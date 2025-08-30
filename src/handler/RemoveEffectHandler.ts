import { Plugin } from 'obsidian';
import { BaseEffectHandler, EffectContext, EffectResult } from './EffectHandler';

export class RemoveEffectHandler extends BaseEffectHandler {
  readonly effectType = 'remove';
  private readonly plugin: Plugin;

  constructor(plugin: Plugin) {
    super();
    this.plugin = plugin;
  }

  async apply(
    context: EffectContext,
    parameters: Record<string, string | number | boolean>
  ): Promise<EffectResult> {
    try {
      const effect = (parameters.effect as string) || 'remove';

      switch (effect) {
        case 'remove':
          return this.removeEffect(context, parameters);
        case 'clear':
          return this.clearEffect(context, parameters);
        case 'reset':
          return this.resetEffect(context, parameters);
        default:
          return { success: false, error: `Unknown effect: ${effect}` };
      }
    } catch (error) {
      console.error(`RemoveEffectHandler error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async remove(context: EffectContext, effectId: string): Promise<boolean> {
    try {
      this.clearEffect(context, {});
      return true;
    } catch (error) {
      console.error(`RemoveEffectHandler remove error:`, error);
      return false;
    }
  }

  isApplied(context: EffectContext): boolean {
    return context.element.classList.contains('camo-removed');
  }

  private removeEffect(
    context: EffectContext,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const target = (parameters.target as string) || 'all';
    const element = context.element;

    switch (target) {
      case 'all':
        element.style.filter = '';
        element.style.transform = '';
        element.style.opacity = '';
        element.style.background = '';
        element.style.color = '';
        break;
      case 'filter':
        element.style.filter = '';
        break;
      case 'transform':
        element.style.transform = '';
        break;
      case 'opacity':
        element.style.opacity = '';
        break;
      case 'background':
        element.style.background = '';
        break;
      case 'color':
        element.style.color = '';
        break;
      default:
        return { success: false, error: `Unknown target: ${target}` };
    }

    // Remove CAMO-specific classes
    element.classList.remove('camo-blurred', 'camo-pixelated', 'camo-scrambled');

    return { success: true, effectId: 'remove' };
  }

  private clearEffect(
    context: EffectContext,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const element = context.element;

    // Clear all inline styles
    element.removeAttribute('style');

    // Remove all CAMO classes
    const camoClasses = Array.from(element.classList).filter(cls => cls.startsWith('camo-'));
    element.classList.remove(...camoClasses);

    // Remove CAMO data attributes
    const camoAttributes = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-camo-'))
      .map(attr => attr.name);

    camoAttributes.forEach(attr => element.removeAttribute(attr));

    return { success: true, effectId: 'clear' };
  }

  private resetEffect(
    context: EffectContext,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const element = context.element;

    // Reset to default state
    this.clearEffect(context, parameters);

    // Restore original content if available
    const originalContent = element.getAttribute('data-camo-original');
    if (originalContent) {
      element.textContent = originalContent;
    }

    return { success: true, effectId: 'reset' };
  }
}
