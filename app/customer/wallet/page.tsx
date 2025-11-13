"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TopUpModal } from "@/components/wallet/top-up-modal";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Gift,
  RefreshCw,
  Loader2,
  DollarSign,
} from "lucide-react";
import type { WalletTransaction } from "@/lib/constants/wallet";

function WalletContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // Fetch balance
      const balanceResponse = await fetch("/api/wallet/balance");
      const balanceData = await balanceResponse.json();

      if (balanceData.success) {
        setBalance(balanceData.balance || 0);
      }

      // Fetch transactions
      const transactionsResponse = await fetch("/api/wallet/transactions");
      const transactionsData = await transactionsResponse.json();

      if (transactionsData.success) {
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpSuccess = () => {
    fetchWalletData();
    setShowTopUpModal(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "topup":
        return <ArrowUpCircle className="h-5 w-5 text-green-600" />;
      case "deduct":
        return <ArrowDownCircle className="h-5 w-5 text-red-600" />;
      case "bonus":
      case "welcome_bonus":
      case "referral_bonus":
        return <Gift className="h-5 w-5 text-purple-600" />;
      case "refund":
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "topup":
      case "bonus":
      case "welcome_bonus":
      case "referral_bonus":
      case "refund":
        return "text-green-600";
      case "deduct":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case "topup":
        return "Top-Up";
      case "deduct":
        return "Booking Fee";
      case "bonus":
        return "Bonus Credits";
      case "welcome_bonus":
        return "Welcome Bonus";
      case "referral_bonus":
        return "Referral Bonus";
      case "refund":
        return "Refund";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  if (!user || profile?.user_type !== "customer") {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">
            Manage your credits and view transaction history
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 shadow-xl mb-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-6 w-6" />
                    <span className="text-sm font-medium opacity-90">
                      Available Balance
                    </span>
                  </div>
                  <div className="text-5xl font-bold mb-2">
                    {balance.toFixed(1)}
                  </div>
                  <div className="text-sm opacity-90">
                    {balance === 1 ? "credit" : "credits"}
                  </div>
                </div>
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Top Up
                </button>
              </div>

              <div className="border-t border-white/20 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm opacity-90 mb-1">
                      Booking Fee per credit
                    </div>
                    <div className="text-2xl font-bold flex items-center gap-1">
                      <DollarSign className="h-5 w-5" />1
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">
                      Total transactions
                    </div>
                    <div className="text-2xl font-bold">{transactions.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => setShowTopUpModal(true)}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-green-500"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <ArrowUpCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Top Up</div>
                    <div className="text-sm text-gray-600">Add credits</div>
                  </div>
                </div>
              </button>

              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Total Credits</div>
                    <div className="text-sm text-gray-600">
                      {transactions
                        .filter((t) =>
                          ["topup", "bonus", "welcome_bonus", "referral_bonus", "refund"].includes(
                            t.type
                          )
                        )
                        .reduce((acc, t) => acc + t.credits_amount, 0)
                        .toFixed(1)}{" "}
                      earned
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Used Credits</div>
                    <div className="text-sm text-gray-600">
                      {transactions
                        .filter((t) => t.type === "deduct")
                        .reduce((acc, t) => acc + Math.abs(t.credits_amount), 0)
                        .toFixed(1)}{" "}
                      spent
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Transaction History
                </h2>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start by topping up your wallet to make bookings easier
                  </p>
                  <button
                    onClick={() => setShowTopUpModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    Top Up Now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 mb-1">
                              {formatTransactionType(transaction.type)}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {transaction.description}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(transaction.created_at)}
                            </div>
                            {transaction.reference_id && (
                              <div className="text-xs text-gray-400 mt-1">
                                Ref: {transaction.reference_id}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${getTransactionColor(
                              transaction.type
                            )}`}
                          >
                            {transaction.credits_amount >= 0 ? "+" : ""}
                            {transaction.credits_amount.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Balance: {transaction.balance_after.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Top-Up Modal */}
      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
}

export default function WalletPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <WalletContent />
    </ProtectedRoute>
  );
}
