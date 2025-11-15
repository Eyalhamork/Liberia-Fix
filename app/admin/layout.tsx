// app/admin/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";

// Force dynamic rendering for admin pages (requires authentication)
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard - LiberiaFix",
  description: "LiberiaFix Admin Dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin/dashboard");
  }

  // Check admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name, email, user_type")
    .eq("id", user.id)
    .single();

  // Not admin - redirect to appropriate dashboard
  if (!profile?.is_admin) {
    if (profile?.user_type === "provider") {
      redirect("/provider/dashboard");
    }
    redirect("/customer/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader
          user={{
            full_name: profile.full_name,
            email: profile.email,
          }}
        />
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
