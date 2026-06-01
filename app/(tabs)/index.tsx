import { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Landmark, PiggyBank, ReceiptText, RefreshCw, WalletCards } from "lucide-react-native";

import { AccountCard } from "@/components/account-card";
import { BalanceCard } from "@/components/balance-card";
import { BudgetChallengeCard } from "@/components/budget-challenge-card";
import { BudgetCard } from "@/components/budget-card";
import { DailyMoneyPulse } from "@/components/daily-money-pulse";
import { AccountFormModal, BudgetFormModal, TransactionFormModal, TransferFormModal } from "@/components/forms/finance-modals";
import { InsightCard } from "@/components/insight-card";
import { MetricCard } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionHeader } from "@/components/section-header";
import { TransactionRow } from "@/components/transaction-row";
import { useAppAlert } from "@/components/ui/app-alert";
import { StateView } from "@/components/ui/state-view";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { formatMonthLabel } from "@/lib/forms";
import { formatCurrency, getGreeting } from "@/lib/format";
import type { Account, Budget, Transaction } from "@/types/finance";

export default function DashboardScreen() {
  const router = useRouter();
  const appAlert = useAppAlert();
  const summary = useFinanceSummary();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const isInitialLoading = summary.isLoading && summary.accounts.length === 0 && summary.transactions.length === 0;
  const currentMonthLabel = formatMonthLabel();
  const firstName = summary.profile.displayName.trim().split(/\s+/)[0] || "Pengguna";

  const criticalBudgets = summary.budgets.filter((b) => b.limit > 0 && b.spent >= b.limit * 0.8);
  const streakInsight = summary.insights.find((i) => i.id === "insight-count");

  return (
    <ScreenShell>
      <View className="gap-1">
        <Text className="text-sm font-semibold text-emerald">{getGreeting()}, {firstName}</Text>
        <Text className="text-2xl font-bold text-ink">Keuangan hari ini</Text>
      </View>

      {isInitialLoading ? (
        <StateView caption="Database lokal sedang disiapkan." isLoading title="Memuat data" />
      ) : summary.error ? (
        <StateView
          actionLabel="Coba lagi"
          caption={summary.error.message}
          icon={RefreshCw}
          onActionPress={summary.reload}
          title="Data belum bisa dimuat"
        />
      ) : (
        <BalanceCard
          balance={summary.totalBalance}
          cashflow={summary.netCashflow}
          onAddTransaction={() => {
            if (summary.accounts.length === 0) {
              appAlert.show({
                message: "Tambahkan rekening dulu supaya transaksi punya sumber dana.",
                title: "Belum ada rekening",
                tone: "warning",
              });
              return;
            }
            setSelectedTransaction(null);
            setShowTransactionForm(true);
          }}
          onTransfer={() => {
            if (summary.accounts.length < 2) {
              appAlert.show({
                message: "Minimal perlu dua rekening supaya saldo bisa dipindahkan antar sumber dana.",
                title: "Rekening tidak cukup",
                tone: "warning",
              });
              return;
            }
            setShowTransferForm(true);
          }}
          savingsRate={summary.savingsRate}
        />
      )}

      <DailyMoneyPulse budgets={summary.budgets} transactions={summary.transactions} />

      <View className="flex-row gap-3">
        <MetricCard accent="sky" icon={Landmark} label={`Masuk ${currentMonthLabel}`} value={formatCurrency(summary.monthlyIncome, true)} />
        <MetricCard accent="coral" icon={ReceiptText} label={`Keluar ${currentMonthLabel}`} value={formatCurrency(summary.monthlyExpense, true)} />
      </View>

      {/* GAMIFICATION & ALERTS */}
      {criticalBudgets.length > 0 && (
        <View className="rounded-lg border border-coral bg-surface p-3 gap-1">
          <Text className="font-bold text-coral">⚠️ Awas Overbudget!</Text>
          {criticalBudgets.map((b) => (
            <Text key={b.id} className="text-sm font-medium text-ink">
              {b.name}: Terpakai {Math.round((b.spent / b.limit) * 100)}% dari limit
            </Text>
          ))}
        </View>
      )}

      {streakInsight && (
        <View className="mt-1">
          <InsightCard insight={streakInsight} />
        </View>
      )}

      <BudgetChallengeCard budgets={summary.budgets} transactions={summary.transactions} />

      <View className="gap-3">
        <SectionHeader actionLabel="Detail" icon={PiggyBank} onActionPress={() => router.push("/budgets")} title="Budget aktif" />
        {!isInitialLoading && !summary.error && summary.budgets.length === 0 ? (
          <StateView
            actionLabel="Tambah budget"
            caption="Buat budget pertama untuk memantau pengeluaran bulan ini."
            icon={PiggyBank}
            onActionPress={() => {
              setSelectedBudget(null);
              setShowBudgetForm(true);
            }}
            title="Belum ada budget"
          />
        ) : null}
        {summary.budgets.slice(0, 2).map((budget) => (
          <BudgetCard
            budget={budget}
            key={budget.id}
            onPress={() => {
              setSelectedBudget(budget);
              setShowBudgetForm(true);
            }}
          />
        ))}
      </View>

      <View className="gap-3">
        <SectionHeader actionLabel="Semua" icon={ReceiptText} onActionPress={() => router.push("/transactions")} title="Transaksi terbaru" />
        {!isInitialLoading && !summary.error && summary.transactions.length === 0 ? (
          <StateView
            actionLabel={summary.accounts.length === 0 ? "Tambah rekening" : "Tambah transaksi"}
            caption={
              summary.accounts.length === 0
                ? "Tambahkan rekening dulu agar transaksi punya sumber dana."
                : "Catat transaksi pertama agar ringkasan bulanan mulai bergerak."
            }
            icon={ReceiptText}
            onActionPress={() => {
              if (summary.accounts.length === 0) {
                setSelectedAccount(null);
                setShowAccountForm(true);
                return;
              }

              setSelectedTransaction(null);
              setShowTransactionForm(true);
            }}
            title="Belum ada transaksi"
          />
        ) : null}
        {summary.transactions.slice(0, 4).map((transaction) => (
          <TransactionRow
            key={transaction.id}
            onPress={() => {
              setSelectedTransaction(transaction);
              setShowTransactionForm(true);
            }}
            transaction={transaction}
          />
        ))}
      </View>

      <View className="gap-3">
        <SectionHeader
          actionLabel="Tambah"
          icon={WalletCards}
          onActionPress={() => {
            setSelectedAccount(null);
            setShowAccountForm(true);
          }}
          title="Rekening"
        />
        {summary.accounts.length === 0 ? (
          <StateView
            actionLabel="Tambah rekening"
            caption="Tambahkan rekening pertama untuk mulai mencatat saldo dan transaksi."
            icon={WalletCards}
            onActionPress={() => {
              setSelectedAccount(null);
              setShowAccountForm(true);
            }}
            title="Belum ada rekening"
          />
        ) : null}
        {summary.accounts.map((account) => (
          <AccountCard
            account={account}
            key={account.id}
            onPress={() => {
              setSelectedAccount(account);
              setShowAccountForm(true);
            }}
          />
        ))}
      </View>

      <AccountFormModal
        account={selectedAccount}
        onClose={() => setShowAccountForm(false)}
        onDelete={async (id) => {
          await summary.removeAccount(id);
          setShowAccountForm(false);
        }}
        onSave={summary.persistAccount}
        visible={showAccountForm}
      />
      <BudgetFormModal
        budget={selectedBudget}
        onClose={() => setShowBudgetForm(false)}
        onDelete={async (id) => {
          await summary.removeBudget(id);
          setShowBudgetForm(false);
        }}
        onSave={summary.persistBudget}
        visible={showBudgetForm}
      />
      <TransactionFormModal
        accounts={summary.accounts}
        onClose={() => setShowTransactionForm(false)}
        onDelete={async (id) => {
          await summary.removeTransaction(id);
          setShowTransactionForm(false);
        }}
        onSave={summary.persistTransaction}
        transaction={selectedTransaction}
        visible={showTransactionForm}
      />
      <TransferFormModal
        accounts={summary.accounts}
        onClose={() => setShowTransferForm(false)}
        onSave={summary.persistTransfer}
        visible={showTransferForm}
      />
    </ScreenShell>
  );
}
