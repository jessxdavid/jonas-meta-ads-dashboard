"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================================
// Do Not Click — Pixel Chow Chow Tamagotchi (Meta Ads themed)
// ============================================================================

type Stage = "puppy" | "young" | "adult" | "elder" | "legend" | "dead";
type Mood = "happy" | "neutral" | "sad" | "sleeping" | "sick" | "dead";

interface PetState {
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  health: number;
  xp: number;
  impressions: number;
  clicks: number;
  bornAt: number;
  lastTick: number;
  stage: Stage;
  isSleeping: boolean;
  alive: boolean;
}

const STORAGE_KEY = "doNotClick.tamagotchi.v2";
const TICK_MS = 5000;
const FEED_COST = 1000;
const PLAY_COST = 10;
const HEAL_COST = 50;
const PASSIVE_INCOME = { impressions: 250, clicks: 3 };

const initialState = (): PetState => ({
  name: "Mochi",
  hunger: 80,
  happiness: 80,
  energy: 80,
  health: 100,
  xp: 0,
  impressions: 5000,
  clicks: 50,
  bornAt: Date.now(),
  lastTick: Date.now(),
  stage: "puppy",
  isSleeping: false,
  alive: true,
});

const stageFromXp = (xp: number, alive: boolean): Stage => {
  if (!alive) return "dead";
  if (xp < 100) return "puppy";
  if (xp < 300) return "young";
  if (xp < 700) return "adult";
  if (xp < 1500) return "elder";
  return "legend";
};

const moodFromState = (s: PetState): Mood => {
  if (!s.alive) return "dead";
  if (s.isSleeping) return "sleeping";
  if (s.health < 30) return "sick";
  const avg = (s.hunger + s.happiness + s.energy) / 3;
  if (avg > 65) return "happy";
  if (avg > 35) return "neutral";
  return "sad";
};

const stageLabel: Record<Stage, string> = {
  puppy: "Pixel Puppy",
  young: "Fluff Cadet",
  adult: "Floof Lord",
  elder: "Wise Chow",
  legend: "Legendary Mochi",
  dead: "Crossed the rainbow bridge",
};

export default function DoNotClickPage() {
  const [pet, setPet] = useState<PetState | null>(null);
  const [bounce, setBounce] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PetState;
        const now = Date.now();
        const missedTicks = Math.min(Math.floor((now - saved.lastTick) / TICK_MS), 720);
        const caughtUp = applyTicks(saved, missedTicks);
        caughtUp.lastTick = now;
        setPet(caughtUp);
      } else {
        setPet(initialState());
      }
    } catch {
      setPet(initialState());
    }
  }, []);

  useEffect(() => {
    if (pet) localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
  }, [pet]);

  useEffect(() => {
    if (!pet) return;
    tickRef.current = setInterval(() => {
      setPet((prev) => (prev ? applyTicks(prev, 1) : prev));
    }, TICK_MS);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [pet?.alive]);

  if (!pet) {
    return <div style={{ padding: "2rem", color: "#999" }}>Loading your pet…</div>;
  }

  const mood = moodFromState(pet);
  const ageDays = Math.floor((Date.now() - pet.bornAt) / (1000 * 60 * 60 * 24));
  const ageHours = Math.floor((Date.now() - pet.bornAt) / (1000 * 60 * 60));

  const feed = () => {
    if (!pet.alive || pet.isSleeping || pet.impressions < FEED_COST) return;
    setBounce(true);
    setTimeout(() => setBounce(false), 400);
    setPet({
      ...pet,
      impressions: pet.impressions - FEED_COST,
      hunger: Math.min(100, pet.hunger + 25),
      xp: pet.xp + 5,
    });
  };

  const play = () => {
    if (!pet.alive || pet.isSleeping || pet.clicks < PLAY_COST) return;
    setBounce(true);
    setTimeout(() => setBounce(false), 400);
    setPet({
      ...pet,
      clicks: pet.clicks - PLAY_COST,
      happiness: Math.min(100, pet.happiness + 30),
      energy: Math.max(0, pet.energy - 10),
      xp: pet.xp + 8,
    });
  };

  const toggleSleep = () => {
    if (!pet.alive) return;
    setPet({ ...pet, isSleeping: !pet.isSleeping });
  };

  const heal = () => {
    if (!pet.alive || pet.clicks < HEAL_COST) return;
    setPet({
      ...pet,
      clicks: pet.clicks - HEAL_COST,
      health: Math.min(100, pet.health + 40),
      xp: pet.xp + 3,
    });
  };

  const reset = () => {
    if (!confirm("Reset your pet? A new puppy will appear.")) return;
    setPet(initialState());
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Do Not Click</h1>
          <p style={styles.subtitle}>
            Meet {pet.name}, your pixel chow chow. Feeds on impressions, plays with clicks.
          </p>
        </div>
        <button style={styles.resetBtn} onClick={reset}>
          Reset pet
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.petCard}>
          <div style={styles.stageRow}>
            <div>
              <p style={styles.metaLabel}>Stage</p>
              <p style={styles.stageName}>{stageLabel[pet.stage]}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={styles.metaLabel}>Age</p>
              <p style={styles.stageName}>
                {ageDays > 0 ? `${ageDays}d` : `${ageHours}h`}
              </p>
            </div>
          </div>

          <div style={styles.petStage}>
            <ChowChowSprite stage={pet.stage} mood={mood} bounce={bounce} />
          </div>

          <div style={styles.statsGrid}>
            <Stat label="Hunger" value={pet.hunger} color="#f97316" />
            <Stat label="Happy" value={pet.happiness} color="#22c55e" />
            <Stat label="Energy" value={pet.energy} color="#3b82f6" />
            <Stat label="Health" value={pet.health} color="#ec4899" />
          </div>

          <div style={styles.actionsRow}>
            <ActionBtn
              icon="🍖"
              label="Feed"
              sub={`-${FEED_COST.toLocaleString()} impr`}
              onClick={feed}
              disabled={!pet.alive || pet.isSleeping || pet.impressions < FEED_COST}
            />
            <ActionBtn
              icon="🎾"
              label="Play"
              sub={`-${PLAY_COST} clicks`}
              onClick={play}
              disabled={!pet.alive || pet.isSleeping || pet.clicks < PLAY_COST}
            />
            <ActionBtn
              icon={pet.isSleeping ? "☀️" : "💤"}
              label={pet.isSleeping ? "Wake" : "Sleep"}
              sub={pet.isSleeping ? "rise & grind" : "restore energy"}
              onClick={toggleSleep}
              disabled={!pet.alive}
            />
            <ActionBtn
              icon="💊"
              label="Heal"
              sub={`-${HEAL_COST} clicks`}
              onClick={heal}
              disabled={!pet.alive || pet.clicks < HEAL_COST}
            />
          </div>
        </div>

        <div style={styles.sideCol}>
          <div style={styles.currencyCard}>
            <p style={styles.metaLabel}>Pet wallet</p>
            <div style={styles.currencyRow}>
              <span style={styles.currencyIcon}>👁️</span>
              <div style={{ flex: 1 }}>
                <p style={styles.currencyValue}>{pet.impressions.toLocaleString()}</p>
                <p style={styles.currencySub}>impressions</p>
              </div>
            </div>
            <div style={{ ...styles.currencyRow, borderBottom: "none" }}>
              <span style={styles.currencyIcon}>🖱️</span>
              <div style={{ flex: 1 }}>
                <p style={styles.currencyValue}>{pet.clicks.toLocaleString()}</p>
                <p style={styles.currencySub}>clicks</p>
              </div>
            </div>
            <div style={styles.passiveBox}>
              <p style={styles.passiveLabel}>Earning while you work</p>
              <p style={styles.passiveValue}>
                +{PASSIVE_INCOME.impressions}/tick · +{PASSIVE_INCOME.clicks}/tick
              </p>
            </div>
          </div>

          <div style={styles.xpCard}>
            <p style={styles.metaLabel}>Experience</p>
            <p style={styles.xpValue}>{pet.xp} XP</p>
            <XpBar xp={pet.xp} stage={pet.stage} />
          </div>

          <div style={styles.tipsCard}>
            <p style={styles.metaLabel}>Tips</p>
            <ul style={styles.tipsList}>
              <li>Feed before hunger drops below 30</li>
              <li>Play boosts happiness and earns most XP</li>
              <li>Sleep restores energy faster</li>
              <li>Heal when health gets low</li>
            </ul>
          </div>
        </div>
      </div>

      {!pet.alive && (
        <div style={styles.deadBanner}>
          {pet.name} has crossed the rainbow bridge. Reset to welcome a new puppy.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tick logic
// ============================================================================
function applyTicks(state: PetState, ticks: number): PetState {
  if (!state.alive || ticks <= 0) return state;

  let { hunger, happiness, energy, health, impressions, clicks, xp, isSleeping } = state;

  for (let i = 0; i < ticks; i++) {
    impressions += PASSIVE_INCOME.impressions;
    clicks += PASSIVE_INCOME.clicks;

    if (isSleeping) {
      energy = Math.min(100, energy + 4);
      hunger = Math.max(0, hunger - 1);
    } else {
      hunger = Math.max(0, hunger - 2);
      happiness = Math.max(0, happiness - 1.5);
      energy = Math.max(0, energy - 1);
    }

    if (hunger < 15 || happiness < 15 || energy < 10) {
      health = Math.max(0, health - 2);
    } else if (health < 100) {
      health = Math.min(100, health + 0.3);
    }

    if (!isSleeping) xp += 1;
  }

  const alive = health > 0;
  const stage = stageFromXp(xp, alive);

  return {
    ...state,
    hunger: Math.round(hunger),
    happiness: Math.round(happiness),
    energy: Math.round(energy),
    health: Math.round(health),
    impressions,
    clicks,
    xp: Math.round(xp),
    stage,
    alive,
    isSleeping: alive ? isSleeping : false,
    lastTick: Date.now(),
  };
}

// ============================================================================
// Pixel Chow Chow Sprite
// ============================================================================
function ChowChowSprite({
  stage,
  mood,
  bounce,
}: {
  stage: Stage;
  mood: Mood;
  bounce: boolean;
}) {
  const transform = bounce ? "translateY(-8px)" : "translateY(0)";
  const transition = "transform 0.2s ease-out";

  const scale =
    stage === "puppy" ? 0.85 : stage === "young" ? 0.95 : stage === "adult" ? 1.05 : 1.15;

  if (mood === "dead" || stage === "dead") {
    return (
      <svg
        width="160"
        height="180"
        viewBox="0 0 120 140"
        shapeRendering="crispEdges"
        style={{ opacity: 0.3 }}
      >
        <ChowBody mood="neutral" />
        <rect x="32" y="40" width="8" height="2" fill="#1a1a1a" />
        <rect x="36" y="38" width="2" height="2" fill="#1a1a1a" />
        <rect x="38" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="76" y="40" width="8" height="2" fill="#1a1a1a" />
        <rect x="80" y="38" width="2" height="2" fill="#1a1a1a" />
        <rect x="82" y="40" width="2" height="2" fill="#1a1a1a" />
      </svg>
    );
  }

  if (mood === "sleeping") {
    return (
      <svg
        width="160"
        height="180"
        viewBox="0 0 120 140"
        shapeRendering="crispEdges"
        style={{ transform, transition }}
      >
        <g transform={`translate(60, 80) scale(${scale}) translate(-60, -80)`}>
          <rect x="20" y="60" width="80" height="4" fill="#fafafa" />
          <rect x="16" y="64" width="88" height="4" fill="#fafafa" />
          <rect x="12" y="68" width="96" height="28" fill="#fafafa" />
          <rect x="16" y="96" width="88" height="4" fill="#fafafa" />
          <rect x="20" y="100" width="80" height="4" fill="#fafafa" />
          <rect x="20" y="56" width="8" height="4" fill="#fafafa" />
          <rect x="92" y="56" width="8" height="4" fill="#fafafa" />
          <rect x="32" y="76" width="8" height="2" fill="#1a1a1a" />
          <rect x="80" y="76" width="8" height="2" fill="#1a1a1a" />
          <rect x="52" y="80" width="16" height="6" fill="#f0f0f0" />
          <rect x="56" y="78" width="8" height="2" fill="#1a1a1a" />
          <rect x="100" y="40" width="6" height="2" fill="#fff" />
          <rect x="104" y="42" width="2" height="4" fill="#fff" />
          <rect x="100" y="46" width="6" height="2" fill="#fff" />
          <rect x="92" y="28" width="4" height="2" fill="#fff" />
          <rect x="94" y="30" width="2" height="2" fill="#fff" />
          <rect x="92" y="32" width="4" height="2" fill="#fff" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      width="160"
      height="180"
      viewBox="0 0 120 140"
      shapeRendering="crispEdges"
      style={{ transform, transition }}
    >
      <g transform={`translate(60, 80) scale(${scale}) translate(-60, -80)`}>
        <ChowBody mood={mood} />
        <ChowFace mood={mood} />
        {(stage === "elder" || stage === "legend") && (
          <ChowAccessory legend={stage === "legend"} />
        )}
      </g>
    </svg>
  );
}

function ChowBody({ mood }: { mood: Mood }) {
  const fur = mood === "sick" ? "#e8f0d8" : "#fafafa";
  const furShade = mood === "sick" ? "#d4e0c0" : "#f0f0f0";
  const earOffset = mood === "sad" || mood === "sick" ? 8 : 0;

  return (
    <>
      <rect x="24" y={20 + earOffset} width="4" height="4" fill={fur} />
      <rect x="92" y={20 + earOffset} width="4" height="4" fill={fur} />
      <rect x="20" y={24 + earOffset} width="12" height="4" fill={fur} />
      <rect x="88" y={24 + earOffset} width="12" height="4" fill={fur} />
      <rect x="24" y={28 + earOffset} width="8" height="4" fill="#e5b8a8" />
      <rect x="88" y={28 + earOffset} width="8" height="4" fill="#e5b8a8" />
      <rect x="32" y="20" width="56" height="4" fill={fur} />
      <rect x="28" y="24" width="64" height="4" fill={fur} />
      <rect x="24" y="28" width="72" height="4" fill={fur} />
      <rect x="20" y="32" width="80" height="20" fill={fur} />
      <rect x="16" y="52" width="88" height="4" fill={fur} />
      <rect x="48" y="48" width="24" height="4" fill={furShade} />
      <rect x="44" y="52" width="32" height="8" fill={furShade} />
      <rect x="56" y="50" width="8" height="4" fill="#1a1a1a" />
      <rect x="12" y="56" width="8" height="8" fill={fur} />
      <rect x="100" y="56" width="8" height="8" fill={fur} />
      <rect x="20" y="60" width="20" height="8" fill={fur} />
      <rect x="80" y="60" width="20" height="8" fill={fur} />
      <rect x="24" y="68" width="72" height="24" fill={fur} />
      <rect x="28" y="92" width="64" height="12" fill={fur} />
      <rect x="32" y="104" width="16" height="8" fill={furShade} />
      <rect x="72" y="104" width="16" height="8" fill={furShade} />
      <rect x="36" y="108" width="2" height="2" fill="#1a1a1a" />
      <rect x="42" y="108" width="2" height="2" fill="#1a1a1a" />
      <rect x="76" y="108" width="2" height="2" fill="#1a1a1a" />
      <rect x="82" y="108" width="2" height="2" fill="#1a1a1a" />
      {mood === "happy" ? (
        <>
          <rect x="92" y="68" width="8" height="4" fill={fur} />
          <rect x="96" y="64" width="4" height="8" fill={fur} />
          <rect x="100" y="60" width="4" height="8" fill={fur} />
        </>
      ) : mood === "sad" || mood === "sick" ? (
        <rect x="92" y="92" width="12" height="4" fill={fur} />
      ) : (
        <>
          <rect x="92" y="76" width="8" height="4" fill={fur} />
          <rect x="96" y="72" width="4" height="8" fill={fur} />
        </>
      )}
    </>
  );
}

function ChowFace({ mood }: { mood: Mood }) {
  if (mood === "happy") {
    return (
      <>
        <rect x="34" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="36" y="38" width="2" height="2" fill="#1a1a1a" />
        <rect x="38" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="40" y="42" width="2" height="2" fill="#1a1a1a" />
        <rect x="42" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="44" y="38" width="2" height="2" fill="#1a1a1a" />
        <rect x="46" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="74" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="76" y="38" width="2" height="2" fill="#1a1a1a" />
        <rect x="78" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="80" y="42" width="2" height="2" fill="#1a1a1a" />
        <rect x="82" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="84" y="38" width="2" height="2" fill="#1a1a1a" />
        <rect x="86" y="40" width="2" height="2" fill="#1a1a1a" />
        <rect x="28" y="46" width="4" height="2" fill="#fca5a5" />
        <rect x="88" y="46" width="4" height="2" fill="#fca5a5" />
        <rect x="48" y="58" width="2" height="2" fill="#1a1a1a" />
        <rect x="50" y="60" width="20" height="2" fill="#1a1a1a" />
        <rect x="70" y="58" width="2" height="2" fill="#1a1a1a" />
        <rect x="54" y="62" width="12" height="2" fill="#5b21b6" />
      </>
    );
  }

  if (mood === "sad" || mood === "sick") {
    return (
      <>
        <rect x="36" y="42" width="8" height="3" fill="#1a1a1a" />
        <rect x="76" y="42" width="8" height="3" fill="#1a1a1a" />
        <rect x="40" y="48" width="2" height="4" fill="#3b82f6" />
        <rect x="50" y="62" width="20" height="2" fill="#1a1a1a" />
        <rect x="48" y="60" width="2" height="2" fill="#1a1a1a" />
        <rect x="70" y="60" width="2" height="2" fill="#1a1a1a" />
      </>
    );
  }

  return (
    <>
      <rect x="36" y="40" width="8" height="4" fill="#1a1a1a" />
      <rect x="76" y="40" width="8" height="4" fill="#1a1a1a" />
      <rect x="36" y="40" width="2" height="2" fill="#fff" />
      <rect x="76" y="40" width="2" height="2" fill="#fff" />
      <rect x="52" y="58" width="4" height="4" fill="#1a1a1a" />
      <rect x="64" y="58" width="4" height="4" fill="#1a1a1a" />
      <rect x="56" y="62" width="8" height="4" fill="#5b21b6" />
    </>
  );
}

function ChowAccessory({ legend }: { legend: boolean }) {
  if (legend) {
    return (
      <>
        <rect x="44" y="14" width="32" height="4" fill="#fde047" />
        <rect x="46" y="10" width="4" height="4" fill="#fde047" />
        <rect x="58" y="8" width="4" height="6" fill="#fde047" />
        <rect x="70" y="10" width="4" height="4" fill="#fde047" />
      </>
    );
  }
  return (
    <>
      <rect x="52" y="68" width="4" height="4" fill="#dc2626" />
      <rect x="64" y="68" width="4" height="4" fill="#dc2626" />
      <rect x="58" y="68" width="4" height="4" fill="#dc2626" />
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================
function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={styles.statBox}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#999", fontSize: 11 }}>{label}</span>
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 500 }}>
          {Math.round(value)}%
        </span>
      </div>
      <div style={styles.statTrack}>
        <div
          style={{
            background: color,
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: "100%",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  sub,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  sub: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.actionBtn,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{label}</span>
      <span style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{sub}</span>
    </button>
  );
}

function XpBar({ xp, stage }: { xp: number; stage: Stage }) {
  const thresholds = [0, 100, 300, 700, 1500, 1500];
  const stageIdx = ["puppy", "young", "adult", "elder", "legend"].indexOf(stage);
  const lo = thresholds[stageIdx] ?? 0;
  const hi = thresholds[stageIdx + 1] ?? 1500;
  const pct = stage === "legend" ? 100 : ((xp - lo) / (hi - lo)) * 100;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={styles.statTrack}>
        <div
          style={{
            background: "#f97316",
            width: `${Math.max(0, Math.min(100, pct))}%`,
            height: "100%",
          }}
        />
      </div>
      <p style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
        {stage === "legend" ? "Maxed out — legend tier" : `Next stage at ${hi} XP`}
      </p>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "2rem",
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
  title: { fontSize: 24, fontWeight: 500, margin: 0, color: "#fff" },
  subtitle: { margin: "4px 0 0", color: "#999", fontSize: 13 },
  resetBtn: {
    background: "transparent",
    border: "0.5px solid #333",
    color: "#999",
    padding: "8px 14px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 },
  petCard: {
    background: "#0f0f0f",
    border: "0.5px solid #1f1f1f",
    borderRadius: 12,
    padding: "1.5rem",
  },
  stageRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  metaLabel: {
    margin: 0,
    color: "#f97316",
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  stageName: { margin: "4px 0 0", color: "#fff", fontSize: 16, fontWeight: 500 },
  petStage: {
    background: "#161616",
    border: "0.5px solid #222",
    borderRadius: 8,
    padding: "1.5rem 1rem",
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    background: "#161616",
    border: "0.5px solid #222",
    borderRadius: 8,
    padding: "10px 12px",
  },
  statTrack: { background: "#0a0a0a", borderRadius: 4, height: 6, overflow: "hidden" },
  actionsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  actionBtn: {
    background: "#161616",
    border: "0.5px solid #333",
    color: "#fff",
    padding: "12px 6px",
    borderRadius: 6,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  sideCol: { display: "flex", flexDirection: "column", gap: 12 },
  currencyCard: {
    background: "#0f0f0f",
    border: "0.5px solid #1f1f1f",
    borderRadius: 12,
    padding: "1.25rem",
  },
  currencyRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "0.5px solid #1f1f1f",
  },
  currencyIcon: { fontSize: 22 },
  currencyValue: { margin: 0, fontSize: 18, fontWeight: 500, color: "#fff" },
  currencySub: { margin: 0, fontSize: 11, color: "#999" },
  passiveBox: {
    marginTop: 12,
    padding: "10px 12px",
    background: "#1a0f08",
    border: "0.5px solid #f97316",
    borderRadius: 6,
  },
  passiveLabel: {
    margin: 0,
    fontSize: 10,
    color: "#f97316",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 500,
  },
  passiveValue: { margin: "4px 0 0", fontSize: 12, color: "#fff" },
  xpCard: {
    background: "#0f0f0f",
    border: "0.5px solid #1f1f1f",
    borderRadius: 12,
    padding: "1.25rem",
  },
  xpValue: { margin: "4px 0 8px", fontSize: 18, fontWeight: 500, color: "#fff" },
  tipsCard: {
    background: "#0f0f0f",
    border: "0.5px solid #1f1f1f",
    borderRadius: 12,
    padding: "1.25rem",
  },
  tipsList: {
    margin: "8px 0 0",
    paddingLeft: 18,
    color: "#bbb",
    fontSize: 12,
    lineHeight: 1.7,
  },
  deadBanner: {
    marginTop: 16,
    padding: "12px 16px",
    background: "#2a0a0a",
    border: "0.5px solid #ef4444",
    borderRadius: 8,
    color: "#fca5a5",
    fontSize: 13,
  },
};
