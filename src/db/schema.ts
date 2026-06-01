import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 7;

type VersionRow = {
  user_version: number;
};

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA foreign_keys = ON");

  const row = await db.getFirstAsync<VersionRow>("PRAGMA user_version");
  let currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    const { processRecurringTransactions } = await import("@/db/finance-repository");
    await processRecurringTransactions(db);
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        institution TEXT NOT NULL,
        balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
        accent TEXT NOT NULL CHECK (accent IN ('emerald', 'sky', 'amber', 'coral')),
        mask TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        merchant TEXT NOT NULL,
        category TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount >= 0),
        flow TEXT NOT NULL CHECK (flow IN ('income', 'expense')),
        account_id TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_flow ON transactions(flow);

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        limit_amount INTEGER NOT NULL CHECK (limit_amount >= 0),
        spent_amount INTEGER NOT NULL CHECK (spent_amount >= 0),
        accent TEXT NOT NULL CHECK (accent IN ('emerald', 'sky', 'amber', 'coral')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        target_amount INTEGER NOT NULL CHECK (target_amount > 0),
        saved_amount INTEGER NOT NULL CHECK (saved_amount >= 0),
        due_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        merchant TEXT NOT NULL,
        category TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount >= 0),
        flow TEXT NOT NULL CHECK (flow IN ('income', 'expense')),
        account_id TEXT NOT NULL,
        frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        next_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        display_name TEXT NOT NULL,
        plan_label TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await seedDefaults(db);
    currentVersion = 5; // Fast-forward to v5 since the above represents the v5 state
  }

  if (currentVersion === 5) {
    // Migration from v5 to v6
    // Drop old manual insights and monthly_spending
    await db.execAsync(`
      DROP TABLE IF EXISTS insights;
      DROP TABLE IF EXISTS monthly_spending;
      
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        merchant TEXT NOT NULL,
        category TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount >= 0),
        flow TEXT NOT NULL CHECK (flow IN ('income', 'expense')),
        account_id TEXT NOT NULL,
        frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        next_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
      );
    `);
    currentVersion = 6;
  }

  if (currentVersion === 6) {
    // Migration from v6 to v7
    // Create composite indexes to speed up dashboard queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_flow_date ON transactions(flow, date DESC);
    `);
    currentVersion = 7;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  
  // App Boot Routine: Process recurring transactions after DB is ready
  const { processRecurringTransactions } = await import("@/db/finance-repository");
  await processRecurringTransactions(db);
}

async function seedDefaults(db: SQLiteDatabase) {
  await db.runAsync(
    "INSERT OR IGNORE INTO profile (id, display_name, plan_label) VALUES (1, ?, ?)",
    "Pengguna",
    "Keuangan pribadi",
  );
}
