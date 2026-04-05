import { useState } from "react";
import {
  LayoutDashboard, TrendingUp, HandCoins, Calculator, Settings,
  Receipt, Activity, FolderOpen, Users, Wallet, ChevronLeft, ChevronRight,
  LogOut,
} from "lucide-react";
import { T, APP_NAME } from "./config/theme";
import { useStore } from "./hooks/useStore";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Investments from "./pages/Investments";
import Lending from "./pages/Lending";
import SplitPage from "./pages/Split";
import Assignments from "./pages/Assignments";
import Analytics from "./pages/Analytics";
import Calculator_ from "./pages/Calculator";
import SettingsPage from "./pages/Settings";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "investments", label: "Investments", icon: TrendingUp },
  { id: "lending", label: "Lending", icon: HandCoins },
  { id: "split", label: "Split", icon: Users },
  { id: "assignments", label: "Assignments", icon: FolderOpen },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "settings", label: "Settings", icon: Settings },
];

// ── NAME LOGIN SCREEN ──
function NameLogin({ onLogin }) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem("vault:current_user", trimmed.toLowerCase());
    onLogin(trimmed.toLowerCase());
  };

  return (
    <div style={{
      height: "100vh", background: T.bg, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: T.grad1,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", boxShadow: "0 0 50px rgba(0,232,176,.25)",
        }}>
          <Wallet size={30} color="#030507" />
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: T.text, margin: "0 0 8px", letterSpacing: "-1px" }}>
          {APP_NAME}
        </h1>
        <p style={{ fontSize: 13, color: T.textSec, margin: "0 0 36px" }}>
          Financial HQ — Who's logging in?
        </p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter your name, boss"
          style={{
            width: "100%", padding: "16px 20px", background: "rgba(255,255,255,.04)",
            border: `1px solid ${T.border}`, borderRadius: 14, color: T.text,
            fontSize: 18, outline: "none", boxSizing: "border-box",
            fontFamily: "'DM Sans'", textAlign: "center", fontWeight: 600,
          }}
        />

        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "14px 20px", background: T.grad1,
            border: "none", borderRadius: 12, color: "#030507", fontSize: 14,
            fontWeight: 700, cursor: "pointer", marginTop: 16,
            fontFamily: "'DM Sans'", opacity: name.trim() ? 1 : 0.4, transition: "opacity .3s",
          }}
        >
          Enter Vault
        </button>

        <p style={{ fontSize: 10, color: T.textMut, marginTop: 20 }}>
          Each name gets its own data. Switch anytime.
        </p>
      </div>
    </div>
  );
}

// ── MAIN APP ──
function MainApp({ userName, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const prefix = `vault:${userName}`;

  const [config, updateConfig, cl] = useStore(`${prefix}:config`, null);
  const [expenses, updateExpenses, el] = useStore(`${prefix}:expenses`, []);
  const [lending, updateLending, ll] = useStore(`${prefix}:lending`, []);
  const [crowdfunding, updateCF, cfl] = useStore(`${prefix}:cf`, []);
  const [payments, updatePayments] = useStore(`${prefix}:payments`, {});
  const [history, updateHistory] = useStore(`${prefix}:history`, []);
  const [splits, updateSplits] = useStore(`${prefix}:splits`, { people: [], transactions: [] });
  const [assignments, updateAssignments] = useStore(`${prefix}:assignments`, []);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sb, setSb] = useState(true);

  const loaded = cl && el && ll && cfl;

  const handleComplete = (cfg, lend) => {
    updateConfig(cfg);
    if (lend.length > 0) updateLending(lend);
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("vault:current_user");
    onLogout();
  };

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg, fontFamily: "'DM Sans'" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: T.grad1, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "pulse 1.5s infinite" }}>
            <Wallet size={24} color="#030507" />
          </div>
          <div style={{ color: T.textSec, fontSize: 13 }}>Loading {APP_NAME}...</div>
        </div>
      </div>
    );
  }

  if (!config || showOnboarding) {
    return <Onboarding onComplete={handleComplete} />;
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard config={config} updateConfig={updateConfig} expenses={expenses} updateExpenses={updateExpenses} payments={payments} updatePayments={updatePayments} lending={lending} history={history} updateHistory={updateHistory} onSetup={() => setShowOnboarding(true)} userName={userName} />;
      case "expenses":
        return <Expenses config={config} expenses={expenses} updateExpenses={updateExpenses} />;
      case "investments":
        return <Investments config={config} updateConfig={updateConfig} crowdfunding={crowdfunding} updateCF={updateCF} />;
      case "lending":
        return <Lending config={config} lending={lending} updateLending={updateLending} />;
      case "split":
        return <SplitPage splits={splits} updateSplits={updateSplits} />;
      case "assignments":
        return <Assignments assignments={assignments} updateAssignments={updateAssignments} />;
      case "analytics":
        return <Analytics config={config} history={history} />;
      case "calculator":
        return <Calculator_ config={config} />;
      case "settings":
        return <SettingsPage config={config} updateConfig={updateConfig} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "'DM Sans',sans-serif", color: T.text, overflow: "hidden" }}>
      {/* SIDEBAR */}
      <div style={{
        width: sb ? 220 : 64, background: "rgba(8,12,20,.95)",
        borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column",
        transition: "width .3s cubic-bezier(.16,1,.3,1)", overflow: "hidden", flexShrink: 0,
      }}>
        {/* LOGO */}
        <div style={{ padding: sb ? "24px 20px 20px" : "24px 12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: T.grad1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 24px rgba(0,232,176,.18)" }}>
            <Wallet size={18} color="#030507" strokeWidth={2.5} />
          </div>
          {sb && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.1, letterSpacing: "-.5px" }}>{APP_NAME}</div>
              <div style={{ fontSize: 9, color: T.textMut, letterSpacing: "2px", textTransform: "uppercase" }}>Financial HQ</div>
            </div>
          )}
        </div>

        {/* USER BADGE */}
        <div style={{ padding: sb ? "12px 20px" : "12px 8px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: sb ? "space-between" : "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: T.accent + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: T.accent, textTransform: "uppercase",
              border: `1px solid ${T.accent}33`,
            }}>
              {userName[0]}
            </div>
            {sb && <span style={{ fontSize: 12, color: T.text, fontWeight: 600, textTransform: "capitalize" }}>{userName}</span>}
          </div>
          {sb && (
            <button
              onClick={handleLogout}
              title="Switch user"
              style={{
                background: "rgba(255,255,255,.04)", border: `1px solid ${T.border}`,
                borderRadius: 7, padding: 5, cursor: "pointer", color: T.textMut,
                display: "flex", transition: "all .2s",
              }}
            >
              <LogOut size={13} />
            </button>
          )}
        </div>

        {/* NAV */}
        <nav style={{ flex: 1, padding: "10px 8px", overflow: "auto" }}>
          {navItems.map((item) => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} className={`ni ${active ? "act" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%",
                  padding: sb ? "9px 14px" : "9px 0", justifyContent: sb ? "flex-start" : "center",
                  background: active ? "rgba(0,232,176,.06)" : "transparent",
                  border: "none", borderRadius: 9, cursor: "pointer",
                  color: active ? T.accent : T.textSec,
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  fontFamily: "'DM Sans'", marginBottom: 1,
                }}>
                <item.icon size={16} />{sb && item.label}
              </button>
            );
          })}
        </nav>

        {/* STATUS */}
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, animation: "pulse 2s infinite" }} />
            {sb && <span style={{ fontSize: 9, color: T.textMut }}>Auto-saving</span>}
          </div>
        </div>

        <button onClick={() => setSb(!sb)} style={{ padding: 12, border: "none", borderTop: `1px solid ${T.border}`, background: "transparent", color: T.textMut, cursor: "pointer", display: "flex", justifyContent: "center" }}>
          {sb ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>{renderPage()}</div>
      </div>
    </div>
  );
}

// ── ROOT ──
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem("vault:current_user") || null;
  });

  if (!currentUser) {
    return <NameLogin onLogin={setCurrentUser} />;
  }

  return <MainApp userName={currentUser} onLogout={() => setCurrentUser(null)} />;
}