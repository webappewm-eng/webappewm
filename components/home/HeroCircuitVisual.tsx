export function HeroCircuitVisual() {
  const heroSvg = String.raw`<svg width="100%" viewBox="0 0 480 400" style="max-width:480px;margin:auto;display:block;">
  <defs>
    <filter id="fg"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="fg2"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  <rect x="40" y="40" width="400" height="320" rx="12" fill="#F7F7F5" stroke="#E0DDD6" stroke-width="1.5"/>

  <g opacity="0.15" stroke="#FF6B00" stroke-width="0.5">
    <line x1="40" y1="120" x2="440" y2="120"/><line x1="40" y1="200" x2="440" y2="200"/>
    <line x1="40" y1="280" x2="440" y2="280"/><line x1="160" y1="40" x2="160" y2="360"/>
    <line x1="240" y1="40" x2="240" y2="360"/><line x1="320" y1="40" x2="320" y2="360"/>
  </g>

  <g stroke="#D0CEC8" stroke-width="2" fill="none">
    <path d="M80,200 L140,200 L140,140 L200,140"/>
    <path d="M200,140 L280,140 L280,200 L360,200"/>
    <path d="M360,200 L400,200"/>
    <path d="M80,200 L80,260 L400,260 L400,200"/>
    <path d="M240,140 L240,80"/>
    <path d="M160,200 L160,260"/>
    <path d="M320,200 L320,260"/>
  </g>

  <g fill="#C8C5BE"><circle cx="140" cy="200" r="4"/><circle cx="360" cy="200" r="4"/><circle cx="240" cy="140" r="4"/></g>

  <g transform="translate(200,128)">
    <rect x="0" y="-13" width="80" height="26" rx="13" fill="#C49A3C"/>
    <rect x="10" y="-13" width="12" height="26" rx="2" fill="#E53935" opacity=".9"/>
    <rect x="27" y="-13" width="12" height="26" rx="2" fill="#E53935" opacity=".9"/>
    <rect x="44" y="-13" width="12" height="26" rx="2" fill="#FF6B00" opacity=".9"/>
    <rect x="63" y="-13" width="10" height="26" rx="2" fill="#2E7D32" opacity=".9"/>
    <text x="40" y="22" text-anchor="middle" fill="#FF6B00" font-family="JetBrains Mono, monospace" font-size="8" letter-spacing="1">220OHM</text>
  </g>

  <g transform="translate(152,196)">
    <line x1="0" y1="-14" x2="0" y2="-4" stroke="#1565C0" stroke-width="2"/>
    <line x1="0" y1="4" x2="0" y2="14" stroke="#1565C0" stroke-width="2"/>
    <line x1="-10" y1="-4" x2="10" y2="-4" stroke="#1565C0" stroke-width="3"/>
    <line x1="-10" y1="4" x2="10" y2="4" stroke="#1565C0" stroke-width="3"/>
    <text x="16" y="5" fill="#1565C0" font-family="JetBrains Mono, monospace" font-size="8">10uF</text>
  </g>

  <g transform="translate(313,196)">
    <polygon points="-10,-13 -10,13 12,0" fill="#2E7D32" opacity=".9"/>
    <line x1="12" y1="-13" x2="12" y2="13" stroke="#2E7D32" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="14" fill="#43A047" opacity="0" filter="url(#fg2)">
      <animate attributeName="opacity" values="0;.3;0" dur="2s" repeatCount="indefinite"/>
    </circle>
  </g>

  <g transform="translate(200,248)">
    <rect x="0" y="0" width="80" height="52" rx="4" fill="#F0EFEB" stroke="#C8C5BE" stroke-width="1.5"/>
    <g stroke="#D0CEC8" stroke-width="1.5">
      <line x1="-8" y1="10" x2="0" y2="10"/><line x1="-8" y1="22" x2="0" y2="22"/>
      <line x1="-8" y1="34" x2="0" y2="34"/><line x1="-8" y1="46" x2="0" y2="46"/>
      <line x1="80" y1="10" x2="88" y2="10"/><line x1="80" y1="22" x2="88" y2="22"/>
      <line x1="80" y1="34" x2="88" y2="34"/><line x1="80" y1="46" x2="88" y2="46"/>
    </g>
    <path d="M36,0 Q40,-4 44,0" fill="none" stroke="#C8C5BE" stroke-width="1.5"/>
    <text x="40" y="22" text-anchor="middle" fill="#FF6B00" font-family="JetBrains Mono, monospace" font-size="8" font-weight="500">MCU</text>
    <text x="40" y="36" text-anchor="middle" fill="#999" font-family="JetBrains Mono, monospace" font-size="7">ATmega</text>
    <circle cx="70" cy="8" r="3" fill="#43A047"><animate attributeName="opacity" values="1;0;1" dur="1.4s" repeatCount="indefinite"/></circle>
  </g>

  <g transform="translate(228,68)">
    <rect x="-18" y="-16" width="36" height="32" rx="3" fill="#F0EFEB" stroke="#F9A825" stroke-width="1.5"/>
    <line x1="-8" y1="-8" x2="-8" y2="8" stroke="#43A047" stroke-width="2"/>
    <line x1="-13" y1="0" x2="-3" y2="0" stroke="#E53935" stroke-width="1.5"/>
    <line x1="4" y1="-6" x2="4" y2="6" stroke="#E53935" stroke-width="1.5"/>
    <text x="0" y="26" text-anchor="middle" fill="#F9A825" font-family="JetBrains Mono, monospace" font-size="8">5V</text>
  </g>

  <circle r="5" fill="#FF6B00" filter="url(#fg)" opacity="0">
    <animateMotion dur="3s" repeatCount="indefinite" path="M80,200 L140,200 L140,140 L200,140 L280,140 L360,200 L400,200 L400,260 L80,260 L80,200"/>
    <animate attributeName="opacity" values="0;.9;.9;.9;0" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle r="5" fill="#E53935" filter="url(#fg)" opacity="0">
    <animateMotion dur="3s" begin="1s" repeatCount="indefinite" path="M80,200 L140,200 L140,140 L200,140 L280,140 L360,200 L400,200 L400,260 L80,260 L80,200"/>
    <animate attributeName="opacity" values="0;.9;.9;.9;0" dur="3s" begin="1s" repeatCount="indefinite"/>
  </circle>
  <circle r="5" fill="#1565C0" filter="url(#fg)" opacity="0">
    <animateMotion dur="3s" begin="2s" repeatCount="indefinite" path="M80,200 L140,200 L140,140 L200,140 L280,140 L360,200 L400,200 L400,260 L80,260 L80,200"/>
    <animate attributeName="opacity" values="0;.9;.9;.9;0" dur="3s" begin="2s" repeatCount="indefinite"/>
  </circle>

  <text x="240" y="388" text-anchor="middle" fill="rgba(255,107,0,0.25)" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="3">REAL BUILD - REAL CODE - REAL ENGINEERING</text>
</svg>`;

  return <div className="svg-wrap" dangerouslySetInnerHTML={{ __html: heroSvg }} />;
}
