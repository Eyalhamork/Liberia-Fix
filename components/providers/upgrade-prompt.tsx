// components/providers/upgrade-prompt.tsx
// Reusable upgrade prompt component

import { Lock, Crown } from "lucide-react";

interface UpgradePromptProps {
  reason: string;
  onUpgrade: () => void;
}

export function UpgradePrompt({ reason, onUpgrade }: UpgradePromptProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Lock className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-2">Upgrade Required</h3>
          <p className="text-sm text-gray-700 mb-4">{reason}</p>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
          >
            <Crown className="h-4 w-4" />
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
