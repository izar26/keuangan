import type { FinanceSnapshot } from "@/db/finance-repository";

export function updateBudgetPulseWidget(_snapshot: FinanceSnapshot) {
  // Home screen widgets are iOS-only in expo-widgets v56; web and Android keep app runtime clean.
}
