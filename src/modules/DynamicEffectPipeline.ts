/**
 * Dynamic Effect Pipeline
 * Advanced effect composition and rendering system
 */

export interface Effect {
  id: string;
  name: string;
  apply: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
  options: Record<string, string | number | boolean>;
  priority: number;
  conflicts?: string[];
  dependencies?: string[];
}

export interface EffectLayer {
  effects: Effect[];
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  opacity: number;
}

export interface PipelineConfig {
  maxEffects: number;
  enableGPUAcceleration: boolean;
  fallbackToCanvas: boolean;
  performanceMode: boolean;
}

export class DynamicEffectPipeline {
  private effectStack: Effect[] = [];
  private layers: EffectLayer[] = [];
  private config: PipelineConfig;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(config?: Partial<PipelineConfig>) {
    this.config = {
      maxEffects: 10,
      enableGPUAcceleration: true,
      fallbackToCanvas: true,
      performanceMode: false,
      ...config,
    };
  }

  addEffect(effect: Effect): boolean {
    // Check for conflicts
    if (this.hasConflicts(effect)) {
      console.warn(`Effect ${effect.id} conflicts with existing effects`);
      return false;
    }

    // Check max effects limit
    if (this.effectStack.length >= this.config.maxEffects) {
      console.warn(`Maximum effects limit (${this.config.maxEffects}) reached`);
      return false;
    }

    // Add effect and sort by priority
    this.effectStack.push(effect);
    this.effectStack.sort((a, b) => b.priority - a.priority);

    return true;
  }

  removeEffect(effectId: string): boolean {
    const index = this.effectStack.findIndex(e => e.id === effectId);
    if (index === -1) return false;

    this.effectStack.splice(index, 1);
    return true;
  }

  private hasConflicts(newEffect: Effect): boolean {
    if (!newEffect.conflicts) return false;

    return this.effectStack.some(
      existingEffect =>
        newEffect.conflicts!.includes(existingEffect.id) ||
        existingEffect.conflicts?.includes(newEffect.id)
    );
  }

  composite(element: HTMLElement): void {
    if (this.effectStack.length === 0) return;

    // Apply effects in priority order
    for (const effect of this.effectStack) {
      try {
        effect.apply(element, effect.options);
      } catch (error) {
        console.error(`Error applying effect ${effect.id}:`, error);
      }
    }

    // Apply layer blending if multiple layers exist
    if (this.layers.length > 1) {
      this.applyLayerBlending(element);
    }
  }

  private applyLayerBlending(element: HTMLElement): void {
    // Implement layer blending logic
    for (const layer of this.layers) {
      element.style.mixBlendMode = layer.blendMode;
      element.style.opacity = layer.opacity.toString();
    }
  }

  createLayer(blendMode: EffectLayer['blendMode'] = 'normal', opacity = 1): EffectLayer {
    const layer: EffectLayer = {
      effects: [],
      blendMode,
      opacity,
    };
    this.layers.push(layer);
    return layer;
  }

  addEffectToLayer(layerIndex: number, effect: Effect): boolean {
    if (layerIndex >= this.layers.length) return false;

    this.layers[layerIndex].effects.push(effect);
    return true;
  }

  getEffectStack(): Effect[] {
    return [...this.effectStack];
  }

  getLayers(): EffectLayer[] {
    return [...this.layers];
  }

  clear(): void {
    this.effectStack = [];
    this.layers = [];
  }

  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  // Performance monitoring
  getPerformanceStats(): {
    effectCount: number;
    layerCount: number;
    memoryUsage: number;
  } {
    return {
      effectCount: this.effectStack.length,
      layerCount: this.layers.length,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    return this.effectStack.length * 1024 + this.layers.length * 512;
  }
}
