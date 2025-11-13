// app/(auth)/signup/page.tsx - COMPLETE FIXED VERSION
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  EyeOff,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<"customer" | "provider" | "">(
    ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!accountType) {
      setError("Please select an account type");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            user_type: accountType,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        if (!authData.session) {
          setEmailSent(true);
          setLoading(false);
        } else {
          setLoading(false);
          if (accountType === "provider") {
            router.push("/provider/onboarding");
          } else {
            router.push("/customer/dashboard");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");

    if (!accountType) {
      setError("Please select an account type first");
      return;
    }

    setLoading(true);

    try {
      // FIXED: Encode user_type in the redirect URL
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?user_type=${accountType}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-6">
            <Mail className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Check Your Email! 📧
          </h2>
          <p className="text-gray-600 mb-4">
            We've sent a verification link to:
          </p>
          <p className="text-lg font-semibold text-gray-900 mb-6">
            {formData.email}
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              📬 Next Steps:
            </p>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Click the verification link we sent</li>
              <li>You'll be redirected to your dashboard</li>
            </ol>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Didn't receive it? Check spam or{" "}
            <button
              onClick={() => {
                setEmailSent(false);
                setLoading(false);
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              try again
            </button>
          </p>

          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-2 mx-auto"
          >
            Go to Login <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {step === 1 && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              Join LiberiaFix
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Choose how you want to get started
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => {
                  setAccountType("customer");
                  setStep(2);
                }}
                className="group relative p-8 rounded-3xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-2xl transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                <div className="relative z-10">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    I Need Services
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Find trusted local service providers for all your needs
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Browse verified providers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Read reviews & ratings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Secure booking system</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                      Sign up as Customer
                    </span>
                    <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setAccountType("provider");
                  setStep(2);
                }}
                className="group relative p-8 rounded-3xl border-2 border-gray-200 bg-white hover:border-purple-500 hover:shadow-2xl transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                <div className="relative z-10">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    I Provide Services
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Grow your business and connect with customers
                  </p>

                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    <Sparkles className="h-4 w-4" />3 Months FREE!
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Build your portfolio</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Get customer leads</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Analytics & insights</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                      Sign up as Provider
                    </span>
                    <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Log in
                </a>
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
              >
                ← Back to account type
              </button>

              <div className="text-center mb-8">
                <div className="text-6xl mb-4">
                  {accountType === "customer" ? "🔍" : "🔧"}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Create Your{" "}
                  {accountType === "customer" ? "Customer" : "Provider"} Account
                </h2>
                <p className="text-gray-600">
                  {accountType === "customer"
                    ? "Start finding trusted service providers"
                    : "Start growing your business today"}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {accountType === "provider" && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900 mb-1">
                        🎉 Launch Special: 3 Months FREE!
                      </p>
                      <p className="text-sm text-green-700">
                        Get full PRO features during our launch period
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="+231 XXX XXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-2" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                    accountType === "customer"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500 font-semibold">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirecting to Google...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-6">
                By signing up, you agree to our{" "}
                <a href="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
