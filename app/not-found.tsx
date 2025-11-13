// app/not-found.tsx
import Link from "next/link";
import {
  Home,
  Search,
  ArrowLeft,
  MapPin,
  Wrench,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text">
            404
          </div>
          <div className="absolute -top-4 -right-4">
            <div className="bg-yellow-400 rounded-full p-3 animate-bounce">
              <Sparkles className="h-6 w-6 text-yellow-800" />
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            Looks like this service provider went off the grid.
            <br />
            Don't worry, we'll help you find what you're looking for!
          </p>
        </div>

        {/* Liberian Context */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-800">
              We're still mapping all of Liberia
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            Our service providers are expanding across Monrovia, Paynesville,
            and beyond. The page you're looking for might be under construction
            or has moved to a new location.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-3">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </Link>

          <Link href="/search">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3"
            >
              <Search className="mr-2 h-5 w-5" />
              Find Services
            </Button>
          </Link>

          <Link href="/provider/signup">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-2 border-green-200 text-green-700 hover:bg-green-50 px-8 py-3"
            >
              <Wrench className="mr-2 h-5 w-5" />
              Become Provider
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Link
            href="/search?category=plumbing"
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
              🔧
            </div>
            <div className="font-semibold text-gray-800">Plumbing</div>
            <div className="text-gray-500">45+ providers</div>
          </Link>

          <Link
            href="/search?category=cleaning"
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
              🧽
            </div>
            <div className="font-semibold text-gray-800">Cleaning</div>
            <div className="text-gray-500">32+ providers</div>
          </Link>

          <Link
            href="/search?category=electrical"
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
              ⚡
            </div>
            <div className="font-semibold text-gray-800">Electrical</div>
            <div className="text-gray-500">28+ providers</div>
          </Link>

          <Link
            href="/search?category=handyman"
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
              🔨
            </div>
            <div className="font-semibold text-gray-800">Handyman</div>
            <div className="text-gray-500">67+ providers</div>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            Still can't find what you're looking for?
            <br />
            <Link
              href="/contact"
              className="text-blue-600 hover:underline font-medium"
            >
              Contact our support team
            </Link>{" "}
            or go back to the{" "}
            <Link
              href="/"
              className="text-blue-600 hover:underline font-medium"
            >
              homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
