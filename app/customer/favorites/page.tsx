// app/customer/favorites/page.tsx
"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Header } from "@/components/layout/header";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Heart,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  Search,
  Trash2,
  TrendingUp,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

// Mock data with emoji avatars
const mockFavorites = [
  {
    id: "1",
    provider_id: "p1",
    name: "David Williams",
    service: "Master Electrician",
    rating: 4.9,
    reviews: 127,
    location: "Sinkor",
    responseTime: "< 1 hour",
    tier: "Elite",
    completedJobs: 340,
    hourlyRate: "$40/hour",
    avatar: "⚡👨🏾",
    added_at: "2025-01-10",
  },
  {
    id: "2",
    provider_id: "p2",
    name: "Sarah Brown",
    service: "Professional Cleaner",
    rating: 5.0,
    reviews: 203,
    location: "Congo Town",
    responseTime: "< 30 min",
    tier: "Pro",
    completedJobs: 580,
    hourlyRate: "$25/hour",
    avatar: "🧹👩🏿",
    added_at: "2025-01-15",
  },
  {
    id: "3",
    provider_id: "p3",
    name: "Robert Taylor",
    service: "Expert Plumber",
    rating: 4.8,
    reviews: 156,
    location: "Paynesville",
    responseTime: "< 2 hours",
    tier: "Pro",
    completedJobs: 290,
    hourlyRate: "$35/hour",
    avatar: "🔧👨🏽",
    added_at: "2025-01-20",
  },
  {
    id: "4",
    provider_id: "p4",
    name: "Grace Johnson",
    service: "Garden Specialist",
    rating: 4.7,
    reviews: 89,
    location: "Old Road",
    responseTime: "< 3 hours",
    tier: "Free",
    completedJobs: 145,
    hourlyRate: "$20/hour",
    avatar: "🌱👩🏾",
    added_at: "2025-01-22",
  },
  {
    id: "5",
    provider_id: "p5",
    name: "Michael Chen",
    service: "AC Repair Specialist",
    rating: 4.9,
    reviews: 178,
    location: "Mamba Point",
    responseTime: "< 1 hour",
    tier: "Pro",
    completedJobs: 420,
    hourlyRate: "$45/hour",
    avatar: "❄️👨🏻",
    added_at: "2025-01-18",
  },
  {
    id: "6",
    provider_id: "p6",
    name: "Linda Martinez",
    service: "Interior Painter",
    rating: 4.8,
    reviews: 134,
    location: "Sinkor",
    responseTime: "< 2 hours",
    tier: "Pro",
    completedJobs: 267,
    hourlyRate: "$30/hour",
    avatar: "🎨👩🏽",
    added_at: "2025-01-12",
  },
];

function FavoritesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "name">("recent");
  const [showFilters, setShowFilters] = useState(false);

  const filteredFavorites = mockFavorites
    .filter(
      (fav) =>
        fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });

  const handleRemoveFavorite = (id: string) => {
    // TODO: Implement Supabase favorite removal
    console.log("Removing favorite:", id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Favorite Providers
            </h1>
          </div>
          <p className="text-gray-700">Your saved providers for quick access</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1">Total Favorites</p>
                  <p className="text-3xl font-bold ">{mockFavorites.length}</p>
                </div>
                <Heart className="h-12 w-12  opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm  mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold ">
                    {(
                      mockFavorites.reduce((acc, fav) => acc + fav.rating, 0) /
                      mockFavorites.length
                    ).toFixed(1)}
                  </p>
                </div>
                <Star className="h-12 w-12  opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm  mb-1">Elite Providers</p>
                  <p className="text-3xl font-bold ">
                    {mockFavorites.filter((fav) => fav.tier === "Elite").length}
                  </p>
                </div>
                <Sparkles className="h-12 w-12  opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, service, or location..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              Sort
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-2 border-gray-100">
              <button
                onClick={() => setSortBy("recent")}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  sortBy === "recent"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Recently Added
              </button>
              <button
                onClick={() => setSortBy("rating")}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  sortBy === "rating"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Highest Rated
              </button>
              <button
                onClick={() => setSortBy("name")}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  sortBy === "name"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Name (A-Z)
              </button>
            </div>
          )}
        </div>

        {/* Favorites Grid */}
        {filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFavorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all group hover:shadow-xl"
              >
                {/* Avatar & Tier Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{favorite.avatar}</div>
                  <Badge
                    className={
                      favorite.tier === "Elite"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                        : favorite.tier === "Pro"
                        ? "bg-blue-600 text-white border-0"
                        : "bg-gray-600 text-white border-0"
                    }
                  >
                    {favorite.tier}
                  </Badge>
                </div>

                {/* Provider Info */}
                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {favorite.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{favorite.service}</p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {favorite.rating}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({favorite.reviews} reviews)
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{favorite.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{favorite.responseTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{favorite.completedJobs} jobs</span>
                  </div>
                </div>

                {/* Rate */}
                <div className="mb-4">
                  <p className="text-xl font-bold text-blue-600">
                    {favorite.hourlyRate}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/provider/${favorite.provider_id}`}
                    className="flex-1"
                  >
                    <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md text-sm">
                      View Profile
                    </button>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(favorite.id)}
                    className="px-3 py-2.5 border-2 border-red-300 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? "No matching favorites" : "No favorites yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Start saving your favorite providers for quick access!"}
            </p>
            <Link href="/search">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md">
                <Search className="h-4 w-4" />
                Find Providers
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CustomerFavoritesPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <FavoritesContent />
    </ProtectedRoute>
  );
}
