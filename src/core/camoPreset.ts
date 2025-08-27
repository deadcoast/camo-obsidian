
export interface Preset {
  trigger: string;
  metadata: string;
  style: {
    background: string;
    color: string;
    cursor: string;
  };
}

export const CORE_PRESETS = {
  // BLACKOUT - Complete Privacy
  blackout: {
    trigger: "```camoblackout",
    metadata: `
      :: set[background] // content[all] % {color}(#000000) -> {visual[solid_black]}
      :: set[text] // visibility % {hidden}(true) -> {text[invisible]}
      :: reveal[interaction] // trigger[click] % {animation}(fade_in) -> {ready}
    `,
    style: {
      background: "#000000",
      color: "transparent",
      cursor: "pointer",
    },
  },

  // BLUEPRINT - Technical Aesthetic
  blueprint: {
    trigger: "```camoblueprint",
    metadata: `
      :: set[background] // content[all] % {color}(#0D1F2D) -> {visual[blueprint_bg]}
      :: apply[grid] // overlay % {spacing}(20px) -> {grid[applied]}
      :: set[text] // color % {value}(#4FC3F7) -> {text[cyan]}
      :: add[accents] // highlights % {color}(#FFD54F) -> {accents[yellow]}
    `,
    style: {
      background: "#0D1F2D",
      backgroundImage: "repeating-linear-gradient(...)",
      color: "#4FC3F7",
      fontFamily: "monospace",
    },
  },

  // MODERN95 - Retro Modern
  modern95: {
    trigger: "```camomodern95",
    metadata: `
      :: set[background] // content[all] % {color}(#2B2B2B) -> {visual[charcoal]}
      :: set[text] // color % {value}(#00FF41) -> {text[terminal_green]}
      :: apply[border] // style % {type}(solid) -> {border[retro]}
      :: add[scanlines] // animation % {speed}(slow) -> {effect[crt]}
    `,
    style: {
      background: "#2B2B2B",
      color: "#00FF41",
      border: "2px solid #555555",
      textShadow: "0 0 5px #00FF41",
    },
  },

  // GHOST - Semi-Transparent
  ghost: {
    trigger: "```camoghost",
    metadata: `
      :: set[opacity] // content[all] % {value}(0.15) -> {visual[translucent]}
      :: apply[blur] // backdrop % {intensity}(4px) -> {effect[blurred_bg]}
      :: reveal[hover] // opacity % {target}(1.0) -> {interaction[hover_reveal]}
    `,
    style: {
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(4px)",
      color: "rgba(0,0,0,0.3)",
    },
  },

  // MATRIX - Digital Rain
  matrix: {
    trigger: "```camomatrix",
    metadata: `
      :: set[background] // content[all] % {color}(#000000) -> {visual[black]}
      :: apply[rain] // effect % {characters}(katakana) -> {animation[rain]}
      :: set[text] // visibility % {hidden}(true) -> {content[hidden]}
      :: reveal[click] // animation % {type}(digital_fade) -> {ready}
    `,
    style: {
      background: "#000000",
      position: "relative",
      overflow: "hidden",
    },
  },

  // CLASSIFIED - Redacted Document
  classified: {
    trigger: "```camoclassified",
    metadata: `
      :: set[background] // content[all] % {color}(#F5F5DC) -> {visual[document]}
      :: apply[redaction] // bars % {coverage}(70%) -> {redacted[partial]}
      :: add[stamps] // watermark % {text}(CLASSIFIED) -> {stamps[added]}
      :: reveal[auth] // requirement % {level}(secret) -> {locked}
    `,
    style: {
      background: "#F5F5DC",
      color: "#000000",
      position: "relative",
    },
  },
};
