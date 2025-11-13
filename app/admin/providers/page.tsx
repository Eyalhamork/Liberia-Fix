"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/admin/data-table";
import StatsCard from "@/components/admin/stats-card";
import {
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react";

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      const supabase = createClient();
      const { data } = await supabase
        .from("providers")
        .select(
          `
          *,
          profiles!providers_user_id_fkey (
            id,
            full_name,
            email,
            phone_number
          )
        `
        )
        .order("created_at", { ascending: false });

      setProviders(data || []);
      setLoading(false);
    }
    fetchProviders();
  }, []);

  // Calculate stats
  const totalProviders = providers.length;
  const activeProviders = providers.filter((p) => p.active === true).length;
  const verifiedProviders = providers.filter(
    (p) => p.verification_status === "verified"
  ).length;
  const pendingVerification = providers.filter(
    (p) => p.verification_status === "pending"
  ).length;

  // Define columns
  const columns = [
    {
      header: "Provider",
      accessor: (provider: any) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-sm font-medium text-orange-600">
                {(provider.business_name || "N")[0].toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {provider.business_name || "N/A"}
            </div>
            <div className="text-sm text-gray-500">
              {provider.profiles?.email || "N/A"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (provider: any) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {provider.profiles?.full_name || "N/A"}
          </div>
          <div className="text-gray-500">
            {provider.profiles?.phone_number || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Verification",
      accessor: (provider: any) => {
        const status = provider.verification_status || "pending";
        const variants: Record<string, any> = {
          verified: "default",
          pending: "secondary",
          rejected: "destructive",
        };
        return <Badge variant={variants[status]}>{status}</Badge>;
      },
    },
    {
      header: "Subscription",
      accessor: (provider: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {provider.subscription_tier || "Free"}
          </div>
          <div className="text-gray-500">
            {provider.subscription_status || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (provider: any) => (
        <Badge variant={provider.active ? "default" : "secondary"}>
          {provider.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Joined",
      accessor: (provider: any) => (
        <span className="text-sm text-gray-500">
          {new Date(provider.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (provider: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            View
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading providers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Providers</h1>
        <p className="mt-2 text-gray-600">
          Manage all service providers on the platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Providers"
          value={totalProviders}
          icon={Briefcase}
        />
        <StatsCard
          title="Active Providers"
          value={activeProviders}
          icon={CheckCircle}
          subtitle={`${((activeProviders / totalProviders) * 100 || 0).toFixed(
            1
          )}% of total`}
        />
        <StatsCard
          title="Verified"
          value={verifiedProviders}
          icon={TrendingUp}
          subtitle={`${(
            (verifiedProviders / totalProviders) * 100 || 0
          ).toFixed(1)}% verified`}
        />
        <StatsCard
          title="Pending Verification"
          value={pendingVerification}
          icon={Clock}
          subtitle="Needs review"
        />
      </div>

      {/* Verification Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">
                {verifiedProviders}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingVerification}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {providers.filter((p) => p.verification_status === "rejected")
                  .length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Providers Table */}
      <DataTable
        data={providers}
        columns={columns}
        searchPlaceholder="Search by business name, email, phone..."
        onExport={() => {
          console.log("Export providers");
        }}
      />
    </div>
  );
}
