import { useState, useMemo } from "react";
import { Plus, Receipt, Trash2, ChevronDown, Calendar, Banknote } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { T, PIE_COLORS, toINR, toUSD, fmt, tipStyle, CATEGORIES, MONTH_NAMES } from "../config/theme";
import { GC, Ctr, Modal, Inp, Btn } from "../components/ui";

function getCurrentMonthTag() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(tag) {
  const [y, m] = tag.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

function getDaysInMonth(tag) {
  const [y, m] = tag.split("-");
  return new Date(parseInt(y), parseInt(m), 0).getDate();
}

// Build "clears" dropdown options from config
function getClearsOptions(config) {
  const opts = [{ value: "", label: "None (regular expense)" }];
  if (config.rent > 0) opts.push({ value: "rent", label: "Rent" });
  (config.cards || []).forEach((c) => opts.push({ value: `card-${c.id}`, label: c.name }));
  (config.sips || []).forEach((s) => opts.push({ value: `sip-${s.id}`, label: s.name }));
  if (config.studentLoan && config.studentLoan.amountINR > 0) {
    opts.push({ value: "loan", label: "Loan EMI" });
  }
  (config.subscriptions || []).forEach((s) => opts.push({ value: `sub-${s.id}`, label: s.name }));
  return opts;
}

export default function Expenses({ config, expenses, updateExpenses, history }) {
  const currentMonth = getCurrentMonthTag();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showAdd, setShowAdd] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [form, setForm] = useState({
    desc: "", amount: "", category: "Food",
    date: new Date().toISOString().split("T")[0],
    currency: "USD", clears: "", cashPayment: false,
  });

  const isCurrentMonth = selectedMonth === currentMonth;

  // Get all available months from expenses + history
  const availableMonths = useMemo(() => {
    const months = new Set();
    months.add(currentMonth);
    expenses.forEach((e) => {
      if (e.monthTag) months.add(e.monthTag);
    });
    (history || []).forEach((h) => {
      if (h.monthTag) months.add(h.monthTag);
    });
    return [...months].sort().reverse();
  }, [expenses, history, currentMonth]);

  // Filter expenses for selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.monthTag) return e.monthTag === selectedMonth;
      // Legacy expenses without monthTag show in current month
      return selectedMonth === currentMonth;
    });
  }, [expenses, selectedMonth, currentMonth]);

  const clearsOptions = getClearsOptions(config);

  const add = () => {
    if (!form.desc || !form.amount) return;
    updateExpenses((p) => [{
      desc: form.desc,
      amount: parseFloat(form.amount),
      currency: form.currency,
      category: form.category,
      date: form.date,
      clears: form.clears || null,
      cashPayment: form.cashPayment || false,
      id: Date.now(),
      monthTag: currentMonth,
    }, ...p]);
    setForm({
      desc: "", amount: "", category: "Food",
      date: new Date().toISOString().split("T")[0],
      currency: "USD", clears: "", cashPayment: false,
    });
    setShowAdd(false);
  };

  const total = monthExpenses.reduce((s, e) => s + (e.currency === "USD" ? e.amount : toUSD(e.amount, config.exchangeRate)), 0);
  const catData = CATEGORIES.map((c) => ({
    name: c,
    value: monthExpenses.filter((e) => e.category === c).reduce((s, e) => s + (e.currency === "USD" ? e.amount : toUSD(e.amount, config.exchangeRate)), 0),
  })).filter((c) => c.value > 0);

  // Cumulative spending chart data
  const cumulativeData = useMemo(() => {
    const daysCount = getDaysInMonth(selectedMonth);
    const sorted = [...monthExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));

    const dailyTotals = {};
    sorted.forEach((e) => {
      const day = new Date(e.date).getDate();
      const amt = e.currency === "USD" ? e.amount : toUSD(e.amount, config.exchangeRate);
      dailyTotals[day] = (dailyTotals[day] || 0) + amt;
    });

    const data = [];
    let cumulative = 0;
    for (let d = 1; d <= daysCount; d++) {
      cumulative += dailyTotals[d] || 0;
      data.push({ day: d, total: parseFloat(cumulative.toFixed(2)) });
    }
    return data;
  }, [monthExpenses, selectedMonth, config.exchangeRate]);

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: 0 }}>Expenses</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* MONTH DROPDOWN */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", background: "rgba(255,255,255,.04)",
                border: `1px solid ${T.border}`, borderRadius: 10,
                color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans'",
              }}
            >
              <Calendar size={14} color={T.accent} />
              {getMonthLabel(selectedMonth)}
              <ChevronDown size={14} color={T.textMut} />
            </button>
            {showMonthPicker && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 6, zIndex: 100,
                background: "rgba(12,16,24,0.95)", border: `1px solid ${T.border}`,
                borderRadius: 12, padding: 6, minWidth: 180,
                backdropFilter: "blur(16px)", boxShadow: "0 12px 40px rgba(0,0,0,.5)",
              }}>
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setSelectedMonth(m); setShowMonthPicker(false); }}
                    style={{
                      display: "block", width: "100%", padding: "8px 14px", textAlign: "left",
                      background: m === selectedMonth ? T.accent + "12" : "transparent",
                      border: "none", borderRadius: 8, cursor: "pointer",
                      color: m === selectedMonth ? T.accent : T.text,
                      fontSize: 12, fontWeight: m === selectedMonth ? 700 : 400,
                      fontFamily: "'DM Sans'",
                    }}
                  >
                    {getMonthLabel(m)}
                    {m === currentMonth && <span style={{ color: T.textMut, fontSize: 10, marginLeft: 6 }}>(current)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isCurrentMonth && (
            <Btn onClick={() => setShowAdd(true)}><Plus size={14} /> Quick Add</Btn>
          )}
        </div>
      </div>

      {!isCurrentMonth && (
        <div style={{
          padding: "10px 16px", background: T.yellow + "08", border: `1px solid ${T.yellow}22`,
          borderRadius: 10, marginBottom: 16, fontSize: 12, color: T.yellow, fontWeight: 600,
        }}>
          Viewing {getMonthLabel(selectedMonth)} — read-only archive
        </div>
      )}

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
        <GC style={{ flex: "1 1 320px" }} delay={0.04}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>By Category</h3>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke={T.bg} strokeWidth={3}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tipStyle} formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>No expenses yet</div>
          )}
        </GC>

        <GC style={{ flex: "1 1 180px" }} delay={0.08}>
          <div style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Total</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono'", marginTop: 8 }}><Ctr value={total} /></div>
          <div style={{ fontSize: 11, color: T.textMut, fontFamily: "'JetBrains Mono'", marginTop: 3 }}>{fmt(toINR(total, config.exchangeRate), "INR")}</div>
          <div style={{ marginTop: 16, fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Count</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'", marginTop: 8 }}>{monthExpenses.length}</div>
        </GC>
      </div>

      {/* EXPENSE LIST */}
      <GC hover={false} delay={0.12} style={{ marginBottom: 18 }}>
        {monthExpenses.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>Nothing here yet</div>
        ) : (
          monthExpenses.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${T.border}`, animation: `slideR .3s ease ${i * 0.03}s both` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,.03)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
                  <Receipt size={14} color={T.textSec} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                    {e.desc}
                    {e.clears && (
                      <span style={{
                        marginLeft: 8, fontSize: 9, padding: "2px 8px",
                        background: T.accent + "14", color: T.accent,
                        borderRadius: 20, fontWeight: 700, border: `1px solid ${T.accent}33`,
                      }}>
                        clears: {clearsOptions.find((o) => o.value === e.clears)?.label || e.clears}
                      </span>
                    )}
                    {e.cashPayment && (
                      <span style={{
                        marginLeft: 8, fontSize: 9, padding: "2px 8px",
                        background: T.orange + "14", color: T.orange,
                        borderRadius: 20, fontWeight: 700, border: `1px solid ${T.orange}33`,
                      }}>
                        CASH
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{e.category} · {e.date}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.red, fontFamily: "'JetBrains Mono'" }}>
                    {e.currency === "USD" ? fmt(e.amount) : fmt(e.amount, "INR")}
                  </div>
                </div>
                {isCurrentMonth && (
                  <button onClick={() => updateExpenses((p) => p.filter((x) => x.id !== e.id))} style={{ background: T.red + "12", border: `1px solid ${T.red}22`, cursor: "pointer", color: T.red, padding: 4, borderRadius: 6, display: "flex" }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </GC>

      {/* CUMULATIVE SPENDING CHART */}
      <GC delay={0.16}>
        <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>Spending Trend</h3>
        {monthExpenses.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="day" tick={{ fill: T.textMut, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMut, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                {...tipStyle}
                formatter={(v) => [fmt(v), "Total"]}
                labelFormatter={(l) => `Day ${l}`}
              />
              <Area type="monotone" dataKey="total" stroke={T.accent} strokeWidth={2} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ padding: 30, textAlign: "center", color: T.textMut, fontSize: 12 }}>
            <Receipt size={24} color={T.textMut} style={{ margin: "0 auto 8px", display: "block" }} />
            Add expenses to see your spending trend
          </div>
        )}
      </GC>

      {/* ADD MODAL */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Quick Add">
        <Inp label="What" value={form.desc} onChange={(v) => setForm((p) => ({ ...p, desc: v }))} placeholder="Coffee, Uber..." />
        <Inp label="Amount" value={form.amount} onChange={(v) => setForm((p) => ({ ...p, amount: v }))} type="number" />
        <Inp label="Currency" value={form.currency} onChange={(v) => setForm((p) => ({ ...p, currency: v }))} options={[{ value: "USD", label: "USD" }, { value: "INR", label: "INR" }]} />
        <Inp label="Category" value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} options={CATEGORIES} />
        <Inp label="Date" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} type="date" />
        <Inp label="Clears" value={form.clears} onChange={(v) => setForm((p) => ({ ...p, clears: v }))} options={clearsOptions} />

        {/* External cash toggle */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setForm((p) => ({ ...p, cashPayment: !p.cashPayment }))}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 14px", borderRadius: 9, cursor: "pointer",
              background: form.cashPayment ? T.orange + "12" : "rgba(255,255,255,.03)",
              border: `1px solid ${form.cashPayment ? T.orange + "44" : T.border}`,
              transition: "all .2s",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: form.cashPayment ? T.orange : "transparent",
              border: `2px solid ${form.cashPayment ? T.orange : T.textMut}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s",
            }}>
              {form.cashPayment && <div style={{ width: 8, height: 8, borderRadius: 2, background: "#fff" }} />}
            </div>
            <Banknote size={15} color={form.cashPayment ? T.orange : T.textMut} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: form.cashPayment ? T.orange : T.textSec, fontWeight: 600, fontFamily: "'DM Sans'" }}>External cash</div>
              <div style={{ fontSize: 10, color: T.textMut, fontFamily: "'DM Sans'" }}>Don't count toward salary</div>
            </div>
          </button>
        </div>

        <Btn onClick={add} style={{ width: "100%", justifyContent: "center" }}><Plus size={14} /> Add</Btn>
      </Modal>
    </div>
  );
}
