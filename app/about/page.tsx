// app/about/page.tsx
"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { Button } from "@/components/ui/button";
import {
  Users,
  Target,
  Shield,
  CheckCircle,
  ArrowRight,
  Wrench,
  Heart,
  TrendingUp,
  Award,
  Globe,
  Zap,
} from "lucide-react";

export default function AboutPage() {
  const stats = [
    { value: "500+", label: "Verified Providers", icon: Users },
    { value: "15+", label: "Service Categories", icon: Target },
    { value: "4.8", label: "Average Rating", icon: Award },
    { value: "24/7", label: "Platform Available", icon: Globe },
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Safety",
      description:
        "Every provider is verified with real contact information. Our review system ensures transparency, and customer feedback helps maintain high service standards.",
      color: "blue",
    },
    {
      icon: Target,
      title: "Accessibility for All",
      description:
        "Quality services should be affordable and easy to find. We've built a platform that works for everyone—from professionals offering services to customers who need them.",
      color: "purple",
    },
    {
      icon: Heart,
      title: "Community First",
      description:
        "We're committed to empowering local Liberian professionals and creating economic opportunities. Every connection strengthens our community.",
      color: "green",
    },
  ];

  const team = [
    {
      role: "Mission",
      title: "Empowering Service Providers",
      description:
        "Our mission is to make it easy for skilled professionals across Liberia to grow their businesses and reach more customers through technology.",
    },
    {
      role: "Vision",
      title: "Connecting Communities",
      description:
        "We envision a Liberia where finding reliable services is simple, transparent, and affordable—where quality professionals thrive and customers find help easily.",
    },
    {
      role: "Impact",
      title: "Building the Future",
      description:
        "We're not just building a platform—we're creating opportunities, fostering trust, and strengthening local economies one connection at a time.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/20">
              <Zap className="h-4 w-4" />
              Connecting Liberia
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              About LiberiaFix
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
              We're building Liberia's most trusted marketplace for local
              services—connecting customers with verified professionals across
              every service category.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Our Story
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Built for Liberia, By Liberians
              </h2>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                <p>
                  LiberiaFix was created to solve a simple but important
                  problem: finding reliable service providers in Liberia
                  shouldn't be difficult, expensive, or risky.
                </p>
                <p>
                  We've built a platform that makes it easy for customers to
                  discover trusted professionals—from plumbers and electricians
                  to cleaners, caterers, and IT specialists—all verified and
                  rated by real customers.
                </p>
                <p>
                  For service providers, we offer a simple way to reach more
                  customers, build their reputation online, and grow their
                  businesses—starting completely free.
                </p>
                <p className="font-semibold text-gray-900">
                  Our goal is to empower local professionals and make quality
                  services accessible to everyone across Liberia.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {team.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100"
                >
                  <div className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">
                    {item.role}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Our Values
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              What We Stand For
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do at LiberiaFix
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {values.map((value, index) => {
              const Icon = value.icon;
              const colorClasses = {
                blue: "from-blue-500 to-blue-600 bg-blue-100",
                purple: "from-purple-500 to-purple-600 bg-purple-100",
                green: "from-green-500 to-green-600 bg-green-100",
              };
              const bgClass =
                colorClasses[value.color as keyof typeof colorClasses].split(
                  " "
                )[1];
              const gradientClass =
                colorClasses[value.color as keyof typeof colorClasses].split(
                  " "
                )[0];

              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${bgClass} mb-6`}
                  >
                    <Icon
                      className={`h-8 w-8 bg-gradient-to-br ${gradientClass} text-transparent bg-clip-text`}
                      style={{ stroke: `url(#gradient-${value.color})` }}
                    />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient
                          id={`gradient-${value.color}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor={
                              value.color === "blue"
                                ? "#3b82f6"
                                : value.color === "purple"
                                ? "#a855f7"
                                : "#10b981"
                            }
                          />
                          <stop
                            offset="100%"
                            stopColor={
                              value.color === "blue"
                                ? "#2563eb"
                                : value.color === "purple"
                                ? "#9333ea"
                                : "#059669"
                            }
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How We Help Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-10 lg:p-12 text-white">
              <Users className="h-12 w-12 mb-6 opacity-90" />
              <h3 className="text-3xl font-bold mb-4">For Customers</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Browse 500+ verified service providers across Liberia
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Read real reviews from other customers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Connect directly with providers for just $1
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    No subscriptions or hidden fees—pay only to connect
                  </span>
                </li>
              </ul>
              <Link href="/search">
                <Button className="mt-8 bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-xl">
                  Browse Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl p-10 lg:p-12 text-white">
              <Wrench className="h-12 w-12 mb-6 opacity-90" />
              <h3 className="text-3xl font-bold mb-4">For Providers</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Start with a FREE profile—1 service and 1 photo
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Reach thousands of potential customers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Upgrade to PRO ($15/month) for 3x more bookings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Build your reputation with customer reviews
                  </span>
                </li>
              </ul>
              <Link href="/for-providers">
                <Button className="mt-8 bg-white text-green-600 hover:bg-green-50 px-8 py-6 text-lg font-semibold shadow-xl">
                  Become a Provider
                  <Wrench className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TrendingUp className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Join Our Growing Community
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
            Whether you're looking for quality services or offering them,
            LiberiaFix is here to help you connect and succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto">
                Find Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/for-providers">
              <Button
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-6 text-lg font-semibold transition-all w-full sm:w-auto"
              >
                Offer Services
                <Wrench className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ConditionalFooter />
    </div>
  );
}
