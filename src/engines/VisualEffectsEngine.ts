/**
 * Visual Effects Engine
 * Handles all visual transformations and effects for CAMO blocks
 *
 * Based on specifications in Docs/7_systemArchitecture.md
 */

export interface VisualEffect {
  id: string;
  type: string;
  priority: number;
  parameters: Map<string, any>;
  cssClasses: string[];
  cssProperties: Map<string, string>;
}

export interface EffectParameters {
  intensity?: number;
  color?: string;
  duration?: string;
  easing?: string;
  delay?: string;
}

export interface RenderStrategy {
  blur: GaussianBlurFilter;
  pixelate: PixelationFilter;
  glitch: GlitchEffect;
  redact: RedactionOverlay;
  scramble: TextScrambler;
  fade: OpacityController;
  noise: VisualNoiseGenerator;
  distort: WaveDistortion;
}

export class VisualEffectsEngine {
  private styleElement: HTMLStyleElement;
  private effectStack: VisualEffect[] = [];
  private renderStrategy: Partial<RenderStrategy>;

  constructor() {
    this.renderStrategy = {
      blur: new GaussianBlurFilter(),
      pixelate: new PixelationFilter(),
      fade: new OpacityController(),
      redact: new RedactionOverlay(),
    };
  }

  /**
   * Initialize the visual effects engine
   */
  initialize(): void {
    this.injectStyles();
  }

  /**
   * Apply a visual effect to an element
   */
  applyEffect(
    element: HTMLElement,
    effectType: string,
    parameters: EffectParameters
  ): void {
    const effect = this.createEffect(effectType, parameters);

    // Add CSS classes
    effect.cssClasses.forEach((className) => {
      element.addClass(className);
    });

    // Apply CSS properties
    effect.cssProperties.forEach((value, property) => {
      element.style.setProperty(property, value);
    });

    // Store effect for management
    this.effectStack.push(effect);
  }

  /**
   * Remove effect from element
   */
  removeEffect(element: HTMLElement, effectId: string): void {
    const effect = this.effectStack.find((e) => e.id === effectId);
    if (effect) {
      // Remove CSS classes
      effect.cssClasses.forEach((className) => {
        element.removeClass(className);
      });

      // Remove CSS properties
      effect.cssProperties.forEach((value, property) => {
        element.style.removeProperty(property);
      });

      // Remove from stack
      this.effectStack = this.effectStack.filter((e) => e.id !== effectId);
    }
  }

  /**
   * Create a visual effect configuration
   */
  private createEffect(
    type: string,
    parameters: EffectParameters
  ): VisualEffect {
    const effect: VisualEffect = {
      id: this.generateEffectId(),
      type,
      priority: this.getEffectPriority(type),
      parameters: new Map(Object.entries(parameters)),
      cssClasses: [],
      cssProperties: new Map(),
    };

    switch (type) {
      case "blur":
        this.configureBlurEffect(effect, parameters);
        break;
      case "pixelate":
        this.configurePixelateEffect(effect, parameters);
        break;
      case "fade":
        this.configureFadeEffect(effect, parameters);
        break;
      case "redact":
        this.configureRedactEffect(effect, parameters);
        break;
      case "scramble":
        this.configureScrambleEffect(effect, parameters);
        break;
      case "glitch":
        this.configureGlitchEffect(effect, parameters);
        break;
      default:
        console.warn(`Unknown effect type: ${type}`);
    }

    return effect;
  }

  private configureBlurEffect(
    effect: VisualEffect,
    params: EffectParameters
  ): void {
    const intensity = params.intensity || 4;
    effect.cssClasses.push("camo-effect-blur");
    effect.cssProperties.set("--camo-blur-intensity", `${intensity}px`);
  }

  private configurePixelateEffect(
    effect: VisualEffect,
    params: EffectParameters
  ): void {
    effect.cssClasses.push("camo-effect-pixelate");
    if (params.intensity) {
      effect.cssProperties.set("--pixelate-size", `${params.intensity}px`);
    }
  }

  private configureFadeEffect(
    effect: VisualEffect,
    params: EffectParameters
  ): void {
    const intensity = params.intensity || 0.5;
    effect.cssClasses.push("camo-effect-fade");
    effect.cssProperties.set("--fade-opacity", intensity.toString());
  }

  private configureRedactEffect(
    effect: VisualEffect,
    params: EffectParameters
  ): void {
    effect.cssClasses.push("camo-effect-redact");
    if (params.color) {
      effect.cssProperties.set("--redact-color", params.color);
    }
  }

  private configureScrambleEffect(
    effect: VisualEffect,
    params: EffectParameters
  ): void {
    effect.cssClasses.push("camo-effect-scramble");
    if (params.duration) {
      effect.cssProperties.set("--scramble-duration", params.duration);
    }
  }

  private configureGlitchEffect(
    effect: VisualEffect,
    params: EffectParameters
  ): void {
    effect.cssClasses.push("camo-effect-glitch");
    if (params.intensity) {
      effect.cssProperties.set(
        "--glitch-intensity",
        params.intensity.toString()
      );
    }
  }

  /**
   * Inject CSS styles for all effects
   */
  private injectStyles(): void {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "camo-visual-effects";
    this.styleElement.textContent = this.getEffectStyles();
    document.head.appendChild(this.styleElement);
  }

  /**
   * Get all CSS styles for visual effects
   */
  private getEffectStyles(): string {
    return `
      /* Blur Effects */
      .camo-effect-blur {
        filter: blur(var(--camo-blur-intensity, 4px));
        transition: filter 0.3s ease;
      }
      .camo-effect-blur:hover,
      .camo-effect-blur.camo-revealed {
        filter: none;
      }

      /* Pixelation Effects */
      .camo-effect-pixelate {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
        filter: contrast(1000%) blur(1px) contrast(100%);
      }

      /* Fade Effects */
      .camo-effect-fade {
        opacity: var(--fade-opacity, 0.5);
        transition: opacity 0.3s ease;
      }
      .camo-effect-fade:hover,
      .camo-effect-fade.camo-revealed {
        opacity: 1;
      }

      /* Redaction Effects */
      .camo-effect-redact {
        position: relative;
        color: transparent !important;
      }
      .camo-effect-redact::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--redact-color, #000000);
        border-radius: 2px;
      }
      .camo-effect-redact:hover::before,
      .camo-effect-redact.camo-revealed::before {
        display: none;
      }
      .camo-effect-redact:hover,
      .camo-effect-redact.camo-revealed {
        color: var(--text-normal) !important;
      }

      /* Scramble Effects */
      .camo-effect-scramble {
        position: relative;
        animation: camo-scramble var(--scramble-duration, 0.5s) infinite;
      }
      .camo-effect-scramble:hover,
      .camo-effect-scramble.camo-revealed {
        animation: none;
      }

      @keyframes camo-scramble {
        0%, 100% {
          transform: translateX(0);
        }
        25% {
          transform: translateX(-1px) scale(1.01);
        }
        50% {
          transform: translateX(1px) scale(0.99);
        }
        75% {
          transform: translateX(-0.5px) scale(1.005);
        }
      }

      /* Glitch Effects */
      .camo-effect-glitch {
        position: relative;
        animation: camo-glitch 2s infinite;
      }

      @keyframes camo-glitch {
        0%, 100% {
          text-shadow:
            0.05em 0 0 rgba(255,0,0,0.75),
            -0.05em -0.025em 0 rgba(0,255,0,0.75),
            0.025em 0.05em 0 rgba(0,0,255,0.75);
        }
        14% {
          text-shadow:
            0.05em 0 0 rgba(255,0,0,0.75),
            -0.05em -0.025em 0 rgba(0,255,0,0.75),
            0.025em 0.05em 0 rgba(0,0,255,0.75);
        }
        15% {
          text-shadow:
            -0.05em -0.025em 0 rgba(255,0,0,0.75),
            0.025em 0.025em 0 rgba(0,255,0,0.75),
            -0.05em -0.05em 0 rgba(0,0,255,0.75);
        }
      }

      /* Performance optimizations */
      .camo-effect-blur,
      .camo-effect-fade {
        will-change: filter, opacity;
      }

      /* Mobile optimizations */
      @media (max-width: 768px) {
        .camo-effect-blur {
          filter: blur(calc(var(--camo-blur-intensity, 4px) * 0.5));
        }
        .camo-effect-glitch {
          animation: none;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .camo-effect-scramble,
        .camo-effect-glitch {
          animation: none;
        }
      }

      /* Dark theme adjustments */
      .theme-dark .camo-effect-blur {
        filter: blur(var(--camo-blur-intensity, 4px)) brightness(0.8);
      }
      .theme-light .camo-effect-blur {
        filter: blur(var(--camo-blur-intensity, 4px)) brightness(1.2);
      }
    `;
  }

  private getEffectPriority(type: string): number {
    const priorities: Record<string, number> = {
      blur: 1,
      pixelate: 1,
      fade: 2,
      redact: 3,
      scramble: 4,
      glitch: 5,
    };
    return priorities[type] || 10;
  }

  private generateEffectId(): string {
    return "effect_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.styleElement) {
      this.styleElement.remove();
    }
    this.effectStack = [];
  }
}

// Effect Filter Classes
export class GaussianBlurFilter {
  apply(element: HTMLElement, intensity: number): void {
    element.style.filter = `blur(${intensity}px)`;
  }
}

export class PixelationFilter {
  apply(element: HTMLElement, size: number): void {
    element.style.imageRendering = "pixelated";
    element.style.filter = `contrast(1000%) blur(${size}px) contrast(100%)`;
  }
}

export class GlitchEffect {
  apply(element: HTMLElement, intensity: number): void {
    element.addClass("camo-effect-glitch");
    element.style.setProperty("--glitch-intensity", intensity.toString());
  }
}

export class RedactionOverlay {
  apply(element: HTMLElement, color = "#000000"): void {
    element.addClass("camo-effect-redact");
    element.style.setProperty("--redact-color", color);
  }
}

export class TextScrambler {
  apply(element: HTMLElement, speed = "0.5s"): void {
    element.addClass("camo-effect-scramble");
    element.style.setProperty("--scramble-duration", speed);
  }
}

export class OpacityController {
  apply(element: HTMLElement, opacity: number): void {
    element.style.opacity = opacity.toString();
  }
}

export class VisualNoiseGenerator {
  apply(element: HTMLElement, intensity: number): void {
    // TODO: Implement noise generation
  }
}

export class WaveDistortion {
  apply(element: HTMLElement, amplitude: number): void {
    // TODO: Implement wave distortion
  }
}
