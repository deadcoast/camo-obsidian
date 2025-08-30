/**
 * Set Effect Handler
 * Handles 'set' keyword effects (background, color, opacity, etc.)
 */

import { BaseEffectHandler, EffectContext, EffectResult } from './EffectHandler';

export class SetEffectHandler extends BaseEffectHandler {
  readonly effectType = 'set';
  protected readonly priority = 1; // High priority for base styling

  async apply(context: EffectContext, parameters: Record<string, any>): Promise<EffectResult> {
    const { element } = context;
    const { property, value } = parameters;
    const effectId = this.generateEffectId();

    const appliedStyles: Record<string, string> = {};
    const appliedClasses: string[] = [];

    try {
      switch (property) {
        case 'background':
          element.style.backgroundColor = value;
          appliedStyles['background-color'] = value;
          break;

        case 'color':
          element.style.color = value;
          appliedStyles['color'] = value;
          break;

        case 'opacity': {
          const opacityValue = Math.max(0, Math.min(1, parseFloat(value)));
          element.style.opacity = opacityValue.toString();
          appliedStyles['opacity'] = opacityValue.toString();
          break;
        }

        case 'blur': {
          const blurValue = Math.max(0, parseFloat(value));
          element.style.filter = `blur(${blurValue}px)`;
          appliedStyles['filter'] = `blur(${blurValue}px)`;
          break;
        }

        case 'border':
          element.style.border = value;
          appliedStyles['border'] = value;
          break;

        case 'borderRadius':
          element.style.borderRadius = value;
          appliedStyles['border-radius'] = value;
          break;

        case 'padding':
          element.style.padding = value;
          appliedStyles['padding'] = value;
          break;

        case 'margin':
          element.style.margin = value;
          appliedStyles['margin'] = value;
          break;

        case 'fontSize':
          element.style.fontSize = value;
          appliedStyles['font-size'] = value;
          break;

        case 'fontFamily':
          element.style.fontFamily = value;
          appliedStyles['font-family'] = value;
          break;

        case 'textAlign':
          element.style.textAlign = value;
          appliedStyles['text-align'] = value;
          break;

        case 'width':
          element.style.width = value;
          appliedStyles['width'] = value;
          break;

        case 'height':
          element.style.height = value;
          appliedStyles['height'] = value;
          break;

        case 'transform':
          element.style.transform = value;
          appliedStyles['transform'] = value;
          break;

        case 'boxShadow':
          element.style.boxShadow = value;
          appliedStyles['box-shadow'] = value;
          break;

        case 'position':
          element.style.position = value;
          appliedStyles['position'] = value;
          break;

        case 'zIndex':
          element.style.zIndex = value;
          appliedStyles['z-index'] = value;
          break;

        case 'display':
          element.style.display = value;
          appliedStyles['display'] = value;
          break;

        case 'visibility':
          element.style.visibility = value;
          appliedStyles['visibility'] = value;
          break;

        default:
          throw new Error(`Unknown set property: ${property}`);
      }

      // Store original values for removal
      element.setAttribute(
        `data-camo-original-${property}`,
        element.style.getPropertyValue(property) || 'initial'
      );
      element.setAttribute(`data-camo-effect-${effectId}`, JSON.stringify({ property, value }));

      return {
        success: true,
        effectId,
        appliedStyles,
        appliedClasses,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async remove(context: EffectContext, effectId: string): Promise<boolean> {
    const { element } = context;

    try {
      const effectData = element.getAttribute(`data-camo-effect-${effectId}`);
      if (!effectData) {
        return false;
      }

      const { property } = JSON.parse(effectData);
      const originalValue = element.getAttribute(`data-camo-original-${property}`);

      if (originalValue === 'initial') {
        element.style.removeProperty(this.camelToKebab(property));
      } else {
        element.style.setProperty(this.camelToKebab(property), originalValue);
      }

      // Clean up attributes
      element.removeAttribute(`data-camo-effect-${effectId}`);
      element.removeAttribute(`data-camo-original-${property}`);

      return true;
    } catch (error) {
      console.error('Failed to remove set effect:', error);
      return false;
    }
  }

  isApplied(context: EffectContext): boolean {
    const { element } = context;
    const attributes = element.getAttributeNames();
    return attributes.some(attr => attr.startsWith('data-camo-effect-set_'));
  }

  validateParameters(parameters: Record<string, any>): boolean {
    const { property, value } = parameters;

    if (!property || !value) {
      return false;
    }

    // Validate specific properties
    switch (property) {
      case 'opacity': {
        const opacity = parseFloat(value);
        return !isNaN(opacity) && opacity >= 0 && opacity <= 1;
      }

      case 'blur': {
        const blur = parseFloat(value);
        return !isNaN(blur) && blur >= 0;
      }

      case 'zIndex':
        return !isNaN(parseInt(value));

      default:
        return typeof value === 'string' && value.length > 0;
    }
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}
