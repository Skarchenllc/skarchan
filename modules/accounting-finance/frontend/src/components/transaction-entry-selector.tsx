"use client";

import { MessageSquare, Camera, Zap, Settings } from "lucide-react";

interface TransactionEntrySelectorProps {
  onSelect: (mode: "ai" | "scan" | "template" | "manual") => void;
  onClose: () => void;
}

export function TransactionEntrySelector({ onSelect, onClose }: TransactionEntrySelectorProps) {
  const entryModes = [
    {
      id: "ai" as const,
      icon: MessageSquare,
      title: "Describe Transaction",
      description: "Type in your own words, AI suggests accounts",
      example: '"I paid $500 to AWS for hosting"',
      badge: "AI Powered",
      badgeColor: "bg-purple-100 text-purple-700",
      available: false, // Will enable in Phase 2
    },
    {
      id: "scan" as const,
      icon: Camera,
      title: "Scan Receipt",
      description: "Upload invoice or receipt photo",
      example: "Auto-extract details from images",
      badge: "Coming Soon",
      badgeColor: "bg-gray-100 text-gray-600",
      available: false, // Will enable in Phase 3
    },
    {
      id: "template" as const,
      icon: Zap,
      title: "Quick Templates",
      description: "Common transactions with guided entry",
      example: "Pay vendor, receive payment, etc.",
      badge: "Fast & Easy",
      badgeColor: "bg-green-100 text-green-700",
      available: true,
    },
    {
      id: "manual" as const,
      icon: Settings,
      title: "Manual Entry",
      description: "Full control for accountants",
      example: "Choose debit & credit accounts",
      badge: "Advanced",
      badgeColor: "bg-blue-100 text-blue-700",
      available: true,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">New Transaction</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose how you'd like to enter this transaction
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {entryModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => mode.available && onSelect(mode.id)}
              disabled={!mode.available}
              className={`
                relative p-6 text-left border-2 rounded-lg transition-all
                ${
                  mode.available
                    ? "hover:border-primary hover:shadow-md cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <mode.icon className="h-6 w-6 text-primary" />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${mode.badgeColor}`}
                >
                  {mode.badge}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-2">{mode.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {mode.description}
              </p>
              <p className="text-xs text-muted-foreground italic">
                {mode.example}
              </p>
            </button>
          ))}
        </div>

        <div className="p-6 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              <span>Available now</span>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
              <span>Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
