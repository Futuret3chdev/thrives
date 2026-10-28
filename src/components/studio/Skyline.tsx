export function Skyline() {
  return (
    <svg className="sky" viewBox="0 0 800 140" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width="800" height="140" fill="#e7dfd2" />
      <path d="M0 110h800" stroke="#8d6238" strokeOpacity="0.35" />
      <g fill="#1c1712">
        <path d="M20 110 V62 h18 v-16 h10 v16 h22 V78 h16 v32z" />
        <path d="M110 110 V48 h8 V30 h6 v18 h28 V70 h14 v40z" />
        <path d="M190 110 V58 h40 V40 h12 v18 h26 V74 h20 v36z" />
        <path d="M310 110 V36 h10 V18 h8 v18 h34 V64 h18 v46z" />
        <path d="M400 110 V72 h50 V50 h16 v22 h30 V80 h22 v30z" />
        <path d="M540 110 V44 h12 V26 h7 v18 h36 V60 h20 v50z" />
        <path d="M640 110 V68 h28 V52 h14 v16 h40 V78 h18 v32z" />
        <path d="M760 110 V56 h28 v54z" />
      </g>
      <g fill="#c4a27a">
        <rect className="window" x="28" y="72" width="5" height="7" />
        <rect className="window b" x="40" y="72" width="5" height="7" />
        <rect className="window c" x="128" y="58" width="5" height="7" />
        <rect className="window d" x="148" y="80" width="5" height="7" />
        <rect className="window" x="206" y="68" width="6" height="8" />
        <rect className="window b" x="222" y="68" width="6" height="8" />
        <rect className="window c" x="248" y="84" width="6" height="8" />
        <rect className="window d" x="330" y="48" width="5" height="7" />
        <rect className="window" x="348" y="74" width="5" height="7" />
        <rect className="window b" x="418" y="82" width="6" height="8" />
        <rect className="window c" x="560" y="56" width="5" height="7" />
        <rect className="window d" x="586" y="72" width="5" height="7" />
        <rect className="window" x="656" y="80" width="5" height="7" />
        <rect className="window b" x="700" y="88" width="5" height="7" />
        <rect className="window c" x="772" y="70" width="6" height="8" />
      </g>
    </svg>
  );
}
