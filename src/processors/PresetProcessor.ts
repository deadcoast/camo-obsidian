/**
 * Preset Processor
 * Manages preset loading, application, and customization
 *
 * Based on specifications in Docs/6_userExperience.md
 */

export interface CamoPreset {
  id: string;
  name: string;
  category: 'privacy' | 'aesthetic' | 'functional';
  description: string;
  baseStyle: CamoStyle;
  defaultMetadata: string[];
  cssClass: string;
  styles: string;
  flags: string[];
  animations?: Animation[];
  interactions?: InteractionSet;
  fallbacks?: FallbackChain;
}

export interface CamoStyle {
  background: string;
  color: string;
  border?: string;
  padding?: string;
  margin?: string;
  fontFamily?: string;
  borderRadius?: string;
  boxShadow?: string;
  position?: string;
}

export interface Animation {
  name: string;
  duration: string;
  easing: string;
  keyframes: Record<string, Record<string, string>>;
}

export interface InteractionSet {
  hover?: Record<string, string>;
  click?: {
    action: string;
    transition: string;
  };
  keyboard?: Record<string, string>;
}

export interface FallbackChain {
  onError: string;
  onUnsupported: string;
  onMobile: string;
}

export class PresetProcessor {
  private presets: Map<string, CamoPreset> = new Map();
  private customPresets: Map<string, CamoPreset> = new Map();

  constructor() {
    this.initializeDefaultPresets();
  }

  /**
   * Initialize the default preset collection
   */
  private initializeDefaultPresets(): void {
    // Blackout Preset
    this.presets.set('blackout', {
      id: 'blackout',
      name: 'Blackout',
      category: 'privacy',
      description: 'Complete content hiding with solid black overlay',
      baseStyle: {
        background: '#000000',
        color: 'transparent',
        borderRadius: '4px',
        padding: '1em',
      },
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#000000) -> {visual[blackout]}',
        ':: set[opacity] // text[all] % {value}(0) -> {text[hidden]}',
        ':: set[reveal] // trigger[click] % {animation}(fade) -> {interaction[ready]}',
      ],
      cssClass: 'camo-preset-blackout',
      styles: `
        .camo-preset-blackout {
          background: #000000 !important;
          color: transparent !important;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .camo-preset-blackout:hover,
        .camo-preset-blackout.camo-revealed {
          background: var(--background-primary) !important;
          color: var(--text-normal) !important;
        }
      `,
      flags: ['click', 'hover'],
    });

    // Ghost Preset
    this.presets.set('ghost', {
      id: 'ghost',
      name: 'Ghost',
      category: 'aesthetic',
      description: 'Semi-transparent overlay with blur effect',
      baseStyle: {
        background: 'rgba(255,255,255,0.85)',
        color: 'rgba(0,0,0,0.3)',
        borderRadius: '4px',
        padding: '1em',
      },
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(rgba(255,255,255,0.85)) -> {visual[ghost]}',
        ':: apply[blur] // backdrop % {amount}(4px) -> {filter[applied]}',
        ':: set[reveal] // trigger[hover] % {animation}(smooth) -> {interaction[ready]}',
      ],
      cssClass: 'camo-preset-ghost',
      styles: `
        .camo-preset-ghost {
          background: rgba(255,255,255,0.85) !important;
          backdrop-filter: blur(4px);
          color: rgba(0,0,0,0.3) !important;
          transition: all 0.3s ease;
        }
        .camo-preset-ghost:hover,
        .camo-preset-ghost.camo-revealed {
          background: var(--background-primary) !important;
          color: var(--text-normal) !important;
          backdrop-filter: none;
        }
      `,
      flags: ['hover'],
    });

    // Blueprint Preset
    this.presets.set('blueprint', {
      id: 'blueprint',
      name: 'Blueprint',
      category: 'aesthetic',
      description: 'Technical blueprint aesthetic with grid patterns',
      baseStyle: {
        background: '#0D1F2D',
        color: '#4FC3F7',
        fontFamily: 'var(--font-monospace)',
        border: '2px solid #1E3A4C',
        padding: '1em',
      },
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#0D1F2D) -> {visual[blueprint]}',
        ':: apply[grid] // overlay % {spacing}(20px) -> {grid[applied]}',
        ':: set[text] // color % {value}(#4FC3F7) -> {text[cyan]}',
      ],
      cssClass: 'camo-preset-blueprint',
      styles: `
        .camo-preset-blueprint {
          background: #0D1F2D !important;
          background-image:
            repeating-linear-gradient(0deg,
              transparent,
              transparent 19px,
              #1E3A4C 19px,
              #1E3A4C 20px),
            repeating-linear-gradient(90deg,
              transparent,
              transparent 19px,
              #1E3A4C 19px,
              #1E3A4C 20px);
          color: #4FC3F7 !important;
          font-family: var(--font-monospace);
          border: 2px solid #1E3A4C;
        }
        .camo-preset-blueprint .camo-accent {
          color: #FFD54F !important;
        }
      `,
      flags: [],
    });

    // Modern95 Preset
    this.presets.set('modern95', {
      id: 'modern95',
      name: 'Modern95',
      category: 'aesthetic',
      description: 'Retro terminal meets modern design',
      baseStyle: {
        background: '#2B2B2B',
        color: '#00FF41',
        fontFamily: 'var(--font-monospace)',
        border: '2px solid #555555',
        boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.1)',
      },
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#2B2B2B) -> {visual[terminal]}',
        ':: set[text] // color % {value}(#00FF41) -> {text[green]}',
        ':: apply[border] // style % {retro}(true) -> {aesthetic[90s]}',
      ],
      cssClass: 'camo-preset-modern95',
      styles: `
        .camo-preset-modern95 {
          background: #2B2B2B !important;
          color: #00FF41 !important;
          font-family: var(--font-monospace);
          border: 2px solid #555555;
          box-shadow: inset 2px 2px 4px rgba(255,255,255,0.1);
        }
      `,
      flags: [],
    });

    // Matrix Preset
    this.presets.set('matrix', {
      id: 'matrix',
      name: 'Matrix',
      category: 'aesthetic',
      description: 'Digital rain effect with green cascading characters',
      baseStyle: {
        background: '#000000',
        color: '#00FF00',
        fontFamily: 'var(--font-monospace)',
        position: 'relative',
      },
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#000000) -> {visual[matrix]}',
        ':: apply[animation] // rain % {cascade}(true) -> {effect[active]}',
        ':: set[reveal] // trigger[click] % {stop_animation}(true) -> {interaction[ready]}',
      ],
      cssClass: 'camo-preset-matrix',
      styles: `
        .camo-preset-matrix {
          background: #000000 !important;
          color: #00FF00 !important;
          font-family: var(--font-monospace);
          position: relative;
          overflow: hidden;
        }
      `,
      flags: ['click'],
    });

    // Classified Preset
    this.presets.set('classified', {
      id: 'classified',
      name: 'Classified',
      category: 'privacy',
      description: 'Redacted document style with black bars',
      baseStyle: {
        background: '#F5F5DC',
        color: '#000000',
        fontFamily: 'Courier New, monospace',
        position: 'relative',
      },
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#F5F5DC) -> {visual[document]}',
        ':: apply[redaction] // bars % {random}(true) -> {pattern[applied]}',
        ':: add[watermark] // stamp % {text}(CLASSIFIED) -> {security[marked]}',
      ],
      cssClass: 'camo-preset-classified',
      styles: `
        .camo-preset-classified {
          background: #F5F5DC !important;
          color: #000000 !important;
          font-family: 'Courier New', monospace;
          position: relative;
        }
        .camo-preset-classified::before {
          content: 'CLASSIFIED';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 3em;
          font-weight: bold;
          color: rgba(255, 0, 0, 0.3);
          pointer-events: none;
          z-index: 1;
        }
      `,
      flags: ['redact'],
    });
  }

  /**
   * Get a preset by ID
   */
  getPreset(id: string): CamoPreset | null {
    return this.presets.get(id) || this.customPresets.get(id) || null;
  }

  /**
   * Get all available presets
   */
  getAllPresets(): CamoPreset[] {
    return [...Array.from(this.presets.values()), ...Array.from(this.customPresets.values())];
  }

  /**
   * Get all preset IDs
   */
  getAllPresetIds(): string[] {
    return [...Array.from(this.presets.keys()), ...Array.from(this.customPresets.keys())];
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: CamoPreset['category']): CamoPreset[] {
    return this.getAllPresets().filter(preset => preset.category === category);
  }

  /**
   * Remove a preset (only custom presets can be removed)
   */
  removePreset(presetId: string): boolean {
    if (this.customPresets.has(presetId)) {
      this.customPresets.delete(presetId);
      return true;
    }
    return false; // Can't remove built-in presets
  }

  /**
   * Register a custom preset
   */
  registerCustomPreset(preset: CamoPreset): void {
    this.customPresets.set(preset.id, preset);
  }

  /**
   * Add a preset (alias for registerCustomPreset for consistency)
   */
  addPreset(preset: CamoPreset): void {
    this.registerCustomPreset(preset);
  }

  /**
   * Get all custom presets
   */
  getCustomPresets(): CamoPreset[] {
    return Array.from(this.customPresets.values());
  }

  /**
   * Remove a custom preset
   */
  removeCustomPreset(id: string): boolean {
    return this.customPresets.delete(id);
  }

  /**
   * Apply preset configuration to an element
   */
  applyPreset(element: HTMLElement, presetId: string, overrides?: Partial<CamoStyle>): boolean {
    const preset = this.getPreset(presetId);
    if (!preset) {
      console.warn(`Preset not found: ${presetId}`);
      return false;
    }

    // Add preset CSS class
    element.addClass(preset.cssClass);

    // Apply base styles with overrides
    const finalStyle = { ...preset.baseStyle, ...overrides };
    Object.entries(finalStyle).forEach(([property, value]) => {
      if (value) {
        const cssProperty = this.camelToKebab(property);
        element.style.setProperty(cssProperty, value);
      }
    });

    return true;
  }

  /**
   * Get combined CSS for all presets
   */
  getAllPresetStyles(): string {
    return this.getAllPresets()
      .map(preset => preset.styles)
      .join('\n');
  }

  /**
   * Validate preset structure
   */
  validatePreset(preset: unknown): preset is CamoPreset {
    const required = ['id', 'name', 'category', 'baseStyle', 'cssClass', 'styles'];
    return required.every(field => preset && typeof preset === 'object' && field in preset);
  }

  /**
   * Convert camelCase to kebab-case for CSS properties
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Create a new preset based on an existing one
   */
  createVariant(
    basePresetId: string,
    variantId: string,
    modifications: Partial<CamoPreset>
  ): CamoPreset | null {
    const basePreset = this.getPreset(basePresetId);
    if (!basePreset) {
      return null;
    }

    const variant: CamoPreset = {
      ...basePreset,
      id: variantId,
      name: modifications.name || `${basePreset.name} Variant`,
      ...modifications,
    };

    this.registerCustomPreset(variant);
    return variant;
  }

  /**
   * Export preset for sharing
   */
  exportPreset(id: string): string | null {
    const preset = this.getPreset(id);
    if (!preset) {
      return null;
    }

    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import preset from JSON
   */
  importPreset(presetJson: string): boolean {
    try {
      const preset = JSON.parse(presetJson);
      if (this.validatePreset(preset)) {
        this.registerCustomPreset(preset);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import preset:', error);
      return false;
    }
  }
}
