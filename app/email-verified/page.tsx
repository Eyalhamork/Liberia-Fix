// app/email-verified/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EmailVerifiedPage() {
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Get user profile to determine redirect destination
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", user.id)
            .single();

          setUserType(profile?.user_type || "customer");

          // Auto-redirect after 3 seconds
          setTimeout(() => {
            if (profile?.user_type === "provider") {
              router.push("/provider/dashboard");
            } else if (profile?.user_type === "admin") {
              router.push("/admin/dashboard");
            } else {
              router.push("/customer/dashboard");
            }
          }, 3000);
        } else {
          // If no user, redirect to login
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndRedirect();
  }, [router, supabase]);

  const handleRedirectNow = () => {
    if (userType === "provider") {
      router.push("/provider/dashboard");
    } else if (userType === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/customer/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-800">
            Email Verified Successfully!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your email has been confirmed. Welcome to LiberiaFix!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Setting up your account...</span>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">
                    Redirecting to your dashboard in 3 seconds...
                  </span>
                </p>
                <div className="mt-2 bg-blue-200 rounded-full h-1">
                  <div className="bg-blue-600 h-1 rounded-full animate-pulse"></div>
                </div>
              </div>

              <Button
                onClick={handleRedirectNow}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Go to Dashboard Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="text-xs text-gray-500">
                Having trouble?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  Try logging in again
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
