export interface PerformanceMetrics {
  blockProcessTimeMs?: number;
  cssInjectionTimeMs?: number;
  debounceMs?: number;
  cacheSize?: number;
}

type CachedBlock = {
  key: string;
  ts: number;
};

export class CamoOptimizer {
  // Debouncing for processor
  private processorDebounce = 500; // ms

  // Cache for processed blocks
  private blockCache = new Map<string, CachedBlock>();

  // Intersection Observer for lazy rendering
  private observer: IntersectionObserver;

  initialize() {
    // Setup intersection observer for lazy rendering
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderBlock(entry.target as HTMLElement);
          } else {
            this.unrenderBlock(entry.target as HTMLElement);
          }
        });
      },
      {
        rootMargin: '100px', // Start rendering 100px before visible
      }
    );
  }

  // CSS-only animations
  getPerformantCSS(): string {
    return `
      /* Use transform instead of position */
      .camo-animate {
        transform: translateZ(0); /* Enable GPU acceleration */
        will-change: transform;
      }

      /* Reduce effects on mobile */
      @media (max-width: 768px) {
        .camo-effect-blur { filter: blur(2px); }
        .camo-effect-matrix { animation: none; }
      }

      /* Performance mode */
      .camo-performance-mode .camo-effect-blur { filter: none; }
      .camo-performance-mode .camo-animate { animation: none; }
    `;
  }

  measureRenderImpact(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      debounceMs: this.processorDebounce,
      cacheSize: this.blockCache.size,
    };
    // Best-effort memory timing if available
    try {
      const perfObj = (
        window as unknown as {
          performance?: Performance & { memory?: { usedJSHeapSize?: number } };
        }
      ).performance;
      if (perfObj && perfObj.memory && typeof perfObj.memory.usedJSHeapSize === 'number') {
        // Expose via cssInjectionTimeMs slot to avoid expanding interface too much
        metrics.cssInjectionTimeMs = perfObj.memory.usedJSHeapSize;
      }
    } catch {
      // ignore
    }
    return metrics;
  }

  private renderBlock(_el: HTMLElement) {
    // Add animation-enable class when entering viewport
    try {
      _el.classList.add('camo-animate');
    } catch {
      // Ignore errors
    }
  }
  private unrenderBlock(_el: HTMLElement) {
    // Remove animation when out of view to save CPU
    try {
      _el.classList.remove('camo-animate');
    } catch {
      // Ignore errors
    }
  }

  observeBlock(el: HTMLElement) {
    try {
      this.observer && this.observer.observe(el);
    } catch {
      // Ignore errors
    }
  }

  unobserveBlock(el: HTMLElement) {
    try {
      this.observer && this.observer.unobserve(el);
    } catch {
      // Ignore errors
    }
  }
}
