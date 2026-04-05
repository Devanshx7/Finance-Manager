export const T = {
  bg: "#030507",
  card: "rgba(12,16,24,0.85)",
  border: "rgba(255,255,255,0.06)",
  accent: "#00e8b0",
  red: "#ff3b5c",
  yellow: "#ffbe0b",
  purple: "#a855f7",
  blue: "#3b82f6",
  orange: "#ff6b35",
  text: "#edf0f7",
  textSec: "#7a839e",
  textMut: "#3a4058",
  grad1: "linear-gradient(135deg,#00e8b0,#00b4d8)",
};

export const PIE_COLORS = [
  "#00e8b0", "#3b82f6", "#ff6b35", "#a855f7",
  "#ffbe0b", "#ff3b5c", "#06b6d4", "#f472b6", "#84cc16",
];

export const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment",
  "Health", "Education", "Other",
];

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const EXCHANGE_RATE = parseFloat(
  import.meta.env.VITE_DEFAULT_EXCHANGE_RATE || "83.5"
);

export const APP_NAME = import.meta.env.VITE_APP_NAME || "Vault";

// ── Utility Functions ──

export const toINR = (usd, rate = EXCHANGE_RATE) => usd * rate;
export const toUSD = (inr, rate = EXCHANGE_RATE) => inr / rate;

export const fmt = (n, currency = "USD") =>
  currency === "INR"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const daysUntil = (dayOfMonth) => {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
  const target = thisMonth >= today ? thisMonth : nextMonth;
  return Math.ceil((target - today) / 86400000);
};

export const daysSince = (dateStr) => {
  const d = new Date(dateStr);
  return Math.floor((new Date() - d) / 86400000);
};

export const tipStyle = {
  contentStyle: {
    background: "rgba(20,25,40,0.95)",
    border: "1px solid rgba(0,232,176,0.3)",
    borderRadius: 12,
    color: "#edf0f7",
    fontSize: 13,
    fontFamily: "'JetBrains Mono'",
    padding: "10px 16px",
    boxShadow: "0 12px 40px rgba(0,0,0,.5)",
  },
  itemStyle: { color: "#edf0f7" },
  labelStyle: { color: "#7a839e" },
};