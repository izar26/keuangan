import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";

import type {
  SaveAccountInput,
  SaveBudgetInput,
  SaveGoalInput,
  SaveTransactionInput,
  SaveRecurringTransactionInput,
  TransferInput,
} from "@/db/finance-repository";
import type { Account, Budget, Goal, Insight, MoneyFlow, Transaction, RecurringTransaction, RecurringFrequency } from "@/types/finance";
import type { Profile } from "@/types/finance";
import { formatDateInput, isIsoDate, moneyToInput, parseMoneyInput } from "@/lib/forms";
import { formatCurrency } from "@/lib/format";
import { useAppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { FormField, FormModal, SegmentedField, MoneyField } from "@/components/ui/form-modal";
import DateTimePicker from "@/components/ui/native-date-picker";

type Accent = Account["accent"];

const accentOptions: { label: string; value: Accent }[] = [
  { label: "Hijau", value: "emerald" },
  { label: "Biru", value: "sky" },
  { label: "Kuning", value: "amber" },
  { label: "Merah", value: "coral" },
];

const flowOptions: { label: string; value: MoneyFlow }[] = [
  { label: "Masuk", value: "income" },
  { label: "Keluar", value: "expense" },
];

const quickAmounts = [10000, 25000, 50000, 100000, 250000];

type AccountFormModalProps = {
  account?: Account | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<unknown>;
  onSave: (input: SaveAccountInput) => Promise<unknown>;
  visible: boolean;
};

type BudgetFormModalProps = {
  budget?: Budget | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<unknown>;
  onSave: (input: SaveBudgetInput) => Promise<unknown>;
  visible: boolean;
};

type GoalFormModalProps = {
  goal?: Goal | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<unknown>;
  onSave: (input: SaveGoalInput) => Promise<unknown>;
  visible: boolean;
};

type TransactionFormModalProps = {
  accounts: Account[];
  onClose: () => void;
  onDelete?: (id: string) => Promise<unknown>;
  onSave: (input: SaveTransactionInput) => Promise<unknown>;
  transaction?: Transaction | null;
  visible: boolean;
};

type TransferFormModalProps = {
  accounts: Account[];
  onClose: () => void;
  onSave: (input: TransferInput) => Promise<unknown>;
  visible: boolean;
};

type ProfileFormModalProps = {
  onClose: () => void;
  onSave: (input: Profile) => Promise<unknown>;
  profile: Profile;
  visible: boolean;
};


export function AccountFormModal({ account, onClose, onDelete, onSave, visible }: AccountFormModalProps) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [balance, setBalance] = useState("");
  const [mask, setMask] = useState("");
  const [accent, setAccent] = useState<Accent>("emerald");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(account?.name ?? "");
    setInstitution(account?.institution ?? "");
    setBalance(moneyToInput(account?.balance ?? 0));
    setMask(account?.mask ?? "");
    setAccent(account?.accent ?? "emerald");
    setError(null);
  }, [account, visible]);

  async function handleSubmit() {
    const parsedBalance = parseMoneyInput(balance);

    if (!name.trim() || !institution.trim() || !mask.trim()) {
      setError("Nama, institusi, dan nomor rekening wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        accent,
        balance: parsedBalance,
        id: account?.id,
        institution: institution.trim(),
        mask: mask.trim(),
        name: name.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormModal
      error={error}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={account ? "Edit rekening" : "Tambah rekening"}
      visible={visible}
    >
      <FormField label="Nama rekening" onChangeText={setName} placeholder="Kas utama" value={name} />
      <FormField label="Institusi" onChangeText={setInstitution} placeholder="Nama bank/dompet" value={institution} />
      {account ? null : (
        <MoneyField label="Saldo awal" onChangeText={setBalance} placeholder="0" value={balance} />
      )}
      <FormField label="Nomor pendek" onChangeText={setMask} placeholder="1024" value={mask} />
      <SegmentedField label="Warna" onValueChange={setAccent} options={accentOptions} value={accent} />
      {account && onDelete ? <DangerAction disabled={isSaving} label="Hapus rekening" onPress={() => onDelete(account.id)} /> : null}
    </FormModal>
  );
}

export function BudgetFormModal({ budget, onClose, onDelete, onSave, visible }: BudgetFormModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [accent, setAccent] = useState<Accent>("emerald");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(budget?.name ?? "");
    setCategory(budget?.category ?? "");
    setLimit(moneyToInput(budget?.limit ?? 0));
    setAccent(budget?.accent ?? "emerald");
    setError(null);
  }, [budget, visible]);

  async function handleSubmit() {
    const parsedLimit = parseMoneyInput(limit);

    if (!name.trim() || !category.trim() || parsedLimit <= 0) {
      setError("Nama, kategori, dan limit budget wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        accent,
        category: category.trim(),
        id: budget?.id,
        limit: parsedLimit,
        name: name.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormModal
      error={error}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={budget ? "Edit budget" : "Tambah budget"}
      visible={visible}
    >
      <FormField label="Nama budget" onChangeText={setName} placeholder="Rumah tangga" value={name} />
      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-ink">Kategori transaksi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row gap-2 px-1">
            {EXPENSE_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.name}
                onPress={() => setCategory(cat.name)}
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border ${
                  category === cat.name ? "border-emerald bg-mint" : "border-line bg-surface"
                }`}
              >
                <Text className="text-sm">{cat.emoji}</Text>
                <Text className={`text-sm ${category === cat.name ? "font-bold text-emerald" : "text-ink"}`}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <MoneyField label="Limit" onChangeText={setLimit} placeholder="0" value={limit} />
      <SegmentedField label="Warna" onValueChange={setAccent} options={accentOptions} value={accent} />
      {budget && onDelete ? <DangerAction disabled={isSaving} label="Hapus budget" onPress={() => onDelete(budget.id)} /> : null}
    </FormModal>
  );
}

export function GoalFormModal({ goal, onClose, onDelete, onSave, visible }: GoalFormModalProps) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [dueDate, setDueDate] = useState(formatDateInput());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(goal?.name ?? "");
    setTarget(moneyToInput(goal?.target ?? 0));
    setSaved(moneyToInput(goal?.saved ?? 0));
    setDueDate(goal?.dueDate ?? formatDateInput());
    setError(null);
  }, [goal, visible]);

  async function handleSubmit() {
    const parsedTarget = parseMoneyInput(target);
    const parsedSaved = parseMoneyInput(saved);

    if (!name.trim() || parsedTarget <= 0 || !isIsoDate(dueDate)) {
      setError("Nama, target, dan tanggal target wajib valid.");
      return;
    }

    if (parsedSaved > parsedTarget) {
      setError("Nominal terkumpul tidak boleh melebihi target.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({ dueDate, id: goal?.id, name: name.trim(), saved: parsedSaved, target: parsedTarget });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormModal
      error={error}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={goal ? "Edit tujuan" : "Tambah tujuan"}
      visible={visible}
    >
      <FormField label="Nama tujuan" onChangeText={setName} placeholder="Dana darurat" value={name} />
      <MoneyField label="Target" onChangeText={setTarget} placeholder="0" value={target} />
      <MoneyField label="Terkumpul" onChangeText={setSaved} placeholder="0" value={saved} />
      <FormField label="Tanggal target" onChangeText={setDueDate} placeholder="2026-12-31" value={dueDate} />
      {goal && onDelete ? <DangerAction disabled={isSaving} label="Hapus tujuan" onPress={() => onDelete(goal.id)} /> : null}
    </FormModal>
  );
}


export function TransactionFormModal({
  accounts,
  onClose,
  onDelete,
  onSave,
  transaction,
  visible,
}: TransactionFormModalProps) {
  const defaultAccountId = accounts[0]?.id ?? "";
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Makan");
  const [amount, setAmount] = useState("");
  const [flow, setFlow] = useState<MoneyFlow>("expense");
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(transaction?.title ?? "");
    setMerchant(transaction?.merchant ?? "");
    setCategory(transaction?.category ?? (transaction?.flow === "income" ? "Gaji" : "Makan"));
    setAmount(moneyToInput(transaction?.amount ?? 0));
    setFlow(transaction?.flow ?? "expense");
    setAccountId(transaction?.accountId ?? defaultAccountId);
    setDate(transaction?.date ? new Date(transaction.date) : new Date());
    setError(null);
  }, [defaultAccountId, transaction, visible]);

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  async function handleSubmit() {
    const parsedAmount = parseMoneyInput(amount);
    const dateString = date.toISOString().slice(0, 10);

    if (!title.trim() || !merchant.trim() || !category.trim() || parsedAmount <= 0 || !accountId || !isIsoDate(dateString)) {
      setError("Judul, merchant, kategori, nominal, rekening, dan tanggal wajib valid.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        accountId,
        amount: parsedAmount,
        category: category.trim(),
        date: dateString,
        flow,
        id: transaction?.id,
        merchant: merchant.trim(),
        title: title.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormModal
      error={error}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={transaction ? "Edit transaksi" : "Tambah transaksi"}
      visible={visible}
    >
      <SegmentedField label="Arus" onValueChange={setFlow} options={flowOptions} value={flow} />
      <FormField label="Judul" onChangeText={setTitle} placeholder="Belanja dapur" value={title} />
      <FormField label="Merchant" onChangeText={setMerchant} placeholder="Fresh Market" value={merchant} />
      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-ink">Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row gap-2 px-1">
            {(flow === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
              <Pressable
                key={cat.name}
                onPress={() => setCategory(cat.name)}
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border ${
                  category === cat.name ? "border-emerald bg-mint" : "border-line bg-surface"
                }`}
              >
                <Text className="text-sm">{cat.emoji}</Text>
                <Text className={`text-sm ${category === cat.name ? "font-bold text-emerald" : "text-ink"}`}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <MoneyField label="Nominal" onChangeText={setAmount} placeholder="0" value={amount} />
      <QuickAmountPicker onSelect={(value) => setAmount(moneyToInput(value))} />
      {accountOptions.length > 0 ? (
        <SegmentedField label="Rekening" onValueChange={setAccountId} options={accountOptions} value={accountId} />
      ) : null}
      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-ink">Tanggal</Text>
        <Pressable
          className="h-12 justify-center rounded-lg border border-line bg-surface px-3"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className="text-base text-ink">{date.toISOString().slice(0, 10)}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            accentColor="#1F8A5B"
            display="default"
            mode="date"
            onDismiss={() => setShowDatePicker(false)}
            onValueChange={(_, selectedDate) => {
              setDate(selectedDate);
              if (Platform.OS === "android") {
                setShowDatePicker(false);
              }
            }}
            value={date}
          />
        )}
      </View>
      {transaction && onDelete ? (
        <DangerAction disabled={isSaving} label="Hapus transaksi" onPress={() => onDelete(transaction.id)} />
      ) : null}
    </FormModal>
  );
}

export function TransferFormModal({ accounts, onClose, onSave, visible }: TransferFormModalProps) {
  const firstAccountId = accounts[0]?.id ?? "";
  const secondAccountId = accounts[1]?.id ?? firstAccountId;
  const [fromAccountId, setFromAccountId] = useState(firstAccountId);
  const [toAccountId, setToAccountId] = useState(secondAccountId);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const accountOptions = useMemo(
    () => accounts.map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setFromAccountId(firstAccountId);
    setToAccountId(secondAccountId);
    setAmount("");
    setError(null);
  }, [firstAccountId, secondAccountId, visible]);

  async function handleSubmit() {
    const parsedAmount = parseMoneyInput(amount);

    if (accounts.length < 2) {
      setError("Minimal perlu dua rekening untuk transfer.");
      return;
    }

    if (fromAccountId === toAccountId || parsedAmount <= 0) {
      setError("Rekening harus berbeda dan nominal harus lebih dari 0.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({ amount: parsedAmount, fromAccountId, toAccountId });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormModal
      error={error}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Transfer"
      title="Transfer antar rekening"
      visible={visible}
    >
      <SegmentedField label="Dari" onValueChange={setFromAccountId} options={accountOptions} value={fromAccountId} />
      <SegmentedField label="Ke" onValueChange={setToAccountId} options={accountOptions} value={toAccountId} />
      <MoneyField label="Nominal" onChangeText={setAmount} placeholder="0" value={amount} />
      <QuickAmountPicker onSelect={(value) => setAmount(moneyToInput(value))} />
    </FormModal>
  );
}

export function ProfileFormModal({ onClose, onSave, profile, visible }: ProfileFormModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [planLabel, setPlanLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDisplayName(profile.displayName);
    setPlanLabel(profile.planLabel);
    setError(null);
  }, [profile, visible]);

  async function handleSubmit() {
    if (!displayName.trim() || !planLabel.trim()) {
      setError("Nama dan label profil wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({ displayName: displayName.trim(), planLabel: planLabel.trim() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormModal
      error={error}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Edit profil"
      visible={visible}
    >
      <FormField label="Nama" onChangeText={setDisplayName} placeholder="Izar Finance" value={displayName} />
      <FormField label="Label" onChangeText={setPlanLabel} placeholder="Local finance workspace" value={planLabel} />
    </FormModal>
  );
}

function DangerAction({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => Promise<unknown> }) {
  const appAlert = useAppAlert();
  const [isDeleting, setIsDeleting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handlePress() {
    const confirmed = await appAlert.confirm({
      cancelLabel: "Batal",
      confirmLabel: "Hapus",
      message: "Data yang dihapus tidak bisa dikembalikan.",
      title: label,
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await onPress();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      await appAlert.show({
        message: getErrorMessage(cause),
        title: "Gagal menghapus",
        tone: "danger",
      });
    } finally {
      if (mountedRef.current) {
        setIsDeleting(false);
      }
    }
  }

  return (
    <View className="pt-1">
      <Button
        className="border-coral/30 bg-coral/10"
        disabled={disabled || isDeleting}
        label={isDeleting ? "Menghapus..." : label}
        onPress={handlePress}
        variant="secondary"
      />
    </View>
        );
}

function getErrorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Operasi gagal. Coba lagi.";
}

export type RecurringTransactionFormModalProps = {
  accounts: Account[];
  onClose: () => void;
  onDelete?: (id: string) => Promise<unknown>;
  onSave: (input: SaveRecurringTransactionInput) => Promise<unknown>;
  transaction?: RecurringTransaction | null;
  visible: boolean;
};

const frequencyOptions: { label: string; value: RecurringFrequency }[] = [
  { label: "Harian", value: "daily" },
  { label: "Mingguan", value: "weekly" },
  { label: "Bulanan", value: "monthly" },
  { label: "Tahunan", value: "yearly" },
];

export function RecurringTransactionFormModal({
  accounts,
  onClose,
  onDelete,
  onSave,
  transaction,
  visible,
}: RecurringTransactionFormModalProps) {
  const defaultAccountId = accounts[0]?.id ?? "";
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Tagihan");
  const [amount, setAmount] = useState("");
  const [flow, setFlow] = useState<MoneyFlow>("expense");
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [nextDate, setNextDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(transaction?.title ?? "");
    setMerchant(transaction?.merchant ?? "");
    setCategory(transaction?.category ?? (transaction?.flow === "income" ? "Gaji" : "Tagihan"));
    setAmount(moneyToInput(transaction?.amount ?? 0));
    setFlow(transaction?.flow ?? "expense");
    setAccountId(transaction?.accountId ?? defaultAccountId);
    setFrequency(transaction?.frequency ?? "monthly");
    setNextDate(transaction?.nextDate ? new Date(transaction.nextDate) : new Date());
    setError(null);
  }, [defaultAccountId, transaction, visible]);

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  async function handleSubmit() {
    const parsedAmount = parseMoneyInput(amount);
    const dateString = nextDate.toISOString().slice(0, 10);

    if (!title.trim() || !merchant.trim() || !category.trim() || parsedAmount <= 0 || !accountId || !isIsoDate(dateString)) {
      setError("Judul, merchant, kategori, nominal, rekening, dan tanggal wajib valid.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        accountId,
        amount: parsedAmount,
        category: category.trim(),
        nextDate: dateString,
        frequency,
        flow,
        id: transaction?.id,
        merchant: merchant.trim(),
        title: title.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormModal
      error={error}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={transaction ? "Edit transaksi berulang" : "Tambah transaksi berulang"}
      visible={visible}
    >
      <SegmentedField label="Arus" onValueChange={setFlow} options={flowOptions} value={flow} />
      <FormField label="Judul" onChangeText={setTitle} placeholder="Langganan internet" value={title} />
      <FormField label="Merchant" onChangeText={setMerchant} placeholder="ISP" value={merchant} />
      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-ink">Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row gap-2 px-1">
            {(flow === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
              <Pressable
                key={cat.name}
                onPress={() => setCategory(cat.name)}
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border ${
                  category === cat.name ? "border-emerald bg-mint" : "border-line bg-surface"
                }`}
              >
                <Text className="text-sm">{cat.emoji}</Text>
                <Text className={`text-sm ${category === cat.name ? "font-bold text-emerald" : "text-ink"}`}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <MoneyField label="Nominal" onChangeText={setAmount} placeholder="0" value={amount} />
      <QuickAmountPicker onSelect={(value) => setAmount(moneyToInput(value))} />
      {accountOptions.length > 0 ? (
        <SegmentedField label="Rekening (Sumber)" onValueChange={setAccountId} options={accountOptions} value={accountId} />
      ) : null}
      
      <SegmentedField label="Siklus ulangan" onValueChange={setFrequency} options={frequencyOptions} value={frequency} />

      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-ink">Tanggal Eksekusi Berikutnya</Text>
        <Pressable
          className="h-12 justify-center rounded-lg border border-line bg-surface px-3"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className="text-base text-ink">{nextDate.toISOString().slice(0, 10)}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            accentColor="#1F8A5B"
            display="default"
            mode="date"
            onDismiss={() => setShowDatePicker(false)}
            onValueChange={(_, selectedDate) => {
              setNextDate(selectedDate);
              if (Platform.OS === "android") {
                setShowDatePicker(false);
              }
            }}
            value={nextDate}
          />
        )}
      </View>
      {transaction && onDelete ? (
        <DangerAction disabled={isSaving} label="Hapus transaksi berulang" onPress={() => onDelete(transaction.id)} />
      ) : null}
    </FormModal>
  );
}

function QuickAmountPicker({ onSelect }: { onSelect: (amount: number) => void }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink">Nominal cepat</Text>
      <View className="flex-row flex-wrap gap-2">
        {quickAmounts.map((amount) => (
          <Pressable
            className="rounded-full border border-line bg-surface px-3 py-2"
            key={amount}
            onPress={() => onSelect(amount)}
          >
            <Text className="text-xs font-bold text-ink">{formatCurrency(amount, true)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
