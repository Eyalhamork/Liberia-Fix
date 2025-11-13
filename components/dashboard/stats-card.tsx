// components/dashboard/stats-card.tsx
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
  color: "blue" | "green" | "yellow" | "purple" | "red";
  subtitle?: string;
  prefix?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  color,
  subtitle,
  prefix,
}: StatsCardProps) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    yellow: "text-yellow-600 bg-yellow-100",
    purple: "text-purple-600 bg-purple-100",
    red: "text-red-600 bg-red-100",
  };

  const changeIcon = {
    increase: <TrendingUp className="h-4 w-4" />,
    decrease: <TrendingDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />,
  };

  const changeColor = {
    increase: "text-green-600",
    decrease: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm ${changeColor[changeType]}`}
            >
              {changeIcon[changeType]}
              <span>
                {changeType === "neutral" ? "" : prefix}
                {change} {subtitle}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
