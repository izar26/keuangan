import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const packageJson = JSON.parse(read("package.json"));
const rootLayout = read("app/_layout.tsx");
const schema = read("src/db/schema.ts");
const seedData = read("src/db/seed-data.ts");
const repository = read("src/db/finance-repository.ts");
const summaryHook = read("src/hooks/use-finance-summary.ts");
const forms = read("src/lib/forms.ts");
const dashboard = read("app/(tabs)/index.tsx");
const transactionsScreen = read("app/(tabs)/transactions.tsx");
const budgetsScreen = read("app/(tabs)/budgets.tsx");
const insightsScreen = read("app/(tabs)/insights.tsx");
const profileScreen = read("app/(tabs)/profile.tsx");
const budgetCard = read("src/components/budget-card.tsx");
const spendingChart = read("src/components/spending-chart.tsx");
const financeModals = read("src/components/forms/finance-modals.tsx");
const stateView = read("src/components/ui/state-view.tsx");

assert(packageJson.dependencies["expo-sqlite"], "expo-sqlite dependency is required for local persistence.");
assert(rootLayout.includes("SQLiteProvider"), "Root layout must wrap the app in SQLiteProvider.");
assert(rootLayout.includes("migrateDatabase"), "SQLiteProvider must run database migrations.");
assert(schema.includes("PRAGMA user_version"), "Schema migrations must use PRAGMA user_version.");
assert(schema.includes("CREATE TABLE IF NOT EXISTS accounts"), "Schema must include accounts.");
assert(schema.includes("CREATE TABLE IF NOT EXISTS transactions"), "Schema must include transactions.");
assert(schema.includes("category TEXT NOT NULL DEFAULT ''"), "Budgets must store a transaction category for automatic tracking.");
assert(schema.includes("CREATE TABLE IF NOT EXISTS settings"), "Schema must include local profile settings.");
assert(schema.includes("@/db/seed-data"), "Schema must seed from database-owned seed data, not UI mock data.");
assert(seedData.includes("transactions: Transaction[]"), "Initial local database seed must include transaction data.");
assert(repository.includes("withExclusiveTransactionAsync"), "Money mutations must use exclusive SQLite transactions.");
assert(repository.includes("Saldo rekening tidak mencukupi"), "Repository must prevent negative balances.");
assert(repository.includes("Saldo awal tidak boleh negatif."), "Repository must reject negative opening balances.");
assert(repository.includes("Nominal terkumpul harus berada di antara 0 dan target."), "Repository must keep goal savings within target bounds.");
assert(repository.includes("input.amount <= 0"), "Repository must reject zero-value transactions.");
assert(repository.includes("isIsoDate(input.dueDate)") && repository.includes("Tanggal target wajib valid."), "Repository must validate goal dates.");
assert(repository.includes("isIsoDate(input.date)") && repository.includes("Tanggal transaksi wajib valid."), "Repository must validate transaction dates.");
assert(repository.includes("assertChanged"), "Repository must fail clearly when an update/delete affects no rows.");
assert(repository.includes("Transaksi tidak ditemukan."), "Deleting missing transactions must report a clear error.");
assert(repository.includes("UPDATE accounts") && !repository.includes("balance = excluded.balance"), "Editing accounts must not overwrite ledger-managed balances.");
assert(repository.includes("transferBetweenAccounts"), "Repository must support local transfers.");
assert(repository.includes("saveInsight"), "Repository must support editable insights.");
assert(repository.includes("saveSettings"), "Repository must support editable local settings.");
assert(repository.includes("isBudgetNotification") && repository.includes("Siklus notifikasi budget tidak valid."), "Repository must validate local settings values at runtime.");
assert(repository.includes("Insight tidak ditemukan."), "Deleting missing insights must report a clear error.");
assert(repository.includes("Data bulanan tidak ditemukan."), "Deleting missing monthly chart data must report a clear error.");
assert(repository.includes("previousMonth") && repository.includes("DELETE FROM monthly_spending WHERE month = ?"), "Renaming monthly chart data must replace the previous local row.");
assert(financeModals.includes("previousMonth: month ?? undefined"), "Monthly chart edit form must pass the previous month key for true updates.");
assert(repository.includes("transaction.category.toLowerCase() === category.toLowerCase()"), "Budget spending must be derived from matching transaction categories.");
assert(repository.includes("transaction.date.startsWith(currentMonthKey)"), "Budget spending must use current-month transactions.");
assert(summaryHook.includes("persistTransaction"), "Summary hook must expose transaction persistence.");
assert(summaryHook.includes("persistSettings"), "Summary hook must expose settings persistence.");
assert(forms.includes("getFullYear()"), "Date input must use local date parts instead of UTC ISO strings.");
assert(!forms.includes("toISOString()"), "Date input must not derive local dates from toISOString().");
assert(forms.includes("getMonthKey"), "Forms/date utilities must expose a local current-month key.");
assert(summaryHook.includes("currentMonthTransactions"), "Finance summary must derive monthly metrics from current-month transactions.");
assert(summaryHook.includes("transaction.date.startsWith(currentMonthKey)"), "Monthly metrics must filter transactions by current month.");
assert(dashboard.includes("TransactionFormModal"), "Dashboard must expose transaction creation.");
assert(dashboard.includes("TransferFormModal"), "Dashboard must expose local transfers.");
assert(dashboard.includes("BudgetFormModal"), "Dashboard active budget cards must be editable, not display-only.");
assert(dashboard.includes("summary.profile.displayName"), "Dashboard greeting must reflect the editable local profile.");
assert(!dashboard.includes("Selamat siang, Izar"), "Dashboard greeting must not be hardcoded.");
assert(dashboard.includes("selectedTransaction"), "Dashboard latest transactions must be editable.");
assert(dashboard.includes("summary.accounts.map"), "Dashboard must render all accounts for management.");
assert(dashboard.includes("selectedBudget") && dashboard.includes("summary.removeBudget"), "Dashboard must support editing and deleting active budgets.");
assert(dashboard.includes("Belum ada budget") && dashboard.includes("Tambah budget"), "Dashboard must expose an actionable empty state for budgets.");
assert(dashboard.includes("Belum ada transaksi") && dashboard.includes("Tambah transaksi"), "Dashboard must expose an actionable empty state for transactions.");
assert(transactionsScreen.includes("onDelete") && transactionsScreen.includes("onSave"), "Transactions screen must support save/delete.");
assert(budgetsScreen.includes("BudgetFormModal") && budgetsScreen.includes("GoalFormModal"), "Budgets screen must support budgets and goals.");
assert(budgetsScreen.includes("remainingBudget") && !budgetsScreen.includes("Ruang aman masih cukup"), "Budget summary copy must reflect the actual local budget state.");
assert(budgetCard.includes("Lewat"), "Budget cards must clearly label over-budget spending instead of showing negative remaining balance.");
assert(budgetCard.includes("budget.limit > 0"), "Budget progress must guard against division by zero.");
assert(insightsScreen.includes("InsightFormModal") && insightsScreen.includes("MonthlySpendingFormModal"), "Insights screen must support insight/chart editing.");
assert(spendingChart.includes("data.length") && !spendingChart.includes("5 bulan terakhir"), "Monthly chart label must reflect editable local data length.");
assert(profileScreen.includes("ProfileFormModal") && profileScreen.includes("persistSettings"), "Profile screen must support local profile/settings editing.");
assert(profileScreen.includes("settingsError") && profileScreen.includes("updateSettings"), "Profile settings mutations must surface save errors.");
assert(stateView.includes("ActivityIndicator"), "Reusable state view must support loading UI.");
assert(dashboard.includes("StateView"), "Dashboard must render loading/error/empty states.");
assert(transactionsScreen.includes("StateView"), "Transactions screen must render loading/error/empty states.");
assert(budgetsScreen.includes("StateView"), "Budgets screen must render loading/error/empty states.");
assert(insightsScreen.includes("StateView"), "Insights screen must render loading/error/empty states.");
assert(profileScreen.includes("StateView"), "Profile screen must render error state.");

console.log("Local SQLite architecture audit passed.");
