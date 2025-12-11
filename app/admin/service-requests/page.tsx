// app/admin/service-requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/admin/data-table";
import StatsCard from "@/components/admin/stats-card";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Loader2,
} from "lucide-react";

export default function AdminServiceRequestsPage() {
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [bidsCount, setBidsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const { data: requests, error } = await (supabase as any)
      .from("service_requests")
        .select(
          `
          *,
          customer:profiles!service_requests_customer_id_fkey (
            id,
            full_name,
            email
          ),
          category:service_categories (
            id,
            name
          )
        `
        )
        .order("created_at", { ascending: false }) as { data: Array<any> | null; error: any };

      if (error) throw error;

      // Fetch bids count for each request
      const requestIds = requests?.map((r: any) => r.id) || [];
      const { data: bids } = await (supabase as any)
      .from("service_request_bids")
        .select("request_id")
        .in("request_id", requestIds) as { data: Array<{ request_id: string }> | null };

      // Count bids per request
      const counts =
        bids?.reduce((acc: Record<string, number>, bid) => {
          acc[bid.request_id] = (acc[bid.request_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      setServiceRequests(requests || []);
      setBidsCount(counts);
    } catch (error) {
      console.error("Error fetching service requests:", error);
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
  const totalRequests = serviceRequests?.length || 0;
  const activeRequests =
    serviceRequests?.filter((r) => r.status === "active").length || 0;
  const completedRequests =
    serviceRequests?.filter((r) => r.status === "completed").length || 0;
  const cancelledRequests =
    serviceRequests?.filter((r) => r.status === "cancelled").length || 0;

  // Calculate total bids
  const totalBids = Object.values(bidsCount).reduce((a, b) => a + b, 0);
  const avgBidsPerRequest = totalRequests > 0 ? totalBids / totalRequests : 0;

  // Status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      completed: "default",
      cancelled: "destructive",
      expired: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  // Define columns
  const columns = [
    {
      header: "Request ID",
      accessor: (request: any) => (
        <div className="text-sm">
          <div className="font-mono font-medium text-gray-900">
            #{request.id.slice(0, 8)}
          </div>
          <div className="text-gray-500">
            {new Date(request.created_at).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: (request: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {request.customer?.full_name || "N/A"}
          </div>
          <div className="text-gray-500">
            {request.customer?.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: (request: any) => (
        <Badge variant="outline">{request.category?.name || "N/A"}</Badge>
      ),
    },
    {
      header: "Title",
      accessor: (request: any) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {request.title}
        </div>
      ),
    },
    {
      header: "Budget",
      accessor: (request: any) => (
        <div className="text-sm text-gray-600">
          ${request.budget_min} - ${request.budget_max}
        </div>
      ),
    },
    {
      header: "Bids",
      accessor: (request: any) => (
        <div className="flex items-center gap-1 text-sm">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">
            {bidsCount[request.id] || 0}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (request: any) => getStatusBadge(request.status),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Service Requests
        </h1>
        <p className="text-gray-600">
          Manage all service requests on the platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Requests"
          value={totalRequests}
          icon={FileText}
          trend={null}
        />
        <StatsCard
          title="Active"
          value={activeRequests}
          icon={Clock}
          trend={null}
          variant="success"
        />
        <StatsCard
          title="Total Bids"
          value={totalBids}
          icon={MessageSquare}
          trend={null}
        />
        <StatsCard
          title="Avg. Bids/Request"
          value={avgBidsPerRequest.toFixed(1)}
          icon={MessageSquare}
          trend={null}
        />
      </div>

      {/* Service Requests Table */}
      <DataTable
        data={serviceRequests || []}
        columns={columns}
        searchPlaceholder="Search service requests..."
      />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedRequests}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">
                {cancelledRequests}
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
                {totalRequests > 0
                  ? Math.round((completedRequests / totalRequests) * 100)
                  : 0}
                %
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>
    </div>
  );
}
