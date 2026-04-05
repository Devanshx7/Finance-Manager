import { T, toUSD, daysUntil, daysSince } from "../config/theme";
import { GC } from "./ui";

export function Greeting({ config, expenses, lending, userName }) {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const r = config.exchangeRate;

  const varT = expenses.reduce((s, e) => s + (e.currency === "USD" ? e.amount : toUSD(e.amount, r)), 0);
  const rem = config.salary - varT;
  const savingsRate = ((rem / Math.max(config.salary, 1)) * 100).toFixed(1);

  const pendingLend = lending.filter((l) => !l.settled);
  const timedReminders = pendingLend.filter((l) => l.delayType === "timed" && daysSince(l.date) >= 14);

  const alerts = [
    ...config.cards.map((c) => ({ label: c.name, days: daysUntil(c.dueDate) })),
    ...config.sips.map((s) => ({ label: s.name, days: daysUntil(s.date) })),
  ];
  const urgent = alerts.filter((a) => a.days <= 3);

  let status = "All systems nominal.";
  let statusColor = T.accent;
  if (parseFloat(savingsRate) < 20) {
    status = "Warning: Low savings. Monitor closely.";
    statusColor = T.red;
  } else if (parseFloat(savingsRate) < 40) {
    status = "Systems stable. Keep an eye on spending.";
    statusColor = T.yellow;
  }

  const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : "there";

  let context = "";
  if (urgent.length > 0) context = `${urgent[0].label} due in ${urgent[0].days}d. `;
  if (timedReminders.length > 0) context += `${timedReminders.length} lending reminder${timedReminders.length > 1 ? "s" : ""}. `;

  return (
    <GC
      style={{
        marginBottom: 18,
        padding: "20px 24px",
        borderLeft: `3px solid ${statusColor}`,
        background: `linear-gradient(135deg,${statusColor}08,transparent)`,
      }}
      hover={false}
      delay={0}
    >
      <div style={{ fontSize: 9, color: statusColor, fontWeight: 700, letterSpacing: "3px", fontFamily: "'JetBrains Mono'" }}>
        SYSTEM ACTIVE
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginTop: 8 }}>
        {timeGreeting},{" "}
        <span style={{ background: T.grad1, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {displayName}
        </span>
        .
      </div>
      <div style={{ fontSize: 13, color: T.textSec, marginTop: 6, lineHeight: 1.5 }}>
        Savings at{" "}
        <span style={{ color: statusColor, fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>{savingsRate}%</span>.{" "}
        {context}
      </div>
      <div style={{ fontSize: 11, color: statusColor, marginTop: 8, fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>
        ● {status}
      </div>
    </GC>
  );
}
