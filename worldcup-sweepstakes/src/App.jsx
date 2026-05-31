import { useState, useEffect } from "react";

const TEAMS_2026 = [
  { name: "France",      flag: "🇫🇷", group: "Europe",        fifaRank: 1  },
  { name: "Spain",       flag: "🇪🇸", group: "Europe",        fifaRank: 2  },
  { name: "Argentina",   flag: "🇦🇷", group: "South America", fifaRank: 3  },
  { name: "England",     flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "Europe",        fifaRank: 4  },
  { name: "Portugal",    flag: "🇵🇹", group: "Europe",        fifaRank: 5  },
  { name: "Brazil",      flag: "🇧🇷", group: "South America", fifaRank: 6  },
  { name: "Netherlands", flag: "🇳🇱", group: "Europe",        fifaRank: 7  },
  { name: "Morocco",     flag: "🇲🇦", group: "Africa",        fifaRank: 8  },
  { name: "Belgium",     flag: "🇧🇪", group: "Europe",        fifaRank: 9  },
  { name: "Germany",     flag: "🇩🇪", group: "Europe",        fifaRank: 10 },
  { name: "Croatia",     flag: "🇭🇷", group: "Europe",        fifaRank: 11 },
  { name: "Colombia",    flag: "🇨🇴", group: "South America", fifaRank: 13 },
];

const CURRENCY = "£";
const BASE_PRICE = 10;
const STORAGE_KEY = "wc2026_sweepstakes";

const COLORS = [
  "#e63946", "#2a9d8f", "#e9c46a", "#f4a261", "#264653",
  "#6a4c93", "#1982c4", "#ff595e", "#6a994e", "#bc4749",
  "#e76f51", "#457b9d",
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(players, assignments, manualMode) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, assignments, manualMode }));
  } catch {}
}

// ── Small reusable components ──────────────────────────────────────────────

function Icon({ name, size = 24, style = {} }) {
  return (
    <span className="material-symbols-rounded" style={{ fontSize: size, ...style }}>
      {name}
    </span>
  );
}

function BtnInner({ icon, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <Icon name={icon} size={20} />
      {label}
    </span>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={icon} size={22} style={{ color: "#c9a84c" }} />
        <h2 style={{ margin: 0, fontSize: 22, letterSpacing: -0.3, color: "#f0ead6", fontFamily: "Georgia, serif" }}>{title}</h2>
      </div>
      {subtitle && (
        <p style={{ margin: "4px 0 0 30px", color: "rgba(240,234,214,0.5)", fontStyle: "italic", fontSize: 13, fontFamily: "sans-serif" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontFamily: "sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(240,234,214,0.5)", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function bigBtn(bg, color) {
  return {
    width: "100%", background: bg, border: "none",
    color, padding: "15px 20px", borderRadius: 12,
    cursor: "pointer", fontFamily: "sans-serif",
    fontWeight: 700, fontSize: 15, letterSpacing: 0.3,
    transition: "all 0.15s", display: "block",
  };
}

const roundBtn = {
  width: 40, height: 40, borderRadius: "50%",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(240,234,214,0.15)",
  color: "#f0ead6", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all 0.15s",
};

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const saved = loadState();

  const [view, setView]               = useState(saved?.assignments ? "results" : "home");
  const [players, setPlayersRaw]      = useState(saved?.players      ?? []);
  const [assignments, setAssignmentsRaw] = useState(saved?.assignments ?? null);
  const [manualMode, setManualModeRaw]   = useState(saved?.manualMode  ?? false);
  const [newName, setNewName]         = useState("");
  const [newTeams, setNewTeams]       = useState(1);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [toast, setToast]             = useState(null);

  // Persist to localStorage whenever core state changes
  useEffect(() => {
    saveState(players, assignments, manualMode);
  }, [players, assignments, manualMode]);

  const setPlayers     = (v) => setPlayersRaw(typeof v === "function" ? v : () => v);
  const setAssignments = (v) => setAssignmentsRaw(v);
  const setManualMode  = (v) => setManualModeRaw(v);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const totalSlots = players.reduce((s, p) => s + p.teams, 0);
  const totalPot   = players.reduce((s, p) => s + p.teams * BASE_PRICE, 0);

  const addPlayer = () => {
    const name = newName.trim();
    if (!name) return;
    if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      showToast("Name already taken!", "error"); return;
    }
    const color = COLORS[players.length % COLORS.length];
    setPlayers(prev => [...prev, { name, teams: newTeams, color }]);
    setNewName(""); setNewTeams(1);
    showToast(`${name} added!`);
  };

  const removePlayer = (name) => {
    setPlayers(prev => prev.filter(p => p.name !== name));
    if (assignments) {
      const a = { ...assignments };
      delete a[name];
      setAssignments(Object.keys(a).length ? a : null);
    }
  };

  const saveEdit = () => {
    if (!editingPlayer) return;
    setPlayers(prev => prev.map(p =>
      p.name === editingPlayer.name ? { ...p, teams: editingPlayer.teams } : p
    ));
    setEditingPlayer(null);
    showToast("Player updated!");
  };

  const doDraw = () => {
    if (players.length === 0) { showToast("Add players first!", "error"); return; }
    if (totalSlots > TEAMS_2026.length) { showToast(`Max ${TEAMS_2026.length} slots!`, "error"); return; }
    const shuffled = shuffle(TEAMS_2026).slice(0, totalSlots);
    const result = {};
    let idx = 0;
    for (const p of shuffle([...players])) {
      result[p.name] = shuffled.slice(idx, idx + p.teams);
      idx += p.teams;
    }
    setAssignments(result);
    setManualMode(false);
    setView("results");
    showToast("Teams drawn!");
  };

  const initManual = () => {
    if (players.length === 0) { showToast("Add players first!", "error"); return; }
    const a = {};
    for (const p of players) a[p.name] = Array(p.teams).fill(null);
    setAssignments(a);
    setManualMode(true);
    setView("results");
  };

  const manualAssign = (playerName, teamName, slot) => {
    const team = TEAMS_2026.find(t => t.name === teamName);
    if (!team) return;
    const a = { ...assignments };
    const arr = [...(a[playerName] || [])];
    arr[slot] = team;
    a[playerName] = arr;
    setAssignments(a);
  };

  const clearAll = () => {
    setPlayersRaw([]);
    setAssignmentsRaw(null);
    setManualModeRaw(false);
    localStorage.removeItem(STORAGE_KEY);
    setView("home");
    showToast("Everything cleared!");
  };

  const assignedTeamNames = assignments
    ? Object.values(assignments).flat().filter(Boolean).map(t => t.name)
    : [];

  const tabs = [
    { id: "home",    icon: "home",          label: "Home"    },
    { id: "manage",  icon: "group",         label: "Players" },
    { id: "draw",    icon: "casino",        label: "Draw"    },
    ...(assignments ? [{ id: "results", icon: "emoji_events", label: "Results" }] : []),
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0e1a",
      fontFamily: "Georgia, serif",
      color: "#f0ead6",
      backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(16,45,90,0.6) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(180,30,40,0.25) 0%, transparent 50%)
      `,
      display: "flex",
      flexDirection: "column",
      paddingBottom: "calc(72px + env(safe-area-inset-bottom))",
    }}>

      {/* ── Header ────────────────────────────────────────── */}
      <header style={{
        borderBottom: "1px solid rgba(240,234,214,0.12)",
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 10,
        backdropFilter: "blur(8px)",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,14,26,0.9)",
      }}>
        <Icon name="emoji_events" size={26} style={{ color: "#c9a84c" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#c9a84c", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>World Cup</div>
          <div style={{ fontSize: 17, letterSpacing: 0.5, fontStyle: "italic", lineHeight: 1.1 }}>2026 Sweepstakes</div>
        </div>
        {totalPot > 0 && (
          <div style={{
            background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 20, padding: "4px 12px",
            fontFamily: "sans-serif", fontSize: 13, fontWeight: 700, color: "#c9a84c",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Icon name="payments" size={15} style={{ color: "#c9a84c" }} />
            {CURRENCY}{totalPot} pot
          </div>
        )}
      </header>

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", top: 70, left: "50%",
          animation: "fadeInDown 0.2s ease",
          zIndex: 999,
          background: toast.type === "error" ? "#7f1d1d" : "#14532d",
          border: `1px solid ${toast.type === "error" ? "#ef4444" : "#22c55e"}`,
          color: "#fff", padding: "10px 20px", borderRadius: 20,
          fontFamily: "sans-serif", fontSize: 14,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon name={toast.type === "error" ? "error" : "check_circle"} size={18} />
          {toast.msg}
        </div>
      )}

      {/* ── Main ──────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "20px 16px", maxWidth: 600, width: "100%", margin: "0 auto" }}>

        {/* HOME */}
        {view === "home" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <Icon name="sports_soccer" size={56} style={{ color: "#c9a84c", display: "block", margin: "0 auto 8px" }} />
              <h1 style={{
                fontSize: 28, margin: 0, letterSpacing: -0.5,
                background: "linear-gradient(135deg, #c9a84c, #f0ead6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>FIFA World Cup 2026</h1>
              <p style={{ color: "rgba(240,234,214,0.55)", marginTop: 6, fontSize: 14, fontStyle: "italic" }}>
                USA · Canada · Mexico — June 11 – July 19
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { icon: "group",               label: "Players", value: players.length },
                { icon: "confirmation_number", label: "Slots",   value: `${totalSlots}/${TEAMS_2026.length}` },
                { icon: "payments",            label: "Pot",     value: `${CURRENCY}${totalPot}` },
              ].map(c => (
                <div key={c.label} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(240,234,214,0.1)",
                  borderRadius: 12, padding: "16px 10px", textAlign: "center",
                }}>
                  <Icon name={c.icon} size={26} style={{ color: "#c9a84c", display: "block", margin: "0 auto 6px" }} />
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#c9a84c", fontFamily: "sans-serif" }}>{c.value}</div>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", color: "rgba(240,234,214,0.45)", marginTop: 2 }}>{c.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setView("manage")} style={bigBtn("#c9a84c", "#0a0e1a")}>
                <BtnInner icon="group_add" label="Add Players" />
              </button>
              {players.length > 0 && (
                <button onClick={() => setView("draw")} style={bigBtn("#2a9d8f", "#fff")}>
                  <BtnInner icon="casino" label="Go to Draw" />
                </button>
              )}
              {assignments && (
                <button onClick={() => setView("results")} style={bigBtn("rgba(255,255,255,0.08)", "#f0ead6")}>
                  <BtnInner icon="emoji_events" label="View Results" />
                </button>
              )}
            </div>

            <div style={{ marginTop: 24, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(240,234,214,0.08)", borderRadius: 12, fontFamily: "sans-serif", fontSize: 12, color: "rgba(240,234,214,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="info" size={15} style={{ color: "rgba(240,234,214,0.3)", flexShrink: 0 }} />
              {CURRENCY}{BASE_PRICE} per team · Top 12 FIFA ranked nations
            </div>
          </div>
        )}

        {/* PLAYERS */}
        {view === "manage" && (
          <div>
            <SectionTitle icon="group" title="Players" subtitle="Add everyone joining the sweepstakes" />

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(240,234,214,0.12)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <Label>Player Name</Label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPlayer()}
                placeholder="Enter name..."
                style={{
                  width: "100%", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(240,234,214,0.15)",
                  borderRadius: 10, padding: "12px 14px",
                  color: "#f0ead6", fontFamily: "sans-serif", fontSize: 16,
                  marginBottom: 14,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <Label>Number of Teams</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setNewTeams(t => Math.max(1, t - 1))} style={roundBtn}>
                    <Icon name="remove" size={20} />
                  </button>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "sans-serif", fontSize: 22, fontWeight: 700, color: "#c9a84c", lineHeight: 1 }}>{newTeams}</div>
                    <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "rgba(240,234,214,0.4)", marginTop: 2 }}>{CURRENCY}{newTeams * BASE_PRICE}</div>
                  </div>
                  <button onClick={() => setNewTeams(t => Math.min(10, t + 1))} style={roundBtn}>
                    <Icon name="add" size={20} />
                  </button>
                </div>
              </div>
              <button onClick={addPlayer} style={bigBtn("#c9a84c", "#0a0e1a")}>
                <BtnInner icon="person_add" label="Add Player" />
              </button>
            </div>

            {players.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(240,234,214,0.3)", fontStyle: "italic", fontFamily: "sans-serif", fontSize: 14 }}>
                No players yet — add the first one above!
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {players.map(p => {
                    const isEditing = editingPlayer?.name === p.name;
                    return (
                      <div key={p.name} style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${isEditing ? "rgba(201,168,76,0.4)" : "rgba(240,234,214,0.1)"}`,
                        borderLeft: `4px solid ${p.color}`,
                        borderRadius: 12, padding: "12px 14px",
                        transition: "border-color 0.2s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                            background: p.color, display: "flex", alignItems: "center",
                            justifyContent: "center", fontFamily: "sans-serif", fontWeight: 700, fontSize: 16, color: "#fff",
                          }}>{p.name[0].toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                            <div style={{ fontSize: 12, fontFamily: "sans-serif", color: "rgba(240,234,214,0.5)", marginTop: 2 }}>
                              {p.teams} team{p.teams > 1 ? "s" : ""} · {CURRENCY}{p.teams * BASE_PRICE}
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingPlayer(isEditing ? null : { name: p.name, teams: p.teams })}
                            style={{
                              background: isEditing ? "rgba(201,168,76,0.15)" : "transparent",
                              border: `1px solid ${isEditing ? "rgba(201,168,76,0.4)" : "rgba(240,234,214,0.2)"}`,
                              color: isEditing ? "#c9a84c" : "rgba(240,234,214,0.6)",
                              borderRadius: 8, padding: "6px 10px", cursor: "pointer", flexShrink: 0,
                              display: "flex", alignItems: "center",
                            }}>
                            <Icon name="edit" size={16} />
                          </button>
                          <button onClick={() => removePlayer(p.name)} style={{
                            background: "transparent", border: "1px solid rgba(239,68,68,0.35)",
                            color: "rgba(239,68,68,0.7)", borderRadius: 8, padding: "6px 10px",
                            cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center",
                          }}>
                            <Icon name="delete" size={16} />
                          </button>
                        </div>

                        {isEditing && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(240,234,214,0.1)" }}>
                            <div style={{ fontFamily: "sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(240,234,214,0.5)", marginBottom: 10 }}>
                              Number of Teams
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                              <button onClick={() => setEditingPlayer(e => ({ ...e, teams: Math.max(1, e.teams - 1) }))} style={roundBtn}>
                                <Icon name="remove" size={20} />
                              </button>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontFamily: "sans-serif", fontSize: 26, fontWeight: 700, color: "#c9a84c", lineHeight: 1 }}>{editingPlayer.teams}</div>
                                <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "rgba(240,234,214,0.4)", marginTop: 2 }}>{CURRENCY}{editingPlayer.teams * BASE_PRICE}</div>
                              </div>
                              <button onClick={() => setEditingPlayer(e => ({ ...e, teams: Math.min(10, e.teams + 1) }))} style={roundBtn}>
                                <Icon name="add" size={20} />
                              </button>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={saveEdit} style={{ ...bigBtn("#c9a84c", "#0a0e1a"), flex: 1 }}>
                                <BtnInner icon="check" label="Save" />
                              </button>
                              <button onClick={() => setEditingPlayer(null)} style={{ ...bigBtn("rgba(255,255,255,0.07)", "#f0ead6"), flex: 1, border: "1px solid rgba(240,234,214,0.15)" }}>
                                <BtnInner icon="close" label="Cancel" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  marginTop: 12, padding: "10px 14px",
                  background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: 10, fontFamily: "sans-serif", fontSize: 13, color: "#c9a84c",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name="group" size={15} />
                    {players.length} player{players.length !== 1 ? "s" : ""} · {totalSlots} slots
                  </span>
                  <strong style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="payments" size={15} />
                    {CURRENCY}{totalPot} pot
                  </strong>
                </div>

                <button onClick={clearAll} style={{ ...bigBtn("transparent", "rgba(239,68,68,0.7)"), border: "1px solid rgba(239,68,68,0.25)", marginTop: 8 }}>
                  <BtnInner icon="delete_forever" label="Clear Everything" />
                </button>
              </>
            )}
          </div>
        )}

        {/* DRAW */}
        {view === "draw" && (
          <div>
            <SectionTitle icon="casino" title="The Draw" subtitle="Randomly assign teams, or pick manually" />
            {players.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ color: "rgba(240,234,214,0.4)", fontStyle: "italic", marginBottom: 20, fontFamily: "sans-serif", fontSize: 14 }}>Add players before doing the draw.</p>
                <button onClick={() => setView("manage")} style={bigBtn("#c9a84c", "#0a0e1a")}>
                  <BtnInner icon="group_add" label="Add Players" />
                </button>
              </div>
            ) : (
              <>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(240,234,214,0.1)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontFamily: "sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "rgba(240,234,214,0.45)", marginBottom: 12 }}>Draw Summary</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {players.map(p => (
                      <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: "sans-serif", fontSize: 15, flex: 1 }}>{p.name}</span>
                        <span style={{ fontFamily: "sans-serif", fontSize: 13, color: p.color, fontWeight: 700 }}>{p.teams} team{p.teams > 1 ? "s" : ""}</span>
                        <span style={{ fontFamily: "sans-serif", fontSize: 13, color: "rgba(240,234,214,0.4)" }}>{CURRENCY}{p.teams * BASE_PRICE}</span>
                      </div>
                    ))}
                  </div>
                  {totalSlots > TEAMS_2026.length && (
                    <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontFamily: "sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="warning" size={16} style={{ color: "#f87171" }} />
                      Too many slots ({totalSlots}) — max is {TEAMS_2026.length}.
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={doDraw} disabled={totalSlots > TEAMS_2026.length} style={{ ...bigBtn("#c9a84c", "#0a0e1a"), opacity: totalSlots > TEAMS_2026.length ? 0.4 : 1 }}>
                    <BtnInner icon="shuffle" label="Random Draw" />
                  </button>
                  <button onClick={initManual} style={bigBtn("rgba(255,255,255,0.08)", "#f0ead6")}>
                    <BtnInner icon="edit_note" label="Assign Manually" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* RESULTS */}
        {view === "results" && assignments && (
          <div>
            <SectionTitle icon="emoji_events" title="Results" subtitle={manualMode ? "Use dropdowns to assign teams" : "Your drawn teams"} />

            {manualMode && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, fontFamily: "sans-serif", fontSize: 13, color: "#c9a84c", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="edit_note" size={18} style={{ color: "#c9a84c" }} />
                Use the dropdowns to assign a team to each player.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {players.map(p => {
                const teams = assignments[p.name] || [];
                return (
                  <div key={p.name} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(240,234,214,0.1)",
                    borderLeft: `4px solid ${p.color}`,
                    borderRadius: 12, padding: 14,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: p.color, display: "flex", alignItems: "center",
                        justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 15, flexShrink: 0,
                      }}>{p.name[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, fontFamily: "sans-serif", color: "rgba(240,234,214,0.45)", marginTop: 1 }}>
                          {p.teams} team{p.teams > 1 ? "s" : ""} · {CURRENCY}{p.teams * BASE_PRICE}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {Array.from({ length: p.teams }).map((_, i) => {
                        const team = teams[i];
                        return manualMode ? (
                          <select key={i} value={team?.name || ""} onChange={e => manualAssign(p.name, e.target.value, i)}
                            style={{ width: "100%", background: "#0f1626", border: "1px solid rgba(240,234,214,0.2)", color: "#f0ead6", borderRadius: 8, padding: "10px 12px", fontFamily: "sans-serif", fontSize: 15, cursor: "pointer" }}>
                            <option value="">— Pick a team —</option>
                            {TEAMS_2026.filter(t => !assignedTeamNames.includes(t.name) || t.name === team?.name).map(t => (
                              <option key={t.name} value={t.name}>{t.flag} {t.name} (FIFA #{t.fifaRank})</option>
                            ))}
                          </select>
                        ) : (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            background: "rgba(255,255,255,0.06)", border: `1px solid ${p.color}35`,
                            borderRadius: 10, padding: "10px 14px",
                          }}>
                            <span style={{ fontSize: 28, flexShrink: 0 }}>{team?.flag}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: "sans-serif", fontSize: 15, fontWeight: 600 }}>{team?.name}</div>
                              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                                <span style={{
                                  fontFamily: "sans-serif", fontSize: 10, letterSpacing: 0.5,
                                  background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
                                  color: "#c9a84c", borderRadius: 4, padding: "2px 7px",
                                  display: "flex", alignItems: "center", gap: 3,
                                }}>
                                  <Icon name="language" size={11} style={{ color: "#c9a84c" }} />
                                  FIFA #{team?.fifaRank}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {!manualMode && (
              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button onClick={doDraw} style={{ ...bigBtn("#2a9d8f", "#fff"), flex: 1 }}>
                  <BtnInner icon="shuffle" label="Redraw" />
                </button>
                <button onClick={() => { setAssignments(null); setView("draw"); }} style={{ ...bigBtn("rgba(255,255,255,0.07)", "#f0ead6"), flex: 1, border: "1px solid rgba(240,234,214,0.15)" }}>
                  <BtnInner icon="restart_alt" label="Reset Draw" />
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── Bottom Tab Bar ────────────────────────────────── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,14,26,0.97)",
        borderTop: "1px solid rgba(240,234,214,0.12)",
        display: "flex",
        backdropFilter: "blur(12px)",
        zIndex: 200,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            flex: 1, background: "transparent", border: "none",
            color: view === tab.id ? "#c9a84c" : "rgba(240,234,214,0.45)",
            padding: "10px 0 8px",
            cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            transition: "color 0.2s",
          }}>
            <Icon name={tab.icon} size={24} />
            <span style={{ fontFamily: "sans-serif", fontSize: 10, letterSpacing: 0.5, fontWeight: view === tab.id ? 700 : 400 }}>{tab.label}</span>
            {view === tab.id && <div style={{ width: 18, height: 2, borderRadius: 1, background: "#c9a84c", marginTop: 1 }} />}
          </button>
        ))}
      </nav>
    </div>
  );
}
