import {
  App,
  Editor,
  MarkdownPostProcessorContext,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian';

// Import core modules
import { LivePreviewCompatibility } from './compatibility/LivePreviewCompatibility';
import { CamoPresetBuilderModal } from './compilers/PresetBuilder';
import { CamoIRExecutor } from './core/camoIRExecutor';
import { CamoMetaDataProcessor, MetaDataContext } from './core/camoMetaData';
import { CamoSyntaxHighlighter } from './core/camoSyntaxHighlighting';
import { CamoGrammarEngine } from './engines/GrammarEngine';
import { VisualEffectsEngine } from './engines/VisualEffectsEngine';
import { CamoErrorRecovery } from './error_control/ErrorRecovery';
import { ContentParser } from './extractors/ContentParser';
import { CamoIRExtractor } from './extractors/IRExtractor';
import { ApplyEffectHandler } from './handler/ApplyEffectHandler';
import { EffectHandlerRegistry } from './handler/EffectHandler';
import { ProtectEventHandler } from './handler/ProtectEventHandler';
import { RemoveEffectHandler } from './handler/RemoveEffectHandler';
import { SetEffectHandler } from './handler/SetEffectHandler';
import { ToggleEffectHandler } from './handler/ToggleEffectHandler';
import { BackendCamouflage } from './modules/BackendCamouflage';
import { CamoCoordinateSystem } from './modules/CamoCoordinateSystem';
import { CommunityPresetBrowserModal, CommunitySharing } from './modules/CommunitySharing';
import { CamoConditionalExecution } from './modules/ConditionalExecution';
import { DynamicEffectPipeline } from './modules/DynamicEffectPipeline';
import { CamoMetaDataParser } from './modules/MetaDataParser';
import { CamoReactiveRenderer } from './modules/ReactiveRenderer';
import { RenderStrategyManager } from './modules/RenderStrategy';
import { CamoStateManager } from './modules/StateManager';
import { CamoVisualIntegration } from './modules/VisualIntegration';
import { MobileOptimization } from './performance/MobileOptimization';
import { CamoInstructionProcessor } from './processors/InstructionProcessor';
import { PresetProcessor } from './processors/PresetProcessor';
import { CamoAccessControl } from './security/AccessControl';
import { CamoSecurityIntegration } from './security/SecurityIntegration';

interface CamoSettings {
  defaultPreset: string;
  revealOnHover: boolean;
  enableAnimations: boolean;
  performanceMode: boolean;
  debugMode: boolean;
  enableSecurity: boolean;
  securityAudit: boolean;
  gpuAcceleration: boolean;
  renderMode: 'css' | 'canvas' | 'webgl' | 'auto';
  // Community settings
  enableCommunityPresets: boolean;
  githubToken: string;
  autoUpdatePresets: boolean;
  enableBetaPresets: boolean;
  trustedAuthors: string[];
  [key: string]: string | number | boolean | string[];
}

const DEFAULT_SETTINGS: CamoSettings = {
  defaultPreset: 'ghost',
  revealOnHover: true,
  enableAnimations: true,
  performanceMode: false,
  debugMode: false,
  enableSecurity: true,
  securityAudit: false,
  gpuAcceleration: true,
  renderMode: 'auto',
  // Community defaults
  enableCommunityPresets: true,
  githubToken: '',
  autoUpdatePresets: false,
  enableBetaPresets: false,
  trustedAuthors: [],
};

export default class CamoPlugin extends Plugin {
  settings: CamoSettings;
  private debounceTimers: Map<string, number> = new Map();

  // Core components
  private metaDataProcessor: CamoMetaDataProcessor;
  private irExecutor: CamoIRExecutor;
  private visualEffects: VisualEffectsEngine;
  private presetProcessor: PresetProcessor;
  private stateManager: CamoStateManager;
  private syntaxHighlighter: CamoSyntaxHighlighter;
  private effectHandlerRegistry: EffectHandlerRegistry;
  private livePreviewCompatibility: LivePreviewCompatibility;
  private securityIntegration: CamoSecurityIntegration;
  private accessControl: CamoAccessControl;
  private errorRecovery: CamoErrorRecovery;
  private contentParser: ContentParser;
  private instructionProcessor: CamoInstructionProcessor;
  private visualIntegration: CamoVisualIntegration;
  private dynamicEffectPipeline: DynamicEffectPipeline;
  private backendCamouflage: BackendCamouflage;
  private coordinateSystem: CamoCoordinateSystem;
  private renderStrategyManager: RenderStrategyManager;
  private communitySharing: CommunitySharing;
  private conditionalExecution: CamoConditionalExecution;
  private metaDataParser: CamoMetaDataParser;
  private irExtractor: CamoIRExtractor;
  private grammarEngine: CamoGrammarEngine;
  private mobileOptimization: MobileOptimization;
  private reactiveRenderer: CamoReactiveRenderer;

  // Public accessor for settings tab
  getPresetProcessor(): PresetProcessor {
    return this.presetProcessor;
  }

  // Settings-related methods for SettingsTab
  applyGlobalSettingsToDocument(): void {
    // Apply global settings to all CAMO blocks in the current document
    const camoBlocks = document.querySelectorAll('.camo-block');
    camoBlocks.forEach(block => {
      if (block instanceof HTMLElement) {
        // Apply global hover settings
        if (this.settings.revealOnHover) {
          block.addClass('camo-global-hover');
        } else {
          block.removeClass('camo-global-hover');
        }

        // Apply animation settings
        if (this.settings.enableAnimations) {
          block.addClass('camo-animations-enabled');
        } else {
          block.removeClass('camo-animations-disabled');
        }
      }
    });
  }

  refreshPrintStyles(): void {
    // Refresh print-specific styles for CAMO blocks
    this.injectStyles();
  }

  getCustomPresets(): Array<{ id: string; name: string }> {
    // Return custom presets (delegate to preset processor)
    return this.presetProcessor.getAllPresets().filter(preset => preset.id.startsWith('custom-'));
  }

  deleteCustomPreset(presetId: string): void {
    // Delete a custom preset
    this.presetProcessor.removePreset(presetId);
  }

  getBuiltInPresetIds(): string[] {
    // Return built-in preset IDs
    return this.presetProcessor
      .getAllPresets()
      .filter(preset => !preset.id.startsWith('custom-'))
      .map(preset => preset.id);
  }

  // Public method for reinitializing security integration
  initializeSecurityIntegration(): void {
    this.securityIntegration = new CamoSecurityIntegration({
      enableSecurityAudit: this.settings.securityAudit,
    });
  }

  // Public accessor for render strategy manager
  getRenderStrategyManager(): RenderStrategyManager {
    return this.renderStrategyManager;
  }

  // Public accessor for community sharing
  getCommunitySharing(): CommunitySharing {
    return this.communitySharing;
  }

  // Public accessor for conditional execution
  getConditionalExecution(): CamoConditionalExecution {
    return this.conditionalExecution;
  }

  // Public accessor for reactive renderer
  getReactiveRenderer(): CamoReactiveRenderer {
    return this.reactiveRenderer;
  }

  // Public accessor for metadata parser
  getMetaDataParser(): CamoMetaDataParser {
    return this.metaDataParser;
  }

  // Public accessor for IR extractor
  getIRExtractor(): CamoIRExtractor {
    return this.irExtractor;
  }

  // Public accessor for grammar engine
  getGrammarEngine(): CamoGrammarEngine {
    return this.grammarEngine;
  }

  // Public accessor for mobile optimization
  getMobileOptimization(): MobileOptimization {
    return this.mobileOptimization;
  }

  // Public accessor for access control
  getAccessControl(): CamoAccessControl {
    return this.accessControl;
  }

  // Public accessor for error recovery
  getErrorRecovery(): CamoErrorRecovery {
    return this.errorRecovery;
  }

  // Public accessor for content parser
  getContentParser(): ContentParser {
    return this.contentParser;
  }

  // Public accessor for instruction processor
  getInstructionProcessor(): CamoInstructionProcessor {
    return this.instructionProcessor;
  }

  // Public accessor for visual integration
  getVisualIntegration(): CamoVisualIntegration {
    return this.visualIntegration;
  }

  // Public accessor for dynamic effect pipeline
  getDynamicEffectPipeline(): DynamicEffectPipeline {
    return this.dynamicEffectPipeline;
  }

  // Public accessor for backend camouflage
  getBackendCamouflage(): BackendCamouflage {
    return this.backendCamouflage;
  }

  // Public accessor for coordinate system
  getCoordinateSystem(): CamoCoordinateSystem {
    return this.coordinateSystem;
  }

  // Update community sharing settings
  updateCommunitySettings(): void {
    this.communitySharing.updateSettings({
      enableCommunityPresets: this.settings.enableCommunityPresets,
      githubToken: this.settings.githubToken,
      autoUpdate: this.settings.autoUpdatePresets,
      enableBetaPresets: this.settings.enableBetaPresets,
      trustedAuthors: this.settings.trustedAuthors,
    });
  }

  previewApplyMetadata(_metadata: string): void {
    // Preview metadata application (for settings preview)
    // This would typically show a preview in the settings UI
  }

  // Dictionary access for settings
  get dictionary(): Record<string, unknown> {
    return {
      presets: this.presetProcessor.getAllPresets(),
      effects: ['blur', 'fade', 'redact', 'scramble', 'glitch'],
      keywords: ['set', 'apply', 'remove', 'protect', 'reveal', 'hide'],
    };
  }

  async onload() {
    // Loading CAMO plugin

    // Initialize core components
    this.metaDataProcessor = new CamoMetaDataProcessor();
    this.irExecutor = new CamoIRExecutor();
    this.visualEffects = new VisualEffectsEngine();
    this.presetProcessor = new PresetProcessor();
    this.stateManager = new CamoStateManager(this);
    this.syntaxHighlighter = new CamoSyntaxHighlighter();
    this.livePreviewCompatibility = new LivePreviewCompatibility();
    this.securityIntegration = new CamoSecurityIntegration({
      enableSecurityAudit: this.settings.securityAudit,
    });
    this.accessControl = new CamoAccessControl();
    this.errorRecovery = new CamoErrorRecovery();
    this.contentParser = new ContentParser();
    this.instructionProcessor = new CamoInstructionProcessor(this);
    this.visualIntegration = new CamoVisualIntegration();
    this.dynamicEffectPipeline = new DynamicEffectPipeline({
      maxEffects: 10,
      enableGPUAcceleration: this.settings.gpuAcceleration,
      performanceMode: this.settings.performanceMode,
    });
    this.backendCamouflage = new BackendCamouflage();
    this.coordinateSystem = new CamoCoordinateSystem();
    this.renderStrategyManager = new RenderStrategyManager(this.visualEffects);
    this.communitySharing = new CommunitySharing(this.app, {
      enableCommunityPresets: this.settings.enableCommunityPresets,
      githubToken: this.settings.githubToken,
      autoUpdate: this.settings.autoUpdatePresets,
      enableBetaPresets: this.settings.enableBetaPresets,
      trustedAuthors: this.settings.trustedAuthors,
    });
    this.conditionalExecution = new CamoConditionalExecution(this.app);
    this.metaDataParser = new CamoMetaDataParser({
      strictMode: this.settings.debugMode,
      enableComments: true,
      maxLineLength: 1000,
      allowIncompleteStatements: !this.settings.debugMode,
    });
    this.irExtractor = new CamoIRExtractor();
    this.grammarEngine = new CamoGrammarEngine();
    this.mobileOptimization = new MobileOptimization(this);
    this.reactiveRenderer = new CamoReactiveRenderer(this.app, this.visualEffects);

    // Initialize effect handler registry
    this.effectHandlerRegistry = new EffectHandlerRegistry();

    // Register effect handlers
    this.effectHandlerRegistry.registerHandler(new ApplyEffectHandler());
    this.effectHandlerRegistry.registerHandler(new SetEffectHandler());
    this.effectHandlerRegistry.registerHandler(new RemoveEffectHandler(this));
    this.effectHandlerRegistry.registerHandler(new ToggleEffectHandler(this));
    this.effectHandlerRegistry.registerHandler(new ProtectEventHandler(this));

    // Load settings from Obsidian's data.json
    await this.loadSettings();

    // Initialize state manager
    await this.stateManager.initialize();

    // Initialize visual effects engine
    this.visualEffects.initialize();

    // Initialize CSS styles
    this.injectStyles();

    // Register base processor with debouncing
    this.registerMarkdownCodeBlockProcessor(
      'camo',
      this.createDebouncedProcessor(async (source, el, ctx) => {
        try {
          await this.processCAMOBlock(source, el, ctx);
        } catch (error) {
          this.handleError(error as Error, el);
        }
      })
    );

    // Register preset processors (hyphenated for Obsidian compliance)
    const presets = this.presetProcessor.getAllPresetIds();
    presets.forEach(preset => {
      this.registerMarkdownCodeBlockProcessor(
        `camo-${preset}`,
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
      },
    });

    this.addCommand({
      id: 'camo-hide-all',
      name: 'Hide all CAMO blocks',
      callback: () => {
        document.querySelectorAll('.camo-block').forEach(block => {
          block.removeClass('camo-revealed');
        });
        new Notice('All CAMO blocks hidden');
      },
    });

    // Community sharing commands
    this.addCommand({
      id: 'browse-community-presets',
      name: 'Browse Community Presets',
      callback: () => {
        if (!this.settings.enableCommunityPresets) {
          new Notice('Community presets are disabled. Enable them in settings.');
          return;
        }

        const modal = new CommunityPresetBrowserModal(
          this.app,
          this.communitySharing,
          async preset => {
            const success = await this.communitySharing.installPreset(preset);
            if (success) {
              // Refresh preset processor with new preset
              this.presetProcessor.addPreset(preset);
            }
          }
        );
        modal.open();
      },
    });

    this.addCommand({
      id: 'share-current-preset',
      name: 'Share Custom Preset',
      checkCallback: (checking: boolean) => {
        // Check if we have custom presets to share
        const customPresets = this.presetProcessor.getCustomPresets();
        if (customPresets.length === 0) {
          return false;
        }

        if (!checking) {
          // For now, share the first custom preset
          // In a real implementation, this would open a selection modal
          const preset = customPresets[0];
          this.communitySharing.sharePreset(preset);
        }

        return true;
      },
    });

    // Add command to open preset builder
    this.addCommand({
      id: 'open-preset-builder',
      name: 'Open Preset Builder',
      callback: () => {
        new CamoPresetBuilderModal(this.app, this).open();
      },
    });

    // Add settings tab
    this.addSettingTab(new CamoSettingTab(this.app, this));

    // Register event handlers
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.refreshBlocks();
      })
    );

    // Register Live Preview compatibility events
    this.registerEvent(
      this.app.workspace.on('editor-change', editor => {
        this.livePreviewCompatibility.trackCursorPosition(editor);
      })
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view.getViewType() === 'markdown') {
          const markdownView = activeLeaf.view as { editor?: Editor };
          if (markdownView.editor) {
            this.livePreviewCompatibility.refreshEditingState(markdownView.editor);
          }
        }
      })
    );

    // Register interaction event handlers for conditional execution
    this.registerDomEvent(document, 'mouseover', event => {
      this.handleInteractionEvent(event, 'hover', true);
    });

    this.registerDomEvent(document, 'mouseout', event => {
      this.handleInteractionEvent(event, 'hover', false);
    });

    this.registerDomEvent(document, 'click', event => {
      this.handleInteractionEvent(event, 'clicked', true);

      // Reset click state after brief delay
      setTimeout(() => {
        const blockId = this.extractBlockIdFromEvent(event);
        if (blockId) {
          this.conditionalExecution.updateInteractionState(blockId, {
            clicked: false,
          });
        }
      }, 100);
    });

    this.registerDomEvent(document, 'focusin', event => {
      this.handleInteractionEvent(event, 'focused', true);
    });

    this.registerDomEvent(document, 'focusout', event => {
      this.handleInteractionEvent(event, 'focused', false);
    });

    // Clean up old states periodically (StateManager handles this internally)
    // Note: StateManager.setupPeriodicCleanup() handles this automatically
  }

  async onunload() {
    // Unloading CAMO plugin

    // Clean up visual effects
    this.visualEffects.destroy();

    // Clean up state manager
    await this.stateManager.cleanup();

    // Clean up reactive renderer
    this.reactiveRenderer.cleanup();

    // Clean up conditional execution cache
    this.conditionalExecution.clearCache();

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
      const sectionInfo = ctx.getSectionInfo(el);
      const cacheKey = `${ctx.docId}-${sectionInfo?.lineStart || 0}`;

      // Check cache via StateManager
      if (this.stateManager.isCacheValid(cacheKey, hash)) {
        return; // Skip re-processing
      }

      // Clear existing timer
      if (this.debounceTimers.has(cacheKey)) {
        const timer = this.debounceTimers.get(cacheKey);
        if (timer) clearTimeout(timer);
      }

      // Set new debounced execution
      const timer = setTimeout(async () => {
        await processor(source, el, ctx);
        // Update cache via StateManager
        this.stateManager.updateProcessorCache(cacheKey, hash);
        this.debounceTimers.delete(cacheKey);
      }, 500); // 500ms debounce

      this.debounceTimers.set(cacheKey, timer as unknown as number);
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
    const metadata: string[] = [];
    let contentStart = 0;

    // Check first line for flags (--flag syntax)
    if (lines[0] && lines[0].trim().startsWith('--')) {
      flags = lines[0]
        .trim()
        .split(/\s+/)
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

    // Setup mobile optimization if on mobile
    if (this.mobileOptimization.isMobileApp()) {
      this.mobileOptimization.setupTouchHandlers(container);
    }

    // Validate and sanitize metadata
    if (metadata.length > 0) {
      const validation = this.securityIntegration.validateMetadata(metadata);
      if (!validation.valid) {
        container.setAttribute(
          'data-camo-error',
          `Security validation failed: ${validation.errors.join(', ')}`
        );
        return;
      }
      // metadata = validation.sanitized;
    }

    // Validate metadata syntax in debug mode
    if (this.settings.debugMode && metadata.length > 0) {
      try {
        const parsedStatements = this.metaDataParser.parseMetaData(metadata);
        const invalidStatements = parsedStatements.filter(stmt => !stmt.valid);

        if (invalidStatements.length > 0) {
          console.warn('CAMO: Invalid metadata statements:', invalidStatements);

          // Show errors in debug mode
          const errorDiv = container.createDiv('camo-debug-errors');
          errorDiv.style.cssText =
            'color: red; font-size: 0.8em; margin-bottom: 10px; padding: 5px; border: 1px solid red; background: rgba(255,0,0,0.1);';

          const errorList = invalidStatements
            .map(stmt => `Line ${stmt.line}: ${stmt.errors.join(', ')}`)
            .join('\n');

          errorDiv.textContent = `Metadata Errors:\n${errorList}`;
        }

        // Grammar validation with EBNF rules
        const grammarValidation = this.grammarEngine.validateGrammar(metadata.join('\n'));
        if (!grammarValidation.valid) {
          console.warn('CAMO: Grammar validation errors:', grammarValidation.errors);

          // Show grammar errors in debug mode
          if (grammarValidation.errors.some(e => e.severity === 'error')) {
            const grammarErrorDiv = container.createDiv('camo-grammar-errors');
            grammarErrorDiv.style.cssText =
              'color: orange; font-size: 0.8em; margin-bottom: 10px; padding: 5px; border: 1px solid orange; background: rgba(255,165,0,0.1);';

            const grammarErrorList = grammarValidation.errors
              .filter(e => e.severity === 'error')
              .map(e => `Line ${e.position.line}: ${e.message}`)
              .join('\n');

            grammarErrorDiv.textContent = `Grammar Errors:\n${grammarErrorList}`;
          }
        }

        // Transform to IR for validation and debugging
        if (parsedStatements.length > 0) {
          const ast = this.metaDataParser.buildAST(metadata.join('\n'));
          const irResult = this.irExtractor.transformASTtoIR(ast, blockId);

          if (irResult.errors.length > 0) {
            console.warn('CAMO: IR transformation errors:', irResult.errors);
          }

          if (irResult.warnings.length > 0) {
            console.warn('CAMO: IR transformation warnings:', irResult.warnings);
          }

          // Log grammar and IR stats in debug mode
          console.log('CAMO Grammar Stats:', this.grammarEngine.getStats());
          console.log('CAMO IR Stats:', irResult.stats);
          console.log('CAMO IR Instructions:', irResult.instructions);
        }
      } catch (error) {
        console.error('CAMO: Failed to parse metadata:', error);
      }
    }

    // Handle Live Preview compatibility
    this.livePreviewCompatibility.handlePartialRender(container, ctx);

    // Process conditional execution in metadata
    const processedMetadata = await this.processConditionalMetadata(metadata, blockId);

    // Apply configuration
    await this.applyConfiguration(container, {
      flags,
      metadata: processedMetadata,
      content,
      preset: null,
      settings: this.settings,
      blockId,
    });

    // Process reactive metadata instructions
    await this.processReactiveMetadata(processedMetadata, blockId, container);
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
    const metadata: string[] = [];
    let contentStart = 0;

    // Parse flags from first line if present
    if (lines[0] && lines[0].trim().startsWith('--')) {
      flags = lines[0]
        .trim()
        .split(/\s+/)
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

    // Setup mobile optimization if on mobile
    if (this.mobileOptimization.isMobileApp()) {
      this.mobileOptimization.setupTouchHandlers(container);
    }

    // Validate and sanitize metadata
    if (metadata.length > 0) {
      const validation = this.securityIntegration.validateMetadata(metadata);
      if (!validation.valid) {
        container.setAttribute(
          'data-camo-error',
          `Security validation failed: ${validation.errors.join(', ')}`
        );
        return;
      }
      // metadata = validation.sanitized;
    }

    // Validate metadata syntax in debug mode
    if (this.settings.debugMode && metadata.length > 0) {
      try {
        const parsedStatements = this.metaDataParser.parseMetaData(metadata);
        const invalidStatements = parsedStatements.filter(stmt => !stmt.valid);

        if (invalidStatements.length > 0) {
          console.warn('CAMO: Invalid metadata statements in preset block:', invalidStatements);
        }

        // Transform to IR for validation
        if (parsedStatements.length > 0) {
          const ast = this.metaDataParser.buildAST(metadata.join('\n'));
          const irResult = this.irExtractor.transformASTtoIR(ast, blockId);

          if (irResult.errors.length > 0) {
            console.warn('CAMO: Preset IR transformation errors:', irResult.errors);
          }
        }
      } catch (error) {
        console.error('CAMO: Failed to parse preset metadata:', error);
      }
    }

    // Handle Live Preview compatibility
    this.livePreviewCompatibility.handlePartialRender(container, ctx);

    // Process conditional execution in metadata
    const processedMetadata = await this.processConditionalMetadata(metadata, blockId);

    // Apply preset configuration
    await this.applyConfiguration(container, {
      flags,
      metadata: processedMetadata,
      content,
      preset,
      settings: this.settings,
      blockId,
    });

    // Process reactive metadata instructions
    await this.processReactiveMetadata(processedMetadata, blockId, container);
  }

  private async applyConfiguration(container: HTMLElement, config: CamoConfig) {
    // Apply preset if specified
    if (config.preset) {
      this.presetProcessor.applyPreset(container, config.preset);

      // Update state
      this.stateManager.setBlockState(config.blockId, {
        preset: config.preset,
        flags: config.flags,
        metadata: config.metadata,
      });
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

    // Apply syntax highlighting to metadata if in debug mode
    if (config.metadata.length > 0 && this.settings.debugMode) {
      const metadataEl = container.createDiv('camo-metadata-display');
      metadataEl.innerHTML = config.metadata
        .map(line => this.syntaxHighlighter.highlight(line))
        .join('<br>');
      metadataEl.addClass('camo-metadata-highlight');
    }

    // Set up interactions
    this.setupInteractions(container);
  }

  private async applyFlag(container: HTMLElement, flag: string, value?: string) {
    const blockId = container.getAttribute('data-camo-id') || '';
    const effectContext = {
      element: container,
      blockId,
      content: container.textContent || '',
      settings: this.settings,
      state: new Map(),
    };

    // Handle visual effects through the effect handler registry
    switch (flag) {
      case 'blur':
      case 'fade':
      case 'redact':
      case 'scramble':
      case 'glitch': {
        const parameters = this.parseEffectParameters(flag, value);
        await this.effectHandlerRegistry.applyEffect('apply', effectContext, {
          effect: flag,
          ...parameters,
        });
        break;
      }

      // Handle interaction triggers (these remain CSS-based)
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

  /**
   * Parse effect parameters from flag values
   */
  private parseEffectParameters(effect: string, value?: string): Record<string, string | number> {
    if (!value) {
      // Default parameters for each effect
      const defaults = {
        blur: { intensity: 4 },
        fade: { intensity: 0.5 },
        redact: { color: '#000000' },
        scramble: { duration: '0.5s' },
        glitch: { intensity: 1 },
      };
      return defaults[effect as keyof typeof defaults] || {};
    }

    // Parse specific parameter based on effect type
    switch (effect) {
      case 'blur':
      case 'glitch':
        return { intensity: parseInt(value) };
      case 'fade':
        return { intensity: parseFloat(value) };
      case 'redact':
        return { color: value };
      case 'scramble':
        return { duration: value };
      default:
        return {};
    }
  }

  private async processMetaData(container: HTMLElement, metadata: string[], blockId: string) {
    const context: MetaDataContext = {
      blockId,
      element: container,
      settings: this.settings as Record<string, string | number | boolean>,
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
    const blockId = container.getAttribute('data-camo-id');

    // Set up click interactions
    if (container.hasClass('camo-trigger-click')) {
      container.addEventListener('click', () => {
        const isRevealed = container.hasClass('camo-revealed');

        if (isRevealed) {
          container.removeClass('camo-revealed');
        } else {
          container.addClass('camo-revealed');
        }

        // Update state
        if (blockId) {
          this.stateManager.setBlockRevealed(blockId, !isRevealed);
        }
      });
    }

    // Set up hover interactions
    if (container.hasClass('camo-trigger-hover')) {
      container.addEventListener('mouseenter', () => {
        if (blockId) {
          this.stateManager.incrementUserInteraction(blockId);
        }
      });
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
    styleElement.textContent =
      this.getCamoStyles() +
      '\n' +
      this.presetProcessor.getAllPresetStyles() +
      '\n' +
      this.syntaxHighlighter.getHighlightingStyles();
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

  /**
   * Process conditional metadata statements and return evaluated metadata
   */
  private async processConditionalMetadata(metadata: string[], blockId: string): Promise<string[]> {
    const processedMetadata: string[] = [];
    const conditionalGroups: {
      condition: string;
      ifStatements: string[];
      elseStatements: string[];
    }[] = [];
    let currentGroup: {
      condition: string;
      ifStatements: string[];
      elseStatements: string[];
    } | null = null;
    let inElseBranch = false;

    // Parse metadata for conditional statements
    for (const line of metadata) {
      const trimmed = line.trim();

      // Check for IF statements
      if (trimmed.startsWith(':^: IF{') && trimmed.includes('}')) {
        // Extract condition from IF{condition}
        const conditionMatch = trimmed.match(/:^:\s*IF\{([^}]+)\}/);
        if (conditionMatch) {
          // Finish previous group if exists
          if (currentGroup) {
            conditionalGroups.push(currentGroup);
          }

          // Start new conditional group
          currentGroup = {
            condition: conditionMatch[1],
            ifStatements: [],
            elseStatements: [],
          };
          inElseBranch = false;

          // Check if there's additional content after the condition
          const afterCondition = trimmed.replace(/:^:\s*IF\{[^}]+\}\s*/, '').trim();
          if (afterCondition && afterCondition.startsWith('//')) {
            currentGroup.ifStatements.push(afterCondition);
          }
        }
      }
      // Check for ELSE statements
      else if (trimmed.startsWith(':: ELSE') || trimmed.startsWith(':^: ELSE')) {
        if (currentGroup) {
          inElseBranch = true;

          // Check if there's content after ELSE
          const afterElse = trimmed.replace(/::\s*ELSE\s*|:^:\s*ELSE\s*/, '').trim();
          if (afterElse && afterElse.startsWith('//')) {
            currentGroup.elseStatements.push(afterElse);
          }
        }
      }
      // Check for conditional branch content
      else if (currentGroup && (trimmed.startsWith('::') || trimmed.startsWith(':^:'))) {
        if (inElseBranch) {
          currentGroup.elseStatements.push(trimmed);
        } else {
          currentGroup.ifStatements.push(trimmed);
        }
      }
      // Regular metadata (not conditional)
      else if (!currentGroup) {
        processedMetadata.push(line);
      }
    }

    // Finish last group if exists
    if (currentGroup) {
      conditionalGroups.push(currentGroup);
    }

    // Evaluate conditional groups and add appropriate statements
    for (const group of conditionalGroups) {
      try {
        const conditionResult = this.conditionalExecution.evaluateCondition(
          group.condition,
          blockId
        );

        if (conditionResult) {
          // Add IF branch statements
          processedMetadata.push(...group.ifStatements);

          if (this.settings.debugMode) {
            console.log(
              `CAMO Conditional: IF condition "${group.condition}" evaluated to TRUE for block ${blockId}`
            );
          }
        } else {
          // Add ELSE branch statements
          processedMetadata.push(...group.elseStatements);

          if (this.settings.debugMode) {
            console.log(
              `CAMO Conditional: IF condition "${group.condition}" evaluated to FALSE for block ${blockId}, executing ELSE branch`
            );
          }
        }
      } catch (error) {
        console.warn(`CAMO Conditional: Failed to evaluate condition "${group.condition}":`, error);
        // On error, default to ELSE branch for fail-safe behavior
        processedMetadata.push(...group.elseStatements);
      }
    }

    return processedMetadata;
  }

  /**
   * Handle interaction events for conditional execution
   */
  private handleInteractionEvent(
    event: Event,
    type: 'hover' | 'clicked' | 'focused',
    value: boolean
  ): void {
    const blockId = this.extractBlockIdFromEvent(event);
    if (blockId) {
      this.conditionalExecution.updateInteractionState(blockId, {
        [type]: value,
      });
    }
  }

  /**
   * Extract CAMO block ID from DOM event
   */
  private extractBlockIdFromEvent(event: Event): string | null {
    const target = event.target as HTMLElement;
    if (!target) return null;

    // Find closest CAMO block element
    const camoBlock = target.closest('[data-camo-id]');
    if (camoBlock) {
      return camoBlock.getAttribute('data-camo-id');
    }

    return null;
  }

  /**
   * Process metadata instructions for reactive rendering
   */
  private async processReactiveMetadata(
    metadata: string[],
    blockId: string,
    container: HTMLElement
  ): Promise<void> {
    try {
      // Filter out conditional statements (already processed)
      const reactiveInstructions = metadata.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('::') && !trimmed.includes('IF{') && !trimmed.includes('ELSE');
      });

      // Process each instruction for reactive updates
      if (reactiveInstructions.length > 0) {
        await this.reactiveRenderer.applyInstructionBatch(
          blockId,
          reactiveInstructions,
          container,
          'system'
        );
      }
    } catch (error) {
      console.error('CAMO: Failed to process reactive metadata:', error);
    }
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
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
      .addDropdown(dropdown => {
        const presetOptions: Record<string, string> = {};
        this.plugin
          .getPresetProcessor()
          .getAllPresets()
          .forEach(preset => {
            presetOptions[preset.id] = preset.name;
          });

        return dropdown
          .addOptions(presetOptions)
          .setValue(this.plugin.settings.defaultPreset)
          .onChange(async value => {
            this.plugin.settings.defaultPreset = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Reveal on hover')
      .setDesc('Automatically reveal content on mouse hover')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.revealOnHover).onChange(async value => {
          this.plugin.settings.revealOnHover = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Enable animations')
      .setDesc('Enable visual animations and effects')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.enableAnimations).onChange(async value => {
          this.plugin.settings.enableAnimations = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Performance mode')
      .setDesc('Reduce visual effects for better performance')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.performanceMode).onChange(async value => {
          this.plugin.settings.performanceMode = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Debug mode')
      .setDesc('Show error messages in blocks')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.debugMode).onChange(async value => {
          this.plugin.settings.debugMode = value;
          await this.plugin.saveSettings();
        })
      );

    // Security Settings Section
    containerEl.createEl('h3', { text: 'Security Settings' });

    new Setting(containerEl)
      .setName('Enable security features')
      .setDesc('Enable encryption, hashing, and signing capabilities')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.enableSecurity).onChange(async value => {
          this.plugin.settings.enableSecurity = value;
          await this.plugin.saveSettings();
          // Reinitialize security integration with new settings
          this.plugin.initializeSecurityIntegration();
        })
      );

    new Setting(containerEl)
      .setName('Security audit logging')
      .setDesc('Log security operations for debugging (disable in production)')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.securityAudit).onChange(async value => {
          this.plugin.settings.securityAudit = value;
          await this.plugin.saveSettings();
          // Reinitialize security integration with new settings
          this.plugin.initializeSecurityIntegration();
        })
      );

    // Display security capabilities
    const capabilities = CamoSecurityIntegration.isSupported()
      ? 'Web Crypto API available: AES-GCM, AES-CBC, SHA-256, SHA-512, ECDSA'
      : 'Web Crypto API not available - security features disabled';

    new Setting(containerEl).setName('Security capabilities').setDesc(capabilities);

    // Rendering Settings Section
    containerEl.createEl('h3', { text: 'Rendering Settings' });

    new Setting(containerEl)
      .setName('GPU acceleration')
      .setDesc('Enable GPU-accelerated rendering for complex effects')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.gpuAcceleration).onChange(async value => {
          this.plugin.settings.gpuAcceleration = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Render mode')
      .setDesc('Choose rendering strategy: auto (recommended), CSS-only, Canvas, or WebGL')
      .addDropdown(dropdown =>
        dropdown
          .addOption('auto', 'Auto (recommended)')
          .addOption('css', 'CSS only')
          .addOption('canvas', 'Canvas')
          .addOption('webgl', 'WebGL')
          .setValue(this.plugin.settings.renderMode)
          .onChange(async (value: 'css' | 'canvas' | 'webgl' | 'auto') => {
            this.plugin.settings.renderMode = value;
            await this.plugin.saveSettings();
          })
      );

    // Display render capabilities
    const renderCapabilities = this.plugin.getRenderStrategyManager().getCapabilities();
    const capabilityList = [
      `CSS: ${renderCapabilities.css ? 'Available' : 'Unavailable'}`,
      `Canvas: ${renderCapabilities.canvas ? 'Available' : 'Unavailable'}`,
      `WebGL: ${renderCapabilities.webgl ? 'Available' : 'Unavailable'}`,
    ].join(', ');

    new Setting(containerEl).setName('Render capabilities').setDesc(capabilityList);

    // Community Settings Section
    containerEl.createEl('h3', { text: 'Community Settings' });

    new Setting(containerEl)
      .setName('Enable community presets')
      .setDesc('Allow browsing and installing presets shared by the community')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.enableCommunityPresets).onChange(async value => {
          this.plugin.settings.enableCommunityPresets = value;
          await this.plugin.saveSettings();
          this.plugin.updateCommunitySettings();
        })
      );

    new Setting(containerEl)
      .setName('GitHub token')
      .setDesc('Personal access token for sharing presets (optional)')
      .addText(text =>
        text
          .setPlaceholder('ghp_xxxxxxxxxxxxxxxxxxxx')
          .setValue(this.plugin.settings.githubToken)
          .onChange(async value => {
            this.plugin.settings.githubToken = value;
            await this.plugin.saveSettings();
            this.plugin.updateCommunitySettings();
          })
      );

    new Setting(containerEl)
      .setName('Auto-update presets')
      .setDesc('Automatically check for updates to installed community presets')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.autoUpdatePresets).onChange(async value => {
          this.plugin.settings.autoUpdatePresets = value;
          await this.plugin.saveSettings();
          this.plugin.updateCommunitySettings();
        })
      );

    new Setting(containerEl)
      .setName('Enable beta presets')
      .setDesc('Show experimental and beta presets in community browser')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.enableBetaPresets).onChange(async value => {
          this.plugin.settings.enableBetaPresets = value;
          await this.plugin.saveSettings();
          this.plugin.updateCommunitySettings();
        })
      );

    new Setting(containerEl)
      .setName('Trusted authors')
      .setDesc('Comma-separated list of trusted GitHub usernames')
      .addText(text =>
        text
          .setPlaceholder('user1, user2, organization1')
          .setValue(this.plugin.settings.trustedAuthors.join(', '))
          .onChange(async value => {
            this.plugin.settings.trustedAuthors = value
              .split(',')
              .map(author => author.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
            this.plugin.updateCommunitySettings();
          })
      );

    // Community stats
    const installedCount = this.plugin.getCommunitySharing().getInstalledPresets().length;
    new Setting(containerEl)
      .setName('Installed community presets')
      .setDesc(`${installedCount} community presets currently installed`);
  }
}

// Type definitions

interface CamoConfig {
  flags: string[];
  metadata: string[];
  content: string;
  preset: string | null;
  settings: CamoSettings;
  blockId: string;
}
