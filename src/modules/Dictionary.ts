export interface PresetDefinition {
  id: string;
  cssClass?: string;
  defaultMetadata: string[];
}

export interface CustomPresetLike {
  id: string;
  styles?: { background?: string; color?: string };
  effects?: { blur?: number };
}

export class CamoDictionary {
  private presets = new Map<string, PresetDefinition>();

  constructor() {
    // Built-ins mirrored from existing PRESET_DEFAULT_METADATA
    this.registerPreset({
      id: 'blackout',
      cssClass: 'camo-preset-blackout',
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#000000) -> {visual[blackout]}',
        ':: set[opacity] // text[all] % {value}(0) -> {text[hidden]}',
        ':: reveal[click] // content[all] % {animation}(fade) -> {interaction[ready]}',
      ],
    });
    this.registerPreset({
      id: 'blueprint',
      cssClass: 'camo-preset-blueprint',
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#0D1F2D) -> {visual[blueprint]}',
        ':: apply[grid] // overlay % {spacing}(20px) -> {grid[applied]}',
        ':: set[text] // color % {color}(#4FC3F7) -> {text[cyan]}',
      ],
    });
    this.registerPreset({
      id: 'modern95',
      cssClass: 'camo-preset-modern95',
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#2B2B2B) -> {visual[charcoal]}',
        ':: set[text] // color % {color}(#00FF41) -> {text[terminal_green]}',
      ],
    });
    this.registerPreset({
      id: 'ghost',
      cssClass: 'camo-preset-ghost',
      defaultMetadata: [
        ':: set[opacity] // content[all] % {value}(0.15) -> {visual[translucent]}',
        ':: reveal[hover] // opacity % {target}(1.0) -> {interaction[hover_reveal]}',
      ],
    });
    this.registerPreset({
      id: 'matrix',
      cssClass: 'camo-preset-matrix',
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#000000) -> {visual[black]}',
        ':: reveal[click] // animation % {type}(digital_fade) -> {ready}',
      ],
    });
    this.registerPreset({
      id: 'classified',
      cssClass: 'camo-preset-classified',
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#F5F5DC) -> {visual[document]}',
      ],
    });
  }

  registerPreset(def: PresetDefinition): void {
    this.presets.set(def.id, def);
  }

  registerCustomPreset(custom: CustomPresetLike): void {
    // Compile simple metadata from custom preset fields
    const md: string[] = [];
    if (custom.styles?.background) {
      md.push(
        `:: set[background] // content[all] % {color}(${custom.styles.background}) -> {visual[bg]}`
      );
    }
    if (custom.styles?.color) {
      md.push(`:: set[text] // color % {color}(${custom.styles.color}) -> {text[color]}`);
    }
    if (typeof custom.effects?.blur === 'number') {
      md.push(
        `:: set[blur] // content[all] % {intensity}(${custom.effects.blur}) -> {visual[blurred]}`
      );
    }
    this.registerPreset({ id: custom.id, defaultMetadata: md });
  }

  getPreset(id: string): PresetDefinition | undefined {
    return this.presets.get(id);
  }

  compilePreset(id: string): string[] {
    const p = this.presets.get(id);
    return p?.defaultMetadata ? [...p.defaultMetadata] : [];
  }

  getPresetIds(): string[] {
    return Array.from(this.presets.keys());
  }
}
