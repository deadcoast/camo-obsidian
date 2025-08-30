/**
 * Apply Effect Handler
 * Handles 'apply' keyword effects (filters, transforms, animations)
 */

import { BaseEffectHandler, EffectContext, EffectResult } from './EffectHandler';

export class ApplyEffectHandler extends BaseEffectHandler {
  readonly effectType = 'apply';
  protected readonly priority = 2;

  async apply(context: EffectContext, parameters: Record<string, any>): Promise<EffectResult> {
    const { element } = context;
    const { effect, ...effectParams } = parameters;
    const effectId = this.generateEffectId();

    try {
      switch (effect) {
        case 'blur':
          return await this.applyBlur(element, effectParams, effectId);
        case 'pixelate':
          return await this.applyPixelate(element, effectParams, effectId);
        case 'scale':
          return await this.applyScale(element, effectParams, effectId);
        case 'rotate':
          return await this.applyRotate(element, effectParams, effectId);
        default:
          throw new Error(`Unknown apply effect: ${effect}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async applyBlur(
    element: HTMLElement,
    params: Record<string, any>,
    effectId: string
  ): Promise<EffectResult> {
    const intensity = Math.max(0, parseFloat(params.intensity || '4'));
    const filter = `blur(${intensity}px)`;

    this.addFilter(element, filter);
    element.setAttribute(`data-camo-effect-${effectId}`, JSON.stringify({ type: 'blur', filter }));

    return {
      success: true,
      effectId,
      appliedStyles: { filter: element.style.filter },
    };
  }

  private async applyPixelate(
    element: HTMLElement,
    params: Record<string, any>,
    effectId: string
  ): Promise<EffectResult> {
    const size = Math.max(1, parseInt(params.size || '4'));

    element.style.imageRendering = 'pixelated';
    const filter = `contrast(1000%) blur(${size}px) contrast(100%)`;
    this.addFilter(element, filter);

    element.setAttribute(
      `data-camo-effect-${effectId}`,
      JSON.stringify({ type: 'pixelate', filter, size })
    );

    return {
      success: true,
      effectId,
      appliedStyles: {
        filter: element.style.filter,
        'image-rendering': 'pixelated',
      },
    };
  }

  private async applyScale(
    element: HTMLElement,
    params: Record<string, any>,
    effectId: string
  ): Promise<EffectResult> {
    const x = parseFloat(params.x || params.scale || '1');
    const y = parseFloat(params.y || params.scale || '1');
    const transform = `scale(${x}, ${y})`;

    this.addTransform(element, transform);
    element.setAttribute(
      `data-camo-effect-${effectId}`,
      JSON.stringify({ type: 'scale', transform })
    );

    return {
      success: true,
      effectId,
      appliedStyles: { transform: element.style.transform },
    };
  }

  private async applyRotate(
    element: HTMLElement,
    params: Record<string, any>,
    effectId: string
  ): Promise<EffectResult> {
    const degrees = parseFloat(params.degrees || '0');
    const transform = `rotate(${degrees}deg)`;

    this.addTransform(element, transform);
    element.setAttribute(
      `data-camo-effect-${effectId}`,
      JSON.stringify({ type: 'rotate', transform })
    );

    return {
      success: true,
      effectId,
      appliedStyles: { transform: element.style.transform },
    };
  }

  private addFilter(element: HTMLElement, newFilter: string): void {
    const currentFilter = element.style.filter;
    element.style.filter = currentFilter ? `${currentFilter} ${newFilter}` : newFilter;
  }

  private addTransform(element: HTMLElement, newTransform: string): void {
    const currentTransform = element.style.transform;
    element.style.transform = currentTransform
      ? `${currentTransform} ${newTransform}`
      : newTransform;
  }

  async remove(context: EffectContext, effectId: string): Promise<boolean> {
    const { element } = context;

    try {
      const effectData = element.getAttribute(`data-camo-effect-${effectId}`);
      if (!effectData) {
        return false;
      }

      const { filter, transform } = JSON.parse(effectData);

      if (filter) {
        this.removeFilter(element, filter);
      }
      if (transform) {
        this.removeTransform(element, transform);
      }

      element.removeAttribute(`data-camo-effect-${effectId}`);
      return true;
    } catch (error) {
      console.error('Failed to remove apply effect:', error);
      return false;
    }
  }

  private removeFilter(element: HTMLElement, filterToRemove: string): void {
    const currentFilter = element.style.filter;
    if (currentFilter) {
      const filters = currentFilter.split(' ').filter(f => f !== filterToRemove);
      element.style.filter = filters.join(' ');
    }
  }

  private removeTransform(element: HTMLElement, transformToRemove: string): void {
    const currentTransform = element.style.transform;
    if (currentTransform) {
      const transforms = currentTransform.split(' ').filter(t => t !== transformToRemove);
      element.style.transform = transforms.join(' ');
    }
  }

  isApplied(context: EffectContext): boolean {
    const { element } = context;
    const attributes = element.getAttributeNames();
    return attributes.some(attr => attr.startsWith('data-camo-effect-apply_'));
  }

  validateParameters(parameters: Record<string, any>): boolean {
    return parameters.effect && typeof parameters.effect === 'string';
  }
}
