import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type DepositGoalInput,
  depositGoalTransaction,
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

// ---------------------------------------------------------------------------
// Global finance data version counter.
//
// Every mutation bumps this counter. Every hook instance subscribes to it and
// reloads when its local version falls behind the global one. This guarantees
// that *all* screens converge to the same snapshot after any write, regardless
// of which screen triggered the write.
// ---------------------------------------------------------------------------

let globalVersion = 0;

type VersionListener = (version: number) => void;
const versionListeners = new Set<VersionListener>();

function subscribeVersion(listener: VersionListener) {
  versionListeners.add(listener);
  return () => {
    versionListeners.delete(listener);
  };
}

/** Bump the global version and notify every subscriber (all screens). */
function broadcastFinanceChanged() {
  globalVersion += 1;
  const v = globalVersion;
  for (const listener of versionListeners) {
    listener(v);
  }
}

export function useFinanceSummary() {
  const db = useSQLiteContext();
  const [snapshot, setSnapshot] = useState<FinanceSnapshot>(emptySnapshot);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track the version this instance has already loaded so we don't reload
  // redundantly when the component itself triggered the mutation.
  const loadedVersionRef = useRef(globalVersion);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextSnapshot = await getFinanceSnapshot(db);
      updateBudgetPulseWidget(nextSnapshot);
      setSnapshot(nextSnapshot);
      // Mark that we are now up-to-date with the current global version.
      loadedVersionRef.current = globalVersion;
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Gagal memuat data keuangan."));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Initial load on mount.
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
          loadedVersionRef.current = globalVersion;
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

  // Subscribe to the global version counter. When another screen (or this
  // screen) bumps the version, reload if we are behind.
  useEffect(() => {
    return subscribeVersion((newVersion) => {
      if (loadedVersionRef.current < newVersion) {
        reload();
      }
    });
  }, [reload]);

  // Helper: run a mutation, reload self, then broadcast so every other screen
  // also reloads. Because reload() updates loadedVersionRef, the broadcast
  // callback for *this* instance will see it is already up-to-date and skip
  // the redundant fetch.
  const mutate = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      const result = await fn();
      await reload();
      broadcastFinanceChanged();
      return result;
    },
    [reload],
  );

  const persistAccount = useCallback(
    (input: SaveAccountInput) => mutate(() => saveAccount(db, input)),
    [db, mutate],
  );

  const removeAccount = useCallback(
    (id: string) => mutate(() => deleteAccount(db, id)),
    [db, mutate],
  );

  const persistBudget = useCallback(
    (input: SaveBudgetInput) => mutate(() => saveBudget(db, input)),
    [db, mutate],
  );

  const removeBudget = useCallback(
    (id: string) => mutate(() => deleteBudget(db, id)),
    [db, mutate],
  );

  const persistGoal = useCallback(
    (input: SaveGoalInput) => mutate(() => saveGoal(db, input)),
    [db, mutate],
  );

  const removeGoal = useCallback(
    (id: string) => mutate(() => deleteGoal(db, id)),
    [db, mutate],
  );

  const depositGoal = useCallback(
    (input: DepositGoalInput) => mutate(() => depositGoalTransaction(db, input)),
    [db, mutate],
  );

  const persistTransaction = useCallback(
    (input: SaveTransactionInput) => mutate(() => saveTransaction(db, input)),
    [db, mutate],
  );

  const persistRecurringTransaction = useCallback(
    (input: SaveRecurringTransactionInput) => mutate(() => saveRecurringTransaction(db, input)),
    [db, mutate],
  );

  const persistProfile = useCallback(
    (input: SaveProfileInput) => mutate(() => saveProfile(db, input)),
    [db, mutate],
  );

  const persistSettings = useCallback(
    (input: SaveSettingsInput) => mutate(() => saveSettings(db, input)),
    [db, mutate],
  );

  const removeTransaction = useCallback(
    (id: string) => mutate(() => deleteTransaction(db, id)),
    [db, mutate],
  );

  const removeRecurringTransaction = useCallback(
    (id: string) => mutate(() => deleteRecurringTransaction(db, id)),
    [db, mutate],
  );

  const persistTransfer = useCallback(
    (input: TransferInput) => mutate(() => transferBetweenAccounts(db, input)),
    [db, mutate],
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
      depositGoal,
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
    depositGoal,
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
