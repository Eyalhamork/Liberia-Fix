"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Filter,
  Calendar,
  User,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface VerificationDocument {
  id: string;
  provider_id: string;
  document_type: string;
  document_number: string;
  document_front_url: string;
  document_back_url: string | null;
  full_name_on_document: string;
  date_of_birth: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  providers?: {
    id: string;
    business_name: string | null;
    profiles?: {
      full_name: string;
      email: string;
      phone: string | null;
      location: string | null;
    };
  };
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationDocument[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVerification, setSelectedVerification] =
    useState<VerificationDocument | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const isMountedRef = useRef(true);

  const supabase = createClient();

  useEffect(() => {
    isMountedRef.current = true;
    fetchVerifications();

    return () => {
      isMountedRef.current = false;
    };
  }, [filter]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("provider_verification_documents")
        .select(
          `
          *,
          providers (
            id,
            business_name,
            profiles (
              full_name,
              email,
              phone,
              location
            )
          )
        `
        )
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      console.log("ADMIN QUERY:", { data, error, count: data?.length });

      if (error) throw error;

      if (isMountedRef.current) {
        setVerifications(data || []);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching verifications:", error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const openVerificationModal = (verification: VerificationDocument) => {
    setSelectedVerification(verification);
    setRejectionReason("");
    setAdminNotes("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVerification(null);
    setRejectionReason("");
    setAdminNotes("");
  };

  const handleApprove = async () => {
    if (!selectedVerification) return;

    setActionLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call approve function
      const { data, error } = await (supabase as any).rpc("approve_verification", {
        p_verification_id: selectedVerification.id,
        p_admin_id: user.id,
      } as any);

      if (error) {
        // Fallback if function doesn't exist - direct API call
        const response = await fetch(
          `/api/admin/verification/${selectedVerification.id}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) throw new Error("Approval failed");
      }

      toast.success("Verification approved successfully!");
      toast.error("Failed to approve verification");
      closeModal();
      fetchVerifications();
    } catch (error: any) {
      console.error("Error approving verification:", error);
      toast.success("Verification approved successfully!");
      toast.error("Failed to approve verification");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;

    if (!rejectionReason.trim()) {
      toast.error("Please provide reason for rejection");
      return;
    }

    setActionLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call reject function
      const { data, error } = await (supabase as any).rpc("reject_verification", {
        p_verification_id: selectedVerification.id,
        p_admin_id: user.id,
        p_reason: rejectionReason,
        p_notes: adminNotes || null,
      } as any);

      if (error) {
        // Fallback if function doesn't exist - direct API call
        const response = await fetch(
          `/api/admin/verification/${selectedVerification.id}/reject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: rejectionReason,
              notes: adminNotes,
            }),
          }
        );

        if (!response.ok) throw new Error("Rejection failed");
      }

      toast.error("Verification Rejected");
      closeModal();
      fetchVerifications();
    } catch (error: any) {
      console.error("Error rejecting verification:", error);
      toast.error("Failed to reject verification");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredVerifications = verifications.filter((v) => {
    const providerName =
      v.providers?.business_name || v.providers?.profiles?.full_name || "";
    const email = v.providers?.profiles?.email || "";
    const documentNumber = v.document_number || "";

    const matchesSearch =
      providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      documentNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    pending: verifications.filter((v) => v.status === "pending").length,
    approved: verifications.filter((v) => v.status === "approved").length,
    rejected: verifications.filter((v) => v.status === "rejected").length,
    total: verifications.length,
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      resubmit_required: "bg-orange-100 text-orange-800 border-orange-200",
    };

    const icons = {
      pending: <Clock className="h-3.5 w-3.5" />,
      approved: <CheckCircle className="h-3.5 w-3.5" />,
      rejected: <XCircle className="h-3.5 w-3.5" />,
      resubmit_required: <RefreshCw className="h-3.5 w-3.5" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {icons[status as keyof typeof icons] || icons.pending}
        {status.replace(/_/g, " ").toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Less than 1 hour ago";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Provider Verifications
          </h1>
          <p className="text-gray-600">
            Review and manage provider identity verification requests
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.approved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === "pending"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setFilter("approved")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === "approved"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter("rejected")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === "rejected"
                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Rejected
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by provider name, email, or document number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Verifications List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading verifications...</p>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery
                ? "No matching verifications"
                : "No verifications found"}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search criteria"
                : `No ${
                    filter === "all" ? "" : filter
                  } verifications at this time`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVerifications.map((verification) => {
              const provider = verification.providers;
              const profile = provider?.profiles;
              const isPending = verification.status === "pending";

              return (
                <div
                  key={verification.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all hover:shadow-md ${
                    isPending ? "border-yellow-200" : "border-gray-100"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Provider Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {provider?.business_name ||
                              profile?.full_name ||
                              "Unknown Provider"}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {profile?.full_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {verification.document_type
                                .replace(/_/g, " ")
                                .toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {getTimeAgo(verification.submitted_at)}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(verification.status)}
                      </div>

                      {/* Document Details */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              Document Number:
                            </span>
                            <p className="text-gray-900 mt-1">
                              {verification.document_number}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Name on Document:
                            </span>
                            <p className="text-gray-900 mt-1">
                              {verification.full_name_on_document}
                            </p>
                          </div>
                          {verification.date_of_birth && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Date of Birth:
                              </span>
                              <p className="text-gray-900 mt-1">
                                {new Date(
                                  verification.date_of_birth
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {verification.expiry_date && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Expiry Date:
                              </span>
                              <p className="text-gray-900 mt-1">
                                {new Date(
                                  verification.expiry_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rejection Reason (if rejected) */}
                      {verification.rejection_reason && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-red-900 mb-1">
                                Rejection Reason:
                              </p>
                              <p className="text-sm text-red-800">
                                {verification.rejection_reason}
                              </p>
                              {verification.admin_notes && (
                                <p className="text-sm text-red-700 mt-2">
                                  <span className="font-medium">
                                    Admin Notes:
                                  </span>{" "}
                                  {verification.admin_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {profile?.email && <span>📧 {profile.email}</span>}
                        {profile?.phone && <span>📞 {profile.phone}</span>}
                        {profile?.location && (
                          <span>📍 {profile.location}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-3">
                      <button
                        onClick={() => openVerificationModal(verification)}
                        className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification Review Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-100 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Review Verification
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Provider Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                <h3 className="font-bold text-lg text-gray-900 mb-4">
                  Provider Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Business Name:
                    </span>
                    <p className="text-gray-900 mt-1">
                      {selectedVerification.providers?.business_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Full Name:
                    </span>
                    <p className="text-gray-900 mt-1">
                      {selectedVerification.providers?.profiles?.full_name}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900 mt-1">
                      {selectedVerification.providers?.profiles?.email}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <p className="text-gray-900 mt-1">
                      {selectedVerification.providers?.profiles?.phone || "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-700">Location:</span>
                    <p className="text-gray-900 mt-1">
                      {selectedVerification.providers?.profiles?.location ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Details */}
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-4">
                  Document Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Document Type:
                    </span>
                    <p className="text-gray-900 mt-1 capitalize">
                      {selectedVerification.document_type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Document Number:
                    </span>
                    <p className="text-gray-900 mt-1">
                      {selectedVerification.document_number}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Name on Document:
                    </span>
                    <p className="text-gray-900 mt-1">
                      {selectedVerification.full_name_on_document}
                    </p>
                  </div>
                  {selectedVerification.date_of_birth && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Date of Birth:
                      </span>
                      <p className="text-gray-900 mt-1">
                        {new Date(
                          selectedVerification.date_of_birth
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedVerification.issue_date && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Issue Date:
                      </span>
                      <p className="text-gray-900 mt-1">
                        {new Date(
                          selectedVerification.issue_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedVerification.expiry_date && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Expiry Date:
                      </span>
                      <p className="text-gray-900 mt-1">
                        {new Date(
                          selectedVerification.expiry_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-700">
                      Submitted:
                    </span>
                    <p className="text-gray-900 mt-1">
                      {formatDate(selectedVerification.submitted_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Images */}
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-4">
                  Document Images
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Front
                    </p>
                    <img
                      src={selectedVerification.document_front_url}
                      alt="Document Front"
                      className="w-full rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() =>
                        window.open(
                          selectedVerification.document_front_url,
                          "_blank"
                        )
                      }
                    />
                  </div>
                  {selectedVerification.document_back_url && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Back
                      </p>
                      <img
                        src={selectedVerification.document_back_url}
                        alt="Document Back"
                        className="w-full rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() =>
                          window.open(
                            selectedVerification.document_back_url!,
                            "_blank"
                          )
                        }
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click images to view full size
                </p>
              </div>

              {/* Rejection Form (only if pending) */}
              {selectedVerification.status === "pending" && (
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">
                    Review Decision
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason (required if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., Document image is unclear. Please upload a clearer photo."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes (optional, internal use only)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal notes about this verification..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedVerification.status === "pending" && (
                <div className="flex gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Approve Verification
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        Reject Verification
                      </>
                    )}
                  </button>
                </div>
              )}

              {selectedVerification.status !== "pending" && (
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-gray-600">
                    This verification has already been{" "}
                    {selectedVerification.status}
                    {selectedVerification.reviewed_at &&
                      ` on ${formatDate(selectedVerification.reviewed_at)}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
