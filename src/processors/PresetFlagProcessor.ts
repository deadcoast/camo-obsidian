import { Plugin } from 'obsidian';

interface Flag {
  name: string;
  value: string;
}

export class PresetFlagProcessor {
  private plugin: Plugin;
  // Enforce category chaining priority: visual → interaction → layout
  private readonly categoryOrder: Array<keyof PresetFlagCategories> = [
    'visual',
    'interaction',
    'layout',
  ];

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  // Parse flags from content line, not language line
  processFlags(container: HTMLElement, flags: Flag[]): void {
    // Partition flags by category, then apply by stable priority order
    const categories: PresetFlagCategories = {
      visual: [],
      interaction: [],
      layout: [],
    };

    for (const flag of flags) {
      const name = (flag.name || '').toLowerCase();
      if (this.isVisual(name)) categories.visual.push(flag);
      else if (this.isInteraction(name)) categories.interaction.push(flag);
      else categories.layout.push(flag);
    }

    for (const cat of this.categoryOrder) {
      for (const flag of categories[cat]) {
        switch (flag.name) {
          // Visual modifiers - add CSS classes
          case 'blur':
            container.addClass('camo-mod-blur');
            if (flag.value) {
              container.style.setProperty('--blur-amount', flag.value);
            }
            break;

          case 'peek':
            container.addClass('camo-mod-peek');
            break;

          case 'flash':
            container.addClass('camo-mod-flash');
            break;

          // Interaction modifiers
          case 'hover':
            container.addClass('camo-trigger-hover');
            break;

          case 'click':
            container.addClass('camo-trigger-click');
            break;

          case 'timer':
            container.addClass('camo-trigger-timer');
            container.setAttribute('data-timer', flag.value || '5');
            this.setupTimer(container, parseInt(flag.value || '5'));
            break;

          // Layout modifiers
          case 'compact':
            container.addClass('camo-layout-compact');
            break;

          case 'wide':
            container.addClass('camo-layout-wide');
            break;
        }
      }
    }
  }

  // CSS for flag modifiers
  getFlagStyles(): string {
    return `
      /* Visual Modifiers */
      .camo-mod-blur {
        filter: blur(calc(var(--blur-amount, 4) * 1px));
      }

      .camo-mod-peek {
        background: #000000 !important;
        color: transparent !important;
      }
      .camo-mod-peek:hover {
        background: var(--background-primary) !important;
        color: var(--text-normal) !important;
      }

      .camo-mod-flash {
        animation: camo-flash 0.5s;
      }

      @keyframes camo-flash {
        0% { background: white; }
        100% { background: var(--background-primary); }
      }

      /* Interaction Triggers */
      .camo-trigger-hover {
        transition: all 0.3s ease;
      }
      .camo-trigger-hover:not(:hover) .camo-content {
        opacity: 0;
      }

      .camo-trigger-click {
        cursor: pointer;
      }
      .camo-trigger-click:not(.revealed) .camo-content {
        display: none;
      }

      /* Layout Modifiers */
      .camo-layout-compact {
        padding: 0.5em !important;
        margin: 0.25em 0 !important;
      }

      .camo-layout-wide {
        width: 100% !important;
        max-width: none !important;
      }
    `;
  }

  private isVisual(name: string): boolean {
    return name === 'blur' || name === 'peek' || name === 'flash';
  }
  private isInteraction(name: string): boolean {
    return name === 'hover' || name === 'click' || name === 'timer';
  }
  private setupTimer(container: HTMLElement, seconds: number): void {
    const ms = (isNaN(seconds) ? 5 : seconds) * 1000;
    window.setTimeout(() => container.classList.add('revealed'), ms);
  }
}

interface PresetFlagCategories {
  visual: Flag[];
  interaction: Flag[];
  layout: Flag[];
}
