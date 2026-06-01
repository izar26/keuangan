const idrFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
});

const compactIdrFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

export function formatCurrency(value: number, compact = false) {
  return (compact ? compactIdrFormatter : idrFormatter).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function formatFullDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) {
    return "Tanggal tidak valid";
  }
  try {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return date.toDateString();
  }
}

export function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 4 && hour < 11) {
    return "Selamat pagi";
  }

  if (hour >= 11 && hour < 15) {
    return "Selamat siang";
  }

  if (hour >= 15 && hour < 18) {
    return "Selamat sore";
  }

  return "Selamat malam";
}
