import { useCallback, useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  deleteBudget,
  deleteAccount,
  deleteGoal,
  deleteTransaction,
  getFinanceSnapshot,
  saveAccount,
  saveBudget,
  saveGoal,
  saveProfile,
  saveSettings,
  saveTransaction,
  saveRecurringTransaction,
  deleteRecurringTransaction,
  transferBetweenAccounts,
  type FinanceSnapshot,
  type SaveAccountInput,
  type SaveBudgetInput,
  type SaveGoalInput,
  type SaveProfileInput,
  type SaveSettingsInput,
  type SaveTransactionInput,
  type SaveRecurringTransactionInput,
  type TransferInput,
} from "@/db/finance-repository";
import { getMonthKey } from "@/lib/forms";
import { updateBudgetPulseWidget } from "@/lib/widget-updates";

const emptySnapshot: FinanceSnapshot = {
  accounts: [],
  budgets: [],
  goals: [],
  insights: [],
  monthlySpending: [],
  profile: {
    displayName: "Izar Finance",
    planLabel: "Local finance workspace",
  },
  settings: {
    budgetNotification: "daily",
    localPrivacyMode: true,
    securityLock: true,
  },
  transactions: [],
  recurringTransactions: [],
};

export function useFinanceSummary() {
  const db = useSQLiteContext();
  const [snapshot, setSnapshot] = useState<FinanceSnapshot>(emptySnapshot);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextSnapshot = await getFinanceSnapshot(db);
      updateBudgetPulseWidget(nextSnapshot);
      setSnapshot(nextSnapshot);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Gagal memuat data keuangan."));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const nextSnapshot = await getFinanceSnapshot(db);
        updateBudgetPulseWidget(nextSnapshot);

        if (isMounted) {
          setSnapshot(nextSnapshot);
        }
      } catch (cause) {
        if (isMounted) {
          setError(cause instanceof Error ? cause : new Error("Gagal memuat data keuangan."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [db]);

  const persistAccount = useCallback(
    async (input: SaveAccountInput) => {
      const id = await saveAccount(db, input);
      await reload();

      return id;
    },
    [db, reload],
  );

  const removeAccount = useCallback(
    async (id: string) => {
      await deleteAccount(db, id);
      await reload();
    },
    [db, reload],
  );

  const persistBudget = useCallback(
    async (input: SaveBudgetInput) => {
      const id = await saveBudget(db, input);
      await reload();

      return id;
    },
    [db, reload],
  );

  const removeBudget = useCallback(
    async (id: string) => {
      await deleteBudget(db, id);
      await reload();
    },
    [db, reload],
  );

  const persistGoal = useCallback(
    async (input: SaveGoalInput) => {
      const id = await saveGoal(db, input);
      await reload();

      return id;
    },
    [db, reload],
  );

  const removeGoal = useCallback(
    async (id: string) => {
      await deleteGoal(db, id);
      await reload();
    },
    [db, reload],
  );

  const persistTransaction = useCallback(
    async (input: SaveTransactionInput) => {
      const id = await saveTransaction(db, input);
      await reload();

      return id;
    },
    [db, reload],
  );

  const persistRecurringTransaction = useCallback(
    async (input: SaveRecurringTransactionInput) => {
      const id = await saveRecurringTransaction(db, input);
      await reload();

      return id;
    },
    [db, reload],
  );

  const persistProfile = useCallback(
    async (input: SaveProfileInput) => {
      await saveProfile(db, input);
      await reload();
    },
    [db, reload],
  );

  const persistSettings = useCallback(
    async (input: SaveSettingsInput) => {
      await saveSettings(db, input);
      await reload();
    },
    [db, reload],
  );



  const removeTransaction = useCallback(
    async (id: string) => {
      await deleteTransaction(db, id);
      await reload();
    },
    [db, reload],
  );

  const removeRecurringTransaction = useCallback(
    async (id: string) => {
      await deleteRecurringTransaction(db, id);
      await reload();
    },
    [db, reload],
  );

  const persistTransfer = useCallback(
    async (input: TransferInput) => {
      await transferBetweenAccounts(db, input);
      await reload();
    },
    [db, reload],
  );

  return useMemo(() => {
    const currentMonthKey = getMonthKey();
    const currentMonthTransactions = snapshot.transactions.filter((transaction) => transaction.date.startsWith(currentMonthKey));
    const totalBalance = snapshot.accounts.reduce((sum, account) => sum + account.balance, 0);
    const monthlyIncome = currentMonthTransactions
      .filter((transaction) => transaction.flow === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const monthlyExpense = currentMonthTransactions
      .filter((transaction) => transaction.flow === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalBudget = snapshot.budgets.reduce((sum, budget) => sum + budget.limit, 0);
    const spentBudget = snapshot.budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const totalGoalTarget = snapshot.goals.reduce((sum, goal) => sum + goal.target, 0);
    const savedGoalTotal = snapshot.goals.reduce((sum, goal) => sum + goal.saved, 0);
    const goalProgress = totalGoalTarget > 0 ? savedGoalTotal / totalGoalTarget : 0;

    return {
      ...snapshot,
      error,
      currentMonthKey,
      currentMonthTransactions,
      goalProgress,
      isLoading,
      monthlyExpense,
      monthlyIncome,
      netCashflow: monthlyIncome - monthlyExpense,
      persistAccount,
      persistBudget,
      persistGoal,
      persistProfile,
      persistSettings,
      persistTransaction,
      persistRecurringTransaction,
      persistTransfer,
      reload,
      removeAccount,
      removeBudget,
      removeGoal,
      removeTransaction,
      removeRecurringTransaction,
      savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0,
      spentBudget,
      totalBalance,
      totalBudget,
    };
  }, [
    error,
    isLoading,
    persistAccount,
    persistBudget,
    persistGoal,
    persistProfile,
    persistSettings,
    persistTransaction,
    persistRecurringTransaction,
    persistTransfer,
    reload,
    removeAccount,
    removeBudget,
    removeGoal,
    removeTransaction,
    removeRecurringTransaction,
    snapshot,
  ]);
}
