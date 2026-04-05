import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit3, Check, RefreshCw } from "lucide-react";
import { T, fmt, toUSD } from "../config/theme";
import { GC, Modal, Inp, Btn } from "../components/ui";

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

const TYPE_COLORS = {
  Stock: "#3266ad", ETF: "#534AB7", SIP: "#1D9E75",
  Gold: "#eab308", "Mutual Fund": "#06b6d4", Crypto: "#ff6b35", Other: "#7a839e",
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

export default function Investments({ config, updateConfig }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filter, setFilter] = useState("All");

  const rate = config.exchangeRate || 93.5;

  // One-time migration
  useEffect(() => {
    if (config && !config.investments && ((config.sips && config.sips.length > 0) || (config.stocks && config.stocks.length > 0))) {
      const migrated = [
        ...(config.sips || []).map((s) => ({
          id: s.id || `sip-${Date.now()}-${Math.random()}`,
          name: s.name, type: "SIP", monthlyAmount: s.amountINR || 0, debitDate: s.date || 1,
        })),
        ...(config.stocks || []).map((s) => ({
          id: s.id || `st-${Date.now()}-${Math.random()}`,
          name: s.name, type: "Stock", quantity: s.qty || 0, buyPrice: s.buyPrice || 0,
        })),
      ];
      updateConfig((prev) => ({ ...prev, investments: migrated }));
    }
  }, [config, updateConfig]);

  const investments = config.investments || [];

  // Holdings = stocks + ETFs with value
  const holdings = useMemo(() =>
    investments
      .filter((i) => i.type === "Stock" || i.type === "ETF")
      .map((i) => ({ ...i, value: (i.quantity || 0) * (i.buyPrice || 0) }))
      .sort((a, b) => b.value - a.value),
    [investments]
  );
  const totalHoldings = holdings.reduce((s, h) => s + h.value, 0);

  // SIPs
  const sips = investments.filter((i) => i.type === "SIP");
  const sipTotal = sips.reduce((s, i) => s + (i.monthlyAmount || 0), 0);

  // Filtered list for table
  const tableData = useMemo(() => {
    const all = investments.map((i) => {
      if (i.type === "SIP") return { ...i, displayVal: i.monthlyAmount || 0, valCurrency: "INR", isSIP: true };
      if (i.type === "Stock" || i.type === "ETF") return { ...i, displayVal: (i.quantity || 0) * (i.buyPrice || 0), valCurrency: "INR", isSIP: false };
      return { ...i, displayVal: i.amount || 0, valCurrency: i.currency || "INR", isSIP: false };
    });
    if (filter === "All") return all;
    if (filter === "Stocks") return all.filter((i) => i.type === "Stock");
    if (filter === "SIPs") return all.filter((i) => i.type === "SIP");
    if (filter === "ETFs") return all.filter((i) => i.type === "ETF");
    return all;
  }, [investments, filter]);

  // Total portfolio (holdings + other non-SIP)
  const totalVal = totalHoldings + investments
    .filter((i) => !["SIP", "Stock", "ETF"].includes(i.type))
    .reduce((s, i) => s + ((i.currency === "USD" ? (i.amount || 0) * rate : (i.amount || 0))), 0);

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
    setEditId(inv.id); setShowAdd(true);
  };

  const save = () => {
    if (!form.name) return;
    const entry = {
      id: editId || `inv-${Date.now()}`, name: form.name, type: form.type,
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

  const tabs = ["All", "Stocks", "SIPs", "ETFs"];

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textMut, fontWeight: 700, letterSpacing: "2px", marginBottom: 6 }}>PORTFOLIO</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono'" }}>{fmt(totalVal, "INR")}</span>
            <span style={{ fontSize: 14, color: T.textMut, fontFamily: "'JetBrains Mono'" }}>{fmt(toUSD(totalVal, rate))}</span>
          </div>
        </div>
        <Btn onClick={openAdd}><Plus size={14} /> Add Investment</Btn>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setFilter(tab)} style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
            border: "none", fontFamily: "'DM Sans'", transition: "all .2s",
            background: filter === tab ? T.accent : "rgba(255,255,255,.05)",
            color: filter === tab ? "#030507" : T.textMut,
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* TREEMAP (holdings only) */}
      {holdings.length > 0 && (
        <div style={{ display: "flex", height: 160, borderRadius: 12, overflow: "hidden", marginBottom: 18, gap: 3 }}>
          {holdings.map((h) => {
            const pct = totalHoldings > 0 ? (h.value / totalHoldings) * 100 : 0;
            if (pct < 2) return null;
            const color = TYPE_COLORS[h.type] || T.textMut;
            return (
              <div key={h.id} style={{
                flex: `${pct} 0 0%`, background: color + "22", border: `1px solid ${color}33`,
                padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between",
                minWidth: pct > 15 ? 80 : 50, overflow: "hidden",
              }}>
                <div>
                  <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: "1px", marginBottom: 2 }}>{h.type.toUpperCase()}</div>
                  {pct > 15 && <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>}
                </div>
                <div>
                  {pct > 12 && <div style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono'" }}>{fmt(h.value, "INR")}</div>}
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: "'JetBrains Mono'" }}>{pct.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DATA TABLE */}
      <GC hover={false} style={{ marginBottom: 18, padding: "16px 20px" }}>
        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 70px 60px 1fr 60px 70px",
          gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.border}`, marginBottom: 4,
        }}>
          {["NAME", "TYPE", "QTY", "VALUE", "WEIGHT", ""].map((h) => (
            <span key={h} style={{ fontSize: 10, color: T.textMut, fontWeight: 700, letterSpacing: "1px" }}>{h}</span>
          ))}
        </div>

        {tableData.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: T.textMut, fontSize: 12 }}>
            {investments.length === 0 ? "No investments yet." : "No items match this filter."}
          </div>
        ) : (
          tableData.map((inv) => {
            const color = TYPE_COLORS[inv.type] || T.textMut;
            const weight = totalVal > 0 ? ((inv.displayVal / totalVal) * 100).toFixed(1) : "0";
            return (
              <div key={inv.id} style={{
                display: "grid", gridTemplateColumns: "2fr 70px 60px 1fr 60px 70px",
                gap: 8, padding: "10px 0", borderBottom: `1px solid ${T.border}`, alignItems: "center",
              }}>
                {/* Name */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{inv.name}</div>
                  {inv.isSIP && inv.debitDate && <div style={{ fontSize: 10, color: T.textMut }}>{inv.debitDate}th</div>}
                </div>
                {/* Type badge */}
                <span style={{
                  fontSize: 9, padding: "3px 8px", borderRadius: 20, fontWeight: 700, textAlign: "center",
                  background: color + "22", color, border: `1px solid ${color}44`, whiteSpace: "nowrap",
                }}>
                  {inv.type}
                </span>
                {/* Qty */}
                <span style={{ fontSize: 12, color: T.textMut, fontFamily: "'JetBrains Mono'" }}>
                  {inv.type === "SIP" ? "—" : (inv.quantity || inv.amount || "—")}
                </span>
                {/* Value */}
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'" }}>
                    {fmt(inv.displayVal, inv.valCurrency)}
                  </span>
                  {inv.isSIP && <span style={{ fontSize: 10, color: T.textMut }}>/mo</span>}
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: "'JetBrains Mono'" }}>
                    {inv.valCurrency === "INR" ? fmt(toUSD(inv.displayVal, rate)) : fmt(inv.displayVal * rate, "INR")}
                  </div>
                </div>
                {/* Weight */}
                <span style={{ fontSize: 11, color: T.textMut, fontFamily: "'JetBrains Mono'" }}>{weight}%</span>
                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(inv)} style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${T.border}`, cursor: "pointer", color: T.textSec, padding: 5, borderRadius: 6, display: "flex" }}>
                    <Edit3 size={11} />
                  </button>
                  <button onClick={() => remove(inv.id)} style={{ background: T.red + "12", border: `1px solid ${T.red}22`, cursor: "pointer", color: T.red, padding: 5, borderRadius: 6, display: "flex" }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </GC>

      {/* SIP STRIP */}
      {sips.length > 0 && (
        <GC hover={false} style={{ borderLeft: `3px solid #1D9E75`, paddingLeft: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RefreshCw size={14} color="#1D9E75" />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: "1px" }}>MONTHLY SIPs</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1D9E75", fontFamily: "'JetBrains Mono'" }}>
              {fmt(sipTotal, "INR")}<span style={{ fontSize: 10, color: T.textMut, fontWeight: 400 }}>/mo · {fmt(toUSD(sipTotal, rate))}</span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8 }}>
            {sips.map((s) => (
              <div key={s.id} style={{
                padding: "10px 14px", background: "rgba(255,255,255,.02)", borderRadius: 10,
                border: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.name}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'", marginTop: 4 }}>
                  {fmt(s.monthlyAmount || 0, "INR")}
                </div>
                <div style={{ fontSize: 10, color: T.textMut }}>{s.debitDate || 1}th of month</div>
              </div>
            ))}
          </div>
        </GC>
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
