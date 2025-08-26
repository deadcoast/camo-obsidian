import {
  Plugin,
  MarkdownPostProcessorContext,
  PluginSettingTab,
  App,
  Setting,
  Notice
} from 'obsidian';

// Import core modules
import { CamoMetaDataProcessor, MetaDataContext } from './core/camoMetaData';
import { CamoIRExecutor, ExecutionContext } from './core/camoIRExecutor';
import { VisualEffectsEngine } from './engines/VisualEffectsEngine';

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
  private processorCache: Map<string, ProcessorCache> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Core components
  private metaDataProcessor: CamoMetaDataProcessor;
  private irExecutor: CamoIRExecutor;
  private visualEffects: VisualEffectsEngine;

  async onload() {
    console.log('Loading CAMO plugin');

    // Initialize core components
    this.metaDataProcessor = new CamoMetaDataProcessor();
    this.irExecutor = new CamoIRExecutor();
    this.visualEffects = new VisualEffectsEngine();

    // Load settings from Obsidian's data.json
    await this.loadSettings();

    // Initialize visual effects engine
    this.visualEffects.initialize();

    // Initialize CSS styles
    this.injectStyles();

    // Register base processor with debouncing
    this.registerMarkdownCodeBlockProcessor('camo',
      this.createDebouncedProcessor(async (source, el, ctx) => {
        try {
          await this.processCAMOBlock(source, el, ctx);
        } catch (error) {
          this.handleError(error as Error, el);
        }
      })
    );

    // Register preset processors (hyphenated for Obsidian compliance)
    const presets = ['blackout', 'blueprint', 'modern95', 'ghost', 'matrix', 'classified'];
    presets.forEach(preset => {
      this.registerMarkdownCodeBlockProcessor(`camo-${preset}`,
        this.createDebouncedProcessor(async (source, el, ctx) => {
          try {
            await this.processPresetBlock(preset, source, el, ctx);
          } catch (error) {
            this.handleError(error as Error, el);
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
        this.cleanupOldCache();
      }, 60 * 60 * 1000) // Every hour
    );
  }

  onunload() {
    console.log('Unloading CAMO plugin');
    
    // Clean up visual effects
    this.visualEffects.destroy();
    
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

  // Debounced processor to prevent constant re-rendering
  private createDebouncedProcessor(
    processor: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => Promise<void>
  ): (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void {
    return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      const hash = this.hashContent(source);
      const cacheKey = `${ctx.docId}-${ctx.sectionInfo?.lineStart || 0}`;

      const cached = this.processorCache.get(cacheKey);
      if (cached && cached.hash === hash && !cached.expired) {
        return; // Skip re-processing
      }

      // Clear existing timer
      if (this.debounceTimers.has(cacheKey)) {
        clearTimeout(this.debounceTimers.get(cacheKey)!);
      }

      // Set new debounced execution
      const timer = setTimeout(async () => {
        await processor(source, el, ctx);
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
    const blockId = this.generateBlockId();
    container.setAttribute('data-camo-id', blockId);

    // Apply configuration
    await this.applyConfiguration(container, {
      flags,
      metadata,
      content,
      preset: null,
      settings: this.settings,
      blockId
    });
  }

  private async processPresetBlock(
    preset: string,
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    // Similar to processCAMOBlock but with preset applied
    const lines = source.split('\n');
    let flags: string[] = [];
    let metadata: string[] = [];
    let contentStart = 0;

    // Parse flags from first line if present
    if (lines[0] && lines[0].trim().startsWith('--')) {
      flags = lines[0].trim().split(/\s+/)
        .filter(f => f.startsWith('--'))
        .map(f => f.substring(2));
      contentStart = 1;
    }

    // Extract metadata
    while (contentStart < lines.length) {
      const line = lines[contentStart].trim();
      if (line.startsWith('::') || line.startsWith(':^:')) {
        metadata.push(line);
        contentStart++;
      } else {
        break;
      }
    }

    const content = lines.slice(contentStart).join('\n');

    // Create container
    const container = el.createDiv(`camo-block camo-preset-${preset}`);
    const blockId = this.generateBlockId();
    container.setAttribute('data-camo-id', blockId);

    // Apply preset configuration
    await this.applyConfiguration(container, {
      flags,
      metadata,
      content,
      preset,
      settings: this.settings,
      blockId
    });
  }

  private async applyConfiguration(container: HTMLElement, config: CamoConfig) {
    // Apply preset if specified
    if (config.preset) {
      container.addClass(`camo-preset-${config.preset}`);
    }

    // Apply flags using visual effects engine
    for (const flag of config.flags) {
      const [name, value] = flag.split(':');
      await this.applyFlag(container, name, value);
    }

    // Process camoMetaData if present
    if (config.metadata.length > 0) {
      await this.processMetaData(container, config.metadata, config.blockId);
    }

    // Add content
    const contentEl = container.createDiv('camo-content');
    contentEl.setText(config.content);

    // Set up interactions
    this.setupInteractions(container);
  }

  private async applyFlag(container: HTMLElement, flag: string, value?: string) {
    switch (flag) {
      case 'blur':
        const intensity = value ? parseInt(value) : 4;
        this.visualEffects.applyEffect(container, 'blur', { intensity });
        break;
      case 'fade':
        const opacity = value ? parseFloat(value) : 0.5;
        this.visualEffects.applyEffect(container, 'fade', { intensity: opacity });
        break;
      case 'redact':
        const color = value || '#000000';
        this.visualEffects.applyEffect(container, 'redact', { color });
        break;
      case 'scramble':
        const duration = value || '0.5s';
        this.visualEffects.applyEffect(container, 'scramble', { duration });
        break;
      case 'glitch':
        const glitchIntensity = value ? parseInt(value) : 1;
        this.visualEffects.applyEffect(container, 'glitch', { intensity: glitchIntensity });
        break;
      case 'hover':
        container.addClass('camo-trigger-hover');
        break;
      case 'click':
        container.addClass('camo-trigger-click');
        break;
      case 'timer':
        container.addClass('camo-trigger-timer');
        container.setAttribute('data-timer', value || '5');
        this.setupTimer(container, parseInt(value || '5'));
        break;
      case 'peek':
        container.addClass('camo-mod-peek');
        break;
    }
  }

  private async processMetaData(
    container: HTMLElement, 
    metadata: string[], 
    blockId: string
  ) {
    const context: MetaDataContext = {
      blockId,
      element: container,
      settings: this.settings
    };

    const result = await this.metaDataProcessor.process(metadata, context);
    
    if (!result.success && this.settings.debugMode) {
      console.error('camoMetaData processing failed:', result.errors);
      const errorEl = container.createDiv('camo-metadata-error');
      errorEl.setText(`MetaData Error: ${result.errors?.join(', ')}`);
    }

    if (result.warnings && result.warnings.length > 0 && this.settings.debugMode) {
      console.warn('camoMetaData warnings:', result.warnings);
    }
  }

  private setupInteractions(container: HTMLElement) {
    // Set up click interactions
    if (container.hasClass('camo-trigger-click')) {
      container.addEventListener('click', () => {
        container.toggleClass('camo-revealed');
      });
    }

    // Set up hover interactions
    if (container.hasClass('camo-trigger-hover')) {
      // CSS handles the hover state
    }
  }

  private setupTimer(container: HTMLElement, seconds: number) {
    setTimeout(() => {
      container.addClass('camo-revealed');
    }, seconds * 1000);
  }

  private injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.id = 'camo-styles';
    styleElement.textContent = this.getCamoStyles();
    document.head.appendChild(styleElement);
  }

  private getCamoStyles(): string {
    return `
      /* Base CAMO styles */
      .camo-block {
        position: relative;
        border-radius: 4px;
        padding: 1em;
        margin: 0.5em 0;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      /* Preset styles */
      .camo-preset-blackout {
        background: #000000 !important;
        color: transparent !important;
      }
      .camo-preset-blackout:hover,
      .camo-preset-blackout.camo-revealed {
        background: var(--background-primary) !important;
        color: var(--text-normal) !important;
      }

      .camo-preset-ghost {
        background: rgba(255,255,255,0.85) !important;
        backdrop-filter: blur(4px);
        color: rgba(0,0,0,0.3) !important;
      }
      .camo-preset-ghost:hover,
      .camo-preset-ghost.camo-revealed {
        background: var(--background-primary) !important;
        color: var(--text-normal) !important;
        backdrop-filter: none;
      }

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

      .camo-preset-modern95 {
        background: #2B2B2B !important;
        color: #00FF41 !important;
        font-family: var(--font-monospace);
        border: 2px solid #555555;
        box-shadow: inset 2px 2px 4px rgba(255,255,255,0.1);
      }

      .camo-preset-matrix {
        background: #000000 !important;
        color: #00FF00 !important;
        font-family: var(--font-monospace);
        position: relative;
        overflow: hidden;
      }

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

      /* Modifier styles */
      .camo-mod-peek {
        background: #000000 !important;
        color: transparent !important;
      }
      .camo-mod-peek:hover {
        background: var(--background-primary) !important;
        color: var(--text-normal) !important;
      }

      /* Trigger styles */
      .camo-trigger-hover:not(:hover) .camo-content {
        opacity: 0;
      }

      .camo-trigger-click:not(.camo-revealed) .camo-content {
        display: none;
      }

      /* Content area */
      .camo-content {
        white-space: pre-wrap;
        transition: opacity 0.3s ease;
        position: relative;
        z-index: 2;
      }

      /* Error state */
      .camo-error {
        background: var(--background-modifier-error) !important;
        color: var(--text-error) !important;
        padding: 0.5em;
        border-radius: 4px;
        font-family: var(--font-monospace);
      }

      .camo-metadata-error {
        background: var(--background-modifier-error);
        color: var(--text-error);
        padding: 0.25em 0.5em;
        border-radius: 2px;
        font-size: 0.8em;
        margin-top: 0.5em;
      }

      /* Performance mode */
      .camo-performance-mode .camo-mod-blur { filter: none; }
      .camo-performance-mode .camo-animate { animation: none; }
    `;
  }

  private generateBlockId(): string {
    return 'camo-' + Math.random().toString(36).substr(2, 9);
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
        // Refresh block state
      }
    });
  }

  private cleanupOldCache() {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    this.processorCache.forEach((cache, key) => {
      if (now - cache.timestamp > maxAge) {
        this.processorCache.delete(key);
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

// Type definitions
interface ProcessorCache {
  hash: string;
  timestamp: number;
  expired: boolean;
}

interface CamoConfig {
  flags: string[];
  metadata: string[];
  content: string;
  preset: string | null;
  settings: CamoSettings;
  blockId: string;
}
