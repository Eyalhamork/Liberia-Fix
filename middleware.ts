// middleware.ts - FIXED VERSION
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("[Middleware] Request:", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // ============================================
  // SKIP MIDDLEWARE FOR API ROUTES
  // ============================================
  if (pathname.startsWith("/api/")) {
    console.log("[Middleware] API route, skipping");
    return response;
  }

  // ============================================
  // SKIP MIDDLEWARE FOR STATIC ASSETS
  // ============================================
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes("/icons/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js)$/)
  ) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ============================================
  // PUBLIC ROUTES
  // ============================================
  const publicRoutes = [
    "/",
    "/welcome",
    "/login",
    "/signup",
    "/search",
    "/about",
    "/contact",
    "/manifest.json",
    "/privacy",
    "/terms",
    "/how-it-works",
    "/for-providers",
    "/service-requests",
    "/test-notifications", // Allow testing page
  ];
  const isProviderProfile = /^\/provider\/[^\/]+$/.test(pathname);
  const isSearchProviderProfile = /^\/search\/provider\/[^\/]+$/.test(pathname);

  if (publicRoutes.includes(pathname) || isProviderProfile || isSearchProviderProfile) {
    return response;
  }

  // ============================================
  // REQUIRE AUTHENTICATION
  // ============================================
  if (!user) {
    console.log("[Middleware] No user, redirecting to /login");
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ============================================
  // CHECK USER TYPE & ENFORCE AUTHORIZATION
  // ============================================
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type, is_admin, onboarding_completed")
      .eq("id", user.id)
      .single();

    // Handle profile fetch errors
    if (profileError) {
      console.error("[Middleware] Profile fetch error:", profileError);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Handle missing profile
    if (!profile) {
      console.log("[Middleware] Profile not found, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log("[Middleware] User profile:", {
      user_type: profile.user_type,
      is_admin: profile.is_admin,
      onboarding_completed: profile.onboarding_completed,
    });

    // ============================================
    // ADMIN ROUTES
    // ============================================
    if (pathname.startsWith("/admin")) {
      if (!profile.is_admin) {
        console.log("[Middleware] Not admin, redirecting");
        return NextResponse.redirect(
          new URL(
            profile.user_type === "provider"
              ? "/provider/dashboard"
              : "/customer/dashboard",
            request.url
          )
        );
      }
      return response;
    }

    // ============================================
    // CUSTOMER ROUTES
    // ============================================
    if (pathname.startsWith("/customer")) {
      if (profile.user_type !== "customer") {
        console.log("[Middleware] Not customer, blocking access");
        return NextResponse.redirect(
          new URL(
            profile.user_type === "provider"
              ? "/provider/dashboard"
              : "/admin/dashboard",
            request.url
          )
        );
      }

      // Check onboarding - FIXED: Use !== true to catch null/undefined
      if (
        profile.onboarding_completed !== true &&
        pathname !== "/customer/onboarding"
      ) {
        console.log("[Middleware] Customer needs onboarding");
        return NextResponse.redirect(
          new URL("/customer/onboarding", request.url)
        );
      }

      return response;
    }

    // ============================================
    // PROVIDER ROUTES
    // ============================================
    if (pathname.startsWith("/provider")) {
      if (profile.user_type !== "provider") {
        console.log("[Middleware] Not provider, blocking access");
        return NextResponse.redirect(
          new URL(
            profile.user_type === "customer"
              ? "/customer/dashboard"
              : "/admin/dashboard",
            request.url
          )
        );
      }

      // Check onboarding - FIXED: Use !== true to catch null/undefined
      if (
        profile.onboarding_completed !== true &&
        pathname !== "/provider/onboarding"
      ) {
        console.log("[Middleware] Provider needs onboarding");
        return NextResponse.redirect(
          new URL("/provider/onboarding", request.url)
        );
      }

      return response;
    }

    // ============================================
    // DEFAULT: Allow access to other routes
    // ============================================
    return response;
  } catch (error) {
    console.error("[Middleware] Unexpected error:", error);
    // On error, redirect to login to be safe
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
