import { Platform, Plugin } from 'obsidian';

export class MobileOptimization {
  private readonly plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  // Detect Obsidian mobile
  isMobileApp(): boolean {
    return Platform.isMobile || Platform.isTablet;
  }

  // Reduce effects on mobile
  private readonly mobileSettings = {
    disableAnimations: true,
    simplifyEffects: true,
    reducedMotion: true,
    touchInteractions: true,
  };

  // Touch gesture support
  setupTouchHandlers(block: HTMLElement): void {
    // Tap to reveal
    block.addEventListener('click', () => {
      const reveal = block.querySelector('.camo-reveal');
      if (reveal) {
        reveal.classList.add('camo-revealed');
      }
    });
    // Long press for options
    block.addEventListener('contextmenu', e => {
      e.preventDefault();
      const options = block.querySelector('.camo-options');
      if (options) {
        options.classList.toggle('camo-options-visible');
      }
    });
    // Swipe to toggle
    block.addEventListener('swipe', e => {
      e.preventDefault();
      const toggle = block.querySelector('.camo-toggle');
      if (toggle) {
        toggle.classList.toggle('camo-toggled');
      }
    });
  }
}
