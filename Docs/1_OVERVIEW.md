# CAMO Complete Design Specification v4.0

Obsidian-Compliant `camo` Implementation Plan

---

## Document Navigation

### system-index

1. [OVERVIEW](OVERVIEW.md) - OVERVIEW OF FULL CAMO SYTEMS
2. [ALLABOUT-camoMetaData](ALLABOUT-camoMetaData.md) - "GettingStarted" style document on `camoMetaData`
3. [camoMetaData](camoMetaData.md) - Dedidated `camoMetaData` syntax document
4. [nestingRules](nestingRules.md) - `nestingRules` for the `camoMetaData` syntax
5. [systemArchitecture](systemArchitecture.md) - Techtical implementation breakdown of the sourcecode
6. [userExperience](userExperience.md) - Enhancements for user QOL

### table-of-contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Obsidian API Compliance](#obsidian-api-compliance)
3. [Core Component Hierarchy](#core-component-hierarchy)
4. [Three-Tier User Experience System](#three-tier-user-experience)
5. [Module Specifications](#module-specifications)
6. [Syntax Implementation](#syntax-implementation)
7. [Integration Architecture](#integration-architecture)
8. [Quality of Life Features](#quality-of-life-features)
9. [Performance & Optimization](#performance-optimization)
10. [Deployment Strategy](#deployment-strategy)

---

### system-architecture-overview

### Core Philosophy

CAMO operates as a **comprehensive camouflage system** for Obsidian codeblocks, providing layered privacy and aesthetic control through a meticulously designed three-tier complexity system, fully compliant with Obsidian's plugin API restrictions.

### Architectural Principles

```yaml
design_principles:
  COMS: "Comprehensive Organized Modular Structure"
  SRP: "Single Responsibility Principle"
  OAC: "Obsidian API Compliance - All operations through official API"
  DRY: "Don't Repeat Yourself"
  KISS: "Keep It Simple, Stupid (for users, not code)"
  
core_relationship:
  camo: "Parent application - HTML-like structure"
  camoMetaData: "Content-based styling syntax - CSS-like customization"
  camoPreset: "Pre-built templates - Bootstrap-like convenience"
  presetFlag: "Content-line modifiers - CSS classes for rapid adjustment"
  
obsidian_constraints:
  codeblock_params: "Cannot use parameters after language identifier"
  processor_timing: "Fires on every character - requires debouncing"
  dom_access: "Must use Obsidian API, not direct DOM manipulation"
  storage: "Use plugin data.json, not localStorage"
```

### System Hierarchy (Obsidian-Compliant)

```text
CAMO Plugin System
├── Obsidian Plugin Interface
│   ├── Plugin Class Extension
│   ├── CodeBlock Processors
│   └── Settings Tab
├── Core Engine (camo)
│   ├── Content Parser (not language params)
│   ├── Debounced Renderer
│   └── Obsidian State Manager
├── Customization Layer (camoMetaData)
│   ├── Content-Line Parser
│   ├── CSS Effect Processor
│   └── Style Injector
├── Template System (camoPreset)
│   ├── Language Variants (camo-blackout, etc.)
│   ├── Preset Compiler
│   └── Community Sharing (GitHub)
└── Modifier System (presetFlag)
    ├── First-Line Parser
    ├── Modifier Chain
    └── CSS Class Application
```

---

## obsidian-api-compliance

### Critical Compliance Requirements

```typescript
interface ObsidianCompliance {
  // RESTRICTION: No parameters after language identifier
  // SOLUTION: Parse flags from first line of content
  codeblockSyntax: {
    correct: '```camo-blackout',
    incorrect: '```camo-blackout--blur--hover', // NOT SUPPORTED
    solution: 'Parse --blur --hover from first content line'
  };
  
  // RESTRICTION: Processor fires on every character
  // SOLUTION: Implement debouncing
  processorBehavior: {
    issue: 'Fires constantly during typing',
    solution: 'Debounce with 500ms delay',
    implementation: 'Cache and compare content hash'
  };
  
  // RESTRICTION: No direct DOM manipulation
  // SOLUTION: Use Obsidian's createEl and container methods
  domAccess: {
    incorrect: 'document.createElement()',
    correct: 'el.createDiv() or createEl()',
    styling: 'Use CSS classes, not inline styles'
  };
  
  // RESTRICTION: No localStorage or sessionStorage
  // SOLUTION: Use plugin's loadData/saveData
  storage: {
    incorrect: 'localStorage.setItem()',
    correct: 'this.loadData() and this.saveData()',
    location: 'VaultFolder/.obsidian/plugins/camo/data.json'
  };
}
```

### Compliant Language Registration

```typescript
// CORRECT: Obsidian-compliant registration
const VALID_LANGUAGES = [
  'camo',           // Base processor
  'camo-blackout',  // Preset processors
  'camo-blueprint',
  'camo-modern95',
  'camo-ghost',
  'camo-matrix',
  'camo-classified'
];

// Each must be registered separately
VALID_LANGUAGES.forEach(lang => {
  this.registerMarkdownCodeBlockProcessor(lang, processor);
});
```

---

## Core Component Hierarchy

### 1. Base CAMO Plugin (`/src/main.ts`)

```typescript
import { Plugin, MarkdownPostProcessorContext, PluginSettingTab, Setting } from 'obsidian';

export default class CamoPlugin extends Plugin {
  settings: CamoSettings;
  private processorCache: Map<string, ProcessorCache> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  async onload() {
    // Load settings from Obsidian's data.json
    await this.loadSettings();
    
    // Register base processor
    this.registerMarkdownCodeBlockProcessor('camo', 
      this.createDebouncedProcessor(this.processCAMOBlock.bind(this))
    );
    
    // Register preset processors (hyphenated for Obsidian compliance)
    const presets = ['blackout', 'blueprint', 'modern95', 'ghost', 'matrix', 'classified'];
    presets.forEach(preset => {
      this.registerMarkdownCodeBlockProcessor(`camo-${preset}`,
        this.createDebouncedProcessor((source, el, ctx) => 
          this.processPresetBlock(preset, source, el, ctx)
        )
      );
    });
    
    // Add settings tab
    this.addSettingTab(new CamoSettingTab(this.app, this));
    
    // Add CSS to document
    this.injectStyles();
    
    // Register commands
    this.addCommand({
      id: 'reveal-all-camo',
      name: 'Reveal all CAMO blocks',
      callback: () => this.revealAllBlocks()
    });
    
    this.addCommand({
      id: 'hide-all-camo',
      name: 'Hide all CAMO blocks',
      callback: () => this.hideAllBlocks()
    });
  }
  
  // Debounced processor to prevent constant re-rendering
  private createDebouncedProcessor(
    processor: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void
  ) {
    return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      const hash = this.hashContent(source);
      const cacheKey = `${ctx.docId}-${ctx.sectionInfo?.lineStart}`;
      
      // Check if content changed
      const cached = this.processorCache.get(cacheKey);
      if (cached && cached.hash === hash && !cached.expired) {
        return; // Skip re-processing
      }
      
      // Clear existing timer
      if (this.debounceTimers.has(cacheKey)) {
        clearTimeout(this.debounceTimers.get(cacheKey)!);
      }
      
      // Set new debounced execution
      const timer = setTimeout(() => {
        processor(source, el, ctx);
        this.processorCache.set(cacheKey, {
          hash,
          timestamp: Date.now(),
          expired: false
        });
        this.debounceTimers.delete(cacheKey);
      }, 500); // 500ms debounce
      
      this.debounceTimers.set(cacheKey, timer);
    };
  }
  
  private async processCAMOBlock(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    // Parse content-based configuration (Obsidian-compliant)
    const lines = source.split('\n');
    let flags: string[] = [];
    let metadata: string[] = [];
    let contentStart = 0;
    
    // Check first line for flags (--flag syntax)
    if (lines[0] && lines[0].trim().startsWith('--')) {
      flags = lines[0].trim().split(/\s+/)
        .filter(f => f.startsWith('--'))
        .map(f => f.substring(2));
      contentStart = 1;
    }
    
    // Extract camoMetaData (:: syntax lines)
    while (contentStart < lines.length) {
      const line = lines[contentStart].trim();
      if (line.startsWith('::') || line.startsWith(':^:')) {
        metadata.push(line);
        contentStart++;
      } else {
        break;
      }
    }
    
    // Get actual content
    const content = lines.slice(contentStart).join('\n');
    
    // Create container using Obsidian API
    const container = el.createDiv('camo-block');
    container.setAttribute('data-camo-id', this.generateBlockId());
    
    // Apply configuration
    await this.applyConfiguration(container, {
      flags,
      metadata,
      content,
      settings: this.settings
    });
  }
  
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

### 2. Visual Camouflage Module (CSS-Based)

```typescript
class VisualCamouflage {
  // All effects implemented via CSS classes, not direct DOM manipulation
  private effectClasses = {
    blur: 'camo-effect-blur',
    pixelate: 'camo-effect-pixelate',
    scramble: 'camo-effect-scramble',
    glitch: 'camo-effect-glitch',
    redact: 'camo-effect-redact',
    matrix: 'camo-effect-matrix'
  };
  
  applyEffect(
    element: HTMLElement,
    effect: string,
    parameters: EffectParameters
  ): void {
    // Add CSS class instead of inline styles
    element.addClass(this.effectClasses[effect]);
    
    // Use CSS variables for parameters
    if (parameters.intensity) {
      element.style.setProperty('--camo-intensity', parameters.intensity.toString());
    }
    if (parameters.color) {
      element.style.setProperty('--camo-color', parameters.color);
    }
  }
  
  // CSS is injected once at plugin load
  getEffectStyles(): string {
    return `
      .camo-effect-blur {
        filter: blur(calc(var(--camo-intensity, 5) * 1px));
      }
      
      .camo-effect-pixelate {
        image-rendering: pixelated;
        filter: contrast(1000%) blur(1px) contrast(100%);
      }
      
      .camo-effect-scramble {
        position: relative;
        animation: camo-scramble 0.5s infinite;
      }
      
      @keyframes camo-scramble {
        0%, 100% { content: attr(data-original); }
        25% { content: attr(data-scramble1); }
        50% { content: attr(data-scramble2); }
        75% { content: attr(data-scramble3); }
      }
      
      .camo-effect-glitch {
        animation: camo-glitch 2s infinite;
      }
      
      @keyframes camo-glitch {
        0%, 100% { 
          text-shadow: 0.05em 0 0 rgba(255,0,0,0.75),
                      -0.05em -0.025em 0 rgba(0,255,0,0.75),
                      0.025em 0.05em 0 rgba(0,0,255,0.75);
        }
        14% {
          text-shadow: 0.05em 0 0 rgba(255,0,0,0.75),
                      -0.05em -0.025em 0 rgba(0,255,0,0.75),
                      0.025em 0.05em 0 rgba(0,0,255,0.75);
        }
        15% {
          text-shadow: -0.05em -0.025em 0 rgba(255,0,0,0.75),
                      0.025em 0.025em 0 rgba(0,255,0,0.75),
                      -0.05em -0.05em 0 rgba(0,0,255,0.75);
        }
      }
    `;
  }
}
```

### 3. CamoDictionary Module (Preset Definitions)

```typescript
class CamoDictionary {
  // Preset definitions with content-based metadata
  private presets: Map<string, CamoPreset> = new Map([
    ['blackout', {
      id: 'blackout',
      name: 'Blackout',
      category: 'privacy',
      // Metadata that will be prepended to content
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#000000) -> {visual[blackout]}',
        ':: set[opacity] // text[all] % {value}(0) -> {text[hidden]}',
        ':: set[reveal] // trigger[click] % {animation}(fade) -> {interaction[ready]}'
      ],
      cssClass: 'camo-preset-blackout',
      styles: `
        .camo-preset-blackout {
          background: #000000 !important;
          color: transparent !important;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .camo-preset-blackout:hover {
          color: var(--text-normal) !important;
        }
        .camo-preset-blackout.camo-revealed {
          background: var(--background-primary) !important;
          color: var(--text-normal) !important;
        }
      `
    }],
    ['blueprint', {
      id: 'blueprint',
      name: 'Blueprint',
      category: 'aesthetic',
      defaultMetadata: [
        ':: set[background] // content[all] % {color}(#0D1F2D) -> {visual[blueprint]}',
        ':: apply[grid] // overlay % {spacing}(20px) -> {grid[applied]}',
        ':: set[text] // color % {value}(#4FC3F7) -> {text[cyan]}'
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
          padding: 20px;
          border: 2px solid #1E3A4C;
        }
        .camo-preset-blueprint .camo-accent {
          color: #FFD54F !important;
        }
      `
    }],
    // ... other presets following same pattern
  ]);
  
  getPreset(name: string): CamoPreset | null {
    return this.presets.get(name) || null;
  }
  
  // Generate CSS for all presets
  getAllPresetStyles(): string {
    return Array.from(this.presets.values())
      .map(preset => preset.styles)
      .join('\n');
  }
}
```

### 4. Content Parser Module (Obsidian-Compliant)

```typescript
class CamoContentParser {
  // Parse flags from first line of content (not language line)
  parseFlags(firstLine: string): string[] {
    if (!firstLine.trim().startsWith('--')) {
      return [];
    }
    
    return firstLine.trim()
      .split(/\s+/)
      .filter(token => token.startsWith('--'))
      .map(flag => {
        const [name, value] = flag.substring(2).split(':');
        return { name, value };
      });
  }
  
  // Parse camoMetaData from content lines
  parseMetadata(lines: string[]): ParsedMetadata {
    const statements: Statement[] = [];
    let currentIndex = 0;
    
    while (currentIndex < lines.length) {
      const line = lines[currentIndex].trim();
      
      // Check for metadata syntax
      if (!line.startsWith('::') && !line.startsWith(':^:')) {
        break;
      }
      
      const statement = this.parseStatement(line);
      statements.push(statement);
      currentIndex++;
    }
    
    return {
      statements,
      endIndex: currentIndex
    };
  }
  
  // Parse individual metadata statement
  private parseStatement(line: string): Statement {
    // Pattern: :: keyword[variable] // function % {action}(params) -> {outcome}
    const pattern = /^(::|\:\^:)\s+(\w+)\[([^\]]*)\]\s*\/\/\s*([^%]+)\s*%\s*\{([^}]+)\}\(([^)]*)\)\s*->\s*\{([^}]+)\}/;
    const match = line.match(pattern);
    
    if (!match) {
      return { type: 'invalid', raw: line };
    }
    
    return {
      type: 'statement',
      operator: match[1],
      keyword: match[2],
      variable: match[3],
      function: match[4].trim(),
      action: match[5],
      parameters: match[6],
      outcome: match[7]
    };
  }
}
```

---

## three-tier-user-experience

### Tier 1: camoPreset (Casual Users)

#### Obsidian-Compliant Preset Usage

````markdown
```camo-blackout
Your content here is completely hidden
Click to reveal
```
````

````markdown
```camo-blueprint
Technical documentation
With blueprint aesthetic
```
````

#### Implementation Pattern

```typescript
class CamoPresetProcessor {
  // Each preset is a separate language for Obsidian compliance
  registerPresets(plugin: Plugin) {
    const presets = this.dictionary.getAllPresets();
    
    presets.forEach(preset => {
      // Register as camo-[preset] not camo[preset]
      plugin.registerMarkdownCodeBlockProcessor(
        `camo-${preset.id}`,
        (source, el, ctx) => {
          // Apply preset configuration
          this.applyPreset(preset, source, el, ctx);
        }
      );
    });
  }
  
  private applyPreset(
    preset: CamoPreset,
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    // Create container
    const container = el.createDiv(`camo-block ${preset.cssClass}`);
    
    // Check for inline overrides in content
    const lines = source.split('\n');
    let contentStart = 0;
    
    // Parse any flags from first line
    if (lines[0] && lines[0].trim().startsWith('--')) {
      const flags = this.parser.parseFlags(lines[0]);
      this.applyFlags(container, flags);
      contentStart = 1;
    }
    
    // Apply preset metadata
    const metadata = [...preset.defaultMetadata];
    
    // Check for additional inline metadata
    while (contentStart < lines.length) {
      if (lines[contentStart].trim().startsWith('::')) {
        metadata.push(lines[contentStart]);
        contentStart++;
      } else {
        break;
      }
    }
    
    // Process metadata
    this.processMetadata(container, metadata);
    
    // Add content
    const content = lines.slice(contentStart).join('\n');
    const contentEl = container.createDiv('camo-content');
    contentEl.setText(content);
  }
}
```

### Tier 2: presetFlag (Intermediate Users)

#### Obsidian-Compliant Flag Syntax

Since we cannot use parameters after the language identifier, flags go in the first line of content:

````markdown
```camo-blackout
--blur --hover --timer:5
Your hidden content here
```
````

#### Flag Processing Implementation

```typescript
class PresetFlagProcessor {
  // Parse flags from content line, not language line
  processFlags(
    container: HTMLElement,
    flags: Flag[]
  ): void {
    flags.forEach(flag => {
      switch (flag.name) {
        // Visual modifiers - add CSS classes
        case 'blur':
          container.addClass('camo-mod-blur');
          if (flag.value) {
            container.style.setProperty('--blur-amount', flag.value);
          }
          break;
          
        case 'peek':
          container.addClass('camo-mod-peek');
          break;
          
        case 'flash':
          container.addClass('camo-mod-flash');
          break;
          
        // Interaction modifiers
        case 'hover':
          container.addClass('camo-trigger-hover');
          break;
          
        case 'click':
          container.addClass('camo-trigger-click');
          break;
          
        case 'timer':
          container.addClass('camo-trigger-timer');
          container.setAttribute('data-timer', flag.value || '5');
          this.setupTimer(container, parseInt(flag.value || '5'));
          break;
          
        // Layout modifiers
        case 'compact':
          container.addClass('camo-layout-compact');
          break;
          
        case 'wide':
          container.addClass('camo-layout-wide');
          break;
      }
    });
  }
  
  // CSS for flag modifiers
  getFlagStyles(): string {
    return `
      /* Visual Modifiers */
      .camo-mod-blur {
        filter: blur(calc(var(--blur-amount, 4) * 1px));
      }
      
      .camo-mod-peek {
        background: #000000 !important;
        color: transparent !important;
      }
      .camo-mod-peek:hover {
        background: var(--background-primary) !important;
        color: var(--text-normal) !important;
      }
      
      .camo-mod-flash {
        animation: camo-flash 0.5s;
      }
      
      @keyframes camo-flash {
        0% { background: white; }
        100% { background: var(--background-primary); }
      }
      
      /* Interaction Triggers */
      .camo-trigger-hover {
        transition: all 0.3s ease;
      }
      .camo-trigger-hover:not(:hover) .camo-content {
        opacity: 0;
      }
      
      .camo-trigger-click {
        cursor: pointer;
      }
      .camo-trigger-click:not(.revealed) .camo-content {
        display: none;
      }
      
      /* Layout Modifiers */
      .camo-layout-compact {
        padding: 0.5em !important;
        margin: 0.25em 0 !important;
      }
      
      .camo-layout-wide {
        width: 100% !important;
        max-width: none !important;
      }
    `;
  }
}
```

### Tier 3: camoMetaData (Power Users)

#### Obsidian-Compliant Inline Syntax

camoMetaData is parsed from the content, not from codeblock parameters:

````markdown
```camo
:: set[blur] // content[all] % {intensity}(60) -> {visual[blurred]}
 :^: blur // IF{hover} % {remove}(true) -> {visual[clear]}
:: protect[content] // text[sensitive] % {redact}(true) -> {secure[redacted]}

Your actual content starts here
After all the metadata instructions
```
````

---

## Module Specifications

### CSS-Based Visual Effects Engine

```typescript
class VisualEffectsEngine {
  private styleElement: HTMLStyleElement;
  
  // Initialize with all effect styles
  initialize(plugin: Plugin) {
    // Create style element
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'camo-styles';
    
    // Build complete CSS
    const css = [
      this.getBaseStyles(),
      this.getEffectStyles(),
      this.getPresetStyles(),
      this.getModifierStyles(),
      this.getAnimationStyles()
    ].join('\n');
    
    this.styleElement.textContent = css;
    document.head.appendChild(this.styleElement);
  }
  
  // All effects use CSS, not JavaScript manipulation
  private getEffectStyles(): string {
    return `
      /* Base effects using CSS only */
      .camo-effect-blur { filter: blur(var(--intensity, 5px)); }
      .camo-effect-pixelate { image-rendering: pixelated; }
      .camo-effect-scramble::before { 
        content: attr(data-scrambled);
        animation: scramble 0.5s infinite;
      }
      
      /* Compound effects */
      .camo-effect-matrix {
        position: relative;
        overflow: hidden;
      }
      .camo-effect-matrix::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,...') repeat;
        animation: matrix-rain 20s linear infinite;
        pointer-events: none;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .camo-effect-blur { filter: blur(3px); }
        .camo-effect-matrix::before { animation-duration: 30s; }
      }
      
      /* Respect Obsidian theme */
      .theme-dark .camo-effect-blur {
        filter: blur(var(--intensity, 5px)) brightness(0.8);
      }
      .theme-light .camo-effect-blur {
        filter: blur(var(--intensity, 5px)) brightness(1.2);
      }
    `;
  }
}
```

### Obsidian State Management

```typescript
class CamoStateManager {
  private plugin: Plugin;
  private state: CamoState;
  
  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }
  
  // Load state from Obsidian's data.json
  async loadState(): Promise<void> {
    const data = await this.plugin.loadData();
    this.state = data?.state || this.getDefaultState();
  }
  
  // Save state to Obsidian's data.json
  async saveState(): Promise<void> {
    const data = await this.plugin.loadData();
    await this.plugin.saveData({
      ...data,
      state: this.state
    });
  }
  
  // Block-specific state
  setBlockState(blockId: string, state: BlockState): void {
    if (!this.state.blocks) {
      this.state.blocks = {};
    }
    this.state.blocks[blockId] = {
      ...state,
      timestamp: Date.now()
    };
    this.saveState();
  }
  
  getBlockState(blockId: string): BlockState | null {
    return this.state.blocks?.[blockId] || null;
  }
  
  // Clean old states
  cleanupOldStates(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const blocks = this.state.blocks || {};
    
    Object.keys(blocks).forEach(id => {
      if (now - blocks[id].timestamp > maxAge) {
        delete blocks[id];
      }
    });
    
    this.saveState();
  }
}
```

---

## Syntax Implementation

### Obsidian-Compliant Parser Architecture

```typescript
class CamoParser {
  // Main parse entry point - content-based parsing
  parse(source: string, languageHint: string): ParseResult {
    const lines = source.split('\n');
    let currentLine = 0;
    
    // Determine input type from language hint
    const type = this.detectType(languageHint);
    
    const result: ParseResult = {
      type,
      flags: [],
      metadata: [],
      content: '',
      preset: null
    };
    
    // Parse flags from first line if present
    if (lines[0] && lines[0].trim().startsWith('--')) {
      result.flags = this.parseFlags(lines[0]);
      currentLine = 1;
    }
    
    // Parse metadata lines
    while (currentLine < lines.length) {
      const line = lines[currentLine].trim();
      if (line.startsWith('::') || line.startsWith(':^:')) {
        result.metadata.push(line);
        currentLine++;
      } else {
        break;
      }
    }
    
    // Remaining lines are content
    result.content = lines.slice(currentLine).join('\n');
    
    // Set preset if applicable
    if (languageHint.startsWith('camo-')) {
      result.preset = languageHint.substring(5);
    }
    
    return result;
  }
  
  private detectType(language: string): ParseType {
    if (language === 'camo') {
      return 'base';
    } else if (language.startsWith('camo-')) {
      return 'preset';
    }
    return 'unknown';
  }
  
  // Parse flags from content line
  private parseFlags(line: string): Flag[] {
    return line.trim()
      .split(/\s+/)
      .filter(token => token.startsWith('--'))
      .map(token => {
        const flag = token.substring(2);
        const [name, value] = flag.split(':');
        return { name, value };
      });
  }
}
```

---

## Integration Architecture

### Complete Obsidian Plugin Implementation

```typescript
import { 
  Plugin, 
  MarkdownPostProcessorContext,
  PluginSettingTab,
  App,
  Setting,
  Notice
} from 'obsidian';

interface CamoSettings {
  defaultPreset: string;
  revealOnHover: boolean;
  enableAnimations: boolean;
  performanceMode: boolean;
  debugMode: boolean;
}

const DEFAULT_SETTINGS: CamoSettings = {
  defaultPreset: 'ghost',
  revealOnHover: true,
  enableAnimations: true,
  performanceMode: false,
  debugMode: false
};

export default class CamoPlugin extends Plugin {
  settings: CamoSettings;
  private parser: CamoParser;
  private renderer: CamoRenderer;
  private stateManager: CamoStateManager;
  private effectEngine: VisualEffectsEngine;
  private dictionary: CamoDictionary;
  
  async onload() {
    console.log('Loading CAMO plugin');
    
    // Initialize components
    this.parser = new CamoParser();
    this.renderer = new CamoRenderer(this);
    this.stateManager = new CamoStateManager(this);
    this.effectEngine = new VisualEffectsEngine();
    this.dictionary = new CamoDictionary();
    
    // Load settings
    await this.loadSettings();
    
    // Initialize CSS
    this.effectEngine.initialize(this);
    
    // Register base processor with debouncing
    this.registerMarkdownCodeBlockProcessor('camo',
      this.createDebouncedProcessor(async (source, el, ctx) => {
        try {
          const parsed = this.parser.parse(source, 'camo');
          await this.renderer.render(parsed, el, ctx);
        } catch (error) {
          this.handleError(error, el);
        }
      })
    );
    
    // Register preset processors
    const presets = this.dictionary.getAllPresetIds();
    presets.forEach(presetId => {
      this.registerMarkdownCodeBlockProcessor(`camo-${presetId}`,
        this.createDebouncedProcessor(async (source, el, ctx) => {
          try {
            const parsed = this.parser.parse(source, `camo-${presetId}`);
            await this.renderer.render(parsed, el, ctx);
          } catch (error) {
            this.handleError(error, el);
          }
        })
      );
    });
    
    // Add commands
    this.addCommand({
      id: 'camo-reveal-all',
      name: 'Reveal all CAMO blocks',
      callback: () => {
        document.querySelectorAll('.camo-block').forEach(block => {
          block.addClass('camo-revealed');
        });
        new Notice('All CAMO blocks revealed');
      }
    });
    
    this.addCommand({
      id: 'camo-hide-all',
      name: 'Hide all CAMO blocks',
      callback: () => {
        document.querySelectorAll('.camo-block').forEach(block => {
          block.removeClass('camo-revealed');
        });
        new Notice('All CAMO blocks hidden');
      }
    });
    
    // Add settings tab
    this.addSettingTab(new CamoSettingTab(this.app, this));
    
    // Register event handlers
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.refreshBlocks();
      })
    );
    
    // Clean up old states periodically
    this.registerInterval(
      window.setInterval(() => {
        this.stateManager.cleanupOldStates();
      }, 60 * 60 * 1000) // Every hour
    );
  }
  
  onunload() {
    console.log('Unloading CAMO plugin');
    // Clean up styles
    const styleEl = document.getElementById('camo-styles');
    if (styleEl) {
      styleEl.remove();
    }
  }
  
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  private createDebouncedProcessor(
    processor: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => Promise<void>
  ): (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void {
    const cache = new Map<string, { hash: string; timer?: NodeJS.Timeout }>();
    
    return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      const hash = this.hashContent(source);
      const key = `${ctx.docId}-${ctx.sectionInfo?.lineStart || 0}`;
      
      const cached = cache.get(key);
      if (cached && cached.hash === hash) {
        return; // Content unchanged
      }
      
      // Clear existing timer
      if (cached?.timer) {
        clearTimeout(cached.timer);
      }
      
      // Set new timer
      const timer = setTimeout(async () => {
        await processor(source, el, ctx);
        cache.set(key, { hash });
      }, 500);
      
      cache.set(key, { hash, timer });
    };
  }
  
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  private handleError(error: Error, el: HTMLElement) {
    console.error('CAMO Error:', error);
    
    if (this.settings.debugMode) {
      const errorEl = el.createDiv('camo-error');
      errorEl.setText(`CAMO Error: ${error.message}`);
    }
    
    // Fallback to plain text
    el.addClass('camo-fallback');
  }
  
  private refreshBlocks() {
    // Re-process visible blocks after layout change
    document.querySelectorAll('.camo-block').forEach((block: HTMLElement) => {
      const blockId = block.getAttribute('data-camo-id');
      if (blockId) {
        const state = this.stateManager.getBlockState(blockId);
        if (state) {
          this.renderer.applyState(block, state);
        }
      }
    });
  }
}

// Settings Tab
class CamoSettingTab extends PluginSettingTab {
  plugin: CamoPlugin;
  
  constructor(app: App, plugin: CamoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'CAMO Settings' });
    
    new Setting(containerEl)
      .setName('Default preset')
      .setDesc('Default preset for new CAMO blocks')
      .addDropdown(dropdown => dropdown
        .addOptions({
          'blackout': 'Blackout',
          'blueprint': 'Blueprint',
          'modern95': 'Modern95',
          'ghost': 'Ghost',
          'matrix': 'Matrix',
          'classified': 'Classified'
        })
        .setValue(this.plugin.settings.defaultPreset)
        .onChange(async (value) => {
          this.plugin.settings.defaultPreset = value;
          await this.plugin.saveSettings();
        })
      );
    
    new Setting(containerEl)
      .setName('Reveal on hover')
      .setDesc('Automatically reveal content on mouse hover')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.revealOnHover)
        .onChange(async (value) => {
          this.plugin.settings.revealOnHover = value;
          await this.plugin.saveSettings();
        })
      );
    
    new Setting(containerEl)
      .setName('Enable animations')
      .setDesc('Enable visual animations and effects')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableAnimations)
        .onChange(async (value) => {
          this.plugin.settings.enableAnimations = value;
          await this.plugin.saveSettings();
        })
      );
    
    new Setting(containerEl)
      .setName('Performance mode')
      .setDesc('Reduce visual effects for better performance')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.performanceMode)
        .onChange(async (value) => {
          this.plugin.settings.performanceMode = value;
          await this.plugin.saveSettings();
        })
      );
    
    new Setting(containerEl)
      .setName('Debug mode')
      .setDesc('Show error messages in blocks')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.debugMode)
        .onChange(async (value) => {
          this.plugin.settings.debugMode = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
```

---

## Quality of Life Features

### 1. Preset Builder (Modal-Based)

```typescript
import { Modal, App, Setting } from 'obsidian';

class CamoPresetBuilderModal extends Modal {
  private plugin: CamoPlugin;
  private preset: CustomPreset;
  
  constructor(app: App, plugin: CamoPlugin) {
    super(app);
    this.plugin = plugin;
    this.preset = this.createEmptyPreset();
  }
  
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    contentEl.createEl('h2', { text: 'CAMO Preset Builder' });
    
    // Name input
    new Setting(contentEl)
      .setName('Preset name')
      .setDesc('Unique identifier for your preset')
      .addText(text => text
        .setPlaceholder('my-preset')
        .onChange(value => {
          this.preset.id = value;
        })
      );
    
    // Visual settings
    contentEl.createEl('h3', { text: 'Visual Settings' });
    
    new Setting(contentEl)
      .setName('Background color')
      .addText(text => text
        .setPlaceholder('#000000')
        .onChange(value => {
          this.preset.styles.background = value;
        })
      );
    
    new Setting(contentEl)
      .setName('Text color')
      .addText(text => text
        .setPlaceholder('#ffffff')
        .onChange(value => {
          this.preset.styles.color = value;
        })
      );
    
    // Effect settings
    contentEl.createEl('h3', { text: 'Effects' });
    
    new Setting(contentEl)
      .setName('Blur amount')
      .setDesc('0 = no blur, 10 = maximum blur')
      .addSlider(slider => slider
        .setLimits(0, 10, 1)
        .setValue(0)
        .onChange(value => {
          this.preset.effects.blur = value;
        })
      );
    
    // Preview area
    contentEl.createEl('h3', { text: 'Preview' });
    const previewEl = contentEl.createDiv('camo-preset-preview');
    this.updatePreview(previewEl);
    
    // Save button
    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText('Save Preset')
        .setCta()
        .onClick(() => {
          this.savePreset();
          this.close();
        })
      );
  }
  
  private updatePreview(el: HTMLElement) {
    // Apply preset styles to preview
    el.empty();
    el.createDiv('camo-block')
      .setText('Preview content')
      .setCssStyles({
        background: this.preset.styles.background,
        color: this.preset.styles.color,
        filter: `blur(${this.preset.effects.blur}px)`,
        padding: '1em',
        borderRadius: '4px'
      });
  }
  
  private async savePreset() {
    // Save to plugin data
    const customPresets = await this.plugin.loadData().customPresets || {};
    customPresets[this.preset.id] = this.preset;
    await this.plugin.saveData({ customPresets });
    
    new Notice(`Preset "${this.preset.id}" saved!`);
  }
}
```

### 2. Community Sharing (GitHub Integration)

```typescript
class CamoCommunitySharingV {
  // Share via GitHub Gist
  async sharePreset(preset: CamoPreset): Promise<string> {
    const gistContent = {
      description: `CAMO Preset: ${preset.name}`,
      public: true,
      files: {
        [`${preset.id}.json`]: {
          content: JSON.stringify(preset, null, 2)
        }
      }
    };
    
    // User provides their GitHub token in settings
    // Create gist and return URL
    return 'https://gist.github.com/...';
  }
  
  // Import from URL
  async importPreset(url: string): Promise<CamoPreset> {
    const response = await fetch(url);
    const preset = await response.json();
    
    // Validate preset structure
    if (!this.validatePreset(preset)) {
      throw new Error('Invalid preset format');
    }
    
    return preset;
  }
}
```

---

## performance-optimization

### Obsidian-Specific Optimizations

```typescript
class CamoOptimizer {
  // Debouncing for processor
  private processorDebounce = 500; // ms
  
  // Cache for processed blocks
  private blockCache = new Map<string, CachedBlock>();
  
  // Intersection Observer for lazy rendering
  private observer: IntersectionObserver;
  
  initialize() {
    // Setup intersection observer for lazy rendering
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderBlock(entry.target as HTMLElement);
          } else {
            this.unrenderBlock(entry.target as HTMLElement);
          }
        });
      },
      {
        rootMargin: '100px' // Start rendering 100px before visible
      }
    );
  }
  
  // CSS-only animations
  getPerformantCSS(): string {
    return `
      /* Use transform instead of position */
      .camo-animate {
        transform: translateZ(0); /* Enable GPU acceleration */
        will-change: transform;
      }
      
      /* Reduce effects on mobile */
      @media (max-width: 768px) {
        .camo-effect-blur { filter: blur(2px); }
        .camo-effect-matrix { animation: none; }
      }
      
      /* Performance mode */
      .camo-performance-mode .camo-effect-blur { filter: none; }
      .camo-performance-mode .camo-animate { animation: none; }
    `;
  }
}
```

---

## Deployment Strategy

### Obsidian Plugin Release Process

```yaml
deployment:
  repository:
    structure:
      - main.js         # Compiled plugin
      - manifest.json   # Plugin manifest
      - styles.css      # Plugin styles
      - README.md       # Documentation
      
  manifest:
    id: "camo-codeblock"
    name: "CAMO - Camouflage for Codeblocks"
    author: "Your Name"
    description: "Hide and stylize your codeblocks with presets and custom effects"
    version: "1.0.0"
    minAppVersion: "0.15.0"
    isDesktopOnly: false
    
  release_process:
    1_development:
      - Build with esbuild
      - Test in development vault
      - Validate with Obsidian linter
      
    2_beta:
      - Release to GitHub
      - Beta testing with BRAT plugin
      - Gather feedback
      
    3_submission:
      - Submit PR to obsidian-releases
      - Pass review process
      - Available in Community Plugins
      
  compatibility:
    - Desktop: Full support
    - Mobile: Full support with reduced effects
    - Sync: Settings sync via Obsidian Sync
    - Publish: Styles work in published sites
```

---

## Conclusion

This Obsidian-compliant specification ensures CAMO works within all platform constraints while delivering the full three-tier experience:

### Key Compliance Points

- ✅ **No parameters after language** - Use content-based configuration
- ✅ **Debounced processing** - Prevents performance issues
- ✅ **CSS-based effects** - No direct DOM manipulation
- ✅ **Official API usage** - loadData/saveData for persistence
- ✅ **Proper registration** - Each preset as separate language

### Delivered Features

- **Immediate usability** through `camo-preset` syntax
- **Progressive complexity** with flags in content
- **Powerful customization** via inline camoMetaData
- **Full Obsidian integration** with commands and settings

The system maintains all planned functionality while respecting Obsidian's architecture, ensuring reliable performance and future compatibility.
