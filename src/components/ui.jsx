import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { T } from "../config/theme";

// ── Glass Card ──
export function GC({ children, style, delay = 0, hover = true }) {
  return (
    <div
      className={`glass ${hover ? "c3d" : ""}`}
      style={{
        borderRadius: 16,
        padding: 22,
        animation: `fadeUp .5s ease ${delay}s both`,
        boxShadow: "0 0 30px rgba(0,232,176,.03)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Badge ──
export function Badge({ days }) {
  const c = days <= 2 ? T.red : days <= 5 ? T.yellow : T.accent;
  return (
    <span
      style={{
        background: c + "18",
        color: c,
        padding: "3px 11px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        border: `1px solid ${c}33`,
      }}
    >
      {days === 0 ? "TODAY" : days === 1 ? "TMR" : `${days}d`}
    </span>
  );
}

// ── Metric Card ──
// eslint-disable-next-line no-unused-vars
export function Metric({ icon: Ic, label, value, sub, color = T.accent, delay = 0 }) {
  return (
    <GC style={{ flex: "1 1 195px", minWidth: 180 }} delay={delay}>
      <div
        style={{
          background: color + "14",
          borderRadius: 11,
          padding: 9,
          display: "inline-flex",
          border: `1px solid ${color}22`,
        }}
      >
        <Ic size={17} color={color} />
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 24,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-1px",
          fontFamily: "'JetBrains Mono'",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 11, color: T.textMut, marginTop: 2, fontFamily: "'JetBrains Mono'" }}>
          {sub}
        </div>
      )}
    </GC>
  );
}

// ── Animated Counter ──
export function Ctr({ value, prefix = "$" }) {
  const [d, setD] = useState(0);
  const rf = useRef();

  useEffect(() => {
    let s = 0;
    const end = typeof value === "number" ? value : 0;
    const step = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / 1000, 1);
      setD((1 - Math.pow(1 - p, 3)) * end);
      if (p < 1) rf.current = requestAnimationFrame(step);
    };
    rf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rf.current);
  }, [value]);

  return (
    <span>
      {prefix}
      {d.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

// ── Modal ──
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.8)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          borderRadius: 18,
          padding: 28,
          width: "92%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflow: "auto",
          animation: "fadeUp .25s ease",
          boxShadow: "0 30px 80px rgba(0,0,0,.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h3 style={{ fontFamily: "'DM Sans'", color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "none",
              color: T.textSec,
              cursor: "pointer",
              borderRadius: 9,
              padding: 7,
              display: "flex",
            }}
          >
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Input ──
export function Inp({ label, value, onChange, type = "text", options, placeholder }) {
  const s = {
    width: "100%",
    padding: "11px 15px",
    background: "rgba(255,255,255,.04)",
    border: `1px solid ${T.border}`,
    borderRadius: 9,
    color: T.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'DM Sans'",
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 10,
          color: T.textSec,
          marginBottom: 5,
          fontWeight: 600,
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...s, cursor: "pointer" }}>
          {options.map((o) => (
            <option key={o.value || o} value={o.value || o}>
              {o.label || o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={s}
        />
      )}
    </div>
  );
}

// ── Button ──
export function Btn({ children, onClick, variant = "primary", small, style: sx }) {
  const variants = {
    primary: { background: T.grad1, color: "#030507" },
    danger: { background: T.red + "22", color: T.red, border: `1px solid ${T.red}33` },
    ghost: { background: "rgba(255,255,255,.04)", color: T.textSec, border: `1px solid ${T.border}` },
    success: { background: T.accent + "18", color: T.accent, border: `1px solid ${T.accent}33` },
  };
  const v = variants[variant];

  return (
    <button
      onClick={onClick}
      style={{
        ...v,
        border: v.border || "none",
        borderRadius: 9,
        padding: small ? "6px 14px" : "11px 22px",
        fontSize: small ? 11 : 13,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 700,
        fontFamily: "'DM Sans'",
        transition: "all .3s",
        ...sx,
      }}
    >
      {children}
    </button>
  );
}