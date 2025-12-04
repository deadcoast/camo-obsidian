import { Plugin } from 'obsidian';
import { BaseEffectHandler, EffectContext, EffectResult } from './EffectHandler';

export class ToggleEffectHandler extends BaseEffectHandler {
  readonly effectType = 'toggle';
  private readonly plugin: Plugin;
  private toggleStates: Map<string, boolean> = new Map();

  constructor(plugin: Plugin) {
    super();
    this.plugin = plugin;
  }

  async apply(
    context: EffectContext,
    parameters: Record<string, string | number | boolean>
  ): Promise<EffectResult> {
    try {
      const effect = (parameters.effect as string) || 'toggle';
      const blockId = context.blockId;
      const toggleKey = `${blockId}-${effect}`;

      const currentState = this.toggleStates.get(toggleKey) || false;
      const newState = !currentState;

      this.toggleStates.set(toggleKey, newState);

      switch (effect) {
        case 'toggle':
          return this.toggleVisibility(context, newState, parameters);
        case 'switch':
          return this.switchContent(context, newState, parameters);
        case 'flip':
          return this.flipEffect(context, newState, parameters);
        default:
          return { success: false, error: `Unknown effect: ${effect}` };
      }
    } catch (error) {
      console.error(`ToggleEffectHandler error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async remove(context: EffectContext, effectId: string): Promise<boolean> {
    try {
      const toggleKey = `${context.blockId}-${effectId}`;
      this.toggleStates.delete(toggleKey);
      return true;
    } catch (error) {
      console.error(`ToggleEffectHandler remove error:`, error);
      return false;
    }
  }

  isApplied(context: EffectContext): boolean {
    const toggleKey = `${context.blockId}-toggle`;
    return this.toggleStates.get(toggleKey) || false;
  }

  private toggleVisibility(
    context: EffectContext,
    isVisible: boolean,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const duration = (parameters.duration as number) || 300;
    const element = context.element;

    if (isVisible) {
      element.style.display = '';
      element.style.opacity = '1';
      element.style.transition = `opacity ${duration}ms ease`;
    } else {
      element.style.transition = `opacity ${duration}ms ease`;
      element.style.opacity = '0';
      setTimeout(() => {
        element.style.display = 'none';
      }, duration);
    }

    return { success: true, effectId: 'toggle' };
  }

  private switchContent(
    context: EffectContext,
    isSwitched: boolean,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const element = context.element;
    const originalContent = element.getAttribute('data-camo-original') || element.textContent || '';
    const alternateContent = (parameters.content as string) || '***';

    if (isSwitched) {
      element.setAttribute('data-camo-original', originalContent);
      element.textContent = alternateContent;
    } else {
      element.textContent = originalContent;
    }

    return { success: true, effectId: 'switch' };
  }

  private flipEffect(
    context: EffectContext,
    isFlipped: boolean,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const element = context.element;
    const duration = (parameters.duration as number) || 500;

    if (isFlipped) {
      element.style.transform = 'rotateY(180deg)';
      element.style.transition = `transform ${duration}ms ease`;
    } else {
      element.style.transform = 'rotateY(0deg)';
      element.style.transition = `transform ${duration}ms ease`;
    }

    return { success: true, effectId: 'flip' };
  }

  getToggleState(blockId: string, effect: string): boolean {
    const toggleKey = `${blockId}-${effect}`;
    return this.toggleStates.get(toggleKey) || false;
  }

  setToggleState(blockId: string, effect: string, state: boolean): void {
    const toggleKey = `${blockId}-${effect}`;
    this.toggleStates.set(toggleKey, state);
  }

  clearToggleStates(): void {
    this.toggleStates.clear();
  }
}
