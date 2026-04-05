import { useState } from "react";
import { Wallet, Plus, Trash2, ChevronRight } from "lucide-react";
import { T } from "../config/theme";
import { GC, Inp, Btn } from "../components/ui";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState({
    salary: "", rent: "", exchangeRate: "83.5",
    cards: [], sips: [], stocks: [],
    studentLoan: { amountINR: "", date: "", totalRemaining: "" },
    subscriptions: [], customBudget: [],
  });
  const [lending, setLending] = useState([]);

  const uc = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  const addCard = () => uc("cards", [...cfg.cards, { id: `c${Date.now()}`, name: "", dueDate: "" }]);
  const addSIP = () => uc("sips", [...cfg.sips, { id: `s${Date.now()}`, name: "", amountINR: "", date: "" }]);
  const addStock = () => uc("stocks", [...cfg.stocks, { id: `st${Date.now()}`, name: "", qty: "", buyPrice: "" }]);
  const addSub = () => uc("subscriptions", [...cfg.subscriptions, { id: `sub${Date.now()}`, name: "", amount: "" }]);
  const addLend = () => setLending((p) => [...p, { id: `l${Date.now()}`, name: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0], delayType: "flexible" }]);

  const updateArr = (key, idx, field, val) => {
    const arr = key === "lending" ? [...lending] : [...cfg[key]];
    arr[idx] = { ...arr[idx], [field]: val };
    if (key === "lending") setLending(arr);
    else uc(key, arr);
  };

  const removeArr = (key, idx) => {
    if (key === "lending") setLending((p) => p.filter((_, i) => i !== idx));
    else uc(key, cfg[key].filter((_, i) => i !== idx));
  };

  const finish = () => {
    const sips = cfg.sips.filter((s) => s.name).map((s) => ({ ...s, amountINR: parseFloat(s.amountINR) || 0, date: parseInt(s.date) || 1 }));
    const stocks = cfg.stocks.filter((s) => s.name).map((s) => ({ ...s, qty: parseFloat(s.qty) || 0, buyPrice: parseFloat(s.buyPrice) || 0 }));

    // Build unified investments array from sips + stocks
    const investments = [
      ...sips.map((s) => ({
        id: s.id,
        name: s.name,
        type: "SIP",
        monthlyAmount: s.amountINR,
        debitDate: s.date,
      })),
      ...stocks.map((s) => ({
        id: s.id,
        name: s.name,
        type: "Stock",
        quantity: s.qty,
        buyPrice: s.buyPrice,
      })),
    ];

    const finalCfg = {
      salary: parseFloat(cfg.salary) || 0,
      rent: parseFloat(cfg.rent) || 0,
      exchangeRate: parseFloat(cfg.exchangeRate) || 83.5,
      cards: cfg.cards.filter((c) => c.name).map((c) => ({ ...c, dueDate: parseInt(c.dueDate) || 1 })),
      sips,
      stocks,
      investments,
      studentLoan: {
        amountINR: parseFloat(cfg.studentLoan.amountINR) || 0,
        date: parseInt(cfg.studentLoan.date) || 1,
        totalRemaining: parseFloat(cfg.studentLoan.totalRemaining) || 0,
      },
      subscriptions: cfg.subscriptions.filter((s) => s.name).map((s) => ({ ...s, amount: parseFloat(s.amount) || 0 })),
      customBudget: [],
    };
    const finalLending = lending.filter((l) => l.name).map((l) => ({ ...l, amount: parseFloat(l.amount) || 0, settled: false }));
    onComplete(finalCfg, finalLending);
  };

  const skipSetup = () => {
    onComplete({
      salary: 0, rent: 0, exchangeRate: 83.5, cards: [], sips: [], stocks: [],
      investments: [],
      studentLoan: { amountINR: 0, date: 1, totalRemaining: 0 },
      subscriptions: [], customBudget: [],
    }, []);
  };

  const steps = [
    { t: "Welcome", s: "Let's get your financial HQ ready, boss." },
    { t: "Income", s: "Monthly take-home." },
    { t: "Housing", s: "Rent or housing." },
    { t: "Cards", s: "Credit cards & due dates." },
    { t: "Investments", s: "SIPs and stocks." },
    { t: "Loans", s: "Active loans." },
    { t: "Subscriptions", s: "Recurring payments." },
    { t: "Lending", s: "Who owes you?" },
    { t: "Review", s: "Looking good, sir?" },
  ];

  const rowStyle = { display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10, animation: "slideR .3s ease" };

  return (
    <div style={{ height: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* PROGRESS BAR */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? T.accent : "rgba(255,255,255,0.06)", transition: "background .3s" }} />
          ))}
        </div>

        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 9, color: T.accent, fontWeight: 700, letterSpacing: "3px", fontFamily: "'JetBrains Mono'", marginBottom: 8 }}>
            STEP {step + 1}/{steps.length}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>{steps[step].t}</h1>
          <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>{steps[step].s}</p>
        </div>

        {/* CONTENT */}
        <GC hover={false} style={{ marginBottom: 24, minHeight: 180 }}>
          {step === 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: T.grad1, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 40px rgba(0,232,176,.2)" }}>
                <Wallet size={28} color="#030507" />
              </div>
              <p style={{ color: T.textSec, fontSize: 14, lineHeight: 1.6 }}>
                Vault — Your personal finance command center.<br />
                A few questions to get everything dialed in.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <Inp label="Monthly Salary (USD)" value={cfg.salary} onChange={(v) => uc("salary", v)} type="number" placeholder="e.g. 3000" />
              <Inp label="Exchange Rate (1 USD = ₹)" value={cfg.exchangeRate} onChange={(v) => uc("exchangeRate", v)} type="number" />
            </div>
          )}

          {step === 2 && <Inp label="Monthly Rent (USD)" value={cfg.rent} onChange={(v) => uc("rent", v)} type="number" placeholder="e.g. 625" />}

          {step === 3 && (
            <div>
              {cfg.cards.map((c, i) => (
                <div key={c.id} style={rowStyle}>
                  <div style={{ flex: 1 }}><Inp label="Card" value={c.name} onChange={(v) => updateArr("cards", i, "name", v)} placeholder="Discover" /></div>
                  <div style={{ width: 90 }}><Inp label="Due" value={c.dueDate} onChange={(v) => updateArr("cards", i, "dueDate", v)} type="number" placeholder="15" /></div>
                  <button onClick={() => removeArr("cards", i)} style={{ background: "none", border: "none", color: T.textMut, cursor: "pointer", padding: "0 0 16px" }}><Trash2 size={14} /></button>
                </div>
              ))}
              <Btn small variant="ghost" onClick={addCard}><Plus size={13} /> Add Card</Btn>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, marginBottom: 12, letterSpacing: "1px" }}>SIPs</div>
              {cfg.sips.map((s, i) => (
                <div key={s.id} style={{ ...rowStyle, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 100px" }}><Inp label="Fund" value={s.name} onChange={(v) => updateArr("sips", i, "name", v)} placeholder="Nifty 50" /></div>
                  <div style={{ width: 90 }}><Inp label="₹/mo" value={s.amountINR} onChange={(v) => updateArr("sips", i, "amountINR", v)} type="number" /></div>
                  <div style={{ width: 60 }}><Inp label="Date" value={s.date} onChange={(v) => updateArr("sips", i, "date", v)} type="number" /></div>
                  <button onClick={() => removeArr("sips", i)} style={{ background: "none", border: "none", color: T.textMut, cursor: "pointer", padding: "0 0 16px" }}><Trash2 size={14} /></button>
                </div>
              ))}
              <Btn small variant="ghost" onClick={addSIP} style={{ marginBottom: 16 }}><Plus size={13} /> Add SIP</Btn>

              <div style={{ fontSize: 12, color: T.purple, fontWeight: 700, marginBottom: 12, letterSpacing: "1px" }}>STOCKS</div>
              {cfg.stocks.map((s, i) => (
                <div key={s.id} style={{ ...rowStyle, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 80px" }}><Inp label="Stock" value={s.name} onChange={(v) => updateArr("stocks", i, "name", v)} placeholder="TCS" /></div>
                  <div style={{ width: 60 }}><Inp label="Qty" value={s.qty} onChange={(v) => updateArr("stocks", i, "qty", v)} type="number" /></div>
                  <div style={{ width: 80 }}><Inp label="Buy ₹" value={s.buyPrice} onChange={(v) => updateArr("stocks", i, "buyPrice", v)} type="number" /></div>
                  <button onClick={() => removeArr("stocks", i)} style={{ background: "none", border: "none", color: T.textMut, cursor: "pointer", padding: "0 0 16px" }}><Trash2 size={14} /></button>
                </div>
              ))}
              <Btn small variant="ghost" onClick={addStock}><Plus size={13} /> Add Stock</Btn>
            </div>
          )}

          {step === 5 && (
            <div>
              <Inp label="Monthly EMI (INR)" value={cfg.studentLoan.amountINR} onChange={(v) => setCfg((p) => ({ ...p, studentLoan: { ...p.studentLoan, amountINR: v } }))} type="number" placeholder="15000" />
              <Inp label="EMI Date" value={cfg.studentLoan.date} onChange={(v) => setCfg((p) => ({ ...p, studentLoan: { ...p.studentLoan, date: v } }))} type="number" placeholder="1" />
              <Inp label="Remaining (INR)" value={cfg.studentLoan.totalRemaining} onChange={(v) => setCfg((p) => ({ ...p, studentLoan: { ...p.studentLoan, totalRemaining: v } }))} type="number" placeholder="1500000" />
              <p style={{ color: T.textMut, fontSize: 11 }}>No loans? Skip ahead, boss.</p>
            </div>
          )}

          {step === 6 && (
            <div>
              {cfg.subscriptions.map((s, i) => (
                <div key={s.id} style={rowStyle}>
                  <div style={{ flex: 1 }}><Inp label="Name" value={s.name} onChange={(v) => updateArr("subscriptions", i, "name", v)} placeholder="Spotify" /></div>
                  <div style={{ width: 80 }}><Inp label="$/mo" value={s.amount} onChange={(v) => updateArr("subscriptions", i, "amount", v)} type="number" /></div>
                  <button onClick={() => removeArr("subscriptions", i)} style={{ background: "none", border: "none", color: T.textMut, cursor: "pointer", padding: "0 0 16px" }}><Trash2 size={14} /></button>
                </div>
              ))}
              <Btn small variant="ghost" onClick={addSub}><Plus size={13} /> Add</Btn>
            </div>
          )}

          {step === 7 && (
            <div>
              {lending.map((l, i) => (
                <div key={l.id} style={{ ...rowStyle, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 80px" }}><Inp label="Name" value={l.name} onChange={(v) => updateArr("lending", i, "name", v)} placeholder="Rahul" /></div>
                  <div style={{ width: 70 }}><Inp label="Amt" value={l.amount} onChange={(v) => updateArr("lending", i, "amount", v)} type="number" /></div>
                  <div style={{ width: 70 }}><Inp label="Cur" value={l.currency} onChange={(v) => updateArr("lending", i, "currency", v)} options={[{ value: "USD", label: "$" }, { value: "INR", label: "₹" }]} /></div>
                  <div style={{ width: 80 }}><Inp label="Type" value={l.delayType} onChange={(v) => updateArr("lending", i, "delayType", v)} options={[{ value: "flexible", label: "Flex" }, { value: "timed", label: "Timed" }]} /></div>
                  <button onClick={() => removeArr("lending", i)} style={{ background: "none", border: "none", color: T.textMut, cursor: "pointer", padding: "0 0 16px" }}><Trash2 size={14} /></button>
                </div>
              ))}
              <Btn small variant="ghost" onClick={addLend}><Plus size={13} /> Add</Btn>
            </div>
          )}

          {step === 8 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
              {[
                ["SALARY", `$${cfg.salary || "0"}/mo`],
                ["RENT", `$${cfg.rent || "0"}/mo`],
                ["CARDS", cfg.cards.filter((c) => c.name).length],
                ["SIPs", cfg.sips.filter((s) => s.name).length],
                ["STOCKS", cfg.stocks.filter((s) => s.name).length],
                ["LENDING", lending.filter((l) => l.name).length + " people"],
              ].map(([k, v], i) => (
                <div key={i} style={{ padding: 12, background: "rgba(255,255,255,.02)", borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ color: T.textMut, fontSize: 10, marginBottom: 4 }}>{k}</div>
                  <div style={{ color: T.text, fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </GC>

        {/* NAVIGATION */}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          {step > 0 ? <Btn variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Btn> : <div />}
          {step < 8
            ? <Btn onClick={() => setStep((s) => s + 1)}>Continue <ChevronRight size={15} /></Btn>
            : <Btn onClick={finish}>Launch Vault <ChevronRight size={15} /></Btn>
          }
        </div>

        {step === 0 && (
          <button onClick={skipSetup} style={{ display: "block", margin: "20px auto 0", background: "none", border: "none", color: T.textMut, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans'", textDecoration: "underline" }}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}