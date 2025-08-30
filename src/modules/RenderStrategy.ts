/**
 * CAMO Render Strategy System
 *
 * Provides different rendering approaches for visual effects:
 * - CSS-only rendering (fastest, most compatible)
 * - Canvas-based rendering (better quality, more effects)
 * - WebGL rendering (best performance for complex effects)
 */

import { VisualEffectsEngine } from '../engines/VisualEffectsEngine';

export type RenderMode = 'css' | 'canvas' | 'webgl' | 'auto';

export interface RenderContext {
  element: HTMLElement;
  content: string;
  blockId: string;
  settings: {
    performanceMode: boolean;
    enableAnimations: boolean;
    gpuAcceleration: boolean;
  };
}

export interface EffectDefinition {
  type: string;
  parameters: Record<string, string | number | boolean>;
  priority: number;
  requiresCanvas?: boolean;
  requiresWebGL?: boolean;
}

export interface RenderResult {
  success: boolean;
  renderMode: RenderMode;
  performance: {
    renderTime: number;
    effectsApplied: number;
    fallbackUsed: boolean;
  };
  errors?: string[];
}

/**
 * Base class for different rendering strategies
 */
abstract class BaseRenderStrategy {
  protected visualEffects: VisualEffectsEngine;

  constructor(visualEffects: VisualEffectsEngine) {
    this.visualEffects = visualEffects;
  }

  abstract canRender(effects: EffectDefinition[], context: RenderContext): boolean;
  abstract render(effects: EffectDefinition[], context: RenderContext): Promise<RenderResult>;
  abstract cleanup(element: HTMLElement): void;

  protected measurePerformance<T>(fn: () => T): { result: T; time: number } {
    const start = performance.now();
    const result = fn();
    const time = performance.now() - start;
    return { result, time };
  }
}

/**
 * CSS-only rendering strategy (default, most compatible)
 */
class CSSRenderStrategy extends BaseRenderStrategy {
  canRender(effects: EffectDefinition[], context: RenderContext): boolean {
    // CSS can handle most basic effects
    const unsupportedEffects = effects.filter(e => e.requiresCanvas || e.requiresWebGL);
    return unsupportedEffects.length === 0;
  }

  async render(effects: EffectDefinition[], context: RenderContext): Promise<RenderResult> {
    const startTime = performance.now();
    let effectsApplied = 0;
    const errors: string[] = [];

    try {
      // Sort effects by priority
      const sortedEffects = [...effects].sort((a, b) => a.priority - b.priority);

      for (const effect of sortedEffects) {
        try {
          await this.visualEffects.applyEffect(context.element, effect.type, effect.parameters);
          effectsApplied++;
        } catch (error) {
          errors.push(`CSS render failed for ${effect.type}: ${error}`);
          console.warn(`CAMO CSS Render: Failed to apply ${effect.type}:`, error);
        }
      }

      // Add CSS-specific optimizations
      context.element.addClass('camo-css-rendered');

      if (context.settings.performanceMode) {
        context.element.addClass('camo-performance-mode');
      }

      return {
        success: errors.length === 0,
        renderMode: 'css',
        performance: {
          renderTime: performance.now() - startTime,
          effectsApplied,
          fallbackUsed: false,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        renderMode: 'css',
        performance: {
          renderTime: performance.now() - startTime,
          effectsApplied,
          fallbackUsed: true,
        },
        errors: [`CSS rendering failed: ${error}`],
      };
    }
  }

  cleanup(element: HTMLElement): void {
    element.removeClass('camo-css-rendered');
    element.removeClass('camo-performance-mode');
    // Remove CSS-based effects
    const cssClasses = Array.from(element.classList).filter(cls => cls.startsWith('camo-effect-'));
    cssClasses.forEach(cls => element.removeClass(cls));
  }
}

/**
 * Canvas-based rendering strategy (better quality)
 */
class CanvasRenderStrategy extends BaseRenderStrategy {
  private canvasCache = new Map<string, HTMLCanvasElement>();

  canRender(effects: EffectDefinition[], context: RenderContext): boolean {
    // Canvas can handle more advanced effects
    const webglOnlyEffects = effects.filter(e => e.requiresWebGL);
    return webglOnlyEffects.length === 0;
  }

  async render(effects: EffectDefinition[], context: RenderContext): Promise<RenderResult> {
    const startTime = performance.now();
    let effectsApplied = 0;
    const errors: string[] = [];

    try {
      // For now, fallback to CSS rendering with canvas optimization markers
      // Full canvas implementation would create and manage canvas elements

      for (const effect of effects) {
        try {
          await this.visualEffects.applyEffect(context.element, effect.type, effect.parameters);
          effectsApplied++;
        } catch (error) {
          errors.push(`Canvas render failed for ${effect.type}: ${error}`);
        }
      }

      context.element.addClass('camo-canvas-rendered');

      return {
        success: errors.length === 0,
        renderMode: 'canvas',
        performance: {
          renderTime: performance.now() - startTime,
          effectsApplied,
          fallbackUsed: true,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        renderMode: 'canvas',
        performance: {
          renderTime: performance.now() - startTime,
          effectsApplied,
          fallbackUsed: true,
        },
        errors: [`Canvas rendering failed: ${error}`],
      };
    }
  }

  cleanup(element: HTMLElement): void {
    element.removeClass('camo-canvas-rendered');

    // Remove canvas elements
    const canvases = element.querySelectorAll('.camo-canvas-overlay');
    canvases.forEach(canvas => canvas.remove());

    // Clean up cache entries for this element
    const blockId = element.getAttribute('data-camo-id');
    if (blockId && this.canvasCache.has(blockId)) {
      this.canvasCache.delete(blockId);
    }
  }
}

/**
 * WebGL rendering strategy (best performance for complex effects)
 */
class WebGLRenderStrategy extends BaseRenderStrategy {
  private static isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  canRender(effects: EffectDefinition[], context: RenderContext): boolean {
    if (!WebGLRenderStrategy.isWebGLSupported()) return false;
    if (!context.settings.gpuAcceleration) return false;

    // Only use WebGL for complex effects that benefit from GPU acceleration
    const complexEffects = effects.filter(
      e => e.type === 'complex-filter' || e.type === 'shader-effect' || e.requiresWebGL
    );

    return complexEffects.length > 0;
  }

  async render(effects: EffectDefinition[], context: RenderContext): Promise<RenderResult> {
    // WebGL implementation would go here
    // For now, fallback to canvas rendering
    const canvasStrategy = new CanvasRenderStrategy(this.visualEffects);
    const result = await canvasStrategy.render(effects, context);

    return {
      ...result,
      renderMode: 'webgl',
      performance: {
        ...result.performance,
        fallbackUsed: true,
      },
    };
  }

  cleanup(element: HTMLElement): void {
    // WebGL cleanup would go here
    const canvasStrategy = new CanvasRenderStrategy(this.visualEffects);
    canvasStrategy.cleanup(element);
  }
}

/**
 * Main Render Strategy Manager
 */
export class RenderStrategyManager {
  private strategies: Map<RenderMode, BaseRenderStrategy>;
  private defaultStrategy: BaseRenderStrategy;

  constructor(visualEffects: VisualEffectsEngine) {
    this.strategies = new Map([
      ['css', new CSSRenderStrategy(visualEffects)],
      ['canvas', new CanvasRenderStrategy(visualEffects)],
      ['webgl', new WebGLRenderStrategy(visualEffects)],
    ]);

    this.defaultStrategy = this.strategies.get('css') || new CSSRenderStrategy(visualEffects);
  }

  /**
   * Automatically select the best rendering strategy
   */
  selectStrategy(effects: EffectDefinition[], context: RenderContext): BaseRenderStrategy {
    if (context.settings.performanceMode) {
      return this.defaultStrategy;
    }

    // Try strategies in order of preference: WebGL -> Canvas -> CSS
    const preferredOrder: RenderMode[] = ['webgl', 'canvas', 'css'];

    for (const mode of preferredOrder) {
      const strategy = this.strategies.get(mode);
      if (strategy && strategy.canRender(effects, context)) {
        return strategy;
      }
    }

    return this.defaultStrategy;
  }

  /**
   * Render effects using the specified or auto-selected strategy
   */
  async render(
    effects: EffectDefinition[],
    context: RenderContext,
    mode: RenderMode = 'auto'
  ): Promise<RenderResult> {
    let strategy: BaseRenderStrategy;

    if (mode === 'auto') {
      strategy = this.selectStrategy(effects, context);
    } else {
      strategy = this.strategies.get(mode) || this.defaultStrategy;

      // Verify the strategy can handle the effects
      if (!strategy.canRender(effects, context)) {
        console.warn(`CAMO Render: ${mode} strategy cannot render effects, falling back to CSS`);
        strategy = this.defaultStrategy;
      }
    }

    try {
      return await strategy.render(effects, context);
    } catch (error) {
      console.error('CAMO Render: Strategy failed, using fallback:', error);

      // Fallback to CSS if the selected strategy fails
      if (strategy !== this.defaultStrategy) {
        return await this.defaultStrategy.render(effects, context);
      } else {
        throw error;
      }
    }
  }

  /**
   * Clean up rendering artifacts
   */
  cleanup(element: HTMLElement): void {
    // Clean up all possible rendering artifacts
    this.strategies.forEach(strategy => {
      strategy.cleanup(element);
    });
  }

  /**
   * Get performance statistics
   */
  getCapabilities(): {
    css: boolean;
    canvas: boolean;
    webgl: boolean;
  } {
    try {
      const canvas = document.createElement('canvas');
      const webglSupported = !!(
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      );

      return {
        css: true,
        canvas: true,
        webgl: webglSupported,
      };
    } catch (e) {
      return {
        css: true,
        canvas: true,
        webgl: false,
      };
    }
  }
}
