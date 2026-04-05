import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, BarChart3, CircleDollarSign, Plus, Trash2, Edit3, Check, Briefcase } from "lucide-react";
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

const TYPE_META = {
  Stock: { icon: TrendingUp, color: "#3b82f6", label: "STOCKS" },
  SIP: { icon: RefreshCw, color: "#00e8b0", label: "SIPs" },
  ETF: { icon: BarChart3, color: "#a855f7", label: "ETFs" },
  Gold: { icon: CircleDollarSign, color: "#eab308", label: "GOLD" },
  "Mutual Fund": { icon: TrendingUp, color: "#06b6d4", label: "MUTUAL FUNDS" },
  Crypto: { icon: Briefcase, color: "#ff6b35", label: "CRYPTO" },
  Other: { icon: Briefcase, color: "#7a839e", label: "OTHER" },
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

function getSectionTotal(items, rate) {
  if (!items.length) return 0;
  const t = items[0].type;
  if (t === "SIP") return items.reduce((s, i) => s + (i.monthlyAmount || 0), 0);
  if (t === "Stock" || t === "ETF") return items.reduce((s, i) => s + (i.quantity || 0) * (i.buyPrice || 0), 0);
  return items.reduce((s, i) => {
    const amt = i.amount || 0;
    return s + (i.currency === "USD" ? amt * rate : amt);
  }, 0);
}

export default function Investments({ config, updateConfig }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const rate = config.exchangeRate || 93.5;

  // One-time migration
  useEffect(() => {
    if (config && !config.investments && ((config.sips && config.sips.length > 0) || (config.stocks && config.stocks.length > 0))) {
      const migrated = [
        ...(config.sips || []).map((s) => ({
          id: s.id || `sip-${Date.now()}-${Math.random()}`,
          name: s.name, type: "SIP",
          monthlyAmount: s.amountINR || 0, debitDate: s.date || 1,
        })),
        ...(config.stocks || []).map((s) => ({
          id: s.id || `st-${Date.now()}-${Math.random()}`,
          name: s.name, type: "Stock",
          quantity: s.qty || 0, buyPrice: s.buyPrice || 0,
        })),
      ];
      updateConfig((prev) => ({ ...prev, investments: migrated }));
    }
  }, [config, updateConfig]);

  const investments = config.investments || [];

  // Metrics
  const sipTotal = investments.filter((i) => i.type === "SIP").reduce((s, i) => s + (i.monthlyAmount || 0), 0);
  const stockTotal = investments.filter((i) => i.type === "Stock").reduce((s, i) => s + (i.quantity || 0) * (i.buyPrice || 0), 0);
  const etfTotal = investments.filter((i) => i.type === "ETF").reduce((s, i) => s + (i.quantity || 0) * (i.buyPrice || 0), 0);
  const otherItems = investments.filter((i) => !["SIP", "Stock", "ETF"].includes(i.type));
  const otherTotal = otherItems.reduce((s, i) => {
    const amt = i.amount || 0;
    return s + (i.currency === "USD" ? amt * rate : amt);
  }, 0);

  // Group by type (ordered)
  const typeOrder = ["Stock", "SIP", "ETF", "Gold", "Mutual Fund", "Crypto", "Other"];
  const groups = typeOrder
    .map((type) => ({ type, items: investments.filter((i) => i.type === type) }))
    .filter((g) => g.items.length > 0);

  const syncLegacy = (newInvestments) => {
    const newSips = newInvestments.filter((i) => i.type === "SIP").map((i) => ({ id: i.id, name: i.name, amountINR: i.monthlyAmount || 0, date: i.debitDate || 1 }));
    const newStocks = newInvestments.filter((i) => i.type === "Stock" || i.type === "ETF").map((i) => ({ id: i.id, name: i.name, qty: i.quantity || 0, buyPrice: i.buyPrice || 0 }));
    return { sips: newSips, stocks: newStocks };
  };

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowAdd(true); };

  const openEdit = (inv) => {
    setForm({
      name: inv.name, type: inv.type,
      monthlyAmount: inv.monthlyAmount || "", debitDate: inv.debitDate || "",
      quantity: inv.quantity || "", buyPrice: inv.buyPrice || "",
      amount: inv.amount || "", currency: inv.currency || "INR",
    });
    setEditId(inv.id);
    setShowAdd(true);
  };

  const save = () => {
    if (!form.name) return;
    const entry = {
      id: editId || `inv-${Date.now()}`,
      name: form.name, type: form.type,
      ...(form.type === "SIP" && { monthlyAmount: parseFloat(form.monthlyAmount) || 0, debitDate: parseInt(form.debitDate) || 1 }),
      ...((form.type === "Stock" || form.type === "ETF") && { quantity: parseFloat(form.quantity) || 0, buyPrice: parseFloat(form.buyPrice) || 0 }),
      ...(!["SIP", "Stock", "ETF"].includes(form.type) && { amount: parseFloat(form.amount) || 0, currency: form.currency }),
    };
    updateConfig((p) => {
      const prev = p.investments || [];
      const newInvestments = editId ? prev.map((i) => (i.id === editId ? entry : i)) : [...prev, entry];
      const { sips, stocks } = syncLegacy(newInvestments);
      return { ...p, investments: newInvestments, sips, stocks };
    });
    setForm({ ...EMPTY_FORM }); setEditId(null); setShowAdd(false);
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
        <Metric icon={RefreshCw} label="Monthly SIPs" value={fmt(sipTotal, "INR")} sub={fmt(toUSD(sipTotal, rate))} color={T.accent} delay={0.04} />
        <Metric icon={TrendingUp} label="Stock Holdings" value={fmt(stockTotal, "INR")} sub={fmt(toUSD(stockTotal, rate))} color={T.blue} delay={0.08} />
        {etfTotal > 0 && <Metric icon={BarChart3} label="ETF Holdings" value={fmt(etfTotal, "INR")} sub={fmt(toUSD(etfTotal, rate))} color={T.purple} delay={0.12} />}
        {otherTotal > 0 && <Metric icon={Briefcase} label="Other" value={fmt(otherTotal, "INR")} sub={fmt(toUSD(otherTotal, rate))} color={T.orange} delay={0.16} />}
      </div>

      {/* GROUPED SECTIONS */}
      {investments.length === 0 ? (
        <GC hover={false}>
          <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>
            No investments yet. Tap "Add Investment" to get started.
          </div>
        </GC>
      ) : (
        groups.map((group, gi) => {
          const meta = TYPE_META[group.type] || TYPE_META.Other;
          const Ic = meta.icon;
          const sectionTotal = getSectionTotal(group.items, rate);
          const isSIP = group.type === "SIP";
          const isHolding = group.type === "Stock" || group.type === "ETF";

          return (
            <GC key={group.type} hover={false} delay={gi * 0.06} style={{ marginBottom: 14, borderLeft: `3px solid ${meta.color}`, paddingLeft: 20 }}>
              {/* Section header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, background: meta.color + "14",
                    border: `1px solid ${meta.color}22`, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Ic size={15} color={meta.color} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: "2px" }}>{meta.label}</span>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 20,
                    background: "rgba(255,255,255,.06)", color: T.textSec, fontWeight: 600,
                  }}>
                    {group.items.length}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: meta.color, fontFamily: "'JetBrains Mono'" }}>
                  {fmt(sectionTotal, "INR")}
                  {isSIP && <span style={{ fontSize: 10, color: T.textMut, fontWeight: 400 }}>/mo</span>}
                </span>
              </div>

              {/* Items */}
              {group.items.map((inv, i) => {
                const { main, sub } = getDisplayValue(inv, rate);
                return (
                  <div key={inv.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: i < group.items.length - 1 ? `1px solid ${T.border}` : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{inv.name}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>
                        {inv.type === "SIP" && inv.debitDate ? `${inv.debitDate}th of month` : ""}
                        {isHolding ? `${inv.quantity} shares` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, fontFamily: "'JetBrains Mono'" }}>{main}</div>
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
              })}
            </GC>
          );
        })
      )}

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
