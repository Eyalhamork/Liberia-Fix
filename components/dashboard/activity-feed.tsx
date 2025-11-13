// components/dashboard/activity-feed.tsx
import { LucideIcon } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  message: string;
  time: string;
  icon: LucideIcon;
  important?: boolean;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activity.icon;
        return (
          <div
            key={activity.id}
            className={`flex items-start gap-3 p-3 rounded-lg ${
              activity.important ? "bg-blue-50" : "bg-gray-50"
            }`}
          >
            <div
              className={`p-1.5 rounded-full ${
                activity.important
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p
                className={`text-sm ${
                  activity.important ? "font-semibold" : ""
                }`}
              >
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
