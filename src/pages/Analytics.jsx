import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { T, tipStyle } from "../config/theme";
import { GC } from "../components/ui";
import { ThreeScene } from "../components/Charts";

export default function Analytics({ config, history }) {
  if (history.length === 0) {
    return (
      <div>
        <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: "0 0 22px" }}>Analytics</h2>
        <GC><div style={{ padding: 40, textAlign: "center", color: T.textMut, fontSize: 13 }}>No history yet, boss. Archive your first month.</div></GC>
      </div>
    );
  }

  const savingsData = history.map((h) => ({
    ...h,
    rate: ((h.savings / Math.max(config.salary, 1)) * 100).toFixed(1),
  }));

  return (
    <div>
      <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: "0 0 22px" }}>Analytics</h2>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
        {/* SPENDING VS SAVINGS */}
        <GC style={{ flex: "1 1 400px" }} delay={0.04}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>Spending vs Savings</h3>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.red} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.red} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="month" tick={{ fill: T.textMut, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textMut, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip {...tipStyle} />
              <Area type="monotone" dataKey="spending" stroke={T.red} fill="url(#gradSpend)" strokeWidth={2.5} name="Spending" />
              <Area type="monotone" dataKey="savings" stroke={T.accent} fill="url(#gradSave)" strokeWidth={2.5} name="Savings" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </GC>

        {/* SAVINGS RATE */}
        <GC style={{ flex: "1 1 400px" }} delay={0.08}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>Savings Rate %</h3>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={savingsData}>
              <defs>
                <linearGradient id="gradRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="month" tick={{ fill: T.textMut, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textMut, fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip {...tipStyle} formatter={(v) => `${v}%`} />
              <Area type="monotone" dataKey="rate" stroke={T.accent} fill="url(#gradRate)" strokeWidth={3} dot={{ fill: T.accent, r: 4, stroke: T.bg }} name="Rate" />
            </AreaChart>
          </ResponsiveContainer>
        </GC>
      </div>

      {/* 3D VIEW */}
      <GC delay={0.12}>
        <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Spending — 3D</h3>
        <ThreeScene data={history.map((h) => ({ label: h.month, value: h.spending }))} height={230} />
      </GC>
    </div>
  );
}