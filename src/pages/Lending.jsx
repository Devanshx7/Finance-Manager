import { useState } from "react";
import { Plus, Check, Clock, Trash2, Banknote, Timer } from "lucide-react";
import { T, fmt, toINR, toUSD, daysSince } from "../config/theme";
import { GC, Metric, Ctr, Modal, Inp, Btn } from "../components/ui";

export default function Lending({ config, lending, updateLending }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0], delayType: "flexible" });

  const pending = lending.filter((l) => !l.settled);
  const settled = lending.filter((l) => l.settled);
  const totalOut = pending.reduce((s, l) => s + (l.currency === "USD" ? l.amount : toUSD(l.amount, config.exchangeRate)), 0);
  const timedAlerts = pending.filter((l) => l.delayType === "timed" && daysSince(l.date) >= 14);

  const add = () => {
    if (!form.name || !form.amount) return;
    updateLending((p) => [...p, { ...form, id: Date.now(), amount: parseFloat(form.amount), settled: false }]);
    setForm({ name: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0], delayType: "flexible" });
    setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: 0 }}>Lending Book</h2>
        <Btn onClick={() => setShowAdd(true)}><Plus size={14} /> Lend</Btn>
      </div>

      {/* TIMED REMINDERS */}
      {timedAlerts.length > 0 && (
        <GC style={{ marginBottom: 18, padding: "16px 20px", borderLeft: `3px solid ${T.yellow}`, background: `linear-gradient(135deg,${T.yellow}08,transparent)` }} hover={false}>
          <div style={{ fontSize: 10, color: T.yellow, fontWeight: 700, letterSpacing: "2px", marginBottom: 10 }}>⏰ REMINDERS, BOSS</div>
          {timedAlerts.map((l) => (
            <div key={l.id} style={{ fontSize: 13, color: T.text, marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>{l.name}</span> owes you{" "}
              <span style={{ color: T.yellow, fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{fmt(l.amount, l.currency)}</span>
              {" "}— it's been <span style={{ color: T.red, fontWeight: 600 }}>{daysSince(l.date)} days</span>, sir.
            </div>
          ))}
        </GC>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Metric icon={Banknote} label="Outstanding" value={<Ctr value={totalOut} />} sub={fmt(toINR(totalOut, config.exchangeRate), "INR")} color={T.yellow} delay={0.04} />
        <Metric icon={Clock} label="Pending" value={String(pending.length)} color={T.orange} delay={0.08} />
        <Metric icon={Check} label="Settled" value={String(settled.length)} color={T.accent} delay={0.12} />
      </div>

      {/* PENDING */}
      <GC delay={0.16}>
        <h3 style={{ color: T.yellow, fontSize: 12, fontWeight: 700, margin: "0 0 14px", letterSpacing: "1px" }}>⏳ PENDING</h3>
        {pending.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.textMut, fontSize: 12 }}>Nobody owes you, boss.</div>
        ) : (
          pending.map((l, i) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}`, animation: `slideR .3s ease ${i * 0.04}s both` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.yellow}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: T.yellow }}>{l.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>{daysSince(l.date)}d ago</span>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: l.delayType === "timed" ? T.purple + "18" : T.blue + "18", color: l.delayType === "timed" ? T.purple : T.blue, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      {l.delayType === "timed" ? <><Timer size={8} /> Timed</> : <>Flexible</>}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.yellow, fontFamily: "'JetBrains Mono'" }}>{fmt(l.amount, l.currency)}</span>
                <Btn small variant="success" onClick={() => updateLending((p) => p.map((x) => x.id === l.id ? { ...x, settled: true } : x))}><Check size={12} /></Btn>
                <button onClick={() => updateLending((p) => p.filter((x) => x.id !== l.id))} style={{ background: T.red + "12", border: `1px solid ${T.red}22`, cursor: "pointer", color: T.red, padding: 4, borderRadius: 6, display: "flex" }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))
        )}
      </GC>

      {/* SETTLED */}
      {settled.length > 0 && (
        <GC style={{ marginTop: 14, opacity: 0.5 }} delay={0.2}>
          <h3 style={{ color: T.accent, fontSize: 12, fontWeight: 700, margin: "0 0 10px" }}>✓ SETTLED</h3>
          {settled.map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.textMut, textDecoration: "line-through" }}>{l.name}</span>
              <span style={{ fontSize: 12, color: T.textMut, fontFamily: "'JetBrains Mono'" }}>{fmt(l.amount, l.currency)}</span>
            </div>
          ))}
        </GC>
      )}

      {/* ADD MODAL */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Lend Money">
        <Inp label="Who, boss?" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Name" />
        <Inp label="Amount" value={form.amount} onChange={(v) => setForm((p) => ({ ...p, amount: v }))} type="number" />
        <Inp label="Currency" value={form.currency} onChange={(v) => setForm((p) => ({ ...p, currency: v }))} options={[{ value: "USD", label: "USD" }, { value: "INR", label: "INR" }]} />

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 10, color: T.textSec, marginBottom: 8, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Repayment Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["flexible", "timed"].map((type) => (
              <button key={type} onClick={() => setForm((p) => ({ ...p, delayType: type }))} style={{
                flex: 1, padding: 12, borderRadius: 10,
                border: `1px solid ${form.delayType === type ? (type === "timed" ? T.purple : T.blue) + "55" : T.border}`,
                background: form.delayType === type ? (type === "timed" ? T.purple : T.blue) + "14" : "rgba(255,255,255,.02)",
                color: form.delayType === type ? (type === "timed" ? T.purple : T.blue) : T.textSec,
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans'", textAlign: "center",
              }}>
                {type === "flexible" ? "Flexible" : "Timed"}
                <div style={{ fontSize: 9, color: T.textMut, marginTop: 4 }}>
                  {type === "flexible" ? "No rush" : "Remind after 2 weeks"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Inp label="Date" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} type="date" />
        <Btn onClick={add} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Lend</Btn>
      </Modal>
    </div>
  );
}