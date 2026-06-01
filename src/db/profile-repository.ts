import type { SQLiteDatabase } from "expo-sqlite";
import type { Profile, ProfileSettings } from "@/types/finance";

export type ProfileRow = {
  display_name: string;
  plan_label: string;
};

export type SettingRow = {
  key: string;
  value: string;
};

export type SaveProfileInput = Profile;
export type SaveSettingsInput = Partial<ProfileSettings>;

export function mapProfile(row: ProfileRow): Profile {
  return {
    displayName: row.display_name,
    planLabel: row.plan_label,
  };
}

export function mapSettings(rows: SettingRow[]): ProfileSettings {
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    budgetNotification: parseBudgetNotification(map.get("budget_notification")),
    localPrivacyMode: map.get("local_privacy_mode") !== "false",
    securityLock: map.get("security_lock") !== "false",
  };
}

function parseBudgetNotification(value: string | undefined): ProfileSettings["budgetNotification"] {
  if (isBudgetNotification(value)) {
    return value;
  }

  return "daily";
}

function isBudgetNotification(value: string | undefined): value is ProfileSettings["budgetNotification"] {
  return value === "daily" || value === "off" || value === "weekly";
}

export async function saveProfile(db: SQLiteDatabase, input: SaveProfileInput) {
  if (!input.displayName.trim() || !input.planLabel.trim()) {
    throw new Error("Nama dan label profil wajib diisi.");
  }

  await db.runAsync(
    `UPDATE profile SET
       display_name = ?,
       plan_label = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = 1`,
    input.displayName.trim(),
    input.planLabel.trim(),
  );
}

export async function saveSettings(db: SQLiteDatabase, input: SaveSettingsInput) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    if (input.budgetNotification !== undefined) {
      await upsertSetting(tx, "budget_notification", input.budgetNotification);
    }
    if (input.localPrivacyMode !== undefined) {
      await upsertSetting(tx, "local_privacy_mode", input.localPrivacyMode ? "true" : "false");
    }
    if (input.securityLock !== undefined) {
      await upsertSetting(tx, "security_lock", input.securityLock ? "true" : "false");
    }
  });
}

async function upsertSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`,
    key,
    value,
  );
}
