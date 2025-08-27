export interface EffectParameters {
  intensity?: number | string;
  color?: string;
}

export class VisualCamouflage {
  // All effects implemented via CSS classes, not direct DOM manipulation
  private effectClasses: Record<string, string> = {
    blur: "camo-effect-blur",
    pixelate: "camo-effect-pixelate",
    scramble: "camo-effect-scramble",
    glitch: "camo-effect-glitch",
    redact: "camo-effect-redact",
    matrix: "camo-effect-matrix",
  };

  applyEffect(
    element: HTMLElement,
    effect: string,
    parameters: EffectParameters
  ): void {
    // Add CSS class instead of inline styles
    const cls = this.effectClasses[effect] || effect;
    (element as any).classList?.add(cls);

    // Use CSS variables for parameters
    if (parameters.intensity) {
      element.style.setProperty(
        "--camo-intensity",
        parameters.intensity.toString()
      );
    }
    if (parameters.color) {
      element.style.setProperty("--camo-color", parameters.color);
    }
  }

  // CSS is injected once at plugin load
  getEffectStyles(): string {
    return `
      .camo-effect-blur {
        filter: blur(calc(var(--camo-intensity, 5) * 1px));
      }

      .camo-effect-pixelate {
        image-rendering: pixelated;
        filter: contrast(1000%) blur(1px) contrast(100%);
      }

      .camo-effect-scramble {
        position: relative;
        animation: camo-scramble 0.5s infinite;
      }

      @keyframes camo-scramble {
        0%, 100% { content: attr(data-original); }
        25% { content: attr(data-scramble1); }
        50% { content: attr(data-scramble2); }
        75% { content: attr(data-scramble3); }
      }

      .camo-effect-glitch { animation: camo-glitch var(--camo-glitch-duration, 2s) infinite; }

      @keyframes camo-glitch {
        0%, 100% {
          text-shadow: 0.05em 0 0 rgba(255,0,0,0.75),
                      -0.05em -0.025em 0 rgba(0,255,0,0.75),
                      0.025em 0.05em 0 rgba(0,0,255,0.75);
        }
        14% {
          text-shadow: 0.05em 0 0 rgba(255,0,0,0.75),
                      -0.05em -0.025em 0 rgba(0,255,0,0.75),
                      0.025em 0.05em 0 rgba(0,0,255,0.75);
        }
        15% {
          text-shadow: -0.05em -0.025em 0 rgba(255,0,0,0.75),
                      0.025em 0.025em 0 rgba(0,255,0,0.75),
                      -0.05em -0.05em 0 rgba(0,0,255,0.75);
        }
      }

      /* Respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .camo-effect-glitch, .camo-effect-glitch .camo-line { animation: none !important; }
        .camo-effect-scramble, .camo-effect-scramble .camo-line::before { animation: none !important; }
        .camo-effect-scan::after, .camo-effect-matrix::before { animation: none !important; }
      }

      /* Additional centralized effects */
      .camo-effect-fade .camo-content { opacity: var(--camo-fade-opacity, 0.2); }
      .camo-effect-redact .camo-content {
        color: transparent !important;
        --camo-redact-bar: var(--camo-redact-bar, 8px);
        --camo-redact-gap: var(--camo-redact-gap, 12px);
        background: repeating-linear-gradient(
          0deg,
          #000,
          #000 var(--camo-redact-bar),
          transparent var(--camo-redact-bar),
          transparent var(--camo-redact-gap)
        );
      }
      /* If decrypted plaintext exists, overlay via ::before to avoid DOM writes */
      .camo-line[data-camo-plain]::before { content: attr(data-camo-plain); color: inherit; }
      .camo-effect-hash .camo-content {
        background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 4px);
      }
      .camo-effect-sign .camo-content { box-shadow: inset 0 0 0 1px rgba(0,128,255,0.25); }
      .camo-effect-compress .camo-content {
        letter-spacing: calc(var(--camo-compress-letter, 0.01) * -1em);
        word-spacing: calc(var(--camo-compress-word, 0.02) * -1em);
      }
      .camo-effect-lock { position: relative; }
      .camo-effect-lock::after { content: "🔒"; position: absolute; top: 4px; right: 6px; opacity: 0.5; font-size: 0.9em; pointer-events: none; }

      .camo-effect-scramble .camo-line::before {
        content: attr(data-scrambled);
        animation: camo-scramble var(--camo-scramble-speed, 0.5s) steps(2, end) infinite;
      }
      .camo-effect-mask .camo-line { position: relative; color: transparent !important; }
      .camo-effect-mask .camo-line::after {
        content: ""; position: absolute; inset: 0;
        background: repeating-linear-gradient(0deg,#000,#000 8px,transparent 8px,transparent 12px);
        pointer-events: none;
      }
      .camo-effect-scan { position: relative; overflow: hidden; }
      .camo-effect-scan::after {
        content: ""; position: absolute; left: 0; right: 0; top: -100%; bottom: 0;
        background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
        animation: camo-scan 2s linear infinite; pointer-events: none;
      }
      @keyframes camo-scan { 0% { transform: translateY(0); } 100% { transform: translateY(200%); } }
      .camo-effect-grid {
        background-image:
          repeating-linear-gradient(0deg, transparent, transparent calc(var(--camo-grid-spacing, 20px) - 1px), rgba(255,255,255,0.08) calc(var(--camo-grid-spacing, 20px) - 1px), rgba(255,255,255,0.08) var(--camo-grid-spacing, 20px)),
          repeating-linear-gradient(90deg, transparent, transparent calc(var(--camo-grid-spacing, 20px) - 1px), rgba(255,255,255,0.08) calc(var(--camo-grid-spacing, 20px) - 1px), rgba(255,255,255,0.08) var(--camo-grid-spacing, 20px));
      }

      /* Line-level variants & helpers */
      .camo-var-background .camo-line { background: var(--camo-bg-color) !important; }
      .camo-var-opacity .camo-line { opacity: var(--camo-opacity, 1); }
      .camo-var-text .camo-line { color: var(--camo-text-color) !important; }
      .camo-mod-blur .camo-line { filter: blur(calc(var(--blur-amount, 4) * 1px)); }
      .camo-effect-pixelate .camo-line { image-rendering: pixelated; }
      .camo-effect-glitch .camo-line { animation: camo-glitch 2s infinite; }
      .camo-effect-redact .camo-line { color: transparent !important; background: repeating-linear-gradient(0deg, #000, #000 8px, transparent 8px, transparent 12px); }
      .camo-effect-fade .camo-line { opacity: var(--camo-fade-opacity, 0.2); }
    `;
  }
}
