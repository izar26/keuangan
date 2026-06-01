import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CalendarDays, Filter, Plus, ReceiptText, RefreshCw, Search, ArrowDownUp } from "lucide-react-native";

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";

import { TransactionFormModal } from "@/components/forms/finance-modals";
import { Button } from "@/components/ui/button";
import { StateView } from "@/components/ui/state-view";
import { ScreenShell } from "@/components/screen-shell";
import { SectionHeader } from "@/components/section-header";
import { TransactionRow } from "@/components/transaction-row";
import { colors } from "@/constants/theme";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { formatMonthLabel } from "@/lib/forms";
import type { MoneyFlow, Transaction } from "@/types/finance";

type FlowFilter = "all" | MoneyFlow;
type PeriodFilter = "all" | "current-month";
type SortFilter = "newest" | "oldest" | "highest" | "lowest";

const PAGE_SIZE = 20;

export default function TransactionsScreen() {
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("current-month");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState<SortFilter>("newest");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
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

      return matchesQuery && matchesFlow && matchesPeriod && matchesCategory;
    });

    if (sortFilter === "oldest") {
      result = [...result].reverse();
    } else if (sortFilter === "highest") {
      result = [...result].sort((a, b) => b.amount - a.amount);
    } else if (sortFilter === "lowest") {
      result = [...result].sort((a, b) => a.amount - b.amount);
    }

    return result;
  }, [flowFilter, periodFilter, categoryFilter, sortFilter, query, summary.currentMonthKey, summary.transactions]);
  const visibleTransactions = useMemo(() => filteredTransactions.slice(0, displayCount), [filteredTransactions, displayCount]);
  const hasMore = displayCount < filteredTransactions.length;

  const loadMore = useCallback(() => {
    setDisplayCount((current) => current + PAGE_SIZE);
  }, []);

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
      Alert.alert("Belum ada rekening", "Silakan tambah rekening terlebih dahulu sebelum mencatat transaksi.");
      return;
    }
    setSelectedTransaction(null);
    setShowForm(true);
  }
  const isInitialLoading = summary.isLoading && summary.transactions.length === 0;

  return (
    <ScreenShell>
      <View className="gap-3">
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

        <Button icon={Plus} label="Tambah transaksi" onPress={openNewTransaction} />
      </View>

      <View className="gap-3">
        <SectionHeader title={`${filteredTransactions.length} transaksi`} />
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
        ) : filteredTransactions.length === 0 ? (
          <StateView
            actionLabel="Tambah transaksi"
            caption={summary.transactions.length === 0 ? "Belum ada transaksi tersimpan." : "Tidak ada transaksi yang cocok dengan filter saat ini."}
            icon={ReceiptText}
            onActionPress={openNewTransaction}
            title="Transaksi kosong"
          />
        ) : null}
        {visibleTransactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            onPress={() => {
              setSelectedTransaction(transaction);
              setShowForm(true);
            }}
            transaction={transaction}
          />
        ))}
        {hasMore ? (
          <Button
            label={`Muat ${Math.min(PAGE_SIZE, filteredTransactions.length - displayCount)} lagi`}
            onPress={loadMore}
            variant="secondary"
          />
        ) : null}
      </View>

      <View className="rounded-lg border border-line bg-surface p-4">
        <Text className="text-base font-semibold text-ink">Rekonsiliasi</Text>
        <Text className="mt-1 text-sm leading-5 text-muted">
          {summary.transactions.length} transaksi tersimpan lokal di SQLite. Pencarian, filter, tambah, edit, dan hapus berjalan tanpa backend.
        </Text>
      </View>

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
    </ScreenShell>
  );
}
