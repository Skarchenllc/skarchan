"use client";

import { ArrowLeft } from "lucide-react";
import { transactionTemplates, TransactionTemplate } from "@/lib/accounting/transaction-templates";

interface TemplateSelectorProps {
  onSelect: (template: TransactionTemplate) => void;
  onBack: () => void;
}

export function TemplateSelector({ onSelect, onBack }: TemplateSelectorProps) {
  // Group templates by category
  const categories = Array.from(new Set(transactionTemplates.map((t) => t.category)));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 hover:bg-accent rounded"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">Quick Templates</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          {categories.map((category) => {
            const templates = transactionTemplates.filter((t) => t.category === category);
            return (
              <div key={category} className="mb-8 last:mb-0">
                <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className="p-5 text-left border-2 rounded-lg hover:border-primary hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{template.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Templates automatically assign debit and credit accounts
            based on transaction type, so you don't need accounting knowledge.
          </p>
        </div>
      </div>
    </div>
  );
}
