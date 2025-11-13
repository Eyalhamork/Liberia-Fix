// app/privacy/page.tsx
"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Eye,
  UserCheck,
  Database,
  FileText,
  Mail,
  CheckCircle,
  AlertCircle,
  Globe,
  Smartphone,
  Settings,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 2, 2025";

  const sections = [
    {
      id: "collection",
      title: "Information We Collect",
      icon: Database,
      content: [
        {
          subtitle: "Account Information",
          text: "When you create an account on LiberiaFix, we collect your name, email address, phone number, and password. For service providers, we also collect business name, service categories, location, pricing information, and portfolio photos.",
        },
        {
          subtitle: "Profile Data",
          text: "Service providers can add detailed business descriptions, service areas, availability, certifications, and other professional information to their profiles.",
        },
        {
          subtitle: "Payment Information",
          text: "We collect payment details when you pay the $1 connection fee or subscribe to provider plans. Payment processing is handled securely through our payment partners. We never store complete credit card numbers.",
        },
        {
          subtitle: "Usage Data",
          text: "We automatically collect information about how you use LiberiaFix, including your IP address, browser type, device information, pages visited, search queries, and interaction patterns. This helps us improve our service.",
        },
        {
          subtitle: "Communications",
          text: "We store messages you send through our platform, reviews you write, and any correspondence with our support team.",
        },
      ],
    },
    {
      id: "usage",
      title: "How We Use Your Information",
      icon: Settings,
      content: [
        {
          subtitle: "Platform Operations",
          text: "We use your information to provide, maintain, and improve LiberiaFix—including account creation, profile management, search functionality, payment processing, and customer support.",
        },
        {
          subtitle: "Connections & Matching",
          text: "When you pay to connect with a provider, we share your contact information with them to facilitate direct communication. Similarly, providers' contact information is revealed to you after payment.",
        },
        {
          subtitle: "Communications",
          text: "We send transactional emails about your account, connections, payments, and important platform updates. We may also send marketing communications about new features and opportunities, which you can opt out of anytime.",
        },
        {
          subtitle: "Safety & Security",
          text: "We use your information to verify identities, prevent fraud, enforce our terms of service, and maintain a safe marketplace for all users.",
        },
        {
          subtitle: "Analytics & Improvements",
          text: "We analyze usage patterns to understand how people use LiberiaFix, identify areas for improvement, and develop new features that better serve our community.",
        },
      ],
    },
    {
      id: "sharing",
      title: "Information Sharing",
      icon: UserCheck,
      content: [
        {
          subtitle: "With Other Users",
          text: "When you connect with a service provider (after paying $1), we share your name and contact information with them. Your profile information and reviews are visible to all LiberiaFix users to facilitate trust and transparency.",
        },
        {
          subtitle: "With Service Providers",
          text: "We use third-party services for payment processing, email delivery, analytics, and hosting. These partners only access information necessary to perform their services and are contractually obligated to protect your data.",
        },
        {
          subtitle: "For Legal Purposes",
          text: "We may disclose information when required by law, to respond to legal processes, to protect our rights and property, or to ensure user safety. We will notify you of such disclosures when legally permitted.",
        },
        {
          subtitle: "Business Transfers",
          text: "If LiberiaFix is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your information becomes subject to a different privacy policy.",
        },
        {
          subtitle: "With Your Consent",
          text: "We may share information with third parties when you explicitly consent to such sharing.",
        },
      ],
    },
    {
      id: "security",
      title: "Data Security",
      icon: Lock,
      content: [
        {
          subtitle: "Protection Measures",
          text: "We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, firewalls, and regular security audits.",
        },
        {
          subtitle: "Payment Security",
          text: "All payment transactions are processed through PCI-compliant payment processors. We never store complete credit card information on our servers.",
        },
        {
          subtitle: "Account Security",
          text: "We strongly encourage you to use a strong, unique password for your LiberiaFix account and to keep your login credentials confidential. Enable two-factor authentication if available.",
        },
        {
          subtitle: "Data Breach Protocol",
          text: "In the unlikely event of a data breach affecting your personal information, we will notify you promptly and take immediate steps to mitigate any potential harm.",
        },
        {
          subtitle: "Limitations",
          text: "While we take security seriously, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security of your information.",
        },
      ],
    },
    {
      id: "rights",
      title: "Your Privacy Rights",
      icon: Eye,
      content: [
        {
          subtitle: "Access & Portability",
          text: "You have the right to access your personal information and request a copy of your data in a portable format. Contact us at support@liberiafix.com to request your data.",
        },
        {
          subtitle: "Correction & Updates",
          text: "You can update most of your information directly through your account settings. For information you cannot update yourself, contact our support team.",
        },
        {
          subtitle: "Deletion",
          text: "You can request deletion of your account and personal information at any time. We will delete your data within 30 days, except where we're required to retain it for legal or legitimate business purposes.",
        },
        {
          subtitle: "Marketing Opt-Out",
          text: "You can unsubscribe from marketing emails by clicking the unsubscribe link in any marketing message or by updating your communication preferences in your account settings.",
        },
        {
          subtitle: "Do Not Track",
          text: "Some browsers offer Do Not Track (DNT) signals. We currently do not respond to DNT signals, but we respect your privacy choices through our settings.",
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookies & Tracking",
      icon: Globe,
      content: [
        {
          subtitle: "What Are Cookies",
          text: "Cookies are small text files stored on your device that help us recognize you, remember your preferences, and improve your experience on LiberiaFix.",
        },
        {
          subtitle: "How We Use Cookies",
          text: "We use essential cookies for authentication and security, functional cookies to remember your preferences, analytics cookies to understand usage patterns, and advertising cookies to show relevant content.",
        },
        {
          subtitle: "Third-Party Cookies",
          text: "Our analytics and advertising partners may set their own cookies. These are governed by their respective privacy policies.",
        },
        {
          subtitle: "Cookie Control",
          text: "You can control cookies through your browser settings. Note that disabling certain cookies may limit some platform functionality.",
        },
      ],
    },
    {
      id: "retention",
      title: "Data Retention",
      icon: Database,
      content: [
        {
          subtitle: "Active Accounts",
          text: "We retain your information for as long as your account is active or as needed to provide services to you.",
        },
        {
          subtitle: "Deleted Accounts",
          text: "After account deletion, we retain some information for legitimate business purposes such as fraud prevention, legal compliance, and resolving disputes. This data is typically deleted within 90 days unless legal requirements mandate longer retention.",
        },
        {
          subtitle: "Transaction Records",
          text: "Payment and transaction records may be retained longer to comply with financial regulations and tax laws.",
        },
      ],
    },
    {
      id: "children",
      title: "Children's Privacy",
      icon: AlertCircle,
      content: [
        {
          subtitle: "Age Requirement",
          text: "LiberiaFix is not intended for users under 18 years of age. We do not knowingly collect personal information from children.",
        },
        {
          subtitle: "Parental Notice",
          text: "If you believe we have inadvertently collected information from a child, please contact us immediately at support@liberiafix.com and we will promptly delete it.",
        },
      ],
    },
    {
      id: "international",
      title: "International Users",
      icon: Globe,
      content: [
        {
          subtitle: "Data Location",
          text: "LiberiaFix primarily operates in Liberia. Your information may be transferred to and processed in countries where our service providers operate, which may have different data protection laws than Liberia.",
        },
        {
          subtitle: "Data Transfers",
          text: "When we transfer data internationally, we ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.",
        },
      ],
    },
    {
      id: "changes",
      title: "Policy Changes",
      icon: FileText,
      content: [
        {
          subtitle: "Updates",
          text: "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.",
        },
        {
          subtitle: "Notification",
          text: "We will notify you of significant changes by posting the updated policy on this page with a new 'Last Updated' date and, when appropriate, by sending an email notification.",
        },
        {
          subtitle: "Review",
          text: "We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.",
        },
      ],
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
              <Shield className="h-4 w-4" />
              Your Privacy Matters
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed mb-6">
              We're committed to protecting your personal information and being
              transparent about how we use it.
            </p>
            <div className="inline-flex items-center gap-2 text-blue-200 text-sm">
              <FileText className="h-4 w-4" />
              Last Updated: {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Privacy at a Glance
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Secure Data
                </h3>
                <p className="text-sm text-gray-600">
                  We use industry-standard encryption and security measures to
                  protect your information.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Your Control
                </h3>
                <p className="text-sm text-gray-600">
                  You can access, update, or delete your personal information at
                  any time.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Transparent
                </h3>
                <p className="text-sm text-gray-600">
                  We're clear about what data we collect, why, and how we use
                  it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <div className="mb-16">
            <p className="text-lg text-gray-600 leading-relaxed">
              LiberiaFix ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our platform
              at liberiafix.com and our mobile applications.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mt-4">
              By using LiberiaFix, you agree to the collection and use of
              information in accordance with this policy. If you do not agree
              with our policies and practices, please do not use our services.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-16">
            {sections.map((section, sectionIndex) => {
              const Icon = section.icon;
              return (
                <div key={section.id} id={section.id} className="scroll-mt-20">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {sectionIndex + 1}. {section.title}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-8 pl-16">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        {item.subtitle && (
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            {item.subtitle}
                          </h3>
                        )}
                        <p className="text-lg text-gray-600 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {sectionIndex < sections.length - 1 && (
                    <div className="mt-12 border-t border-gray-200"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Section */}
          <div className="mt-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-10 lg:p-12 text-white">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Questions About Your Privacy?
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or our data practices, please don't hesitate to
                contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-xl">
                    Contact Us
                    <Mail className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a
                  href="mailto:support@liberiafix.com"
                  className="text-white hover:text-blue-100 font-semibold underline"
                >
                  support@liberiafix.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ConditionalFooter />
    </div>
  );
}
