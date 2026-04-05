import { useState } from "react";
import { Users, Plus, X, Trash2 } from "lucide-react";
import { T, fmt } from "../config/theme";
import { GC, Modal, Inp, Btn } from "../components/ui";

export default function SplitPage({ splits, updateSplits }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showPerson, setShowPerson] = useState(false);
  const [form, setForm] = useState({ desc: "", amount: "", paidBy: "me", splitWith: [], date: new Date().toISOString().split("T")[0] });
  const [newPerson, setNewPerson] = useState("");

  const people = splits.people || [];
  const txns = splits.transactions || [];

  const addPerson = () => {
    if (!newPerson) return;
    updateSplits((p) => ({ ...p, people: [...(p.people || []), newPerson] }));
    setNewPerson("");
    setShowPerson(false);
  };

  const addTxn = () => {
    if (!form.desc || !form.amount || form.splitWith.length === 0) return;
    const t = { id: Date.now(), desc: form.desc, amount: parseFloat(form.amount), paidBy: form.paidBy, splitWith: ["me", ...form.splitWith], date: form.date };
    updateSplits((p) => ({ ...p, transactions: [...(p.transactions || []), t] }));
    setForm({ desc: "", amount: "", paidBy: "me", splitWith: [], date: new Date().toISOString().split("T")[0] });
    setShowAdd(false);
  };

  const toggleSplitWith = (p) => setForm((f) => ({ ...f, splitWith: f.splitWith.includes(p) ? f.splitWith.filter((x) => x !== p) : [...f.splitWith, p] }));

  // Calculate balances
  const balances = {};
  people.forEach((p) => { balances[p] = 0; });
  txns.forEach((tx) => {
    const share = tx.amount / tx.splitWith.length;
    tx.splitWith.forEach((person) => {
      if (person === tx.paidBy) return;
      if (tx.paidBy === "me") balances[person] = (balances[person] || 0) + share;
      else if (person === "me") balances[tx.paidBy] = (balances[tx.paidBy] || 0) - share;
    });
  });

  const theyOweMe = Object.entries(balances).filter(([, v]) => v > 0);
  const iOweThem = Object.entries(balances).filter(([, v]) => v < 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: 0 }}>Split</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="ghost" onClick={() => setShowPerson(true)}><Users size={13} /> Add Person</Btn>
          <Btn small onClick={() => setShowAdd(true)}><Plus size={13} /> Add Bill</Btn>
        </div>
      </div>

      {people.length === 0 ? (
        <GC><div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 13 }}>Add your roommates or friends first, boss.</div></GC>
      ) : (
        <>
          {/* BALANCE SUMMARY */}
          <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            {theyOweMe.length > 0 && (
              <GC style={{ flex: "1 1 300px" }} delay={0.04}>
                <h3 style={{ color: T.accent, fontSize: 12, fontWeight: 700, margin: "0 0 14px", letterSpacing: "1px" }}>THEY OWE YOU, BOSS</h3>
                {theyOweMe.map(([name, amt]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.accent }}>{name[0]}</div>
                      <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{name}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'" }}>{fmt(amt)}</span>
                  </div>
                ))}
              </GC>
            )}

            {iOweThem.length > 0 && (
              <GC style={{ flex: "1 1 300px" }} delay={0.08}>
                <h3 style={{ color: T.red, fontSize: 12, fontWeight: 700, margin: "0 0 14px", letterSpacing: "1px" }}>YOU OWE, SIR</h3>
                {iOweThem.map(([name, amt]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.red + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.red }}>{name[0]}</div>
                      <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{name}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.red, fontFamily: "'JetBrains Mono'" }}>{fmt(Math.abs(amt))}</span>
                  </div>
                ))}
              </GC>
            )}

            {theyOweMe.length === 0 && iOweThem.length === 0 && (
              <GC style={{ flex: 1 }}><div style={{ padding: 20, textAlign: "center", color: T.textMut, fontSize: 12 }}>All settled, boss. No pending splits.</div></GC>
            )}
          </div>

          {/* PEOPLE */}
          <GC style={{ marginBottom: 18 }} delay={0.12} hover={false}>
            <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>People</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {people.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "8px 14px", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{p}</span>
                  <button onClick={() => updateSplits((prev) => ({ ...prev, people: prev.people.filter((x) => x !== p) }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMut, display: "flex" }}><X size={12} /></button>
                </div>
              ))}
            </div>
          </GC>

          {/* TRANSACTIONS */}
          <GC hover={false} delay={0.16}>
            <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>Recent Splits</h3>
            {txns.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: T.textMut, fontSize: 12 }}>No splits yet</div>
            ) : (
              txns.slice().reverse().map((tx) => (
                <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{tx.desc}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>Paid by {tx.paidBy === "me" ? "you" : tx.paidBy} · Split {tx.splitWith.length} ways · {tx.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.orange, fontFamily: "'JetBrains Mono'" }}>{fmt(tx.amount)}</span>
                    <button onClick={() => updateSplits((p) => ({ ...p, transactions: (p.transactions || []).filter((t) => t.id !== tx.id) }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMut }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))
            )}
          </GC>
        </>
      )}

      {/* ADD PERSON MODAL */}
      <Modal open={showPerson} onClose={() => setShowPerson(false)} title="Add Person">
        <Inp label="Name" value={newPerson} onChange={setNewPerson} placeholder="e.g. Raj, Alex" />
        <Btn onClick={addPerson} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Add</Btn>
      </Modal>

      {/* ADD BILL MODAL */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Split a Bill">
        <Inp label="What" value={form.desc} onChange={(v) => setForm((p) => ({ ...p, desc: v }))} placeholder="WiFi, dinner, etc" />
        <Inp label="Total Amount ($)" value={form.amount} onChange={(v) => setForm((p) => ({ ...p, amount: v }))} type="number" />
        <Inp label="Who Paid?" value={form.paidBy} onChange={(v) => setForm((p) => ({ ...p, paidBy: v }))} options={[{ value: "me", label: "Me" }, ...people.map((p) => ({ value: p, label: p }))]} />

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 10, color: T.textSec, marginBottom: 8, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Split With</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {people.map((p) => (
              <button key={p} onClick={() => toggleSplitWith(p)} style={{
                padding: "8px 16px", borderRadius: 9,
                border: `1px solid ${form.splitWith.includes(p) ? T.accent + "55" : T.border}`,
                background: form.splitWith.includes(p) ? T.accent + "14" : "rgba(255,255,255,.03)",
                color: form.splitWith.includes(p) ? T.accent : T.textSec,
                fontSize: 12, cursor: "pointer", fontWeight: 500, fontFamily: "'DM Sans'",
              }}>
                {p}{form.splitWith.includes(p) && " ✓"}
              </button>
            ))}
          </div>
        </div>

        <Inp label="Date" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} type="date" />
        <Btn onClick={addTxn} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Split It</Btn>
      </Modal>
    </div>
  );
}