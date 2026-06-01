import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight, Lightbulb, Plus, ReceiptText, RefreshCw, Target, Calculator, ChevronDown, ChevronUp } from "lucide-react-native";

import { BudgetCard } from "@/components/budget-card";
import { BudgetFormModal, GoalDepositModal, GoalFormModal } from "@/components/forms/finance-modals";
import { GoalCard } from "@/components/goal-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateView } from "@/components/ui/state-view";
import { MoneyField, SegmentedField } from "@/components/ui/form-modal";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { formatCurrency, formatPercent, formatFullDate } from "@/lib/format";
import { getMonthKey, parseMoneyInput, moneyToInput } from "@/lib/forms";
import type { Budget, Goal } from "@/types/finance";

function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return getMonthKey(date);
}

function formatMonthDisplay(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);
}

export default function BudgetsScreen() {
  const summary = useFinanceSummary();
  const currentMonthKey = getMonthKey();
  const [budgetMonthKey, setBudgetMonthKey] = useState(currentMonthKey);
  const isCurrentMonth = budgetMonthKey === currentMonthKey;

  // Recalculate budget spent for selected month
  const budgetsForMonth = useMemo(() => {
    return summary.budgets.map((budget) => {
      if (!budget.category) {
        return budget;
      }

      const spent = summary.transactions
        .filter(
          (t) =>
            t.flow === "expense" &&
            t.category.toLowerCase() === budget.category.toLowerCase() &&
            t.date.startsWith(budgetMonthKey),
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent };
    });
  }, [budgetMonthKey, summary.budgets, summary.transactions]);

  const totalBudget = budgetsForMonth.reduce((sum, b) => sum + b.limit, 0);
  const spentBudget = budgetsForMonth.reduce((sum, b) => sum + b.spent, 0);
  const progress = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - spentBudget;
  const goalTargetTotal = summary.goals.reduce((sum, goal) => sum + goal.target, 0);
  const goalSavedTotal = summary.goals.reduce((sum, goal) => sum + goal.saved, 0);
  const goalProgress = goalTargetTotal > 0 ? (goalSavedTotal / goalTargetTotal) * 100 : 0;
  const budgetCaption =
    totalBudget <= 0
      ? "Tambahkan budget untuk mulai memantau batas pengeluaran."
      : remainingBudget < 0
        ? `Pengeluaran melewati limit sebesar ${formatCurrency(Math.abs(remainingBudget), true)}.`
        : `Sisa ruang budget ${formatCurrency(remainingBudget, true)}.`;
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showGoalDeposit, setShowGoalDeposit] = useState(false);
  const isInitialLoading = summary.isLoading && summary.budgets.length === 0 && summary.goals.length === 0;

  // Standalone simulator states
  const [showSimulator, setShowSimulator] = useState(false);
  const [simTarget, setSimTarget] = useState("");
  const [simSaved, setSimSaved] = useState("");
  const [simAmount, setSimAmount] = useState("");
  const [simFrequency, setSimFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");

  const parsedSimTarget = parseMoneyInput(simTarget);
  const parsedSimSaved = parseMoneyInput(simSaved);
  const parsedSimAmount = parseMoneyInput(simAmount);
  const simRemaining = Math.max(parsedSimTarget - parsedSimSaved, 0);

  const standaloneSimResult = useMemo(() => {
    if (simRemaining <= 0 || parsedSimAmount <= 0) {
      return null;
    }

    const periodsNeeded = Math.ceil(simRemaining / parsedSimAmount);

    // Safety check to prevent huge calculations or Date overflow
    if (periodsNeeded > 50000) {
      return {
        formattedDate: "Terlalu lama (lebih dari 100 tahun)",
        periods: periodsNeeded,
        isValid: false,
      };
    }

    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);

    if (simFrequency === "daily") {
      targetDate.setDate(targetDate.getDate() + periodsNeeded);
    } else if (simFrequency === "weekly") {
      targetDate.setDate(targetDate.getDate() + periodsNeeded * 7);
    } else if (simFrequency === "monthly") {
      targetDate.setMonth(targetDate.getMonth() + periodsNeeded);
    }

    // Double check if date is valid and within range
    if (Number.isNaN(targetDate.getTime()) || targetDate.getFullYear() > 2100) {
      return {
        formattedDate: "Terlalu lama (lebih dari 100 tahun)",
        periods: periodsNeeded,
        isValid: false,
      };
    }

    return {
      formattedDate: formatFullDate(targetDate),
      periods: periodsNeeded,
      isValid: true,
    };
  }, [simRemaining, parsedSimAmount, simFrequency]);

  return (
    <ScreenShell>
      <Card className="gap-4 bg-ink">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className="text-sm font-medium text-white/70">
              {isCurrentMonth ? "Sisa jatah belanja bulan ini" : "Sisa jatah belanja bulan terpilih"}
            </Text>
            <Text className="text-2xl font-bold text-white" selectable>
              {formatCurrency(remainingBudget, true)}
            </Text>
          </View>
          <Text className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
            {formatPercent(progress)}
          </Text>
        </View>
        <Text className="text-sm leading-5 text-white/70">
          Filter bulan di bawah cuma mengubah hitungan jatah belanja. Transaksi bulan {formatMonthDisplay(budgetMonthKey)} sudah memakai {formatCurrency(spentBudget, true)} dari total jatah {formatCurrency(totalBudget, true)}. {budgetCaption}
        </Text>

        <View className="flex-row items-center justify-between rounded-lg bg-white/10 px-2 py-2">
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-md"
            onPress={() => setBudgetMonthKey(shiftMonth(budgetMonthKey, -1))}
          >
            <ChevronLeft color="#FFFFFF" size={18} strokeWidth={2.5} />
          </Pressable>
          <Text className="text-sm font-semibold text-white">{formatMonthDisplay(budgetMonthKey)}</Text>
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-md"
            disabled={isCurrentMonth}
            onPress={() => setBudgetMonthKey(shiftMonth(budgetMonthKey, 1))}
            style={isCurrentMonth ? { opacity: 0.3 } : undefined}
          >
            <ChevronRight color="#FFFFFF" size={18} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
          <CalendarDays color="#FFFFFF" size={15} strokeWidth={2.4} />
          <Text className="flex-1 text-xs font-semibold text-white/75">
            Ganti bulan untuk cek pemakaian jatah di bulan sebelumnya. Tujuan tabungan tidak ikut berubah.
          </Text>
        </View>

        <View className="flex-row gap-3">
          <Button
            className="flex-1 bg-white"
            icon={Plus}
            label="Budget"
            onPress={() => {
              setSelectedBudget(null);
              setShowBudgetForm(true);
            }}
            variant="secondary"
          />
          <Button
            className="flex-1 border-white/25 bg-white/10"
            icon={Plus}
            label="Tujuan"
            onPress={() => {
              setSelectedGoal(null);
              setShowGoalForm(true);
            }}
          />
        </View>
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-mint">
            <Lightbulb color="#1F8A5B" size={20} strokeWidth={2.3} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-base font-bold text-ink">Ada 2 hal di halaman ini</Text>
            <Text className="text-sm leading-5 text-muted">
              Jatah kategori untuk membatasi pengeluaran bulanan. Tujuan tabungan untuk melacak uang yang sedang dikumpulkan.
            </Text>
          </View>
        </View>
        <View className="gap-2 rounded-lg bg-canvas p-3">
          <View className="flex-row items-center gap-2">
            <ReceiptText color="#667267" size={16} strokeWidth={2.3} />
            <Text className="flex-1 text-xs font-semibold text-muted">Jatah kategori: reset hitungannya per bulan dan berhubungan dengan transaksi.</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Target color="#667267" size={16} strokeWidth={2.3} />
            <Text className="flex-1 text-xs font-semibold text-muted">Tujuan tabungan: progress manual untuk target seperti dana darurat, laptop, atau liburan.</Text>
          </View>
        </View>
      </Card>

      <View className="gap-3">
        <SectionHeader icon={Target} title="Jatah per kategori" />
        {isInitialLoading ? (
          <StateView caption="Membaca budget dari database lokal." isLoading title="Memuat budget" />
        ) : summary.error ? (
          <StateView
            actionLabel="Coba lagi"
            caption={summary.error.message}
            icon={RefreshCw}
            onActionPress={summary.reload}
            title="Budget belum bisa dimuat"
          />
        ) : summary.budgets.length === 0 ? (
          <StateView
            actionLabel="Tambah budget"
            caption="Contoh: Makan Rp1 juta, Transport Rp400 ribu, Hiburan Rp300 ribu."
            icon={Target}
            onActionPress={() => {
              setSelectedBudget(null);
              setShowBudgetForm(true);
            }}
            title="Belum ada jatah kategori"
          />
        ) : null}
        {budgetsForMonth.map((budget) => (
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
        <SectionHeader title="Tujuan tabungan" />
        <Card className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-sm font-bold text-emerald">Total progress tujuan</Text>
              <Text className="text-2xl font-bold text-ink">{formatPercent(goalProgress)}</Text>
            </View>
            <Text className="text-right text-xs font-semibold leading-4 text-muted">
              {formatCurrency(goalSavedTotal, true)} terkumpul{"\n"}dari {formatCurrency(goalTargetTotal, true)}
            </Text>
          </View>
          <Text className="text-sm leading-5 text-muted">
            Tujuan tidak otomatis berkurang dari transaksi. Isi "sudah terkumpul" sesuai uang yang memang kamu sisihkan untuk tujuan itu.
          </Text>
        </Card>

        <Card className="gap-3 border-emerald/25 bg-mint/10">
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => setShowSimulator(!showSimulator)}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-mint">
                <Calculator color="#1F8A5B" size={18} strokeWidth={2.3} />
              </View>
              <View className="gap-0.5">
                <Text className="text-sm font-bold text-ink">Simulator Waktu Nabung</Text>
                <Text className="text-xs text-muted">Hitung berapa lama waktu & tanggal target tercapai</Text>
              </View>
            </View>
            {showSimulator ? (
              <ChevronUp color="#667267" size={18} strokeWidth={2.3} />
            ) : (
              <ChevronDown color="#667267" size={18} strokeWidth={2.3} />
            )}
          </Pressable>

          {showSimulator && (
            <View className="gap-4 pt-3 border-t border-line">
              <MoneyField
                label="Target tabungan (tujuan)"
                onChangeText={setSimTarget}
                placeholder="Contoh: 100.000.000"
                value={simTarget}
              />
              <MoneyField
                label="Sudah terkumpul sekarang"
                onChangeText={setSimSaved}
                placeholder="0"
                value={simSaved}
              />
              <MoneyField
                label="Nabung rutin sebesar"
                onChangeText={setSimAmount}
                placeholder="Contoh: 1.000.000"
                value={simAmount}
              />
              <SegmentedField
                label="Frekuensi nabung"
                onValueChange={setSimFrequency}
                options={[
                  { label: "Harian", value: "daily" },
                  { label: "Mingguan", value: "weekly" },
                  { label: "Bulanan", value: "monthly" },
                ]}
                value={simFrequency}
              />

              {standaloneSimResult ? (
                <View className="gap-3 rounded-lg border border-emerald/50 bg-mint/20 p-3 mt-1">
                  <View className="gap-0.5">
                    <Text className="text-xs font-semibold text-emerald">Lama waktu yang dibutuhkan:</Text>
                    <Text className="text-base font-bold text-ink">
                      {!standaloneSimResult.isValid ? (
                        "Terlalu lama"
                      ) : (
                        <>
                          {standaloneSimResult.periods}{" "}
                          {simFrequency === "daily"
                            ? "Hari"
                            : simFrequency === "weekly"
                              ? "Minggu"
                              : "Bulan"}
                          {simFrequency === "daily" && standaloneSimResult.periods > 30 && (
                            <Text className="text-xs font-normal text-muted">
                              {" "}(~{Math.floor(standaloneSimResult.periods / 30)} bulan {standaloneSimResult.periods % 30} hari)
                            </Text>
                          )}
                          {simFrequency === "weekly" && standaloneSimResult.periods > 4 && (
                            <Text className="text-xs font-normal text-muted">
                              {" "}(~{Math.floor(standaloneSimResult.periods / 4.3)} &bull; {Math.round(standaloneSimResult.periods % 4.3)} mgg)
                            </Text>
                          )}
                          {simFrequency === "monthly" && standaloneSimResult.periods > 12 && (
                            <Text className="text-xs font-normal text-muted">
                              {" "}(~{Math.floor(standaloneSimResult.periods / 12)} tahun {standaloneSimResult.periods % 12} bulan)
                            </Text>
                          )}
                        </>
                      )}
                    </Text>
                  </View>
                  <View className="gap-0.5">
                    <Text className="text-xs font-semibold text-emerald">Estimasi tanggal target tercapai:</Text>
                    <Text className="text-sm font-bold text-ink">{standaloneSimResult.formattedDate}</Text>
                  </View>
                </View>
              ) : (
                <View className="rounded-lg bg-canvas p-3 items-center justify-center">
                  <Text className="text-xs text-muted text-center">
                    Masukkan Target dan Nabung Rutin untuk melihat simulasi.
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {!isInitialLoading && !summary.error && summary.goals.length === 0 ? (
          <StateView
            actionLabel="Tambah tujuan"
            caption="Contoh: Dana darurat target Rp10 juta, sudah terkumpul Rp2 juta, deadline Desember."
            icon={Target}
            onActionPress={() => {
              setSelectedGoal(null);
              setShowGoalForm(true);
            }}
            title="Belum ada target tabungan"
          />
        ) : null}
        {summary.goals.map((goal) => (
          <GoalCard
            goal={goal}
            key={goal.id}
            onDepositPress={() => {
              setDepositGoal(goal);
              setShowGoalDeposit(true);
            }}
            onPress={() => {
              setSelectedGoal(goal);
              setShowGoalForm(true);
            }}
          />
        ))}
      </View>

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
      <GoalFormModal
        goal={selectedGoal}
        onClose={() => setShowGoalForm(false)}
        onDelete={async (id) => {
          await summary.removeGoal(id);
          setShowGoalForm(false);
        }}
        onSave={summary.persistGoal}
        visible={showGoalForm}
      />
      <GoalDepositModal
        accounts={summary.accounts}
        goal={depositGoal}
        onClose={() => setShowGoalDeposit(false)}
        onDeposit={summary.depositGoal}
        visible={showGoalDeposit}
      />
    </ScreenShell>
  );
}
