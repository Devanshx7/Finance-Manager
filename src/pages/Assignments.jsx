import { useState } from "react";
import { Plus, Trash2, ChevronLeft, DollarSign, Receipt, PiggyBank, MapPin } from "lucide-react";
import { T, fmt, toINR, toUSD } from "../config/theme";
import { GC, Metric, Modal, Inp, Btn } from "../components/ui";

export default function Assignments({ assignments, updateAssignments, config }) {
  const [showCreate, setShowCreate] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState({ name: "", budget: "" });
  const [expForm, setExpForm] = useState({ desc: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0] });
  const [showAddExp, setShowAddExp] = useState(false);
  const [cur, setCur] = useState("USD"); // display currency toggle

  const rate = config?.exchangeRate || 93.5;
  const isINR = cur === "INR";
  const cv = (usd) => isINR ? toINR(usd, rate) : usd;
  const cfmt = (usd) => fmt(cv(usd), isINR ? "INR" : "USD");

  const create = () => {
    if (!form.name) return;
    updateAssignments((p) => [...p, { id: Date.now(), name: form.name, budget: parseFloat(form.budget) || 0, expenses: [], createdAt: new Date().toISOString().split("T")[0] }]);
    setForm({ name: "", budget: "" });
    setShowCreate(false);
  };

  const active = assignments.find((a) => a.id === activeId);

  const addExp = () => {
    if (!expForm.desc || !expForm.amount) return;
    const amtUSD = expForm.currency === "INR" ? toUSD(parseFloat(expForm.amount), rate) : parseFloat(expForm.amount);
    updateAssignments((p) => p.map((a) => a.id === activeId ? { ...a, expenses: [...a.expenses, { id: Date.now(), desc: expForm.desc, amount: amtUSD, date: expForm.date }] } : a));
    setExpForm({ desc: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0] });
    setShowAddExp(false);
  };

  // Currency toggle pill
  const CurToggle = () => (
    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
      {["USD", "INR"].map((c) => (
        <button key={c} type="button" onClick={() => setCur(c)} style={{
          padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
          background: cur === c ? T.accent : "rgba(255,255,255,.04)",
          color: cur === c ? "#030507" : T.textMut,
          fontFamily: "'JetBrains Mono'", transition: "all .2s",
        }}>
          {c === "USD" ? "$" : "₹"}
        </button>
      ))}
    </div>
  );

  // DETAIL VIEW
  if (active) {
    const spent = active.expenses.reduce((s, e) => s + e.amount, 0);
    const pct = active.budget > 0 ? ((spent / active.budget) * 100).toFixed(0) : 0;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setActiveId(null)} style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${T.border}`, borderRadius: 9, padding: 8, cursor: "pointer", color: T.textSec, display: "flex" }}><ChevronLeft size={16} /></button>
            <div>
              <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: 0 }}>{active.name}</h2>
              <div style={{ fontSize: 11, color: T.textMut }}>Created {active.createdAt}</div>
            </div>
          </div>
          <CurToggle />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <Metric icon={DollarSign} label="Budget" value={cfmt(active.budget)} color={T.blue} delay={0.04} />
          <Metric icon={Receipt} label="Spent" value={cfmt(spent)} color={T.red} delay={0.08} />
          <Metric icon={PiggyBank} label="Remaining" value={cfmt(active.budget - spent)} color={T.accent} delay={0.12} />
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pct > 80 ? T.red : pct > 50 ? T.yellow : T.accent, borderRadius: 3, transition: "width .5s" }} />
          </div>
          <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{pct}% used</div>
        </div>

        <GC hover={false}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>Expenses</h3>
            <Btn small onClick={() => setShowAddExp(true)}><Plus size={13} /> Add</Btn>
          </div>
          {active.expenses.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: T.textMut, fontSize: 12 }}>No expenses logged for this assignment yet.</div>
          ) : (
            active.expenses.map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{e.desc}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{e.date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.red, fontFamily: "'JetBrains Mono'" }}>{cfmt(e.amount)}</span>
                  <button onClick={() => updateAssignments((p) => p.map((a) => a.id === activeId ? { ...a, expenses: a.expenses.filter((x) => x.id !== e.id) } : a))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMut }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))
          )}
        </GC>

        <Modal open={showAddExp} onClose={() => setShowAddExp(false)} title="Add Expense">
          <Inp label="What" value={expForm.desc} onChange={(v) => setExpForm((p) => ({ ...p, desc: v }))} placeholder="Hotel, flight, food..." />
          <Inp label="Amount" value={expForm.amount} onChange={(v) => setExpForm((p) => ({ ...p, amount: v }))} type="number" />
          <Inp label="Currency" value={expForm.currency} onChange={(v) => setExpForm((p) => ({ ...p, currency: v }))} options={[{ value: "USD", label: "USD" }, { value: "INR", label: "INR" }]} />
          <Inp label="Date" value={expForm.date} onChange={(v) => setExpForm((p) => ({ ...p, date: v }))} type="date" />
          <Btn onClick={addExp} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Add</Btn>
        </Modal>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: 0 }}>Assignments</h2>
        <Btn onClick={() => setShowCreate(true)}><Plus size={14} /> Create</Btn>
      </div>

      {assignments.length === 0 ? (
        <GC>
          <div style={{ padding: 40, textAlign: "center" }}>
            <MapPin size={28} color={T.textMut} style={{ margin: "0 auto 12px" }} />
            <div style={{ color: T.textMut, fontSize: 13 }}>No assignments yet. Create one for your next trip or event.</div>
          </div>
        </GC>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {assignments.map((a, i) => {
            const spent = a.expenses.reduce((s, e) => s + e.amount, 0);
            const pct = a.budget > 0 ? ((spent / a.budget) * 100).toFixed(0) : 0;
            return (
              <GC key={a.id} style={{ cursor: "pointer", position: "relative" }} delay={i * 0.05} onClick={() => setActiveId(a.id)}>
                <button onClick={(e) => { e.stopPropagation(); updateAssignments((p) => p.filter((x) => x.id !== a.id)); }} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: T.textMut }}><Trash2 size={13} /></button>
                <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>{a.createdAt}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 12px" }}>{a.name}</h3>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec, marginBottom: 8 }}>
                  <span>Budget: {fmt(a.budget)}</span>
                  <span>Spent: {fmt(spent)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pct > 90 ? T.red : pct > 60 ? T.yellow : T.accent, borderRadius: 2, transition: "width .5s" }} />
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 6 }}>{a.expenses.length} expenses · {pct}% used</div>
              </GC>
            );
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Assignment">
        <Inp label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Goa Trip, Birthday Party" />
        <Inp label="Budget ($)" value={form.budget} onChange={(v) => setForm((p) => ({ ...p, budget: v }))} type="number" placeholder="Total budget" />
        <Btn onClick={create} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Create</Btn>
      </Modal>
    </div>
  );
}
