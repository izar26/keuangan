export function formatDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMonthKey(date = new Date()) {
  return formatDateInput(date).slice(0, 7);
}

export function formatMonthLabel(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date);
}

export function parseMoneyInput(value: string) {
  const normalized = value.replace(/[^\d]/g, "");

  return normalized ? Number(normalized) : 0;
}

export function moneyToInput(value: number) {
  return value > 0 ? String(Math.round(value)) : "";
}

export function isIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
