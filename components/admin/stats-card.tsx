// components/admin/stats-card.tsx
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  } | null;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "error";
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
}: StatsCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className="mt-2 flex items-center text-sm">
              <span
                className={trend.positive ? "text-green-600" : "text-red-600"}
              >
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-gray-500">vs last month</span>
            </p>
          )}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="ml-4">
          <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <Icon className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>
    </Card>
  );
}
