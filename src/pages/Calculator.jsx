import { useState } from "react";
import { T, fmt, toUSD } from "../config/theme";
import { GC, Inp, Btn } from "../components/ui";

export default function Calculator_({ config }) {
  const [inp, setInp] = useState("");
  const [res, setRes] = useState(null);
  const [convAmount, setConvAmount] = useState("");
  const [convDir, setConvDir] = useState("usd-inr");

  const calc = () => {
    try {
      setRes(new Function("return " + inp.replace(/[^0-9+\-*/.() ]/g, ""))());
    } catch {
      setRes("Error");
    }
  };

  const fixedTotal =
    config.rent +
    toUSD(config.sips.reduce((s, x) => s + x.amountINR, 0), config.exchangeRate) +
    toUSD(config.studentLoan.amountINR, config.exchangeRate) +
    config.subscriptions.reduce((s, x) => s + x.amount, 0);

  return (
    <div>
      <h2 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 21, fontWeight: 700, margin: "0 0 22px" }}>Calculator</h2>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {/* QUICK MATH */}
        <GC style={{ flex: "1 1 280px" }} delay={0.04}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>Quick Math</h3>
          <input
            value={inp}
            onChange={(e) => setInp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && calc()}
            placeholder="e.g. 3000 - 625"
            style={{
              width: "100%", padding: "13px 15px",
              background: "rgba(255,255,255,.03)",
              border: `1px solid ${T.border}`, borderRadius: 10,
              color: T.text, fontSize: 17, outline: "none",
              boxSizing: "border-box", fontFamily: "'JetBrains Mono'",
            }}
          />
          <Btn onClick={calc} style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>Calculate</Btn>
          {res !== null && (
            <div style={{ marginTop: 14, padding: 16, background: T.accent + "08", borderRadius: 10, border: `1px solid ${T.accent}22` }}>
              <div style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Result</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'", marginTop: 4 }}>
                {typeof res === "number" ? res.toLocaleString("en-US", { maximumFractionDigits: 2 }) : res}
              </div>
            </div>
          )}
        </GC>

        {/* CONVERTER */}
        <GC style={{ flex: "1 1 280px" }} delay={0.08}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>Converter</h3>
          <Inp label="Amount" value={convAmount} onChange={setConvAmount} type="number" placeholder="Amount" />
          <Inp label="Direction" value={convDir} onChange={setConvDir} options={[{ value: "usd-inr", label: "USD → INR" }, { value: "inr-usd", label: "INR → USD" }]} />
          {convAmount && (
            <div style={{ marginTop: 10, padding: 16, background: T.blue + "0a", borderRadius: 10, border: `1px solid ${T.blue}22` }}>
              <div style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>@ {config.exchangeRate}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: T.blue, fontFamily: "'JetBrains Mono'", marginTop: 4 }}>
                {convDir === "usd-inr"
                  ? fmt(parseFloat(convAmount) * config.exchangeRate, "INR")
                  : fmt(parseFloat(convAmount) / config.exchangeRate)}
              </div>
            </div>
          )}
        </GC>

        {/* WHAT-IF */}
        <GC style={{ flex: "1 1 280px" }} delay={0.12}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>What-If</h3>
          <div style={{ padding: 16, background: T.accent + "08", borderRadius: 10, border: `1px solid ${T.accent}22` }}>
            <div style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>After fixed costs</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono'", marginTop: 6 }}>
              {fmt(config.salary - fixedTotal)}
            </div>
            <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>
              Salary {fmt(config.salary)} − Fixed {fmt(fixedTotal)}
            </div>
          </div>
        </GC>
      </div>
    </div>
  );
}