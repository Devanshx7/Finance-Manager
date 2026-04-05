import { useState } from "react";
import { TrendingUp, BarChart3, Briefcase, Plus, Trash2 } from "lucide-react";
import { T, fmt, toUSD, daysUntil } from "../config/theme";
import { GC, Metric, Ctr, Badge, Modal, Inp, Btn } from "../components/ui";

export default function Investments({ config, updateConfig, crowdfunding, updateCF }) {
  const [showSIP, setShowSIP] = useState(false);
  const [showCF, setShowCF] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [sf, setSf] = useState({ name: "", amountINR: "", date: "" });
  const [cf2, setCf2] = useState({ name: "", amount: "", date: new Date().toISOString().split("T")[0] });
  const [stf, setStf] = useState({ name: "", qty: "", buyPrice: "" });

  const sipT = config.sips.reduce((s, x) => s + x.amountINR, 0);
  const cfT = crowdfunding.filter((c) => c.status === "active").reduce((s, c) => s + c.amount, 0);
  const stocks = config.stocks || [];
  const stockVal = stocks.reduce((s, x) => s + x.qty * x.buyPrice, 0);

  const addSIP = () => {
    if (!sf.name) return;
    updateConfig((p) => ({ ...p, sips: [...p.sips, { id: `sip-${Date.now()}`, name: sf.name, amountINR: parseFloat(sf.amountINR) || 0, date: parseInt(sf.date) || 1 }] }));
    setSf({ name: "", amountINR: "", date: "" });
    setShowSIP(false);
  };

  const addStock = () => {
    if (!stf.name) return;
    updateConfig((p) => ({ ...p, stocks: [...(p.stocks || []), { id: `st-${Date.now()}`, name: stf.name, qty: parseFloat(stf.qty) || 0, buyPrice: parseFloat(stf.buyPrice) || 0 }] }));
    setStf({ name: "", qty: "", buyPrice: "" });
    setShowStock(false);
  };

  const addCF = () => {
    if (!cf2.name) return;
    updateCF((p) => [...p, { ...cf2, id: Date.now(), amount: parseFloat(cf2.amount) || 0, status: "active" }]);
    setCf2({ name: "", amount: "", date: new Date().toISOString().split("T")[0] });
    setShowCF(false);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: "0 0 22px" }}>Investments</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Metric icon={TrendingUp} label="Monthly SIPs" value={fmt(sipT, "INR")} sub={fmt(toUSD(sipT, config.exchangeRate))} color={T.purple} delay={0.04} />
        <Metric icon={BarChart3} label="Stock Holdings" value={fmt(stockVal, "INR")} sub={`${stocks.length} stocks`} color={T.blue} delay={0.08} />
        <Metric icon={Briefcase} label="Crowdfunding" value={<Ctr value={cfT} />} color={T.orange} delay={0.12} />
      </div>

      {/* SIPs */}
      <GC delay={0.16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>SIP Portfolio</h3>
          <Btn small onClick={() => setShowSIP(true)}><Plus size={13} /> Add</Btn>
        </div>
        {config.sips.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.textMut, fontSize: 12 }}>No SIPs yet</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10 }}>
            {config.sips.map((sip) => (
              <div key={sip.id} className="c3d" style={{ background: "rgba(255,255,255,.02)", border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, position: "relative" }}>
                <button onClick={() => updateConfig((p) => ({ ...p, sips: p.sips.filter((s) => s.id !== sip.id) }))} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: T.textMut }}><Trash2 size={11} /></button>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>{sip.name}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'" }}>{fmt(sip.amountINR, "INR")}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: T.textMut }}>{sip.date}th</span>
                  <Badge days={daysUntil(sip.date)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </GC>

      {/* STOCKS */}
      <GC style={{ marginTop: 18 }} delay={0.2}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Stock Holdings</h3>
          <Btn small onClick={() => setShowStock(true)}><Plus size={13} /> Add</Btn>
        </div>
        {stocks.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.textMut, fontSize: 12 }}>No stocks</div>
        ) : (
          stocks.map((st) => (
            <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{st.name}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{st.qty} @ {fmt(st.buyPrice, "INR")}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.blue, fontFamily: "'JetBrains Mono'" }}>{fmt(st.qty * st.buyPrice, "INR")}</span>
                <button onClick={() => updateConfig((p) => ({ ...p, stocks: (p.stocks || []).filter((s) => s.id !== st.id) }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMut }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))
        )}
      </GC>

      {/* CROWDFUNDING */}
      <GC style={{ marginTop: 18 }} delay={0.24}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Crowdfunding</h3>
          <Btn small onClick={() => setShowCF(true)}><Plus size={13} /> Add</Btn>
        </div>
        {crowdfunding.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.textMut, fontSize: 12 }}>None yet</div>
        ) : (
          crowdfunding.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{c.date}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.orange, fontFamily: "'JetBrains Mono'" }}>{fmt(c.amount)}</span>
                <button onClick={() => updateCF((p) => p.filter((x) => x.id !== c.id))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMut }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))
        )}
      </GC>

      {/* MODALS */}
      <Modal open={showSIP} onClose={() => setShowSIP(false)} title="Add SIP">
        <Inp label="Fund" value={sf.name} onChange={(v) => setSf((p) => ({ ...p, name: v }))} placeholder="Nifty 50" />
        <Inp label="₹/month" value={sf.amountINR} onChange={(v) => setSf((p) => ({ ...p, amountINR: v }))} type="number" />
        <Inp label="Date" value={sf.date} onChange={(v) => setSf((p) => ({ ...p, date: v }))} type="number" placeholder="5" />
        <Btn onClick={addSIP} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Add</Btn>
      </Modal>

      <Modal open={showStock} onClose={() => setShowStock(false)} title="Add Stock">
        <Inp label="Stock" value={stf.name} onChange={(v) => setStf((p) => ({ ...p, name: v }))} placeholder="TCS" />
        <Inp label="Qty" value={stf.qty} onChange={(v) => setStf((p) => ({ ...p, qty: v }))} type="number" />
        <Inp label="Buy Price ₹" value={stf.buyPrice} onChange={(v) => setStf((p) => ({ ...p, buyPrice: v }))} type="number" />
        <Btn onClick={addStock} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Add</Btn>
      </Modal>

      <Modal open={showCF} onClose={() => setShowCF(false)} title="Add Crowdfunding">
        <Inp label="Name" value={cf2.name} onChange={(v) => setCf2((p) => ({ ...p, name: v }))} placeholder="Republic" />
        <Inp label="Amount $" value={cf2.amount} onChange={(v) => setCf2((p) => ({ ...p, amount: v }))} type="number" />
        <Inp label="Date" value={cf2.date} onChange={(v) => setCf2((p) => ({ ...p, date: v }))} type="date" />
        <Btn onClick={addCF} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Add</Btn>
      </Modal>
    </div>
  );
}