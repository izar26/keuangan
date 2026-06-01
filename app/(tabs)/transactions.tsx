import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { CalendarDays, Filter, Plus, ReceiptText, RefreshCw, Search, ArrowDownUp } from "lucide-react-native";

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";

import { TransactionFormModal } from "@/components/forms/finance-modals";
import { useAppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { StateView } from "@/components/ui/state-view";
import { SectionHeader } from "@/components/section-header";
import { TransactionRow } from "@/components/transaction-row";
import { colors } from "@/constants/theme";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { formatMonthLabel } from "@/lib/forms";
import type { MoneyFlow, Transaction } from "@/types/finance";

type FlowFilter = "all" | MoneyFlow;
type PeriodFilter = "all" | "current-month";
type SortFilter = "newest" | "oldest" | "highest" | "lowest";
type AmountFilter = "all" | "over-50k" | "over-100k";

export default function TransactionsScreen() {
  const appAlert = useAppAlert();
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("current-month");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState<AmountFilter>("all");
  const [sortFilter, setSortFilter] = useState<SortFilter>("newest");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const summary = useFinanceSummary();
  const currentMonthLabel = formatMonthLabel();

  const allCategories = useMemo(() => {
    return Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => c.name)));
  }, []);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let result = summary.transactions.filter((transaction) => {
      const matchesQuery =
        !normalizedQuery ||
        [transaction.title, transaction.merchant, transaction.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesFlow = flowFilter === "all" || transaction.flow === flowFilter;
      const matchesPeriod = periodFilter === "all" || transaction.date.startsWith(summary.currentMonthKey);
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
      const matchesAccount = accountFilter === "all" || transaction.accountId === accountFilter;
      const matchesAmount =
        amountFilter === "all" ||
        (amountFilter === "over-50k" && transaction.amount >= 50000) ||
        (amountFilter === "over-100k" && transaction.amount >= 100000);

      return matchesQuery && matchesFlow && matchesPeriod && matchesCategory && matchesAccount && matchesAmount;
    });

    if (sortFilter === "oldest") {
      result = [...result].reverse();
    } else if (sortFilter === "highest") {
      result = [...result].sort((a, b) => b.amount - a.amount);
    } else if (sortFilter === "lowest") {
      result = [...result].sort((a, b) => a.amount - b.amount);
    }

    return result;
  }, [accountFilter, amountFilter, flowFilter, periodFilter, categoryFilter, sortFilter, query, summary.currentMonthKey, summary.transactions]);

  function cycleFlowFilter() {
    setFlowFilter((current) => {
      const next = current === "all" ? "income" : current === "income" ? "expense" : "all";
      setCategoryFilter("all"); // reset category when flow changes
      return next;
    });
  }

  function cycleSortFilter() {
    setSortFilter((current) => {
      if (current === "newest") return "highest";
      if (current === "highest") return "lowest";
      if (current === "lowest") return "oldest";
      return "newest";
    });
  }

  function openNewTransaction() {
    if (summary.accounts.length === 0) {
      appAlert.show({
        message: "Tambahkan rekening terlebih dahulu sebelum mencatat transaksi.",
        title: "Belum ada rekening",
        tone: "warning",
      });
      return;
    }
    setSelectedTransaction(null);
    setShowForm(true);
  }
  const isInitialLoading = summary.isLoading && summary.transactions.length === 0;

  return (
    <View className="flex-1 bg-canvas">
      <FlashList
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20 }}
        data={filteredTransactions}
        extraData={{ selectedTransaction }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(transaction) => transaction.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="pt-3">
            {isInitialLoading ? (
              <StateView caption="Membaca transaksi dari database lokal." isLoading title="Memuat transaksi" />
            ) : summary.error ? (
              <StateView
                actionLabel="Coba lagi"
                caption={summary.error.message}
                icon={RefreshCw}
                onActionPress={summary.reload}
                title="Transaksi belum bisa dimuat"
              />
            ) : (
              <StateView
                actionLabel="Tambah transaksi"
                caption={summary.transactions.length === 0 ? "Belum ada transaksi tersimpan." : "Tidak ada transaksi yang cocok dengan filter saat ini."}
                icon={ReceiptText}
                onActionPress={openNewTransaction}
                title="Transaksi kosong"
              />
            )}
          </View>
        }
        ListFooterComponent={
          <View className="mt-5 rounded-lg border border-line bg-surface p-4">
            <Text className="text-base font-semibold text-ink">Rekonsiliasi</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              {summary.transactions.length} transaksi tersimpan lokal di SQLite. Pencarian, filter, tambah, edit, dan hapus berjalan tanpa backend.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View className="gap-3 pb-3">
      <View className="flex-row items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <Search color={colors.muted} size={18} strokeWidth={2.3} />
          <TextInput
            className="flex-1 text-base text-ink"
            onChangeText={setQuery}
            placeholder="Cari transaksi"
            placeholderTextColor={colors.muted}
            value={query}
          />
        </View>

        <View className="flex-row gap-2">
          <Button
            className="flex-1"
            icon={Filter}
            label={flowFilter === "all" ? "Semua" : flowFilter === "income" ? "Masuk" : "Keluar"}
            onPress={cycleFlowFilter}
            variant="secondary"
          />
          <Button
            className="flex-1"
            icon={CalendarDays}
            label={periodFilter === "current-month" ? currentMonthLabel : "Semua waktu"}
            onPress={() => setPeriodFilter((current) => (current === "current-month" ? "all" : "current-month"))}
            variant="secondary"
          />
          <Button
            className="flex-1"
            icon={ArrowDownUp}
            label={sortFilter === "newest" ? "Terbaru" : sortFilter === "highest" ? "Tertinggi" : sortFilter === "lowest" ? "Terendah" : "Terlama"}
            onPress={cycleSortFilter}
            variant="secondary"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row gap-2 px-1">
            <Pressable
              onPress={() => setAccountFilter("all")}
              className={`rounded-full px-4 py-1.5 border ${accountFilter === "all" ? "border-emerald bg-mint" : "border-line bg-surface"}`}
            >
              <Text className={`text-sm ${accountFilter === "all" ? "font-bold text-emerald" : "text-ink"}`}>Semua rekening</Text>
            </Pressable>
            {summary.accounts.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => setAccountFilter(account.id)}
                className={`rounded-full px-4 py-1.5 border ${accountFilter === account.id ? "border-emerald bg-mint" : "border-line bg-surface"}`}
              >
                <Text className={`text-sm ${accountFilter === account.id ? "font-bold text-emerald" : "text-ink"}`}>{account.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row gap-2 px-1">
            <Pressable
              onPress={() => setCategoryFilter("all")}
              className={`rounded-full px-4 py-1.5 border ${categoryFilter === "all" ? "border-emerald bg-mint" : "border-line bg-surface"}`}
            >
              <Text className={`text-sm ${categoryFilter === "all" ? "font-bold text-emerald" : "text-ink"}`}>Semua</Text>
            </Pressable>
            {allCategories.map((catName) => (
              <Pressable
                key={catName}
                onPress={() => setCategoryFilter(catName)}
                className={`rounded-full px-4 py-1.5 border ${categoryFilter === catName ? "border-emerald bg-mint" : "border-line bg-surface"}`}
              >
                <Text className={`text-sm ${categoryFilter === catName ? "font-bold text-emerald" : "text-ink"}`}>{catName}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View className="flex-row gap-2">
          {[
            { label: "Semua nominal", value: "all" },
            { label: "50rb+", value: "over-50k" },
            { label: "100rb+", value: "over-100k" },
          ].map((option) => (
            <Pressable
              className={`flex-1 rounded-lg border px-3 py-2 ${amountFilter === option.value ? "border-emerald bg-mint" : "border-line bg-surface"}`}
              key={option.value}
              onPress={() => setAmountFilter(option.value as AmountFilter)}
            >
              <Text className={`text-center text-xs font-bold ${amountFilter === option.value ? "text-emerald" : "text-muted"}`}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Button icon={Plus} label="Tambah transaksi" onPress={openNewTransaction} />

        <SectionHeader title={`${filteredTransactions.length} transaksi`} />
          </View>
        }
        renderItem={({ item: transaction }) => (
          <TransactionRow
            onPress={() => {
              setSelectedTransaction(transaction);
              setShowForm(true);
            }}
            transaction={transaction}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <TransactionFormModal
        accounts={summary.accounts}
        onClose={() => setShowForm(false)}
        onDelete={async (id) => {
          await summary.removeTransaction(id);
          setShowForm(false);
        }}
        onSave={summary.persistTransaction}
        transaction={selectedTransaction}
        visible={showForm}
      />
    </View>
  );
}
