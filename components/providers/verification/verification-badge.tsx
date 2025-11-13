import { Shield, Clock, XCircle, AlertCircle } from "lucide-react";

interface VerificationBadgeProps {
  status: "not_submitted" | "pending" | "verified" | "rejected";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function VerificationBadge({
  status,
  size = "md",
  showText = true,
  className = "",
}: VerificationBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (status === "verified") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <Shield
          className={`${sizeClasses[size]} text-blue-600`}
          fill="currentColor"
        />
        {showText && (
          <span
            className={`${textSizeClasses[size]} font-semibold text-blue-600`}
          >
            Verified
          </span>
        )}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <Clock className={`${sizeClasses[size]} text-yellow-600`} />
        {showText && (
          <span
            className={`${textSizeClasses[size]} font-medium text-yellow-700`}
          >
            Pending Review
          </span>
        )}
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <XCircle className={`${sizeClasses[size]} text-red-600`} />
        {showText && (
          <span className={`${textSizeClasses[size]} font-medium text-red-600`}>
            Not Verified
          </span>
        )}
      </div>
    );
  }

  if (status === "not_submitted") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <AlertCircle className={`${sizeClasses[size]} text-gray-400`} />
        {showText && (
          <span
            className={`${textSizeClasses[size]} font-medium text-gray-500`}
          >
            Not Verified
          </span>
        )}
      </div>
    );
  }

  return null;
}

// Alternative: Full Badge with Border
export function VerificationBadgeFull({
  status,
  className = "",
}: Pick<VerificationBadgeProps, "status" | "className">) {
  const statusConfig = {
    verified: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      icon: Shield,
      label: "Verified Provider",
    },
    pending: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      icon: Clock,
      label: "Verification Pending",
    },
    rejected: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: XCircle,
      label: "Not Verified",
    },
    not_submitted: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-600",
      icon: AlertCircle,
      label: "Not Verified",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${className}`}
    >
      <Icon className={`h-4 w-4 ${config.text}`} />
      <span className={`text-sm font-medium ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

// Demo component showing all states
export function VerificationBadgeDemo() {
  return (
    <div className="p-8 space-y-8 bg-gray-50 rounded-lg">
      <div>
        <h3 className="font-semibold mb-4 text-gray-900">Small Size</h3>
        <div className="space-y-3">
          <VerificationBadge status="verified" size="sm" />
          <VerificationBadge status="pending" size="sm" />
          <VerificationBadge status="rejected" size="sm" />
          <VerificationBadge status="not_submitted" size="sm" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-gray-900">
          Medium Size (Default)
        </h3>
        <div className="space-y-3">
          <VerificationBadge status="verified" />
          <VerificationBadge status="pending" />
          <VerificationBadge status="rejected" />
          <VerificationBadge status="not_submitted" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-gray-900">Large Size</h3>
        <div className="space-y-3">
          <VerificationBadge status="verified" size="lg" />
          <VerificationBadge status="pending" size="lg" />
          <VerificationBadge status="rejected" size="lg" />
          <VerificationBadge status="not_submitted" size="lg" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-gray-900">Full Badge Style</h3>
        <div className="space-y-3">
          <VerificationBadgeFull status="verified" />
          <VerificationBadgeFull status="pending" />
          <VerificationBadgeFull status="rejected" />
          <VerificationBadgeFull status="not_submitted" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-gray-900">Icon Only</h3>
        <div className="flex gap-4">
          <VerificationBadge status="verified" showText={false} />
          <VerificationBadge status="pending" showText={false} />
          <VerificationBadge status="rejected" showText={false} />
          <VerificationBadge status="not_submitted" showText={false} />
        </div>
      </div>
    </div>
  );
}
