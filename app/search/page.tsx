// app/search/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";

import { createClient } from "@/lib/supabase/client";
import {
  SERVICE_BANK,
  getCategoryById,
  getSpecialtyById,
} from "@/lib/data/service-bank";
import { getDefaultAvatar } from "@/lib/utils/avatar";
import { trackSearch } from "@/lib/utils/search-analytics";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  ChevronDown,
  X,
  Sparkles,
  Wrench,
  ArrowRight,
  Loader2,
  Shield,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const LOCATIONS = [
  "All Locations",
  "Monrovia",
  "Congo Town",
  "Sinkor",
  "Old Road",
  "Paynesville",
  "Red Light",
  "Waterside",
  "Gardnersville",
  "Caldwell",
  "Freeport",
];

export default function SmartSearchPage() {
  const router = useRouter();
  const handleRefresh = async () => {
    // Refresh data
    await refetch();
  };
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [selectedLocation, setSelectedLocation] = useState(
    searchParams.get("location") || "All Locations"
  );
  const [selectedTier, setSelectedTier] = useState(
    searchParams.get("tier") || ""
  );
  const [verifiedOnly, setVerifiedOnly] = useState(
    searchParams.get("verified") === "true"
  );
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "recommended"
  );

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Data state
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions: string[] = [];
    const searchLower = searchQuery.toLowerCase();

    // Search through categories
    SERVICE_BANK.forEach((category) => {
      if (category.name.toLowerCase().includes(searchLower)) {
        suggestions.push(category.name);
      }

      // Search through specialties
      category.specialties.forEach((specialty) => {
        if (specialty.name.toLowerCase().includes(searchLower)) {
          suggestions.push(specialty.name);
        }
      });
    });

    // Add common search terms
    const commonTerms = [
      "leak repair",
      "roof repair",
      "house cleaning",
      "electrician",
      "plumber",
      "driver",
      "security",
      "cctv",
      "generator",
      "painter",
    ];

    commonTerms.forEach((term) => {
      if (term.includes(searchLower) && !suggestions.includes(term)) {
        suggestions.push(term);
      }
    });

    setSearchSuggestions(suggestions.slice(0, 5));
  }, [searchQuery]);

  // Smart search function
  const performSmartSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If using the database function (recommended for production)
      // const { data, error: searchError } = await supabase.rpc('smart_provider_search', {
      //   search_term: debouncedSearch || '',
      //   filter_location: selectedLocation !== 'All Locations' ? selectedLocation : null,
      //   filter_tier: selectedTier || null,
      //   filter_verified: verifiedOnly || null,
      //   result_limit: 50
      // });

      // Client-side smart search (works without DB function)
      let query = supabase
        .from("providers")
        .select(
          `
          *,
          profiles:user_id (full_name, phone, location, avatar_url),
          provider_categories!provider_id (
            id,
            service_category_id,
            status
          ),
          provider_specialties!provider_id (
            id,
            service_category_id,
            specialty_id,
            status
          )
        `,
          { count: "exact" }
        )
        .eq("active", true);

      // Apply filters
      if (selectedTier) query = query.eq("subscription_tier", selectedTier);
      if (verifiedOnly) query = query.eq("verified", true);
      if (selectedLocation !== "All Locations") {
        query = query.eq("profiles.location", selectedLocation);
      }

      if (priceRange) {
        const [min, max] = priceRange.split("-").map(Number);
        if (max) {
          query = query.gte("hourly_rate", min).lte("hourly_rate", max);
        } else {
          query = query.gte("hourly_rate", min);
        }
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      let results = data || [];

      // Smart filtering based on search query
      if (debouncedSearch) {
        results = results.map((provider) => {
          let relevanceScore = 0;
          const searchLower = debouncedSearch.toLowerCase();

          // Check provider name/description
          if (provider.business_name?.toLowerCase().includes(searchLower)) {
            relevanceScore += 60;
          }
          if (provider.description?.toLowerCase().includes(searchLower)) {
            relevanceScore += 40;
          }
          if (
            provider.profiles?.full_name?.toLowerCase().includes(searchLower)
          ) {
            relevanceScore += 50;
          }

          // Check categories
          provider.provider_categories?.forEach((pc: any) => {
            const category = getCategoryById(pc.service_category_id);
            if (category?.name.toLowerCase().includes(searchLower)) {
              relevanceScore += 70;
            }
          });

          // Check specialties (highest score)
          provider.provider_specialties?.forEach((ps: any) => {
            const specialty = getSpecialtyById(
              ps.service_category_id,
              ps.specialty_id
            );
            if (specialty?.name.toLowerCase().includes(searchLower)) {
              relevanceScore += 100;
            }
            if (specialty?.description?.toLowerCase().includes(searchLower)) {
              relevanceScore += 50;
            }
          });

          // Keyword matching
          const keywords = {
            leak: ["plumbing", "emergency-leak-repair"],
            pipe: ["plumbing", "pipe-replacement"],
            drain: ["plumbing", "drain-cleaning"],
            toilet: ["plumbing", "toilet-repair"],
            roof: ["roofing", "roof-repair"],
            electrician: ["electrical"],
            generator: ["electrical", "generator-install"],
            clean: ["cleaning", "deep-house-cleaning"],
            driver: ["driving", "personal-driver"],
            security: ["security"],
            cctv: ["security", "cctv-install"],
          };

          Object.entries(keywords).forEach(
            ([keyword, [categoryId, specialtyId]]) => {
              if (searchLower.includes(keyword)) {
                const hasCategory = provider.provider_specialties?.some(
                  (ps: any) => ps.service_category_id === categoryId
                );
                if (hasCategory) relevanceScore += 80;

                if (specialtyId) {
                  const hasSpecialty = provider.provider_specialties?.some(
                    (ps: any) =>
                      ps.service_category_id === categoryId &&
                      ps.specialty_id === specialtyId
                  );
                  if (hasSpecialty) relevanceScore += 100;
                }
              }
            }
          );

          return { ...provider, relevanceScore };
        });

        // Filter out providers with no relevance
        results = results.filter((p) => p.relevanceScore > 0);
      }

      // Filter by selected category
      if (selectedCategory) {
        results = results.filter((provider) =>
          provider.provider_specialties?.some(
            (ps: any) =>
              getCategoryById(ps.service_category_id)?.name === selectedCategory
          )
        );
      }

      // Filter by minimum rating
      if (minRating) {
        const ratingValue = parseFloat(minRating);
        results = results.filter((provider) => {
          const avgRating =
            provider.review_count > 0
              ? provider.total_rating / provider.review_count
              : 0;
          return avgRating >= ratingValue;
        });
      }

      // Sort results
      results.sort((a, b) => {
        // First by tier (Pro > Free)
        const tierOrder = { pro: 2, free: 1 };
        if (tierOrder[a.subscription_tier] !== tierOrder[b.subscription_tier]) {
          return (
            tierOrder[b.subscription_tier] - tierOrder[a.subscription_tier]
          );
        }

        // Then by verified status
        if (a.verified !== b.verified) return a.verified ? -1 : 1;

        // Then by relevance score (if searching)
        if (debouncedSearch && a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        // Apply selected sorting
        switch (sortBy) {
          case "rating":
            const ratingA =
              a.review_count > 0 ? a.total_rating / a.review_count : 0;
            const ratingB =
              b.review_count > 0 ? b.total_rating / b.review_count : 0;
            return ratingB - ratingA;
          case "reviews":
            return b.review_count - a.review_count;
          case "price-low":
            return (a.hourly_rate || 0) - (b.hourly_rate || 0);
          case "price-high":
            return (b.hourly_rate || 0) - (a.hourly_rate || 0);
          default:
            return b.total_rating - a.total_rating;
        }
      });

      setProviders(results);
      setTotalCount(count || results.length);

      // Track search analytics (non-blocking)
      if (debouncedSearch && results.length > 0) {
        trackSearch(debouncedSearch, results.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    selectedCategory,
    selectedLocation,
    selectedTier,
    verifiedOnly,
    minRating,
    priceRange,
    sortBy,
  ]);

  // Perform search when filters change
  useEffect(() => {
    performSmartSearch();
  }, [performSmartSearch]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedLocation !== "All Locations")
      params.set("location", selectedLocation);
    if (selectedTier) params.set("tier", selectedTier);
    if (verifiedOnly) params.set("verified", "true");
    if (minRating) params.set("rating", minRating);
    if (priceRange) params.set("price", priceRange);
    if (sortBy !== "recommended") params.set("sort", sortBy);

    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [
    searchQuery,
    selectedCategory,
    selectedLocation,
    selectedTier,
    verifiedOnly,
    minRating,
    priceRange,
    sortBy,
  ]);

  const activeFiltersCount = [
    selectedCategory !== "",
    selectedLocation !== "All Locations",
    selectedTier !== "",
    verifiedOnly,
    minRating !== "",
    priceRange !== "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLocation("All Locations");
    setSelectedTier("");
    setVerifiedOnly(false);
    setMinRating("");
    setPriceRange("");
    setSortBy("recommended");
  };

  const getAvgRating = (provider: any) => {
    if (provider.review_count === 0) return "New";
    return (provider.total_rating / provider.review_count).toFixed(1);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Search Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Find Your Perfect Service Provider
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Search by service, category, or provider name. Just $3 booking
                fee to connect.
              </p>
            </div>

            {/* Smart Search Bar */}
            <div className="max-w-4xl mx-auto relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      placeholder="Try 'roof repair', 'leaking pipes', 'electrician'..."
                      className="w-full pl-12 pr-4 py-3 text-lg border-0 focus:outline-none focus:ring-0 bg-transparent"
                    />

                    {/* Search Suggestions */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        {searchSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-2 border-b last:border-b-0"
                          >
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="pl-12 pr-8 py-3 border-0 md:border-l border-gray-200 focus:outline-none appearance-none bg-transparent cursor-pointer"
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>

                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3">
                    Search
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Quick Filter Pills */}
              <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    verifiedOnly
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-200 hover:shadow-md"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Verified Only</span>
                </button>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-gray-100">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border-0 focus:outline-none bg-transparent cursor-pointer font-medium"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="rating">Highest Rated</option>
                    <option value="reviews">Most Reviews</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="mt-4 bg-white rounded-xl shadow-lg border p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Categories */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">
                        Category
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <button
                          onClick={() => setSelectedCategory("")}
                          className={`w-full text-left px-4 py-2 rounded-lg ${
                            selectedCategory === ""
                              ? "bg-blue-600 text-white"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          All Categories
                        </button>
                        {SERVICE_BANK.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 ${
                              selectedCategory === cat.name
                                ? "bg-blue-600 text-white"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tiers & Ratings */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-3">
                          Provider Tier
                        </label>
                        <div className="space-y-2">
                          <button
                            onClick={() => setSelectedTier("")}
                            className={`w-full px-4 py-2 rounded-lg ${
                              selectedTier === ""
                                ? "bg-blue-600 text-white"
                                : "bg-gray-50"
                            }`}
                          >
                            All Tiers
                          </button>
                          <button
                            onClick={() => setSelectedTier("pro")}
                            className={`w-full px-4 py-2 rounded-lg flex items-center gap-2 ${
                              selectedTier === "pro"
                                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                                : "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900"
                            }`}
                          >
                            <Star className="h-4 w-4" />
                            Pro Providers
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-3">
                          Minimum Rating
                        </label>
                        <select
                          value={minRating}
                          onChange={(e) => setMinRating(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                        >
                          <option value="">Any Rating</option>
                          <option value="4.5">4.5+ Stars</option>
                          <option value="4.0">4.0+ Stars</option>
                          <option value="3.5">3.5+ Stars</option>
                        </select>
                      </div>
                    </div>

                    {/* Price & Stats */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-3">
                          Price Range
                        </label>
                        <select
                          value={priceRange}
                          onChange={(e) => setPriceRange(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                        >
                          <option value="">Any Price</option>
                          <option value="0-10">$0 - $10/hr</option>
                          <option value="10-20">$10 - $20/hr</option>
                          <option value="20-30">$20 - $30/hr</option>
                          <option value="30-50">$30 - $50/hr</option>
                          <option value="50">$50+/hr</option>
                        </select>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
                        <div className="text-3xl font-bold text-blue-600">
                          {providers.length}
                        </div>
                        <div className="text-sm text-blue-700 font-medium">
                          Providers Found
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <X className="h-4 w-4" />
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-3 pb-4">
              <button
                onClick={() => setSelectedCategory("")}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === ""
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:shadow-md border"
                }`}
              >
                All Services
              </button>
              {SERVICE_BANK.filter((c) => c.popular).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat.name
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "bg-white text-gray-700 hover:shadow-md border"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {providers.length} Provider{providers.length !== 1 ? "s" : ""}{" "}
              Available
            </h2>
            <p className="text-gray-600 mt-1">
              {searchQuery && `Results for "${searchQuery}" • `}
              {selectedCategory && `${selectedCategory} • `}
              {selectedLocation !== "All Locations" && `${selectedLocation} • `}
              Sorted by{" "}
              {sortBy === "recommended"
                ? "Recommendation"
                : sortBy.replace("-", " ")}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => performSmartSearch()} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {/* Provider Grid */}
          {!loading && !error && providers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider, idx) => {
                const avgRating = getAvgRating(provider);
                const specialties =
                  provider.provider_specialties?.slice(0, 3) || [];

                return (
                  <div
                    key={provider.id}
                    className="group cursor-pointer"
                    onClick={() =>
                      router.push(`/search/provider/${provider.id}`)
                    }
                  >
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1">
                      {/* Header */}
                      <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 p-8">
                        {/* Tier Badge */}
                        <div
                          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                            provider.subscription_tier === "pro"
                              ? "bg-gradient-to-r from-blue-600 to-cyan-600"
                              : "bg-gray-600"
                          }`}
                        >
                          {provider.subscription_tier === "pro" && (
                            <Star className="inline h-3 w-3 mr-1" />
                          )}
                          {provider.subscription_tier.toUpperCase()}
                        </div>

                        {/* Avatar */}
                        <div className="flex items-center justify-center">
                          {provider.profiles?.avatar_url ? (
                            <img
                              src={provider.profiles.avatar_url}
                              alt={provider.profiles?.full_name}
                              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
                              {getDefaultAvatar(
                                provider.id,
                                provider.profiles?.full_name
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              {provider.profiles?.full_name ||
                                provider.business_name}
                              {provider.verified && (
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <MapPin className="h-4 w-4" />
                              {provider.profiles?.location || "Monrovia"}
                            </div>
                          </div>
                        </div>

                        {/* Specialties */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {specialties.map((specialty: any, idx: number) => {
                            const specialtyInfo = getSpecialtyById(
                              specialty.service_category_id,
                              specialty.specialty_id
                            );
                            return (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
                              >
                                {specialtyInfo?.name || specialty.specialty_id}
                              </span>
                            );
                          })}
                          {provider.provider_specialties?.length > 3 && (
                            <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                              +{provider.provider_specialties.length - 3} more
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {provider.description ||
                            "Professional service provider"}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-bold text-yellow-900">
                                {avgRating}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              ({provider.review_count})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              {provider.response_time || "Quick"}
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              ${provider.hourly_rate || 25}/hr
                            </div>
                            {/* <div className="text-xs text-gray-500">
                            $3 booking fee
                          </div> */}
                          </div>

                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group-hover:scale-105 transition-transform">
                            View Profile
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && providers.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No providers found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? `No results for "${searchQuery}". Try different keywords or clear filters.`
                  : "Try adjusting your filters or search terms"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={clearAllFilters} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
                {searchQuery && (
                  <Button onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>

              {/* Suggested Searches */}
              <div className="mt-8">
                <p className="text-sm text-gray-600 mb-3">Try searching for:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "plumber",
                    "electrician",
                    "roof repair",
                    "house cleaning",
                    "driver",
                  ].map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 text-sm font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
            <div className="max-w-3xl mx-auto text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Are You a Service Provider?
              </h2>
              <p className="text-xl mb-8 text-blue-50">
                Join LiberiaFix and connect with thousands of customers looking
                for your services
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push("/signup")}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-xl"
                >
                  <Wrench className="mr-2 h-5 w-5" />
                  Become a Provider
                </Button>
                <Button
                  onClick={() => router.push("/for-providers")}
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-6 text-lg"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
