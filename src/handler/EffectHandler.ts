/**
 * Effect Handler System
 * Modular effect management for CAMO blocks
 *
 * Based on specifications in Docs/7_systemArchitecture.md
 */

export interface EffectContext {
  element: HTMLElement;
  blockId: string;
  content: string;
  settings: any;
  state: Map<string, any>;
}

export interface EffectResult {
  success: boolean;
  effectId?: string;
  error?: string;
  appliedClasses?: string[];
  appliedStyles?: Record<string, string>;
}

export abstract class BaseEffectHandler {
  abstract readonly effectType: string;
  protected readonly priority: number = 5;

  /**
   * Apply the effect to the target element
   */
  abstract apply(
    context: EffectContext,
    parameters: Record<string, any>
  ): Promise<EffectResult>;

  /**
   * Remove the effect from the target element
   */
  abstract remove(context: EffectContext, effectId: string): Promise<boolean>;

  /**
   * Check if effect is currently applied
   */
  abstract isApplied(context: EffectContext): boolean;

  /**
   * Get effect priority for layering
   */
  getPriority(): number {
    return this.priority;
  }

  /**
   * Validate effect parameters
   */
  validateParameters(parameters: Record<string, any>): boolean {
    return true; // Override in subclasses
  }

  /**
   * Generate unique effect ID
   */
  protected generateEffectId(): string {
    return `${this.effectType}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}

export class EffectHandlerRegistry {
  private handlers = new Map<string, BaseEffectHandler>();
  private appliedEffects = new Map<string, Map<string, EffectResult>>();

  /**
   * Register an effect handler
   */
  registerHandler(handler: BaseEffectHandler): void {
    this.handlers.set(handler.effectType, handler);
  }

  /**
   * Apply an effect using the appropriate handler
   */
  async applyEffect(
    effectType: string,
    context: EffectContext,
    parameters: Record<string, any>
  ): Promise<EffectResult> {
    const handler = this.handlers.get(effectType);

    if (!handler) {
      return {
        success: false,
        error: `Unknown effect type: ${effectType}`,
      };
    }

    if (!handler.validateParameters(parameters)) {
      return {
        success: false,
        error: `Invalid parameters for effect: ${effectType}`,
      };
    }

    try {
      const result = await handler.apply(context, parameters);

      if (result.success && result.effectId) {
        // Track applied effect
        if (!this.appliedEffects.has(context.blockId)) {
          this.appliedEffects.set(context.blockId, new Map());
        }
        const blockEffects = this.appliedEffects.get(context.blockId);
        if (blockEffects) {
          blockEffects.set(result.effectId, result);
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Remove an effect
   */
  async removeEffect(
    effectType: string,
    context: EffectContext,
    effectId: string
  ): Promise<boolean> {
    const handler = this.handlers.get(effectType);

    if (!handler) {
      return false;
    }

    try {
      const success = await handler.remove(context, effectId);

      if (success) {
        const blockEffects = this.appliedEffects.get(context.blockId);
        if (blockEffects) {
          blockEffects.delete(effectId);
        }
      }

      return success;
    } catch (error) {
      console.error(`Failed to remove effect ${effectId}:`, error);
      return false;
    }
  }

  /**
   * Get all applied effects for a block
   */
  getAppliedEffects(blockId: string): EffectResult[] {
    const blockEffects = this.appliedEffects.get(blockId);
    return blockEffects ? Array.from(blockEffects.values()) : [];
  }

  /**
   * Remove all effects from a block
   */
  async removeAllEffects(context: EffectContext): Promise<boolean> {
    const blockEffects = this.appliedEffects.get(context.blockId);

    if (!blockEffects) {
      return true;
    }

    const results = await Promise.all(
      Array.from(blockEffects.entries()).map(async ([effectId, result]) => {
        const handler = this.handlers.get(result.effectId?.split("_")[0] || "");
        return handler ? await handler.remove(context, effectId) : false;
      })
    );

    if (results.every((success) => success)) {
      this.appliedEffects.delete(context.blockId);
      return true;
    }

    return false;
  }

  /**
   * Get available effect types
   */
  getAvailableEffects(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if an effect type is available
   */
  hasEffect(effectType: string): boolean {
    return this.handlers.has(effectType);
  }
}
