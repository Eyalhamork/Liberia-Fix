import {
  TrendingUp,
  Award,
  Users,
  Target,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Wrench,
  Shield,
  Clock,
  DollarSign,
  Star,
  Zap,
  Phone,
  MapPin,
  Camera,
  BarChart,
  Facebook,
  MessageSquare,
  Crown,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function ForProvidersPage() {
  const benefits = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Get More Customers",
      description:
        "Reach thousands of potential customers actively searching for your services",
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Zero Commission",
      description:
        "Keep 100% of what you charge. We don't take any cut from your service fees",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Build Your Reputation",
      description:
        "Collect 5-star reviews and showcase your best work to stand out",
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Work On Your Terms",
      description:
        "Set your own rates, hours, and service areas. You're the boss",
    },
  ];

  const proFeatures = [
    { feature: "Service Categories", free: "1", pro: "Up to 10" },
    { feature: "Portfolio Photos", free: "1", pro: "Up to 20" },
    { feature: "Search Ranking", free: "Standard", pro: "Higher Priority" },
    { feature: "PRO Badge", free: "❌", pro: "✅" },
    { feature: "Facebook Ads", free: "❌", pro: "✅ Randomized" },
    { feature: "Analytics Dashboard", free: "Basic", pro: "Advanced" },
    { feature: "Average Bookings", free: "Normal", pro: "3x More" },
  ];

  const successStories = [
    {
      name: "John Mensah",
      service: "Plumbing",
      avatar: "👨🏿‍🔧",
      revenue: "$2,500/month",
      reviews: 127,
      quote:
        "Since upgrading to PRO, my bookings tripled! Best decision for my business.",
    },
    {
      name: "Grace Kollie",
      service: "House Cleaning",
      avatar: "👩🏿",
      revenue: "$1,800/month",
      reviews: 94,
      quote:
        "LiberiaFix helped me grow from 5 clients to 40+ in just 3 months!",
    },
    {
      name: "Emmanuel Cooper",
      service: "Electrical Work",
      avatar: "👨🏿‍🔬",
      revenue: "$3,200/month",
      reviews: 83,
      quote:
        "The PRO badge and higher ranking make a huge difference. Worth every dollar!",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Crown className="h-4 w-4" />
                For Service Providers
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Grow Your Business with LiberiaFix
              </h1>

              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Join 500+ providers getting more customers, building their
                reputation, and earning more. Start FREE today, upgrade to PRO
                for 3x more bookings.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="/provider/signup"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Start FREE Now
                  <ArrowRight className="h-5 w-5" />
                </a>

                <a
                  href="#pricing"
                  className="bg-white/10 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  View PRO Plans
                </a>
              </div>

              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>No Setup Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>0% Commission</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      $2,500+
                    </div>
                    <div className="text-gray-600">Avg. Monthly Revenue</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-400 to-green-600 text-white px-4 py-2 rounded-xl font-bold">
                    +180%
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold">
                        Customer Reach
                      </span>
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      2,000+
                    </div>
                    <div className="text-sm text-gray-600">
                      Active customers searching daily
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold">
                        PRO Advantage
                      </span>
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      3x Bookings
                    </div>
                    <div className="text-sm text-gray-600">
                      PRO members vs FREE members
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl p-6 shadow-xl rotate-3">
                <div className="text-3xl font-bold mb-1">$0</div>
                <div className="text-sm font-semibold">Start FREE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Providers Love LiberiaFix
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to grow your service business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 hover:shadow-lg transition-all border border-blue-100"
              >
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works for Providers */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get Started in 3 Easy Steps
            </h2>
            <p className="text-xl text-gray-600">
              From signup to your first customer in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Create Profile
              </h3>
              <p className="text-gray-600 mb-4">
                Sign up FREE, add your services, upload photos, and set your
                rates
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Takes only 5 minutes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  No credit card required
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Live instantly
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Get Discovered
              </h3>
              <p className="text-gray-600 mb-4">
                Customers find you when searching for services in your area
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  2,000+ active searchers
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  PRO gets higher ranking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  Facebook ads (PRO only)
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Grow Business
              </h3>
              <p className="text-gray-600 mb-4">
                Receive connections, complete jobs, earn reviews, and scale up
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  Keep 100% of earnings
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  Build 5-star reputation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  Track in dashboard
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Real Providers, Real Results
            </h2>
            <p className="text-xl text-gray-600">
              See how LiberiaFix transformed these businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200"
              >
                <div className="text-6xl mb-4 text-center">{story.avatar}</div>

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {story.name}
                  </h3>
                  <p className="text-gray-600">{story.service}</p>
                </div>

                <div className="bg-white rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-semibold">
                      Monthly Revenue
                    </span>
                    <span className="text-green-600 font-bold">
                      {story.revenue}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-semibold">Reviews</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-gray-900">
                        {story.reviews}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 italic leading-relaxed">
                  "{story.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section
        id="pricing"
        className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start FREE, upgrade to PRO for 3x more bookings
            </p>
          </div>

          {/* Feature Comparison Table */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-12">
            <div className="grid grid-cols-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="font-bold text-lg">Features</div>
              <div className="text-center">
                <div className="font-bold text-lg">FREE</div>
                <div className="text-sm text-blue-100">$0/month</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">PRO</div>
                <div className="text-sm text-blue-100">$20/month</div>
              </div>
            </div>

            {proFeatures.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-3 p-6 items-center ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="font-semibold text-gray-900">
                  {item.feature}
                </div>
                <div className="text-center text-gray-700">{item.free}</div>
                <div className="text-center">
                  <span className="font-bold text-blue-600">{item.pro}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-200">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">FREE</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">
                    Perfect for getting started
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Basic features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Upgrade anytime</span>
                </li>
              </ul>
              <a
                href="/provider/signup"
                className="block w-full bg-gray-900 text-white text-center py-4 rounded-xl font-bold hover:bg-gray-800 transition-all"
              >
                Start Free
              </a>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl relative transform hover:scale-105 transition-all">
              <div className="absolute -top-4 right-8 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
                RECOMMENDED
              </div>

              <h3 className="text-3xl font-bold text-white mb-4">PRO</h3>
              <div className="mb-6 text-white">
                <span className="text-5xl font-bold">$20</span>
                <span className="text-blue-100">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-white">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300" />
                  <span>
                    <strong>3x more bookings</strong> on average
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300" />
                  <span>Higher search ranking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300" />
                  <span>PRO badge & Facebook ads</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300" />
                  <span>Advanced analytics</span>
                </li>
              </ul>
              <a
                href="/provider/signup?plan=pro"
                className="block w-full bg-white text-blue-600 text-center py-4 rounded-xl font-bold hover:bg-blue-50 transition-all"
              >
                Upgrade to PRO
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join 500+ service providers already getting more customers with
            LiberiaFix. Start FREE today - no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/provider/signup"
              className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
            >
              <Sparkles className="h-6 w-6" />
              Start FREE Now
              <ArrowRight className="h-6 w-6" />
            </a>
            <a
              href="/how-it-works"
              className="bg-white/10 backdrop-blur-sm border-2 border-white text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/20 transition-all flex items-center justify-center gap-3"
            >
              Learn How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
