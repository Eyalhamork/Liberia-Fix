// app/admin/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import StatsCard from "@/components/admin/stats-card";
import { Card } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";

export default async function AdminDashboard() {
  const supabase = createClient();

  // Fetch all stats in parallel
  const [
    { count: totalUsers },
    { count: totalProviders },
    { count: activeProviders },
    { count: totalBookings },
    { count: pendingBookings },
    { count: completedBookings },
    { count: totalReviews },
    { count: pendingReviews },
    { count: totalServiceRequests },
    { count: activeServiceRequests },
    { data: recentTransactions },
    { data: recentUsers },
    { data: recentProviders },
  ] = await Promise.all([
    // Users
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    // Providers
    supabase.from("providers").select("*", { count: "exact", head: true }),
    supabase
      .from("providers")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    // Bookings
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    // Reviews
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    // Service Requests
    supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    // Recent data
    supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, full_name, email, user_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("providers")
      .select("id, business_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Calculate revenue (if you track it)
  const totalRevenue =
    recentTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to LiberiaFix Admin Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={totalUsers || 0}
          icon={Users}
          subtitle={`${totalProviders || 0} providers, ${
            (totalUsers || 0) - (totalProviders || 0)
          } customers`}
        />
        <StatsCard
          title="Active Providers"
          value={activeProviders || 0}
          icon={Briefcase}
          subtitle={`${totalProviders || 0} total providers`}
        />
        <StatsCard
          title="Total Bookings"
          value={totalBookings || 0}
          icon={Calendar}
          subtitle={`${completedBookings || 0} completed`}
        />
        <StatsCard
          title="Pending Reviews"
          value={pendingReviews || 0}
          icon={Star}
          subtitle={`${totalReviews || 0} total reviews`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Service Requests"
          value={totalServiceRequests || 0}
          icon={TrendingUp}
          subtitle={`${activeServiceRequests || 0} active`}
        />
        <StatsCard
          title="Pending Bookings"
          value={pendingBookings || 0}
          icon={Clock}
          subtitle="Needs attention"
        />
        <StatsCard
          title="Completed Bookings"
          value={completedBookings || 0}
          icon={CheckCircle}
          subtitle="All time"
        />
        <StatsCard
          title="Total Revenue"
          value={`${(totalRevenue / 100).toFixed(2)}`}
          icon={DollarSign}
          subtitle="From transactions"
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Users
          </h3>
          <div className="space-y-4">
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.full_name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.user_type}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent users</p>
            )}
          </div>
        </Card>

        {/* Recent Providers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Providers
          </h3>
          <div className="space-y-4">
            {recentProviders && recentProviders.length > 0 ? (
              recentProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {provider.business_name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Provider ID: {provider.id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(provider.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent providers</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.user_id?.slice(0, 8)}...
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.type || "N/A"}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${((transaction.amount || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-sm text-gray-500"
                  >
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
