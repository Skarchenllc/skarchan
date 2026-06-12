// Transaction Templates Configuration
// These templates guide users through common transactions without needing to know debit/credit

export interface TransactionTemplate {
  id: string;
  icon: string;
  name: string;
  description: string;
  category: string;
  fields: TemplateField[];
  // Rules for automatic debit/credit assignment
  accountingRules: {
    debitAccountType: "expense" | "asset" | "drawing";
    creditAccountType: "asset" | "liability" | "revenue";
    debitAccountCategories?: string[]; // Optional filter by account category
    creditAccountCategories?: string[]; // Optional filter by account category
  };
}

export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "account";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string; accountCode?: string }[];
  helperText?: string;
  accountFilter?: {
    categories?: string[];
    codes?: string[];
  };
}

export const transactionTemplates: TransactionTemplate[] = [
  {
    id: "pay-saas",
    icon: "📱",
    name: "Pay SaaS/Software Subscription",
    description: "Monthly or annual software subscriptions",
    category: "Expenses",
    fields: [
      {
        id: "vendor",
        label: "Software/Service Name",
        type: "text",
        required: true,
        placeholder: "e.g., Anthropic, GitHub, Slack",
      },
      {
        id: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "0.00",
      },
      {
        id: "category",
        label: "What type of software?",
        type: "select",
        required: true,
        options: [
          { value: "6400", label: "Office Supplies (Software/Subscriptions)", accountCode: "6400" },
          { value: "6300", label: "Marketing & Advertising", accountCode: "6300" },
          { value: "6200", label: "Utilities", accountCode: "6200" },
        ],
      },
      {
        id: "payment_account",
        label: "Paid from which account?",
        type: "account",
        required: true,
        helperText: "Select your payment method",
        accountFilter: {
          codes: ["1000", "1010", "1020", "2100"],
        },
      },
      {
        id: "date",
        label: "Payment Date",
        type: "date",
        required: true,
      },
      {
        id: "description",
        label: "Notes (optional)",
        type: "text",
        required: false,
        placeholder: "e.g., Monthly subscription for team",
      },
    ],
    accountingRules: {
      debitAccountType: "expense",
      creditAccountType: "asset",
    },
  },
  {
    id: "pay-cloud",
    icon: "☁️",
    name: "Pay Cloud Hosting",
    description: "AWS, Google Cloud, Azure, DigitalOcean, etc.",
    category: "Expenses",
    fields: [
      {
        id: "vendor",
        label: "Cloud Provider",
        type: "text",
        required: true,
        placeholder: "e.g., AWS, Google Cloud, Azure",
      },
      {
        id: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "0.00",
      },
      {
        id: "category",
        label: "Expense Type",
        type: "select",
        required: true,
        options: [
          { value: "6200", label: "Utilities (Cloud Hosting)", accountCode: "6200" },
          { value: "6400", label: "Office Supplies", accountCode: "6400" },
          { value: "6300", label: "Marketing & Advertising", accountCode: "6300" },
        ],
      },
      {
        id: "payment_account",
        label: "Paid from which account?",
        type: "account",
        required: true,
        accountFilter: {
          codes: ["1000", "1010", "1020", "2100"],
        },
      },
      {
        id: "date",
        label: "Payment Date",
        type: "date",
        required: true,
      },
      {
        id: "description",
        label: "Notes (optional)",
        type: "text",
        required: false,
        placeholder: "e.g., December cloud infrastructure",
      },
    ],
    accountingRules: {
      debitAccountType: "expense",
      creditAccountType: "asset",
      debitAccountCategories: ["Operating Expenses"],
    },
  },
  {
    id: "receive-payment",
    icon: "💰",
    name: "Receive Customer Payment",
    description: "When a customer pays you",
    category: "Revenue",
    fields: [
      {
        id: "customer",
        label: "Customer Name",
        type: "text",
        required: true,
        placeholder: "e.g., Acme Corporation",
      },
      {
        id: "amount",
        label: "Amount Received",
        type: "number",
        required: true,
        placeholder: "0.00",
      },
      {
        id: "revenue_type",
        label: "What type of revenue?",
        type: "select",
        required: true,
        options: [
          { value: "4000", label: "Sales Revenue", accountCode: "4000" },
          { value: "4100", label: "Service Revenue", accountCode: "4100" },
          { value: "4200", label: "Interest Income", accountCode: "4200" },
        ],
      },
      {
        id: "received_in",
        label: "Received into which account?",
        type: "account",
        required: true,
        helperText: "Where did the money go?",
        accountFilter: {
          codes: ["1000", "1010", "1020"],
        },
      },
      {
        id: "date",
        label: "Payment Date",
        type: "date",
        required: true,
      },
      {
        id: "description",
        label: "Notes (optional)",
        type: "text",
        required: false,
        placeholder: "e.g., Invoice #INV-2024-001",
      },
    ],
    accountingRules: {
      debitAccountType: "asset",
      creditAccountType: "revenue",
    },
  },
  {
    id: "pay-contractor",
    icon: "👔",
    name: "Pay Contractor/Freelancer",
    description: "Payments to independent contractors",
    category: "Expenses",
    fields: [
      {
        id: "contractor",
        label: "Contractor Name",
        type: "text",
        required: true,
        placeholder: "e.g., John Doe",
      },
      {
        id: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "0.00",
      },
      {
        id: "service_type",
        label: "Service Type",
        type: "select",
        required: true,
        options: [
          { value: "6000", label: "Salaries & Wages (Contractors)", accountCode: "6000" },
          { value: "6300", label: "Marketing & Advertising", accountCode: "6300" },
          { value: "6400", label: "Office Supplies", accountCode: "6400" },
        ],
      },
      {
        id: "payment_account",
        label: "Paid from which account?",
        type: "account",
        required: true,
        accountFilter: {
          codes: ["1000", "1010", "1020", "2100"],
        },
      },
      {
        id: "date",
        label: "Payment Date",
        type: "date",
        required: true,
      },
      {
        id: "description",
        label: "Notes (optional)",
        type: "text",
        required: false,
        placeholder: "e.g., Website redesign project",
      },
    ],
    accountingRules: {
      debitAccountType: "expense",
      creditAccountType: "asset",
    },
  },
  {
    id: "pay-salary",
    icon: "💵",
    name: "Pay Employee Salary",
    description: "Monthly employee salary payments",
    category: "Expenses",
    fields: [
      {
        id: "employee",
        label: "Employee Name",
        type: "text",
        required: true,
        placeholder: "e.g., Jane Smith",
      },
      {
        id: "amount",
        label: "Net Salary Amount",
        type: "number",
        required: true,
        placeholder: "0.00",
        helperText: "Amount paid after deductions",
      },
      {
        id: "category",
        label: "Expense Type",
        type: "select",
        required: true,
        options: [
          { value: "6000", label: "Salaries & Wages", accountCode: "6000" },
          { value: "6500", label: "Insurance (Employee Benefits)", accountCode: "6500" },
        ],
      },
      {
        id: "payment_account",
        label: "Paid from which account?",
        type: "account",
        required: true,
        accountFilter: {
          codes: ["1000", "1010", "1020", "2100"],
        },
      },
      {
        id: "date",
        label: "Payment Date",
        type: "date",
        required: true,
      },
      {
        id: "description",
        label: "Notes (optional)",
        type: "text",
        required: false,
        placeholder: "e.g., January 2024 salary",
      },
    ],
    accountingRules: {
      debitAccountType: "expense",
      creditAccountType: "asset",
      debitAccountCategories: ["Operating Expenses"],
    },
  },
];

// Helper function to get template by ID
export function getTemplateById(id: string): TransactionTemplate | undefined {
  return transactionTemplates.find((t) => t.id === id);
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): TransactionTemplate[] {
  return transactionTemplates.filter((t) => t.category === category);
}
