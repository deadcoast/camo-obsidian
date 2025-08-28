/**
 * CAMO Preset System
 * Central preset definitions and compatibility layer
 *
 * This module provides the core preset definitions and serves as a bridge
 * between the legacy preset format and the current PresetProcessor system.
 *
 * Integration with: processors/PresetProcessor.ts
 */

// Re-export for convenience
export type { CamoPreset } from "../processors/PresetProcessor";

// Legacy interface for backward compatibility
export interface Preset {
  trigger: string;
  metadata: string;
  style: {
    background: string;
    color: string;
    cursor: string;
  };
}

/**
 * Core preset identifiers - these should match the IDs used in PresetProcessor
 */
export const CORE_PRESET_IDS = [
  "blackout",
  "blueprint",
  "modern95",
  "ghost",
  "matrix",
  "classified",
] as const;

export type CorePresetId = (typeof CORE_PRESET_IDS)[number];

/**
 * Preset categories for organization
 */
export const PRESET_CATEGORIES = {
  PRIVACY: "privacy",
  AESTHETIC: "aesthetic",
  FUNCTIONAL: "functional",
} as const;

/**
 * Language triggers for Obsidian codeblock registration
 * Updated to use hyphenated format per Obsidian compliance
 */
export const PRESET_TRIGGERS = {
  blackout: "camo-blackout",
  blueprint: "camo-blueprint",
  modern95: "camo-modern95",
  ghost: "camo-ghost",
  matrix: "camo-matrix",
  classified: "camo-classified",
} as const;

/**
 * Legacy CORE_PRESETS for backward compatibility
 * @deprecated Use PresetProcessor.getPreset() instead
 */
export const CORE_PRESETS = {
  blackout: {
    trigger: PRESET_TRIGGERS.blackout,
    metadata: `:: set[background] // content[all] % {color}(#000000) -> {visual[blackout]}
:: set[opacity] // text[all] % {value}(0) -> {text[hidden]}
:: set[reveal] // trigger[click] % {animation}(fade) -> {interaction[ready]}`,
    style: {
      background: "#000000",
      color: "transparent",
      cursor: "pointer",
    },
  },
  ghost: {
    trigger: PRESET_TRIGGERS.ghost,
    metadata: `:: set[background] // content[all] % {color}(rgba(255,255,255,0.85)) -> {visual[ghost]}
:: apply[blur] // backdrop % {amount}(4px) -> {filter[applied]}
:: set[reveal] // trigger[hover] % {animation}(smooth) -> {interaction[ready]}`,
    style: {
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(4px)",
      color: "rgba(0,0,0,0.3)",
    },
  },
  blueprint: {
    trigger: PRESET_TRIGGERS.blueprint,
    metadata: `:: set[background] // content[all] % {color}(#0D1F2D) -> {visual[blueprint]}
:: apply[grid] // overlay % {spacing}(20px) -> {grid[applied]}
:: set[text] // color % {value}(#4FC3F7) -> {text[cyan]}`,
    style: {
      background: "#0D1F2D",
      color: "#4FC3F7",
      fontFamily: "monospace",
    },
  },
  modern95: {
    trigger: PRESET_TRIGGERS.modern95,
    metadata: `:: set[background] // content[all] % {color}(#2B2B2B) -> {visual[modern95]}
:: set[text] // color % {value}(#00FF41) -> {text[terminal]}
:: apply[border] // style % {retro}(true) -> {visual[framed]}`,
    style: {
      background: "#2B2B2B",
      color: "#00FF41",
      border: "2px solid #555555",
    },
  },
  matrix: {
    trigger: PRESET_TRIGGERS.matrix,
    metadata: `:: set[background] // content[all] % {color}(#000000) -> {visual[matrix]}
:: apply[animation] // rain % {cascade}(true) -> {effect[active]}
:: set[reveal] // trigger[click] % {stop_animation}(true) -> {interaction[ready]}`,
    style: {
      background: "#000000",
      color: "#00FF00",
      position: "relative",
    },
  },
  classified: {
    trigger: PRESET_TRIGGERS.classified,
    metadata: `:: set[background] // content[all] % {color}(#F5F5DC) -> {visual[document]}
:: apply[redaction] // bars % {coverage}(partial) -> {secure[redacted]}
:: set[reveal] // requirement % {authentication}(required) -> {access[gated]}`,
    style: {
      background: "#F5F5DC",
      color: "#000000",
      fontFamily: "monospace",
    },
  },
} as const;
