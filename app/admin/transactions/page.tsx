// app/admin/transactions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/admin/data-table";
import StatsCard from "@/components/admin/stats-card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await (supabase as any)
      .from("transactions")
        .select(
          `
          *,
          user:profiles!transactions_user_id_fkey (
            id,
            full_name,
            email,
            user_type
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
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
  const totalTransactions = transactions?.length || 0;
  const completedTransactions =
    transactions?.filter((t) => t.status === "completed").length || 0;
  const pendingTransactions =
    transactions?.filter((t) => t.status === "pending").length || 0;
  const failedTransactions =
    transactions?.filter((t) => t.status === "failed").length || 0;

  // Calculate revenue
  const totalRevenue =
    transactions
      ?.filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  const pendingAmount =
    transactions
      ?.filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  // Calculate average transaction value
  const avgTransactionValue =
    completedTransactions > 0 ? totalRevenue / completedTransactions : 0;

  // Get transaction types breakdown
  const subscriptionPayments =
    transactions?.filter((t) => t.type === "subscription").length || 0;
  const membershipPayments =
    transactions?.filter((t) => t.type === "membership").length || 0;
  const bookingPayments =
    transactions?.filter((t) => t.type === "booking").length || 0;

  // Status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  // Define columns
  const columns = [
    {
      header: "Transaction ID",
      accessor: (transaction: any) => (
        <div className="text-sm">
          <div className="font-mono font-medium text-gray-900">
            {transaction.id.slice(0, 8)}...
          </div>
          <div className="text-gray-500">
            {new Date(transaction.created_at).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: "User",
      accessor: (transaction: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {transaction.user?.full_name || "N/A"}
          </div>
          <div className="text-gray-500">
            {transaction.user?.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (transaction: any) => (
        <Badge variant="outline" className="capitalize">
          {transaction.type}
        </Badge>
      ),
    },
    {
      header: "Amount",
      accessor: (transaction: any) => (
        <div className="text-sm font-medium text-gray-900">
          ${(transaction.amount / 100).toFixed(2)}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (transaction: any) => getStatusBadge(transaction.status),
    },
    {
      header: "Payment Method",
      accessor: (transaction: any) => (
        <div className="text-sm text-gray-600 capitalize">
          {transaction.payment_method || "N/A"}
        </div>
      ),
    },
    {
      header: "Reference",
      accessor: (transaction: any) => (
        <div className="text-xs font-mono text-gray-500">
          {transaction.reference_id?.slice(0, 12) || "N/A"}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
        <p className="text-gray-600">
          View and manage all payment transactions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`$${(totalRevenue / 100).toFixed(2)}`}
          icon={DollarSign}
          trend={null}
          variant="success"
        />
        <StatsCard
          title="Completed"
          value={completedTransactions}
          icon={CheckCircle}
          trend={null}
          variant="success"
        />
        <StatsCard
          title="Pending"
          value={pendingTransactions}
          icon={Clock}
          trend={null}
          variant="warning"
        />
        <StatsCard
          title="Failed"
          value={failedTransactions}
          icon={XCircle}
          trend={null}
          variant="error"
        />
      </div>

      {/* Transactions Table */}
      <DataTable
        data={transactions || []}
        columns={columns}
        searchPlaceholder="Search transactions..."
      />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(pendingAmount / 100).toFixed(2)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg. Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(avgTransactionValue / 100).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptionPayments}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingPayments}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>
    </div>
  );
}
