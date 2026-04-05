import { Plus, Trash2 } from "lucide-react";
import { T, fmt } from "../config/theme";
import { GC, Inp, Btn } from "../components/ui";

export default function SettingsPage({ config, updateConfig }) {
  const update = (path, val) => {
    updateConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: "0 0 22px" }}>Settings</h2>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {/* INCOME */}
        <GC style={{ flex: "1 1 280px" }} delay={0.04}>
          <h3 style={{ color: T.accent, fontSize: 11, fontWeight: 700, margin: "0 0 14px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Income</h3>
          <Inp label="Salary (USD)" value={config.salary} onChange={(v) => update("salary", parseFloat(v) || 0)} type="number" />
          <Inp label="Rent (USD)" value={config.rent} onChange={(v) => update("rent", parseFloat(v) || 0)} type="number" />
          <Inp label="Exchange Rate" value={config.exchangeRate} onChange={(v) => update("exchangeRate", parseFloat(v) || 83.5)} type="number" />
        </GC>

        {/* STUDENT LOAN */}
        <GC style={{ flex: "1 1 280px" }} delay={0.08}>
          <h3 style={{ color: T.yellow, fontSize: 11, fontWeight: 700, margin: "0 0 14px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Student Loan</h3>
          <Inp label="EMI (INR)" value={config.studentLoan.amountINR} onChange={(v) => update("studentLoan.amountINR", parseFloat(v) || 0)} type="number" />
          <Inp label="Date" value={config.studentLoan.date} onChange={(v) => update("studentLoan.date", parseInt(v) || 1)} type="number" />
          <Inp label="Remaining (INR)" value={config.studentLoan.totalRemaining} onChange={(v) => update("studentLoan.totalRemaining", parseFloat(v) || 0)} type="number" />
        </GC>

        {/* SUBSCRIPTIONS */}
        <GC style={{ flex: "1 1 280px" }} delay={0.12}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ color: T.purple, fontSize: 11, fontWeight: 700, margin: 0, letterSpacing: "1.5px", textTransform: "uppercase" }}>Subscriptions</h3>
            <Btn small variant="ghost" onClick={() => updateConfig((p) => ({ ...p, subscriptions: [...p.subscriptions, { id: `sub${Date.now()}`, name: "", amount: 0 }] }))}>
              <Plus size={12} />
            </Btn>
          </div>
          {config.subscriptions.map((sub, idx) => (
            <div key={sub.id} style={{ display: "flex", gap: 6, alignItems: "flex-end", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <Inp label="Name" value={sub.name} onChange={(v) => update(`subscriptions.${idx}.name`, v)} />
              </div>
              <div style={{ width: 80 }}>
                <Inp label="$/mo" value={sub.amount} onChange={(v) => update(`subscriptions.${idx}.amount`, parseFloat(v) || 0)} type="number" />
              </div>
              <button onClick={() => updateConfig((p) => ({ ...p, subscriptions: p.subscriptions.filter((s) => s.id !== sub.id) }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMut, padding: "0 0 16px" }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </GC>

        {/* CARD DUE DATES */}
        <GC style={{ flex: "1 1 280px" }} delay={0.16}>
          <h3 style={{ color: T.orange, fontSize: 11, fontWeight: 700, margin: "0 0 14px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Card Dues</h3>
          {config.cards.map((card, idx) => (
            <div key={card.id} style={{ marginBottom: 12, padding: 12, background: "rgba(255,255,255,.02)", borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>{card.name}</div>
              <Inp label="Due Date" value={card.dueDate} onChange={(v) => update(`cards.${idx}.dueDate`, parseInt(v) || 1)} type="number" />
            </div>
          ))}
        </GC>

        {/* CUSTOM BUDGET */}
        {(config.customBudget || []).length > 0 && (
          <GC style={{ flex: "1 1 280px" }} delay={0.2}>
            <h3 style={{ color: T.blue, fontSize: 11, fontWeight: 700, margin: "0 0 14px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Custom Budget</h3>
            {config.customBudget.map((b) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{fmt(b.amount, b.currency)}/mo</div>
                </div>
                <button onClick={() => updateConfig((p) => ({ ...p, customBudget: p.customBudget.filter((x) => x.id !== b.id) }))} style={{ background: T.red + "12", border: `1px solid ${T.red}22`, cursor: "pointer", color: T.red, padding: 4, borderRadius: 6, display: "flex" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </GC>
        )}
      </div>
    </div>
  );
}