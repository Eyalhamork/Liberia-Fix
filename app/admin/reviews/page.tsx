// app/admin/reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/admin/data-table";
import StatsCard from "@/components/admin/stats-card";
import {
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
} from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          customer:profiles!reviews_customer_id_fkey (
            id,
            full_name,
            email
          ),
          provider:providers!reviews_provider_id_fkey (
            id,
            business_name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate stats
  const totalReviews = reviews?.length || 0;
  const pendingReviews =
    reviews?.filter((r) => r.status === "pending").length || 0;
  const activeReviews =
    reviews?.filter((r) => r.status === "active").length || 0;
  const flaggedReviews =
    reviews?.filter((r) => r.status === "flagged").length || 0;

  // Calculate average rating
  const avgRating =
    totalReviews > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
        ).toFixed(1)
      : "0.0";

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews?.filter((r) => r.rating === rating).length || 0,
  }));

  // Status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      pending: "secondary",
      flagged: "destructive",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  // Star rating component
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-900">{rating}</span>
      </div>
    );
  };

  // Define columns
  const columns = [
    {
      header: "Customer",
      accessor: (review: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {review.customer?.full_name || "N/A"}
          </div>
          <div className="text-gray-500">{review.customer?.email || "N/A"}</div>
        </div>
      ),
    },
    {
      header: "Provider",
      accessor: (review: any) => (
        <div className="text-sm text-gray-900">
          {review.provider?.business_name || "N/A"}
        </div>
      ),
    },
    {
      header: "Rating",
      accessor: (review: any) => <StarRating rating={review.rating} />,
    },
    {
      header: "Comment",
      accessor: (review: any) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {review.comment || "No comment"}
        </div>
      ),
    },
    {
      header: "Date",
      accessor: (review: any) => (
        <div className="text-sm text-gray-600">
          {new Date(review.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (review: any) => getStatusBadge(review.status || "active"),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews</h1>
        <p className="text-gray-600">Manage customer reviews and ratings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Reviews"
          value={totalReviews}
          icon={Star}
          trend={null}
        />
        <StatsCard
          title="Average Rating"
          value={avgRating}
          icon={Star}
          trend={null}
          variant="success"
        />
        <StatsCard
          title="Pending Review"
          value={pendingReviews}
          icon={Clock}
          trend={null}
          variant="warning"
        />
        <StatsCard
          title="Flagged"
          value={flaggedReviews}
          icon={AlertCircle}
          trend={null}
          variant="danger"
        />
      </div>

      {/* Reviews Table */}
      <DataTable
        data={reviews || []}
        columns={columns}
        searchPlaceholder="Search reviews..."
      />

      {/* Rating Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Rating Distribution
        </h3>
        <div className="space-y-3">
          {ratingDistribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{item.rating}</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-400 h-2.5 rounded-full"
                  style={{
                    width: `${
                      totalReviews > 0 ? (item.count / totalReviews) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12">{item.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
