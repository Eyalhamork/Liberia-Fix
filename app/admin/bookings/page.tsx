// app/admin/bookings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/admin/data-table";
import StatsCard from "@/components/admin/stats-card";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await (supabase as any)
      .from("bookings")
        .select(
          `
          *,
          customer:profiles!bookings_customer_id_fkey (
            id,
            full_name,
            email
          ),
          provider:providers!bookings_provider_id_fkey (
            id,
            business_name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
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
  const totalBookings = bookings?.length || 0;
  const pendingBookings =
    bookings?.filter((b) => b.status === "pending").length || 0;
  const confirmedBookings =
    bookings?.filter((b) => b.status === "confirmed").length || 0;
  const completedBookings =
    bookings?.filter((b) => b.status === "completed").length || 0;
  const cancelledBookings =
    bookings?.filter((b) => b.status === "cancelled").length || 0;

  // Calculate total revenue from completed bookings
  const totalRevenue =
    bookings
      ?.filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

  // Status badge styles
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      confirmed: { variant: "default", icon: CheckCircle },
      completed: { variant: "default", icon: CheckCircle },
      cancelled: { variant: "destructive", icon: XCircle },
      rejected: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // Define columns
  const columns = [
    {
      header: "Booking ID",
      accessor: (booking: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            #{booking.id.slice(0, 8)}
          </div>
          <div className="text-gray-500">
            {new Date(booking.created_at).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: (booking: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {booking.customer?.full_name || "N/A"}
          </div>
          <div className="text-gray-500">
            {booking.customer?.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Provider",
      accessor: (booking: any) => (
        <div className="text-sm text-gray-900">
          {booking.provider?.business_name || "N/A"}
        </div>
      ),
    },
    {
      header: "Service Date",
      accessor: (booking: any) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {booking.service_date
              ? new Date(booking.service_date).toLocaleDateString()
              : "N/A"}
          </div>
          <div className="text-gray-500">
            {booking.service_time || "Not set"}
          </div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: (booking: any) => (
        <div className="text-sm font-medium text-gray-900">
          ${((booking.total_amount || 0) / 100).toFixed(2)}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (booking: any) => getStatusBadge(booking.status),
    },
    {
      header: "Payment",
      accessor: (booking: any) => (
        <Badge
          variant={booking.payment_status === "paid" ? "default" : "secondary"}
        >
          {booking.payment_status || "pending"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings</h1>
        <p className="text-gray-600">Manage all platform bookings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Bookings"
          value={totalBookings}
          icon={Calendar}
          trend={null}
        />
        <StatsCard
          title="Pending"
          value={pendingBookings}
          icon={Clock}
          trend={null}
          variant="warning"
        />
        <StatsCard
          title="Completed"
          value={completedBookings}
          icon={CheckCircle}
          trend={null}
          variant="success"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${(totalRevenue / 100).toFixed(2)}`}
          icon={DollarSign}
          trend={null}
          variant="success"
        />
      </div>

      {/* Bookings Table */}
      <DataTable
        data={bookings || []}
        columns={columns}
        searchPlaceholder="Search bookings..."
      />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {confirmedBookings}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">
                {cancelledBookings}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalBookings > 0
                  ? Math.round((completedBookings / totalBookings) * 100)
                  : 0}
                %
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg. Booking Value</p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {completedBookings > 0
                  ? (totalRevenue / completedBookings / 100).toFixed(2)
                  : "0.00"}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>
    </div>
  );
}
