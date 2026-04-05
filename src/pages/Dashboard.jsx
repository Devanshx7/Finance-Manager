import { useState } from "react";
import { DollarSign, ArrowDownRight, PiggyBank, Users, Bell, RefreshCw, Check, ChevronRight, AlertCircle, AlertTriangle, Archive } from "lucide-react";
import { T, PIE_COLORS, toINR, toUSD, fmt, MONTH_NAMES } from "../config/theme";
import { GC, Metric, Ctr, Modal, Btn } from "../components/ui";
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

// ── Get current month tag like "2026-04" ──
function getCurrentMonthTag() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(tag) {
  const [y, m] = tag.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

// ── Build list of all upcoming dues from config ──
function getAllDues(config) {
  const dues = [];
  if (config.rent > 0) dues.push({ id: "rent", label: "Rent", amount: config.rent, currency: "USD" });
  (config.cards || []).forEach((c) => dues.push({ id: `card-${c.id}`, label: c.name, amount: null, currency: null }));
  (config.sips || []).forEach((s) => dues.push({ id: `sip-${s.id}`, label: s.name, amount: s.amountINR, currency: "INR" }));
  if (config.studentLoan && config.studentLoan.amountINR > 0) {
    dues.push({ id: "loan", label: "Loan EMI", amount: config.studentLoan.amountINR, currency: "INR" });
  }
  (config.subscriptions || []).forEach((s) => dues.push({ id: `sub-${s.id}`, label: s.name, amount: s.amount, currency: "USD" }));
  return dues;
}

export default function Dashboard({ config, expenses, updateExpenses, payments, updatePayments, lending, history, updateHistory, onSetup, userName }) {
  const rate = config.exchangeRate || 93.5;
  const currentMonth = getCurrentMonthTag();

  // Current month expenses only
  const monthExpenses = expenses.filter((e) => (e.monthTag || "") === currentMonth || (!e.monthTag));

  // Outflow = SUM of expenses logged this month ONLY
  const outflow = monthExpenses.reduce((s, e) => s + (e.currency === "USD" ? e.amount : toUSD(e.amount, rate)), 0);
  const remaining = config.salary - outflow;
  const sr = ((remaining / Math.max(config.salary, 1)) * 100).toFixed(1);

  const pendL = lending.filter((l) => !l.settled);
  const lendT = pendL.reduce((s, l) => s + (l.currency === "USD" ? l.amount : toUSD(l.amount, rate)), 0);

  // Cleared dues = expenses with a "clears" field this month
  const clearedDues = new Set(monthExpenses.filter((e) => e.clears).map((e) => e.clears));

  // All dues from config, filtered by what's NOT yet cleared
  const allDues = getAllDues(config);
  const upcomingDues = allDues.filter((d) => !clearedDues.has(d.id));

  // Budget Allocation pie = the PLAN (how salary should be distributed based on config)
  const sipUSD = (config.sips || []).reduce((s, x) => s + toUSD(x.amountINR, rate), 0);
  const loanUSD = config.studentLoan ? toUSD(config.studentLoan.amountINR, rate) : 0;
  const subsT = (config.subscriptions || []).reduce((s, x) => s + x.amount, 0);
  const investUSD = ((config.investments || []).reduce((s, inv) => {
    if (inv.type === "SIP") return s + toUSD(inv.monthlyAmount || 0, rate);
    return s;
  }, 0));
  const plannedFixed = config.rent + sipUSD + loanUSD + subsT + investUSD;
  const plannedFree = Math.max(0, config.salary - plannedFixed);

  const pieSegs = [
    { name: "Rent", value: config.rent },
    { name: "SIPs", value: sipUSD },
    { name: "Loan", value: loanUSD },
    { name: "Subs", value: subsT },
    ...(investUSD > 0 ? [{ name: "Investments", value: investUSD }] : []),
    { name: "Free", value: plannedFree },
  ].filter((s) => s.value > 0);
  const totalPie = pieSegs.reduce((s, x) => s + x.value, 0);

  const [showNewMonth, setShowNewMonth] = useState(false);
  const [showRecap, setShowRecap] = useState(false);

  const missingSections = getMissingSections(config);
  const setupIncomplete = missingSections.length > 0;

  // ── New Month: recap data ──
  const totalSpent = outflow;
  const totalSaved = remaining;
  const savingsRateNum = parseFloat(sr);
  const duesCleared = clearedDues.size;
  const duesTotal = allDues.length;
  const duesMissed = duesTotal - duesCleared;
  const txnCount = monthExpenses.length;

  // Top spending category
  const catTotals = {};
  monthExpenses.forEach((e) => {
    const cat = e.category || "Other";
    const amt = e.currency === "USD" ? e.amount : toUSD(e.amount, rate);
    catTotals[cat] = (catTotals[cat] || 0) + amt;
  });
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const handleNewMonth = () => {
    setShowNewMonth(true);
  };

  const confirmNewMonth = () => {
    setShowNewMonth(false);
    setShowRecap(true);
  };

  const archive = () => {
    // Archive to history
    updateHistory((prev) => [
      ...prev,
      {
        month: MONTH_NAMES[new Date().getMonth()],
        monthTag: currentMonth,
        spending: totalSpent,
        savings: totalSaved,
        savingsRate: savingsRateNum,
        duesCleared,
        duesMissed,
        topCategory: topCategory ? topCategory[0] : "N/A",
        txnCount,
        variable: totalSpent,
      },
    ].slice(-12));

    // Tag all current expenses with monthTag and archive them
    const taggedExpenses = monthExpenses.map((e) => ({ ...e, monthTag: currentMonth, archived: true }));

    // Keep archived expenses + clear current ones
    const archivedExpenses = expenses.filter((e) => e.archived);
    updateExpenses([...archivedExpenses, ...taggedExpenses]);

    updatePayments({});
    setShowRecap(false);
  };

  const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : "there";

  return (
    <div>
      {/* SETUP INCOMPLETE */}
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
            </div>
          </div>
          <ChevronRight size={18} color={T.yellow} />
        </div>
      )}

      {/* GREETING */}
      <Greeting config={config} expenses={monthExpenses} lending={lending} userName={userName} />

      {/* UPCOMING DUES + NEW MONTH */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <GC style={{ flex: "1 1 auto", padding: "14px 20px" }} hover={false}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <div style={{ animation: "pulse 2s infinite" }}><Bell size={13} color={T.yellow} /></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "1.5px", textTransform: "uppercase" }}>Upcoming Dues</span>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", flexWrap: "wrap" }}>
            {upcomingDues.length === 0
              ? <span style={{ color: T.accent, fontSize: 12, fontWeight: 600 }}>All dues cleared this month!</span>
              : upcomingDues.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "8px 14px", minWidth: "fit-content", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: T.textSec, whiteSpace: "nowrap" }}>{d.label}</span>
                  {d.amount && <span style={{ fontSize: 10, color: T.textMut, fontFamily: "'JetBrains Mono'" }}>{fmt(d.amount, d.currency)}</span>}
                </div>
              ))}
          </div>
        </GC>
        <GC style={{ flexShrink: 0, padding: "14px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", cursor: "pointer", minWidth: 140 }} delay={0.05} onClick={handleNewMonth}>
          <RefreshCw size={18} color={T.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginTop: 6, letterSpacing: "1px" }}>NEW MONTH</span>
        </GC>
      </div>

      {/* NEW MONTH CONFIRMATION */}
      <Modal open={showNewMonth} onClose={() => setShowNewMonth(false)} title="Start New Month?">
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.textSec, fontSize: 13 }}>Total Spent</span>
            <span style={{ color: T.red, fontWeight: 700, fontFamily: "'JetBrains Mono'", fontSize: 13 }}>{fmt(totalSpent)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.textSec, fontSize: 13 }}>Total Saved</span>
            <span style={{ color: T.accent, fontWeight: 700, fontFamily: "'JetBrains Mono'", fontSize: 13 }}>{fmt(totalSaved)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.textSec, fontSize: 13 }}>Savings Rate</span>
            <span style={{ color: savingsRateNum >= 20 ? T.accent : T.red, fontWeight: 700, fontFamily: "'JetBrains Mono'", fontSize: 13 }}>{sr}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.textSec, fontSize: 13 }}>Dues Cleared</span>
            <span style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{duesCleared} / {duesTotal}</span>
          </div>
          {topCategory && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.textSec, fontSize: 13 }}>Top Category</span>
              <span style={{ color: T.purple, fontWeight: 700, fontSize: 13 }}>{topCategory[0]} ({fmt(topCategory[1])})</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ color: T.textSec, fontSize: 13 }}>Transactions</span>
            <span style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{txnCount}</span>
          </div>
        </div>

        {duesMissed > 0 && (
          <div style={{
            padding: "12px 16px", background: T.yellow + "12", border: `1px solid ${T.yellow}33`,
            borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
          }}>
            <AlertTriangle size={16} color={T.yellow} />
            <span style={{ color: T.yellow, fontSize: 12, fontWeight: 600 }}>
              {duesMissed} due{duesMissed > 1 ? "s" : ""} not cleared this month
            </span>
          </div>
        )}

        <p style={{ color: T.textSec, fontSize: 12, lineHeight: 1.6, margin: "0 0 16px" }}>
          Archive <strong style={{ color: T.text }}>{getMonthLabel(currentMonth)}</strong> and start a fresh month? Lending carries over.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={confirmNewMonth} style={{ flex: 1, justifyContent: "center" }}><Archive size={14} /> Archive &amp; Start New</Btn>
          <Btn variant="ghost" onClick={() => setShowNewMonth(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
        </div>
      </Modal>

      {/* MONTH RECAP POPUP */}
      <Modal open={showRecap} onClose={() => setShowRecap(false)} title={`${getMonthLabel(currentMonth)} Recap`}>
        <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'" }}>{sr}%</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Savings Rate</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 14, textAlign: "center", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.red, fontFamily: "'JetBrains Mono'" }}>{fmt(totalSpent)}</div>
            <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>Spent</div>
          </div>
          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 14, textAlign: "center", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'" }}>{fmt(totalSaved)}</div>
            <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>Saved</div>
          </div>
          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 14, textAlign: "center", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{duesCleared}/{duesTotal}</div>
            <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>Dues Cleared</div>
          </div>
          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 14, textAlign: "center", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.purple }}>{txnCount}</div>
            <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>Transactions</div>
          </div>
        </div>
        {topCategory && (
          <div style={{ textAlign: "center", color: T.textSec, fontSize: 12, marginBottom: 16 }}>
            Top category: <span style={{ color: T.purple, fontWeight: 700 }}>{topCategory[0]}</span> at {fmt(topCategory[1])}
          </div>
        )}
        <Btn onClick={archive} style={{ width: "100%", justifyContent: "center" }}>
          <Check size={14} /> Confirm Archive
        </Btn>
      </Modal>

      {/* METRICS + ARC REACTOR */}
      <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Metric icon={DollarSign} label="Take Home" value={<Ctr value={config.salary} />} sub={fmt(toINR(config.salary, rate), "INR")} delay={0.04} />
          <Metric icon={ArrowDownRight} label="Outflow" value={<Ctr value={outflow} />} sub={outflow === 0 ? "No expenses yet" : undefined} color={T.red} delay={0.08} />
          <Metric icon={PiggyBank} label="Remaining" value={<Ctr value={remaining} />} sub={`${sr}% savings`} color={remaining > 0 ? T.accent : T.red} delay={0.12} />
          <Metric icon={Users} label="Lent Out" value={<Ctr value={lendT} />} sub={`${pendL.length} pending`} color={T.yellow} delay={0.16} />
        </div>
        <ArcReactor config={config} expenses={monthExpenses} payments={payments} lending={lending} />
      </div>

      {/* BUDGET ALLOCATION (PLAN — not actual spending) */}
      <GC delay={0.2} style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Budget Allocation</h3>
          <span style={{ fontSize: 10, color: T.textMut, fontStyle: "italic" }}>Planned distribution</span>
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

      {/* 3D TREND */}
      <GC delay={0.24}>
        <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Spending — 3D</h3>
        {history.length > 0
          ? <ThreeScene data={history.map((h) => ({ label: h.month, value: h.spending }))} height={230} />
          : <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>Archive your first month to start tracking</div>
        }
      </GC>
    </div>
  );
}
