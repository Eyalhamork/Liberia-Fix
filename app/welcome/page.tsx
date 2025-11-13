"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Wrench,
  Search,
  Globe,
  Star,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Award,
  Target,
  Sparkles,
  Users,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsCheckingAuth(false);

      if (user) {
        // User is logged in, redirect to root which will handle role-based routing
        router.push("/");
      }
    };

    checkAuth();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3);
    }, 5000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const testimonials = [
    {
      name: "Grace Kollie",
      role: "Homeowner, Sinkor",
      content:
        "Found an amazing plumber in minutes! The $3 connection fee was totally worth it.",
      avatar: "👩🏿",
      rating: 5,
    },
    {
      name: "John Mensah",
      role: "PRO Provider",
      content:
        "Since upgrading to PRO, I get 10+ bookings weekly. Best investment for my business!",
      avatar: "👨🏿‍🔧",
      rating: 5,
    },
    {
      name: "Martha Johnson",
      role: "Business Owner",
      content:
        "LiberiaFix helps me find reliable services fast. No more endless searching!",
      avatar: "👩🏿‍💼",
      rating: 5,
    },
  ];

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Verified Providers",
      description:
        "Every provider is verified with real credentials and reviews",
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Instant Connection",
      description: "Pay $3 and get contact info immediately - no waiting",
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: "Quality Ratings",
      description: "Real reviews from real customers help you choose the best",
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Local Services",
      description: "Find providers in your neighborhood across Monrovia",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "0",
      period: "Forever free",
      description: "Perfect for getting started",
      features: [
        { text: "1 service category", included: true },
        { text: "Basic profile", included: true },
        { text: "Customer reviews", included: true },
        { text: "Standard support", included: true },
        { text: "Analytics dashboard", included: false },
        { text: "Priority ranking", included: false },
        { text: "Marketing tools", included: false },
      ],
      cta: "Start Free",
      popular: false,
      gradient: "from-gray-50 to-gray-100",
      borderGradient: "from-gray-200 to-gray-300",
    },
    {
      name: "PRO",
      price: "20",
      period: "per month",
      description: "Scale your service business",
      features: [
        { text: "10 service categories", included: true },
        { text: "Premium profile badge", included: true },
        { text: "Priority customer matching", included: true },
        { text: "Advanced analytics", included: true },
        { text: "24/7 priority support", included: true },
        { text: "Facebook & Google ads", included: true },
        { text: "Verified badge", included: true },
      ],
      cta: "Upgrade to PRO",
      popular: true,
      gradient: "from-purple-600 via-blue-600 to-purple-700",
      borderGradient: "from-purple-400 to-blue-400",
    },
    {
      name: "Enterprise",
      price: "NA",
      period: "Contact us",
      description: "For established businesses",
      features: [
        { text: "Unlimited categories", included: true },
        { text: "Custom branding", included: true },
        { text: "API access", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Custom integrations", included: true },
        { text: "White-label options", included: true },
        { text: "SLA guarantee", included: true },
      ],
      cta: "Contact Sales",
      popular: false,
      gradient: "from-gray-900 to-black",
      borderGradient: "from-gray-600 to-gray-700",
    },
  ];

  const services = [
    { name: "Plumbing", icon: "🔧", count: "45+" },
    { name: "Cleaning", icon: "🧽", count: "32+" },
    { name: "Electrical", icon: "⚡", count: "28+" },
    { name: "Handyman", icon: "🔨", count: "67+" },
    { name: "Gardening", icon: "🌿", count: "23+" },
    { name: "Driving", icon: "🚗", count: "41+" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section - Blue to Purple Gradient */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/30">
                <Sparkles className="h-4 w-4" />
                Liberia's #1 Service Marketplace
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6">
                Find Trusted{" "}
                <span className="text-yellow-300">Local Services</span> in
                Minutes
              </h1>

              <p className="text-xl text-blue-50 mb-8 leading-relaxed">
                Connect with verified plumbers, cleaners, electricians, and
                more. Pay just{" "}
                <span className="font-bold text-yellow-300">$3</span> to get
                instant contact info.
              </p>

              {/* Launch Discount Badge */}
              <div className="inline-flex items-center  gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-5 py-2.5 rounded-xl font-bold mb-6 text-lg shadow-lg">
                $3 Booking Fee
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="/search"
                  className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Search className="h-5 w-5" />
                  Find Services Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>

                <a
                  href="/provider/signup"
                  className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Target className="h-5 w-5" />
                  Become a Provider
                </a>
              </div>

              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300" />
                  <span className="text-blue-50">500+ Verified Providers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300" />
                  <span className="text-blue-50">2,000+ Happy Customers</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-5xl">👨🏿‍🔧</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">
                      Joseph Kollie
                    </div>
                    <div className="text-gray-600">Expert Plumber</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                  <span className="ml-2 text-gray-600 font-semibold">
                    4.9 (127 reviews)
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-semibold text-gray-900">
                      15 minutes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed Jobs</span>
                    <span className="font-semibold text-gray-900">340+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rate</span>
                    <span className="font-semibold text-blue-600">
                      $35/hour
                    </span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  Booking fee $3
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Verified Provider • PRO Badge</span>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-br from-yellow-400 to-yellow-700 text-white rounded-2xl p-4 shadow-xl rotate-6">
                <div className="text-2xl font-bold">$3</div>
                <div className="text-xs">Booking Fee</div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl p-4 shadow-xl -rotate-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <div className="text-sm font-bold">Fast Response</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block">
              <span className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-2 block">
                Explore Services
              </span>
              <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                Popular Services
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse hundreds of verified service providers across Monrovia
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {services.map((service) => (
              <a
                key={service.name}
                href={`/search?category=${service.name.toLowerCase()}`}
                className="group bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-2xl p-6 text-center transition-all transform hover:scale-105 cursor-pointer border border-blue-100 hover:shadow-lg"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600">
                  {service.count} providers
                </p>
              </a>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="/search"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 text-lg group"
            >
              View All Services
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-2 block">
              Why Choose Us
            </span>
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Why Choose LiberiaFix?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The smartest way to find quality services in Liberia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:-translate-y-1"
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-sm font-bold text-purple-600 tracking-wider uppercase block mb-2">
              Simple Process
            </span>
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get connected with trusted professionals in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Search & Discover",
                description:
                  "Browse through verified service providers in your area with real reviews and ratings",
                icon: <Globe className="h-8 w-8" />,
                color: "blue",
              },
              {
                step: "02",
                title: "Connect Instantly",
                description:
                  "Pay just $3 to unlock provider contact details and connect directly",
                icon: <Zap className="h-8 w-8" />,
                color: "purple",
              },
              {
                step: "03",
                title: "Get Service",
                description:
                  "Coordinate with your provider and pay them directly for quality service",
                icon: <Award className="h-8 w-8" />,
                color: "blue",
              },
            ].map((item, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div
                    className={`absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br ${
                      item.color === "purple"
                        ? "from-purple-500 to-purple-700"
                        : "from-blue-500 to-blue-700"
                    } rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform`}
                  >
                    {item.step}
                  </div>

                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${
                      item.color === "purple"
                        ? "from-purple-100 to-purple-200 text-purple-600"
                        : "from-blue-100 to-blue-200 text-blue-600"
                    } rounded-2xl flex items-center justify-center mb-6`}
                  >
                    {item.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>

                  <div
                    className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${
                      item.color === "purple"
                        ? "via-purple-500"
                        : "via-blue-500"
                    } to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-3xl`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 relative overflow-hidden bg-gray-50">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-sm font-bold text-purple-600 tracking-wider uppercase block mb-2">
              Pricing Plans
            </span>
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              For Providers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent pricing that scales with your business.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 lg:mb-6 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative group ${plan.popular ? "lg:-mt-4" : ""}`}
                onMouseEnter={() => setHoveredPlan(index)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.popular && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2  rounded-full text-sm font-bold shadow-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div
                  className={`relative h-full rounded-3xl p-8 transition-all duration-500 ${
                    plan.popular
                      ? "bg-gradient-to-br " +
                        plan.gradient +
                        " text-white shadow-2xl scale-105"
                      : "bg-white shadow-xl hover:shadow-2xl"
                  } ${hoveredPlan === index ? "transform -translate-y-2" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-3xl opacity-20 blur-xl"></div>
                  )}

                  <div className="relative z-10">
                    <h3
                      className={`text-2xl font-bold mb-2 ${
                        plan.popular ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm mb-6 ${
                        plan.popular ? "text-purple-100" : "text-gray-600"
                      }`}
                    >
                      {plan.description}
                    </p>

                    <div className="mb-8">
                      <span
                        className={`text-6xl font-black ${
                          plan.popular ? "text-white" : "text-gray-900"
                        }`}
                      >
                        ${plan.price}
                      </span>
                      <span
                        className={`text-lg ml-2 ${
                          plan.popular ? "text-purple-100" : "text-gray-600"
                        }`}
                      >
                        {plan.period}
                      </span>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <CheckCircle
                              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                plan.popular
                                  ? "text-yellow-300"
                                  : "text-green-500"
                              }`}
                            />
                          ) : (
                            <div
                              className={`h-5 w-5 flex-shrink-0 mt-0.5 rounded-full border-2 ${
                                plan.popular
                                  ? "border-purple-300"
                                  : "border-gray-300"
                              }`}
                            />
                          )}
                          <span
                            className={`${
                              plan.popular
                                ? "text-white"
                                : feature.included
                                ? "text-gray-700"
                                : "text-gray-400"
                            }`}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                        plan.popular
                          ? "bg-white text-purple-600 hover:bg-gray-100 shadow-lg"
                          : index === 2
                          ? "bg-gray-900 text-white hover:bg-gray-800"
                          : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile PWA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-blue-400/30">
                <Zap className="h-4 w-4" />
                Native App Experience
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Works Like a{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Native App
                </span>
              </h2>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                LiberiaFix is built as a Progressive Web App (PWA) - giving you
                a smooth, fast, mobile-first experience that works perfectly on
                any device.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 rounded-xl p-3 border border-blue-400/30">
                    <Zap className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Lightning Fast</h3>
                    <p className="text-gray-400">
                      Optimized for 2G/3G networks - works smoothly even on slow
                      connections
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-yellow-500/20 rounded-xl p-3 border border-yellow-400/30">
                    <Phone className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">
                      Mobile-First Design
                    </h3>
                    <p className="text-gray-400">
                      Every pixel designed for your phone - smooth gestures and
                      native feel
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-green-500/20 rounded-xl p-3 border border-green-400/30">
                    <Shield className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">
                      Secure & Reliable
                    </h3>
                    <p className="text-gray-400">
                      Bank-level security with encrypted data and secure
                      payments
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        Mobile Optimized
                      </div>
                      <div className="text-sm text-gray-400">
                        Fast & Responsive
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-blue-500/20 rounded-lg p-3 text-blue-300 text-sm">
                      ✓ Works on all Android & iOS devices
                    </div>
                    <div className="bg-purple-500/20 rounded-lg p-3 text-purple-300 text-sm">
                      ✓ No installation required
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-3 text-green-300 text-sm">
                      ✓ Instant updates automatically
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-3" />
                  <div className="font-bold text-lg mb-2">Try It Now</div>
                  <p className="text-sm text-blue-100 mb-4">
                    Open on your phone for the full experience
                  </p>
                  <div className="text-xs text-blue-200">
                    No download needed • Works instantly
                  </div>
                </div>
              </div>

              <div className="absolute -top-6 -left-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 shadow-xl rotate-6">
                <div className="text-2xl font-bold">PWA</div>
                <div className="text-xs">Powered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-purple-600 tracking-wider uppercase block mb-2">
              Success Stories
            </span>
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of happy customers and providers
            </p>
          </div>

          <div className="relative h-96">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  index === currentTestimonial
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 absolute inset-0"
                }`}
              >
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 lg:p-12 border border-blue-100 shadow-xl">
                  <div className="text-6xl mb-6 text-center">
                    {testimonial.avatar}
                  </div>
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-6 w-6 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-xl lg:text-2xl text-gray-900 mb-6 italic leading-relaxed text-center font-medium">
                    "{testimonial.content}"
                  </p>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 text-lg">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8 gap-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial
                    ? "bg-purple-600 w-8"
                    : "bg-gray-300 w-3"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Blue to Purple Gradient */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Liberians connecting for quality services with
            transparent, affordable pricing
          </p>

          {/* Launch Discount Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-5 py-2.5 rounded-xl font-bold mb-8 text-lg">
            <span className="line-through opacity-60">$3</span> $3 • Ending Soon
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/search"
              className="group bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
            >
              <Target className="h-6 w-6 group-hover:rotate-12 transition-transform" />
              Find Services - $3
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/provider/signup"
              className="group bg-gray-900 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
            >
              <Award className="h-6 w-6 group-hover:rotate-12 transition-transform" />
              Become PRO Provider
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
