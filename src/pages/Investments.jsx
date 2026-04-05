import { useState, useEffect } from "react";
import { TrendingUp, Plus, Trash2, Edit3, Check } from "lucide-react";
import { T, fmt, toUSD } from "../config/theme";
import { GC, Metric, Modal, Inp, Btn } from "../components/ui";

const INVESTMENT_TYPES = [
  { value: "SIP", label: "SIP" },
  { value: "Stock", label: "Stock" },
  { value: "ETF", label: "ETF" },
  { value: "Gold", label: "Gold" },
  { value: "Mutual Fund", label: "Mutual Fund" },
  { value: "Crypto", label: "Crypto" },
  { value: "Other", label: "Other" },
];

const EMPTY_FORM = {
  name: "", type: "SIP", monthlyAmount: "", debitDate: "",
  quantity: "", buyPrice: "", amount: "", currency: "INR",
};

function InvestmentFields({ form, setForm }) {
  const t = form.type;

  if (t === "SIP") return (
    <>
      <Inp label="Monthly Amount (INR)" value={form.monthlyAmount} onChange={(v) => setForm((p) => ({ ...p, monthlyAmount: v }))} type="number" placeholder="5000" />
      <Inp label="Debit Date (day)" value={form.debitDate} onChange={(v) => setForm((p) => ({ ...p, debitDate: v }))} type="number" placeholder="5" />
    </>
  );

  if (t === "Stock" || t === "ETF") return (
    <>
      <Inp label="Quantity" value={form.quantity} onChange={(v) => setForm((p) => ({ ...p, quantity: v }))} type="number" />
      <Inp label="Buy Price (INR)" value={form.buyPrice} onChange={(v) => setForm((p) => ({ ...p, buyPrice: v }))} type="number" />
    </>
  );

  // Gold, Crypto, Mutual Fund, Other
  return (
    <>
      <Inp label="Amount" value={form.amount} onChange={(v) => setForm((p) => ({ ...p, amount: v }))} type="number" />
      <Inp label="Currency" value={form.currency} onChange={(v) => setForm((p) => ({ ...p, currency: v }))} options={[{ value: "INR", label: "INR" }, { value: "USD", label: "USD" }]} />
    </>
  );
}

function getDisplayValue(inv, rate) {
  if (inv.type === "SIP") return { main: fmt(inv.monthlyAmount || 0, "INR"), sub: `${fmt(toUSD(inv.monthlyAmount || 0, rate))}/mo` };
  if (inv.type === "Stock" || inv.type === "ETF") {
    const total = (inv.quantity || 0) * (inv.buyPrice || 0);
    return { main: fmt(total, "INR"), sub: `${inv.quantity} @ ${fmt(inv.buyPrice || 0, "INR")}` };
  }
  return { main: fmt(inv.amount || 0, inv.currency || "INR"), sub: inv.currency === "USD" ? fmt((inv.amount || 0) * rate, "INR") : fmt(toUSD(inv.amount || 0, rate)) };
}

function getTypeColor(type) {
  const map = { SIP: T.purple, Stock: T.blue, ETF: T.blue, Gold: T.yellow, "Mutual Fund": T.accent, Crypto: T.orange, Other: T.textSec };
  return map[type] || T.textSec;
}

export default function Investments({ config, updateConfig }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const rate = config.exchangeRate || 93.5;

  // One-time migration: if config.investments doesn't exist but sips/stocks do, create it
  useEffect(() => {
    if (config && !config.investments && ((config.sips && config.sips.length > 0) || (config.stocks && config.stocks.length > 0))) {
      const migrated = [
        ...(config.sips || []).map((s) => ({
          id: s.id || `sip-${Date.now()}-${Math.random()}`,
          name: s.name,
          type: "SIP",
          monthlyAmount: s.amountINR || 0,
          debitDate: s.date || 1,
        })),
        ...(config.stocks || []).map((s) => ({
          id: s.id || `st-${Date.now()}-${Math.random()}`,
          name: s.name,
          type: "Stock",
          quantity: s.qty || 0,
          buyPrice: s.buyPrice || 0,
        })),
      ];
      updateConfig((prev) => ({ ...prev, investments: migrated }));
    }
  }, [config, updateConfig]);

  const investments = config.investments || [];

  // Totals
  const monthlyTotal = investments
    .filter((i) => i.type === "SIP")
    .reduce((s, i) => s + (i.monthlyAmount || 0), 0);
  const holdingsTotal = investments
    .filter((i) => i.type === "Stock" || i.type === "ETF")
    .reduce((s, i) => s + (i.quantity || 0) * (i.buyPrice || 0), 0);
  const otherTotal = investments
    .filter((i) => !["SIP", "Stock", "ETF"].includes(i.type))
    .reduce((s, i) => {
      const amt = i.amount || 0;
      return s + (i.currency === "USD" ? amt * rate : amt);
    }, 0);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowAdd(true);
  };

  const openEdit = (inv) => {
    setForm({
      name: inv.name, type: inv.type,
      monthlyAmount: inv.monthlyAmount || "",
      debitDate: inv.debitDate || "",
      quantity: inv.quantity || "",
      buyPrice: inv.buyPrice || "",
      amount: inv.amount || "",
      currency: inv.currency || "INR",
    });
    setEditId(inv.id);
    setShowAdd(true);
  };

  // Sync config.sips and config.stocks from investments array
  const syncLegacy = (newInvestments) => {
    const newSips = newInvestments
      .filter((i) => i.type === "SIP")
      .map((i) => ({ id: i.id, name: i.name, amountINR: i.monthlyAmount || 0, date: i.debitDate || 1 }));
    const newStocks = newInvestments
      .filter((i) => i.type === "Stock" || i.type === "ETF")
      .map((i) => ({ id: i.id, name: i.name, qty: i.quantity || 0, buyPrice: i.buyPrice || 0 }));
    return { sips: newSips, stocks: newStocks };
  };

  const save = () => {
    if (!form.name) return;

    const entry = {
      id: editId || `inv-${Date.now()}`,
      name: form.name,
      type: form.type,
      ...(form.type === "SIP" && {
        monthlyAmount: parseFloat(form.monthlyAmount) || 0,
        debitDate: parseInt(form.debitDate) || 1,
      }),
      ...((form.type === "Stock" || form.type === "ETF") && {
        quantity: parseFloat(form.quantity) || 0,
        buyPrice: parseFloat(form.buyPrice) || 0,
      }),
      ...(!["SIP", "Stock", "ETF"].includes(form.type) && {
        amount: parseFloat(form.amount) || 0,
        currency: form.currency,
      }),
    };

    updateConfig((p) => {
      const prev = p.investments || [];
      const newInvestments = editId
        ? prev.map((i) => (i.id === editId ? entry : i))
        : [...prev, entry];
      const { sips, stocks } = syncLegacy(newInvestments);
      return { ...p, investments: newInvestments, sips, stocks };
    });

    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowAdd(false);
  };

  const remove = (id) => {
    updateConfig((p) => {
      const newInvestments = (p.investments || []).filter((i) => i.id !== id);
      const { sips, stocks } = syncLegacy(newInvestments);
      return { ...p, investments: newInvestments, sips, stocks };
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: 0 }}>Investments</h2>
        <Btn onClick={openAdd}><Plus size={14} /> Add Investment</Btn>
      </div>

      {/* METRICS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Metric icon={TrendingUp} label="Monthly SIPs" value={fmt(monthlyTotal, "INR")} sub={fmt(toUSD(monthlyTotal, rate))} color={T.purple} delay={0.04} />
        <Metric icon={TrendingUp} label="Holdings" value={fmt(holdingsTotal, "INR")} sub={fmt(toUSD(holdingsTotal, rate))} color={T.blue} delay={0.08} />
        <Metric icon={TrendingUp} label="Other" value={fmt(otherTotal, "INR")} sub={fmt(toUSD(otherTotal, rate))} color={T.orange} delay={0.12} />
      </div>

      {/* INVESTMENT LIST */}
      <GC hover={false} delay={0.16}>
        {investments.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>
            No investments yet. Tap "Add Investment" to get started.
          </div>
        ) : (
          investments.map((inv, i) => {
            const color = getTypeColor(inv.type);
            const { main, sub } = getDisplayValue(inv, rate);
            return (
              <div key={inv.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0", borderBottom: `1px solid ${T.border}`,
                animation: `slideR .3s ease ${i * 0.03}s both`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: color + "14", border: `1px solid ${color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color,
                  }}>
                    {inv.type.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{inv.name}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>
                      {inv.type}
                      {inv.type === "SIP" && inv.debitDate ? ` · ${inv.debitDate}th of month` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>{main}</div>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: "'JetBrains Mono'" }}>{sub}</div>
                  </div>
                  <button onClick={() => openEdit(inv)} style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${T.border}`, cursor: "pointer", color: T.textSec, padding: 5, borderRadius: 6, display: "flex" }}>
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => remove(inv.id)} style={{ background: T.red + "12", border: `1px solid ${T.red}22`, cursor: "pointer", color: T.red, padding: 5, borderRadius: 6, display: "flex" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </GC>

      {/* ADD/EDIT MODAL */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditId(null); }} title={editId ? "Edit Investment" : "Add Investment"}>
        <Inp label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Nifty 50, Bitcoin..." />
        <Inp label="Type" value={form.type} onChange={(v) => setForm((p) => ({ ...p, type: v }))} options={INVESTMENT_TYPES} />
        <InvestmentFields form={form} setForm={setForm} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }}>
          {editId ? <><Check size={14} /> Update</> : <><Plus size={14} /> Add</>}
        </Btn>
      </Modal>
    </div>
  );
}
