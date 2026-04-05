import { useState } from "react";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { T, PIE_COLORS, toINR, toUSD, fmt, tipStyle, CATEGORIES } from "../config/theme";
import { GC, Ctr, Modal, Inp, Btn } from "../components/ui";

export default function Expenses({ config, expenses, updateExpenses }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ desc: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], currency: "USD" });

  const add = () => {
    if (!form.desc || !form.amount) return;
    updateExpenses((p) => [{ ...form, id: Date.now(), amount: parseFloat(form.amount) }, ...p]);
    setForm({ desc: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], currency: "USD" });
    setShowAdd(false);
  };

  const total = expenses.reduce((s, e) => s + (e.currency === "USD" ? e.amount : toUSD(e.amount, config.exchangeRate)), 0);
  const catData = CATEGORIES.map((c) => ({
    name: c,
    value: expenses.filter((e) => e.category === c).reduce((s, e) => s + (e.currency === "USD" ? e.amount : toUSD(e.amount, config.exchangeRate)), 0),
  })).filter((c) => c.value > 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: 0 }}>Expenses</h2>
        <Btn onClick={() => setShowAdd(true)}><Plus size={14} /> Quick Add</Btn>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
        <GC style={{ flex: "1 1 320px" }} delay={0.04}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>By Category</h3>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke={T.bg} strokeWidth={3}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tipStyle} formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>No expenses yet, boss</div>
          )}
        </GC>

        <GC style={{ flex: "1 1 180px" }} delay={0.08}>
          <div style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Total</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono'", marginTop: 8 }}><Ctr value={total} /></div>
          <div style={{ fontSize: 11, color: T.textMut, fontFamily: "'JetBrains Mono'", marginTop: 3 }}>{fmt(toINR(total, config.exchangeRate), "INR")}</div>
          <div style={{ marginTop: 16, fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Count</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'", marginTop: 8 }}>{expenses.length}</div>
        </GC>
      </div>

      <GC hover={false} delay={0.12}>
        {expenses.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>Nothing here yet</div>
        ) : (
          expenses.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${T.border}`, animation: `slideR .3s ease ${i * 0.03}s both` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,.03)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
                  <Receipt size={14} color={T.textSec} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{e.desc}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{e.category} · {e.date}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.red, fontFamily: "'JetBrains Mono'" }}>
                    {e.currency === "USD" ? fmt(e.amount) : fmt(e.amount, "INR")}
                  </div>
                </div>
                <button onClick={() => updateExpenses((p) => p.filter((x) => x.id !== e.id))} style={{ background: T.red + "12", border: `1px solid ${T.red}22`, cursor: "pointer", color: T.red, padding: 4, borderRadius: 6, display: "flex" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </GC>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Quick Add">
        <Inp label="What" value={form.desc} onChange={(v) => setForm((p) => ({ ...p, desc: v }))} placeholder="Coffee, Uber..." />
        <Inp label="Amount" value={form.amount} onChange={(v) => setForm((p) => ({ ...p, amount: v }))} type="number" />
        <Inp label="Currency" value={form.currency} onChange={(v) => setForm((p) => ({ ...p, currency: v }))} options={[{ value: "USD", label: "USD" }, { value: "INR", label: "INR" }]} />
        <Inp label="Category" value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} options={CATEGORIES} />
        <Inp label="Date" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} type="date" />
        <Btn onClick={add} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Add</Btn>
      </Modal>
    </div>
  );
}