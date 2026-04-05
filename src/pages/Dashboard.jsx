import { useState } from "react";
import { DollarSign, ArrowDownRight, PiggyBank, Users, Bell, RefreshCw, Check, Clock, Plus, Wallet, ChevronRight, AlertCircle } from "lucide-react";
import { T, PIE_COLORS, toINR, toUSD, fmt, daysUntil, MONTH_NAMES } from "../config/theme";
import { GC, Badge, Metric, Ctr, Modal, Btn, Inp } from "../components/ui";
import { ThreeDonut, ThreeScene, ArcReactor } from "../components/Charts";
import { Greeting } from "../components/Greeting";

// ── Check what's missing from setup ──
function getMissingSections(config) {
  const missing = [];
  if (!config.salary || config.salary === 0) missing.push("Salary");
  if (config.rent === undefined || config.rent === null) missing.push("Rent");
  if (!config.cards || config.cards.length === 0) missing.push("Credit Cards");
  if (!config.sips || config.sips.length === 0) missing.push("SIPs");
  if (!config.studentLoan || (!config.studentLoan.amountINR && config.studentLoan.amountINR !== 0)) missing.push("Student Loan");
  if (!config.subscriptions || config.subscriptions.length === 0) missing.push("Subscriptions");
  return missing;
}

export default function Dashboard({ config, updateConfig, expenses, updateExpenses, payments, updatePayments, lending, history, updateHistory, onSetup, userName }) {
  const rate = config.exchangeRate || 93.5;
  const sipUSD = config.sips.reduce((s, x) => s + toUSD(x.amountINR, rate), 0);
  const loanUSD = toUSD(config.studentLoan.amountINR, rate);
  const subsT = config.subscriptions.reduce((s, x) => s + x.amount, 0);
  const fixedT = config.rent + sipUSD + loanUSD + subsT;
  const varT = expenses.reduce((s, e) => s + (e.currency === "USD" ? e.amount : toUSD(e.amount, rate)), 0);
  const rem = config.salary - fixedT - varT;
  const sr = ((rem / Math.max(config.salary, 1)) * 100).toFixed(1);
  const pendL = lending.filter((l) => !l.settled);
  const lendT = pendL.reduce((s, l) => s + (l.currency === "USD" ? l.amount : toUSD(l.amount, rate)), 0);

  const pieSegs = [
    { name: "Rent", value: config.rent },
    { name: "SIPs", value: sipUSD },
    { name: "Loan", value: loanUSD },
    { name: "Subs", value: subsT },
    { name: "Spending", value: varT },
    { name: "Free", value: Math.max(0, rem) },
  ].filter((s) => s.value > 0);
  const totalPie = pieSegs.reduce((s, x) => s + x.value, 0);

  const alerts = [
    ...config.cards.map((c) => ({ label: c.name, days: daysUntil(c.dueDate) })),
    ...config.sips.map((s) => ({ label: s.name, days: daysUntil(s.date) })),
    config.studentLoan.amountINR > 0 ? { label: "Loan EMI", days: daysUntil(config.studentLoan.date) } : null,
  ].filter(Boolean).sort((a, b) => a.days - b.days);

  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showNewMonth, setShowNewMonth] = useState(false);
  const [budgetName, setBudgetName] = useState("");
  const [budgetAmt, setBudgetAmt] = useState("");
  const [budgetCur, setBudgetCur] = useState("USD");

  const toggle = (id) => updatePayments((p) => ({ ...p, [id]: !p[id] }));

  // Check what's incomplete
  const missingSections = getMissingSections(config);
  const setupIncomplete = missingSections.length > 0;

  const archive = () => {
    updateHistory((prev) => [
      ...prev,
      { month: MONTH_NAMES[new Date().getMonth()], spending: fixedT + varT, savings: rem, variable: varT },
    ].slice(-12));
    updateExpenses([]);
    updatePayments({});
    setShowNewMonth(false);
  };

  const addBudgetItem = () => {
    if (!budgetName || !budgetAmt) return;
    updateConfig((p) => ({
      ...p,
      customBudget: [...(p.customBudget || []), { id: Date.now(), name: budgetName, amount: parseFloat(budgetAmt), currency: budgetCur }],
    }));
    setBudgetName("");
    setBudgetAmt("");
    setShowAddBudget(false);
  };

  const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : "boss";

  return (
    <div>
      {/* SETUP INCOMPLETE — shows what's missing */}
      {setupIncomplete && (
        <div onClick={onSetup} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px",
          background: `linear-gradient(135deg,${T.yellow}08,${T.orange}05)`,
          border: `1px solid ${T.yellow}33`, borderRadius: 14, marginBottom: 18,
          cursor: "pointer", animation: "fadeUp .4s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: T.yellow + "18",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${T.yellow}33`,
            }}>
              <AlertCircle size={17} color={T.yellow} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                Setup incomplete, {displayName}
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>
                Missing: <span style={{ color: T.yellow, fontWeight: 600 }}>{missingSections.join(", ")}</span>
              </div>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>
                Tap to complete your setup for full tracking
              </div>
            </div>
          </div>
          <ChevronRight size={18} color={T.yellow} />
        </div>
      )}

      {/* GREETING */}
      <Greeting config={config} expenses={expenses} payments={payments} lending={lending} />

      {/* ALERTS + NEW MONTH */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <GC style={{ flex: "1 1 auto", padding: "14px 20px" }} hover={false}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <div style={{ animation: "pulse 2s infinite" }}><Bell size={13} color={T.yellow} /></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "1.5px", textTransform: "uppercase" }}>Upcoming</span>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {alerts.length === 0
              ? <span style={{ color: T.textMut, fontSize: 12 }}>All clear, boss</span>
              : alerts.slice(0, 6).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "8px 14px", minWidth: "fit-content", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: T.textSec, whiteSpace: "nowrap" }}>{a.label}</span>
                  <Badge days={a.days} />
                </div>
              ))}
          </div>
        </GC>
        <GC style={{ flexShrink: 0, padding: "14px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", cursor: "pointer", minWidth: 140 }} delay={0.05} onClick={() => setShowNewMonth(true)}>
          <RefreshCw size={18} color={T.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginTop: 6, letterSpacing: "1px" }}>NEW MONTH</span>
        </GC>
      </div>

      {/* NEW MONTH MODAL */}
      <Modal open={showNewMonth} onClose={() => setShowNewMonth(false)} title="New Month, boss?">
        <p style={{ color: T.textSec, fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
          Archive current month (spent: {fmt(fixedT + varT)}, saved: {fmt(rem)}). Lending carries over.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={archive} style={{ flex: 1, justifyContent: "center" }}><Check size={14} /> Archive</Btn>
          <Btn variant="ghost" onClick={() => setShowNewMonth(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
        </div>
      </Modal>

      {/* METRICS + ARC REACTOR */}
      <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Metric icon={DollarSign} label="Take Home" value={<Ctr value={config.salary} />} sub={fmt(toINR(config.salary, rate), "INR")} delay={0.04} />
          <Metric icon={ArrowDownRight} label="Outflow" value={<Ctr value={fixedT + varT} />} color={T.red} delay={0.08} />
          <Metric icon={PiggyBank} label="Remaining" value={<Ctr value={rem} />} sub={`${sr}% savings`} color={rem > 0 ? T.accent : T.red} delay={0.12} />
          <Metric icon={Users} label="Lent Out" value={<Ctr value={lendT} />} sub={`${pendL.length} pending`} color={T.yellow} delay={0.16} />
        </div>
        <ArcReactor config={config} expenses={expenses} payments={payments} lending={lending} />
      </div>

      {/* BUDGET ALLOCATION */}
      <GC delay={0.2} style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Budget Allocation</h3>
          <Btn small variant="ghost" onClick={() => setShowAddBudget(true)}><Plus size={13} /> Add</Btn>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 250px", minWidth: 210 }}><ThreeDonut segments={pieSegs} height={220} /></div>
          <div style={{ flex: "1 1 230px", minWidth: 190 }}>
            {pieSegs.map((d, i) => {
              const pct = totalPie > 0 ? ((d.value / totalPie) * 100).toFixed(1) : "0";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 7, marginBottom: 3, background: i % 2 === 0 ? "rgba(255,255,255,.02)" : "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ fontSize: 12, color: T.text }}>{d.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec, fontFamily: "'JetBrains Mono'" }}>{fmt(d.value)}</span>
                    <span style={{ fontSize: 10, color: T.textMut, fontFamily: "'JetBrains Mono'", minWidth: 32, textAlign: "right" }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GC>

      {/* ADD BUDGET MODAL */}
      <Modal open={showAddBudget} onClose={() => setShowAddBudget(false)} title="Add Budget Item">
        <Inp label="Name" value={budgetName} onChange={setBudgetName} placeholder="e.g. Crowdfunding" />
        <Inp label="Amount/mo" value={budgetAmt} onChange={setBudgetAmt} type="number" />
        <Inp label="Currency" value={budgetCur} onChange={setBudgetCur} options={[{ value: "USD", label: "USD" }, { value: "INR", label: "INR" }]} />
        <Btn onClick={addBudgetItem} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Add</Btn>
      </Modal>

      {/* MONTHLY ACTIONS */}
      <GC delay={0.24} style={{ marginBottom: 18 }}>
        <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Monthly Actions</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ...config.sips.map((s) => ({ id: `sip-${s.id}`, label: `${s.name} SIP`, amt: fmt(s.amountINR, "INR") })),
            config.studentLoan.amountINR > 0 ? { id: "loan", label: "Loan EMI", amt: fmt(config.studentLoan.amountINR, "INR") } : null,
            ...config.cards.map((c) => ({ id: `card-${c.id}`, label: `${c.name} Due`, amt: `${daysUntil(c.dueDate)}d` })),
          ].filter(Boolean).map((item) => {
            const paid = payments[item.id];
            return (
              <button key={item.id} onClick={() => toggle(item.id)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", background: paid ? T.accent + "0a" : "rgba(255,255,255,.02)",
                border: `1px solid ${paid ? T.accent + "33" : T.border}`,
                borderRadius: 10, cursor: "pointer", width: "100%", transition: "all .3s",
              }}>
                <span style={{ color: T.text, fontSize: 12, fontWeight: 500 }}>{item.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ color: T.textSec, fontSize: 11, fontFamily: "'JetBrains Mono'" }}>{item.amt}</span>
                  {paid ? <Check size={14} color={T.accent} /> : <Clock size={12} color={T.textMut} />}
                </div>
              </button>
            );
          })}
        </div>
      </GC>

      {/* 3D TREND */}
      <GC delay={0.28}>
        <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Spending — 3D</h3>
        {history.length > 0
          ? <ThreeScene data={history.map((h) => ({ label: h.month, value: h.spending }))} height={230} />
          : <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>Archive your first month to start tracking, boss</div>
        }
      </GC>
    </div>
  );
}