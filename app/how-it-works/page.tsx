"use client";

import {
  Search,
  DollarSign,
  CheckCircle,
  Star,
  Shield,
  TrendingUp,
  Users,
  Target,
  Phone,
  MessageSquare,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  Wrench,
  MapPin,
  CreditCard,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function HowItWorksPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const customerSteps = [
    {
      icon: <Search className="h-12 w-12" />,
      title: "Browse Services",
      description:
        "Search our marketplace of 500+ verified providers across all service categories",
      details: [
        "Filter by service type, location, and ratings",
        "Compare provider profiles and portfolios",
        "Read real reviews from customers",
        "100% free to browse - no credit card needed",
      ],
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <DollarSign className="h-12 w-12" />,
      title: "Pay $1 to Connect",
      description:
        "One simple payment unlocks direct contact with any provider",
      details: [
        "Secure mobile money payment",
        "Instant access to phone and WhatsApp",
        "No subscriptions or hidden fees",
        "Connection valid for that provider",
      ],
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <Phone className="h-12 w-12" />,
      title: "Contact & Negotiate",
      description:
        "Call or message the provider directly to discuss your needs",
      details: [
        "Discuss project details and timeline",
        "Negotiate pricing and schedule",
        "Ask questions about experience",
        "Get quotes for your specific job",
      ],
      color: "from-green-500 to-green-600",
    },
    {
      icon: <CheckCircle className="h-12 w-12" />,
      title: "Get Service & Rate",
      description: "Provider completes the job, then you leave a review",
      details: [
        "Provider completes work professionally",
        "Pay the provider directly for service",
        "Rate your experience (1-5 stars)",
        "Help others make informed decisions",
      ],
      color: "from-orange-500 to-orange-600",
    },
  ];

  const providerSteps = [
    {
      icon: <FileText className="h-12 w-12" />,
      title: "Create Your Profile",
      description: "Sign up in minutes and build your professional profile",
      details: [
        "Add business details and services",
        "Upload portfolio photos",
        "Set your rates and availability",
        "Start with FREE plan - no credit card",
      ],
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <Users className="h-12 w-12" />,
      title: "Get Discovered",
      description: "Customers find you when they search for your services",
      details: [
        "Show up in search results",
        "Customers view your profile",
        "Build trust with photos & reviews",
        "PRO members get higher ranking",
      ],
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <Phone className="h-12 w-12" />,
      title: "Receive Connections",
      description: "Get notified when customers pay to connect with you",
      details: [
        "Customer pays $1 to get your contact",
        "You receive notification immediately",
        "No commission fees on connections",
        "You keep 100% of what you charge",
      ],
      color: "from-green-500 to-green-600",
    },
    {
      icon: <TrendingUp className="h-12 w-12" />,
      title: "Grow Your Business",
      description: "Build reputation and get more bookings over time",
      details: [
        "Earn 5-star reviews from happy clients",
        "Upgrade to PRO for 3x more bookings",
        "Track earnings in your dashboard",
        "Get featured in Facebook ads (PRO)",
      ],
      color: "from-orange-500 to-orange-600",
    },
  ];

  const faqs = [
    {
      question: "How much does it cost to find a service provider?",
      answer:
        "Browsing providers is completely FREE. You only pay $1 when you want to connect with a specific provider and get their contact information. This one-time fee gives you direct access to call or message them.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept Orange Money and MTN Mobile Money for the $1 connection fee. All payments are secure and instant.",
    },
    {
      question: "Is the $1 connection fee refundable?",
      answer:
        "The $1 fee is non-refundable as it immediately provides you with the provider's contact information. However, you can report any issues with providers and we'll investigate.",
    },
    {
      question: "How do I know providers are legitimate?",
      answer:
        "All providers are verified with real phone numbers and business information. We also have a rating and review system where customers share their experiences. PRO providers undergo additional verification.",
    },
    {
      question: "Do I pay LiberiaFix for the actual service?",
      answer:
        "No! The $1 is just to connect. You negotiate and pay the provider directly for their services. We don't take any commission from your actual service payment.",
    },
    {
      question: "What's the difference between FREE and PRO providers?",
      answer:
        "PRO providers pay $20/month for premium features like: up to 10 services (vs 1), up to 20 photos (vs 1), higher search ranking, PRO badge, Facebook ads promotion, and advanced analytics. They typically get 3x more bookings.",
    },
    {
      question: "Can I become a provider?",
      answer:
        "Absolutely! Anyone offering services can sign up for FREE. You'll get 1 service listing and 1 photo to start. Upgrade to PRO anytime for just $20/month to unlock more features and get more bookings.",
    },
    {
      question: "How do providers get paid?",
      answer:
        "Providers negotiate and receive payment directly from customers for their services. LiberiaFix doesn't handle service payments - we only facilitate the connection.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4" />
            Simple, Transparent, Fast
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            How LiberiaFix Works
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Connecting customers with trusted service providers in just a few
            clicks. No complexity, no surprises - just quality services at
            transparent prices.
          </p>
        </div>
      </section>

      {/* For Customers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              For Customers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find and hire quality service providers in 4 easy steps
            </p>
          </div>

          <div className="space-y-16">
            {customerSteps.map((step, index) => (
              <div
                key={index}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`bg-gradient-to-br ${step.color} text-white w-20 h-20 rounded-2xl flex items-center justify-center`}
                    >
                      {step.icon}
                    </div>
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl">
                      {index + 1}
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>

                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  <ul className="space-y-3">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border-2 border-gray-200">
                    <div
                      className={`bg-gradient-to-br ${step.color} text-white rounded-2xl p-6 mb-4`}
                    >
                      <div className="text-sm font-semibold mb-2">
                        STEP {index + 1}
                      </div>
                      <div className="text-2xl font-bold">{step.title}</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 space-y-3">
                      {step.details.slice(0, 2).map((detail, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              For Service Providers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Grow your business and get more customers in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {providerSteps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`bg-gradient-to-br ${step.color} text-white w-16 h-16 rounded-2xl flex items-center justify-center`}
                  >
                    {step.icon}
                  </div>
                  <div className="bg-gray-100 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  {step.description}
                </p>

                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="/provider/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <Award className="h-6 w-6" />
              Start as FREE Provider
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No hidden fees. No surprises. Just simple, fair pricing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* For Customers */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200">
              <div className="text-center mb-6">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  For Customers
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      Browse Services
                    </span>
                    <span className="text-green-600 font-bold">FREE</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Search and compare unlimited providers
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      Connect with Provider
                    </span>
                    <span className="text-blue-600 font-bold">$1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    One-time fee per provider connection
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      Service Payment
                    </span>
                    <span className="text-gray-900 font-bold">Direct</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pay provider directly - we take 0%
                  </p>
                </div>
              </div>

              <a
                href="/search"
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Start Browsing
              </a>
            </div>

            {/* FREE Provider */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-lg">
              <div className="text-center mb-6">
                <div className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                  FREE PLAN
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Free Provider
                </h3>
                <div className="text-4xl font-bold text-gray-900">$0</div>
                <p className="text-gray-600 mt-2">per month</p>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">1 service category</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">1 portfolio photo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Basic listing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Customer reviews</span>
                </li>
              </ul>

              <a
                href="/provider/signup"
                className="block w-full bg-gray-900 text-white text-center py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
              >
                Start Free
              </a>
            </div>

            {/* PRO Provider */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-all relative">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                POPULAR
              </div>

              <div className="text-center mb-6 text-white">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-4">
                  PRO PLAN
                </div>
                <h3 className="text-2xl font-bold mb-2">PRO Provider</h3>
                <div className="text-4xl font-bold">$20</div>
                <p className="text-blue-100 mt-2">per month</p>
              </div>

              <ul className="space-y-3 mb-6 text-white">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>Up to 10 service categories</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>Up to 20 portfolio photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>Higher search ranking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>PRO badge on profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>Facebook ads promotion</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>3x more bookings</strong>
                  </span>
                </li>
              </ul>

              <a
                href="/provider/signup?plan=pro"
                className="block w-full bg-white text-blue-600 text-center py-3 rounded-xl font-bold hover:bg-blue-50 transition-all"
              >
                Upgrade to PRO
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about LiberiaFix
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-lg pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-6 w-6 text-blue-600 flex-shrink-0 transition-transform ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedFaq === index && (
                  <div className="px-6 pb-5 text-gray-700 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you're looking for services or want to grow your business,
            LiberiaFix is here to help.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/search"
              className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
            >
              <Search className="h-6 w-6" />
              Find Services
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/provider/signup"
              className="group bg-gray-900 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
            >
              <Award className="h-6 w-6" />
              Become a Provider
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
