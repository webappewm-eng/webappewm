"use client";

import { useMemo, useState } from "react";

type DemoTab = "resistor" | "capacitor" | "led" | "gear";

const capacitorSvg = String.raw`<svg width="100%" height="180" viewBox="0 0 560 180">
  <line x1="60" y1="80" x2="200" y2="80" stroke="#C8C5BE" stroke-width="2.5"/>
  <line x1="360" y1="80" x2="500" y2="80" stroke="#C8C5BE" stroke-width="2.5"/>
  <line x1="500" y1="80" x2="500" y2="130" stroke="#C8C5BE" stroke-width="2.5"/>
  <line x1="60" y1="130" x2="500" y2="130" stroke="#C8C5BE" stroke-width="2.5"/>
  <line x1="60" y1="80" x2="60" y2="130" stroke="#C8C5BE" stroke-width="2.5"/>
  <rect x="30" y="88" width="28" height="34" rx="3" fill="#F0EFEB" stroke="#1565C0" stroke-width="1.5"/>
  <line x1="44" y1="95" x2="44" y2="103" stroke="#43A047" stroke-width="2"/>
  <line x1="38" y1="108" x2="50" y2="108" stroke="#E53935" stroke-width="1.5"/>
  <line x1="200" y1="60" x2="200" y2="100" stroke="#1565C0" stroke-width="4"/>
  <line x1="360" y1="60" x2="360" y2="100" stroke="#1565C0" stroke-width="4"/>
  <rect x="204" y="60" width="0" height="40" fill="rgba(21,101,192,0.1)">
    <animate attributeName="width" values="0;152;0" dur="3s" repeatCount="indefinite"/>
  </rect>
  <text x="225" y="85" fill="#E53935" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" opacity="0">+ + +<animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/></text>
  <text x="315" y="85" fill="#1565C0" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" opacity="0">- - -<animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/></text>
  <text x="280" y="120" text-anchor="middle" fill="#1565C0" font-family="JetBrains Mono, monospace" font-size="10">10uF - charging and discharging</text>
</svg>`;

const ledSvg = String.raw`<svg width="100%" height="160" viewBox="0 0 560 160">
  <defs><filter id="lgfx"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <line x1="40" y1="80" x2="130" y2="80" stroke="#C8C5BE" stroke-width="2.5"/>
  <rect x="130" y="70" width="60" height="20" rx="10" fill="#C49A3C"/>
  <rect x="140" y="70" width="8" height="20" rx="2" fill="#E53935" opacity=".9"/>
  <rect x="154" y="70" width="8" height="20" rx="2" fill="#FF6B00" opacity=".9"/>
  <rect x="168" y="70" width="8" height="20" rx="2" fill="#E53935" opacity=".9"/>
  <line x1="190" y1="80" x2="220" y2="80" stroke="#C8C5BE" stroke-width="2.5"/>
  <polygon points="220,67 220,93 248,80" fill="#2E7D32" opacity=".9"/>
  <line x1="248" y1="67" x2="248" y2="93" stroke="#2E7D32" stroke-width="3"/>
  <line x1="248" y1="80" x2="500" y2="80" stroke="#C8C5BE" stroke-width="2.5"/>
  <line x1="500" y1="80" x2="500" y2="120" stroke="#C8C5BE" stroke-width="2.5"/>
  <line x1="40" y1="120" x2="500" y2="120" stroke="#C8C5BE" stroke-width="2.5"/>
  <line x1="40" y1="80" x2="40" y2="120" stroke="#C8C5BE" stroke-width="2.5"/>
  <rect x="10" y="88" width="28" height="34" rx="3" fill="#F0EFEB" stroke="#F9A825" stroke-width="1.5"/>
  <circle cx="234" cy="80" r="28" fill="#43A047" opacity="0" filter="url(#lgfx)"><animate attributeName="opacity" values="0;.25;0" dur="1.5s" repeatCount="indefinite"/></circle>
  <text x="380" y="68" fill="#2E7D32" font-family="JetBrains Mono, monospace" font-size="10">LED + Resistor</text>
  <text x="380" y="84" fill="#999" font-family="JetBrains Mono, monospace" font-size="9">always pair together</text>
</svg>`;

const gearSvg = String.raw`<svg width="100%" height="200" viewBox="0 0 560 200">
  <g transform="translate(200,100)">
    <animateTransform attributeName="transform" type="rotate" from="0 200 100" to="360 200 100" dur="6s" repeatCount="indefinite"/>
    <circle cx="0" cy="0" r="55" fill="none" stroke="#795548" stroke-width="3"/>
    <circle cx="0" cy="0" r="14" fill="#795548"/>
    <g fill="#795548">
      <rect x="-6" y="-68" width="12" height="16" rx="2"/>
      <rect x="-6" y="52" width="12" height="16" rx="2"/>
      <rect x="-68" y="-6" width="16" height="12" rx="2"/>
      <rect x="52" y="-6" width="16" height="12" rx="2"/>
    </g>
  </g>
  <g transform="translate(330,100)">
    <animateTransform attributeName="transform" type="rotate" from="0 330 100" to="-360 330 100" dur="4s" repeatCount="indefinite"/>
    <circle cx="0" cy="0" r="35" fill="none" stroke="#FF6B00" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="10" fill="#FF6B00"/>
  </g>
  <text x="175" y="172" text-anchor="middle" fill="#795548" font-family="JetBrains Mono, monospace" font-size="10">Driver gear</text>
  <text x="330" y="152" text-anchor="middle" fill="#FF6B00" font-family="JetBrains Mono, monospace" font-size="10">Driven gear</text>
</svg>`;

export function AnimationShowcase() {
  const [activeDemo, setActiveDemo] = useState<DemoTab>("resistor");
  const [voltage, setVoltage] = useState(5);
  const [resistance, setResistance] = useState(220);

  const currentmA = useMemo(() => (voltage / resistance) * 1000, [resistance, voltage]);

  const currentColor = currentmA > 30 ? "#E53935" : currentmA > 15 ? "#F9A825" : "#2E7D32";

  return (
    <div className="showcase">
      <div className="showcase-label">Interactive Preview</div>
      <div className="tab-row">
        <button type="button" className={`tab ${activeDemo === "resistor" ? "active" : ""}`} onClick={() => setActiveDemo("resistor")}>Resistor</button>
        <button type="button" className={`tab ${activeDemo === "capacitor" ? "active" : ""}`} onClick={() => setActiveDemo("capacitor")}>Capacitor</button>
        <button type="button" className={`tab ${activeDemo === "led" ? "active" : ""}`} onClick={() => setActiveDemo("led")}>LED</button>
        <button type="button" className={`tab ${activeDemo === "gear" ? "active" : ""}`} onClick={() => setActiveDemo("gear")}>Gear</button>
      </div>

      {activeDemo === "resistor" ? (
        <div className="showcase-panel">
          <svg width="100%" height="150" viewBox="0 0 560 150">
            <line x1="40" y1="75" x2="130" y2="75" stroke="#C8C5BE" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="330" y1="75" x2="500" y2="75" stroke="#C8C5BE" strokeWidth="2.5"/>
            <line x1="500" y1="75" x2="500" y2="115" stroke="#C8C5BE" strokeWidth="2.5"/>
            <line x1="40" y1="115" x2="500" y2="115" stroke="#C8C5BE" strokeWidth="2.5"/>
            <line x1="40" y1="75" x2="40" y2="115" stroke="#C8C5BE" strokeWidth="2.5"/>
            <rect x="130" y="62" width="200" height="26" rx="13" fill="#C49A3C"/>
            <rect x="148" y="62" width="14" height="26" rx="2" fill="#E53935" opacity=".9"/>
            <rect x="170" y="62" width="14" height="26" rx="2" fill="#E53935" opacity=".9"/>
            <rect x="192" y="62" width="14" height="26" rx="2" fill="#FF6B00" opacity=".9"/>
            <rect x="238" y="62" width="12" height="26" rx="2" fill="#2E7D32" opacity=".9"/>
            <text x="230" y="104" textAnchor="middle" fill="#FF6B00" fontFamily="JetBrains Mono, monospace" fontSize="9">{resistance}OHM</text>
            <text x="420" y="55" textAnchor="middle" fill={currentColor} fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="500">{currentmA.toFixed(1)} mA</text>
            <text x="420" y="40" textAnchor="middle" fill="#999" fontFamily="JetBrains Mono, monospace" fontSize="9">I = V / R</text>
          </svg>
          <div className="range-grid">
            <label>
              Voltage: {voltage.toFixed(1)}V
              <input type="range" min={1} max={12} step={0.5} value={voltage} onChange={(event) => setVoltage(Number(event.target.value))} />
            </label>
            <label>
              Resistance: {resistance}OHM
              <input type="range" min={10} max={1000} step={10} value={resistance} onChange={(event) => setResistance(Number(event.target.value))} />
            </label>
          </div>
        </div>
      ) : null}

      {activeDemo === "capacitor" ? <div className="showcase-panel" dangerouslySetInnerHTML={{ __html: capacitorSvg }} /> : null}
      {activeDemo === "led" ? <div className="showcase-panel" dangerouslySetInnerHTML={{ __html: ledSvg }} /> : null}
      {activeDemo === "gear" ? <div className="showcase-panel" dangerouslySetInnerHTML={{ __html: gearSvg }} /> : null}
    </div>
  );
}
