export type MoneyFlow = "income" | "expense";

export type Account = {
  id: string;
  name: string;
  institution: string;
  balance: number;
  accent: "emerald" | "sky" | "amber" | "coral";
  mask: string;
};

export type Transaction = {
  id: string;
  title: string;
  merchant: string;
  category: string;
  amount: number;
  flow: MoneyFlow;
  accountId: string;
  date: string;
};

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurringTransaction = {
  id: string;
  title: string;
  merchant: string;
  category: string;
  amount: number;
  flow: MoneyFlow;
  accountId: string;
  frequency: RecurringFrequency;
  nextDate: string;
};

export type Budget = {
  id: string;
  name: string;
  category: string;
  limit: number;
  spent: number;
  accent: "emerald" | "sky" | "amber" | "coral";
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  dueDate: string;
};

export type Insight = {
  id: string;
  title: string;
  value: string;
  trend: "up" | "down" | "flat";
  caption: string;
};

export type Profile = {
  displayName: string;
  planLabel: string;
};

export type ProfileSettings = {
  budgetNotification: "off" | "daily" | "weekly";
  localPrivacyMode: boolean;
  securityLock: boolean;
};
