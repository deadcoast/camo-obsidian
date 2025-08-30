// Minimal local LRU fallback to avoid external dependency
class SimpleLRU<K, V> extends Map<K, V> {
  private capacity: number;
  constructor(capacity: number) {
    super();
    this.capacity = Math.max(1, capacity);
  }
  get(key: K): V | undefined {
    const value = super.get(key);
    if (value !== undefined) {
      super.delete(key);
      super.set(key, value);
    }
    return value;
  }
  set(key: K, value: V): this {
    if (super.has(key)) super.delete(key);
    super.set(key, value);
    if (this.size > this.capacity) {
      const firstKey = this.keys().next().value as K;
      super.delete(firstKey);
    }
    return this;
  }
}
import { CamoAST } from './AST';

export interface CachedEffect {
  effect: RenderedEffect;
  timestamp: number;
  ttlMs?: number;
}

export interface BlockState {
  content: string;
  metadata: string;
  timestamp: number;
}

export interface RenderedEffect {
  element: HTMLElement;
  timestamp: number;
}

export class CamoCacheManager {
  private readonly parseCache = new SimpleLRU<string, CamoAST>(100);
  private readonly effectCache = new Map<string, CachedEffect>();
  private readonly stateCache = new Map<string, BlockState>();
  private readonly recentMetrics: Array<{
    label: string;
    data: Record<string, number | boolean>;
    ts: number;
  }> = [];
  private readonly defaultEffectTTL = 60_000; // 60s
  private conflicts: string[] = [];

  getCachedParse(input: string): CamoAST | null {
    const hash = this.hashInput(input);
    const hit = this.parseCache.get(hash);
    return hit ?? null;
  }

  cacheEffect(key: string, effect: RenderedEffect, ttlMs?: number): void {
    this.effectCache.set(key, {
      effect,
      timestamp: Date.now(),
      ttlMs: ttlMs ?? this.defaultEffectTTL,
    });
  }

  getEffect(key: string): RenderedEffect | null {
    const entry = this.effectCache.get(key);
    if (!entry) return null;
    const ttl = entry.ttlMs ?? this.defaultEffectTTL;
    if (Date.now() - entry.timestamp > ttl) {
      this.effectCache.delete(key);
      return null;
    }
    return entry.effect;
  }

  getCachedState(blockId: string): BlockState | null {
    return this.stateCache.get(blockId) || null;
  }

  cacheState(blockId: string, state: BlockState): void {
    this.stateCache.set(blockId, { ...state, timestamp: Date.now() });
  }

  recordMetrics(label: string, data: Record<string, number | boolean>): void {
    this.recentMetrics.push({ label, data, ts: Date.now() });
    while (this.recentMetrics.length > 50) this.recentMetrics.shift();
  }

  getRecentMetrics(limit = 10): Array<{
    label: string;
    data: Record<string, number | boolean>;
    ts: number;
  }> {
    return this.recentMetrics.slice(-limit);
  }

  setConflicts(conflicts: string[]): void {
    this.conflicts = [...conflicts];
  }

  getConflicts(): string[] {
    return [...this.conflicts];
  }

  private hashInput(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(36);
  }
}
