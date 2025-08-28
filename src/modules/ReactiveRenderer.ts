/**
 * CAMO Reactive Renderer System
 *
 * Provides real-time reactive updates for camoMetaData instructions:
 * - Observer pattern for reactive components and state changes
 * - Instruction processing and action mapping
 * - Real-time visual updates without full re-rendering
 * - Batched updates for performance optimization
 * - Integration with StateManager and VisualEffectsEngine
 */

import { App } from "obsidian";
import { VisualEffectsEngine } from "../engines/VisualEffectsEngine";

// Core interfaces for reactive rendering
export interface ParsedInstruction {
  id: string;
  keyword: string;
  target: string;
  parameters: Record<string, any>;
  effects: EffectDefinition[];
  timestamp: number;
}

export interface EffectDefinition {
  type: string;
  target: string;
  properties: Record<string, any>;
  priority: number;
  duration?: number;
  animation?: string;
}

export interface RenderAction {
  type: "apply" | "remove" | "toggle" | "animate";
  target: HTMLElement | HTMLElement[];
  effect: EffectDefinition;
  immediate: boolean;
}

export interface RenderUpdate {
  blockId: string;
  actions: RenderAction[];
  timestamp: number;
  source: "user" | "system" | "conditional";
}

// Observer interface for reactive components
export interface ReactiveObserver {
  id: string;
  onUpdate(update: RenderUpdate): void;
  onError?(error: Error, update: RenderUpdate): void;
  shouldUpdate?(update: RenderUpdate): boolean;
}

/**
 * Main reactive rendering engine
 */
export class CamoReactiveRenderer {
  private app: App;
  private visualEffects: VisualEffectsEngine;
  private observers: Map<string, ReactiveObserver> = new Map();
  private updateQueue: RenderUpdate[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  // Performance tracking
  private updateStats = {
    totalUpdates: 0,
    batchedUpdates: 0,
    averageLatency: 0,
    lastBatchSize: 0,
  };

  // Configuration
  private readonly BATCH_DELAY = 16; // ~60fps
  private readonly MAX_BATCH_SIZE = 50;
  private readonly MAX_OBSERVERS = 100;

  constructor(app: App, visualEffects: VisualEffectsEngine) {
    this.app = app;
    this.visualEffects = visualEffects;
  }

  /**
   * Subscribe to reactive updates
   */
  subscribe(observer: ReactiveObserver): () => void {
    if (this.observers.size >= this.MAX_OBSERVERS) {
      console.warn(
        "CAMO Reactive: Maximum observers reached, rejecting new subscription"
      );
      return () => {};
    }

    this.observers.set(observer.id, observer);

    return () => {
      this.unsubscribe(observer.id);
    };
  }

  /**
   * Unsubscribe from reactive updates
   */
  unsubscribe(observerId: string): void {
    this.observers.delete(observerId);
  }

  /**
   * Process a camoMetaData instruction and trigger reactive updates
   */
  async processInstruction(
    blockId: string,
    instruction: string,
    element: HTMLElement,
    source: "user" | "system" | "conditional" = "user"
  ): Promise<void> {
    try {
      // Parse instruction into structured format
      const parsed = this.parseInstruction(instruction, blockId);
      if (!parsed) {
        console.warn(
          "CAMO Reactive: Failed to parse instruction:",
          instruction
        );
        return;
      }

      // Convert to render actions
      const actions = this.createRenderActions(parsed, element);

      // Create update
      const update: RenderUpdate = {
        blockId,
        actions,
        timestamp: Date.now(),
        source,
      };

      // Queue for batch processing
      this.queueUpdate(update);
    } catch (error) {
      console.error("CAMO Reactive: Error processing instruction:", error);
      this.notifyObserversError(error, {
        blockId,
        actions: [],
        timestamp: Date.now(),
        source,
      });
    }
  }

  /**
   * Apply multiple instructions as a batch
   */
  async applyInstructionBatch(
    blockId: string,
    instructions: string[],
    element: HTMLElement,
    source: "user" | "system" | "conditional" = "system"
  ): Promise<void> {
    const allActions: RenderAction[] = [];

    // Process all instructions
    for (const instruction of instructions) {
      const parsed = this.parseInstruction(instruction, blockId);
      if (parsed) {
        const actions = this.createRenderActions(parsed, element);
        allActions.push(...actions);
      }
    }

    // Create single batched update
    const update: RenderUpdate = {
      blockId,
      actions: allActions,
      timestamp: Date.now(),
      source,
    };

    // Process immediately for batches
    await this.processUpdate(update);
  }

  /**
   * Trigger reactive update for block state changes
   */
  notifyStateChange(
    blockId: string,
    newState: any,
    element: HTMLElement
  ): void {
    // Create synthetic update for state changes
    const update: RenderUpdate = {
      blockId,
      actions: [], // State changes don't directly create actions
      timestamp: Date.now(),
      source: "system",
    };

    // Notify observers about state change
    this.notifyObservers(update);
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats() {
    return { ...this.updateStats };
  }

  /**
   * Clear all observers and pending updates
   */
  cleanup(): void {
    this.observers.clear();
    this.updateQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  // Private methods continue in next part...

  /**
   * Parse camoMetaData instruction into structured format
   */
  private parseInstruction(
    instruction: string,
    blockId: string
  ): ParsedInstruction | null {
    const trimmed = instruction.trim();

    // Basic instruction parsing (:: keyword // target % params -> outcome)
    const match = trimmed.match(
      /^::\s*(\w+)(?:\[([^\]]+)\])?\s*\/\/\s*([^%]+)(?:\s*%\s*([^-]+?))?(?:\s*->\s*(.+))?$/
    );

    if (!match) {
      return null;
    }

    const [, keyword, label, target, params, outcome] = match;

    // Parse parameters
    const parameters: Record<string, any> = {};
    if (params) {
      const paramMatches = params.match(/\{([^}]+)\}\(([^)]+)\)/g);
      if (paramMatches) {
        paramMatches.forEach((paramMatch) => {
          const paramParts = paramMatch.match(/\{([^}]+)\}\(([^)]+)\)/);
          if (paramParts) {
            const [, key, value] = paramParts;
            parameters[key] = this.parseParameterValue(value);
          }
        });
      }
    }

    // Create effect definitions
    const effects: EffectDefinition[] = this.createEffectDefinitions(
      keyword,
      target,
      parameters,
      label
    );

    return {
      id: `${blockId}-${Date.now()}`,
      keyword,
      target,
      parameters,
      effects,
      timestamp: Date.now(),
    };
  }

  /**
   * Parse parameter value to appropriate type
   */
  private parseParameterValue(value: string): any {
    // Boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Number
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

    // String (remove quotes if present)
    return value.replace(/^["']|["']$/g, "");
  }

  /**
   * Create effect definitions from parsed instruction
   */
  private createEffectDefinitions(
    keyword: string,
    target: string,
    parameters: Record<string, any>,
    label?: string
  ): EffectDefinition[] {
    const effects: EffectDefinition[] = [];

    // Map keywords to effect types
    switch (keyword) {
      case "set":
        effects.push({
          type: "set-property",
          target,
          properties: parameters,
          priority: 1,
        });
        break;

      case "apply":
        effects.push({
          type: "apply-effect",
          target,
          properties: parameters,
          priority: 2,
          animation: parameters.animation || "fade",
        });
        break;

      case "remove":
        effects.push({
          type: "remove-effect",
          target,
          properties: parameters,
          priority: 3,
        });
        break;

      case "reveal":
        effects.push({
          type: "reveal",
          target,
          properties: { ...parameters, revealed: true },
          priority: 1,
          animation: parameters.animation || "fade-in",
        });
        break;

      case "hide":
        effects.push({
          type: "hide",
          target,
          properties: { ...parameters, hidden: true },
          priority: 1,
          animation: parameters.animation || "fade-out",
        });
        break;

      case "protect":
        effects.push({
          type: "protect",
          target,
          properties: { ...parameters, protected: true },
          priority: 4,
        });
        break;

      default:
        // Generic effect
        effects.push({
          type: keyword,
          target,
          properties: parameters,
          priority: 2,
        });
    }

    return effects;
  }

  /**
   * Convert parsed instruction to render actions
   */
  private createRenderActions(
    instruction: ParsedInstruction,
    element: HTMLElement
  ): RenderAction[] {
    const actions: RenderAction[] = [];

    // Find target elements
    const targetElements = this.findTargetElements(instruction.target, element);

    // Create actions for each effect
    instruction.effects.forEach((effect) => {
      const actionType = this.mapEffectToActionType(effect.type);

      actions.push({
        type: actionType,
        target: targetElements,
        effect,
        immediate: effect.type.includes("immediate") || effect.priority >= 4,
      });
    });

    return actions;
  }

  /**
   * Find target elements within the block
   */
  private findTargetElements(
    target: string,
    blockElement: HTMLElement
  ): HTMLElement[] {
    const elements: HTMLElement[] = [];

    // Parse target selector
    if (target === "all" || target === "content") {
      elements.push(blockElement);
    } else if (target.includes("[") && target.includes("]")) {
      // Specific selector like text[sensitive] or paragraph[1-3]
      const selectorMatch = target.match(/(\w+)\[([^\]]+)\]/);
      if (selectorMatch) {
        const [, type, selector] = selectorMatch;
        const foundElements = this.selectElementsByType(
          type,
          selector,
          blockElement
        );
        elements.push(...foundElements);
      }
    } else {
      // CSS selector or element type
      const found = blockElement.querySelectorAll(target);
      elements.push(...(Array.from(found) as HTMLElement[]));
    }

    return elements.length > 0 ? elements : [blockElement];
  }

  /**
   * Select elements by CAMO type and selector
   */
  private selectElementsByType(
    type: string,
    selector: string,
    container: HTMLElement
  ): HTMLElement[] {
    const elements: HTMLElement[] = [];

    switch (type) {
      case "text":
        // Text content selection
        if (selector === "all") {
          elements.push(container);
        } else {
          // Find text nodes containing selector pattern
          const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while ((node = walker.nextNode())) {
            if (node.textContent?.includes(selector)) {
              const parent = node.parentElement;
              if (parent && !elements.includes(parent)) {
                elements.push(parent);
              }
            }
          }
        }
        break;

      case "paragraph":
        // Paragraph selection by index
        const paragraphs = container.querySelectorAll("p");
        if (selector === "all") {
          elements.push(...(Array.from(paragraphs) as HTMLElement[]));
        } else if (/^\d+$/.test(selector)) {
          const index = parseInt(selector, 10) - 1; // 1-based to 0-based
          if (paragraphs[index]) {
            elements.push(paragraphs[index] as HTMLElement);
          }
        } else if (/^\d+-\d+$/.test(selector)) {
          const [start, end] = selector.split("-").map((n) => parseInt(n, 10));
          for (let i = start - 1; i < end && i < paragraphs.length; i++) {
            elements.push(paragraphs[i] as HTMLElement);
          }
        }
        break;

      case "line":
        // Line selection
        const lines = container.textContent?.split("\n") || [];
        if (/^\d+$/.test(selector)) {
          // For now, treat as paragraph selection
          elements.push(container);
        }
        break;

      default:
        // Fallback to CSS selector
        const found = container.querySelectorAll(selector);
        elements.push(...(Array.from(found) as HTMLElement[]));
    }

    return elements;
  }

  /**
   * Map effect type to render action type
   */
  private mapEffectToActionType(effectType: string): RenderAction["type"] {
    switch (effectType) {
      case "remove-effect":
        return "remove";
      case "reveal":
      case "hide":
        return "toggle";
      case "apply-effect":
      case "set-property":
      case "protect":
      default:
        return "apply";
    }
  }

  /**
   * Queue update for batch processing
   */
  private queueUpdate(update: RenderUpdate): void {
    this.updateQueue.push(update);

    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_DELAY);
    }

    // Process immediately if queue is full
    if (this.updateQueue.length >= this.MAX_BATCH_SIZE) {
      this.processBatch();
    }
  }

  /**
   * Process batched updates
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Get updates to process
    const updates = [...this.updateQueue];
    this.updateQueue = [];

    const startTime = performance.now();

    try {
      // Process each update
      for (const update of updates) {
        await this.processUpdate(update);
      }

      // Update stats
      const processingTime = performance.now() - startTime;
      this.updateStats.totalUpdates += updates.length;
      this.updateStats.batchedUpdates++;
      this.updateStats.lastBatchSize = updates.length;
      this.updateStats.averageLatency =
        (this.updateStats.averageLatency + processingTime) / 2;
    } catch (error) {
      console.error("CAMO Reactive: Batch processing error:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual update
   */
  private async processUpdate(update: RenderUpdate): Promise<void> {
    try {
      // Apply render actions
      for (const action of update.actions) {
        await this.applyRenderAction(action);
      }

      // Notify observers
      this.notifyObservers(update);
    } catch (error) {
      console.error("CAMO Reactive: Update processing error:", error);
      this.notifyObserversError(error, update);
    }
  }

  /**
   * Apply a single render action
   */
  private async applyRenderAction(action: RenderAction): Promise<void> {
    const elements = Array.isArray(action.target)
      ? action.target
      : [action.target];

    for (const element of elements) {
      switch (action.type) {
        case "apply":
          await this.applyEffect(element, action.effect);
          break;

        case "remove":
          await this.removeEffect(element, action.effect);
          break;

        case "toggle":
          await this.toggleEffect(element, action.effect);
          break;

        case "animate":
          await this.animateEffect(element, action.effect);
          break;
      }
    }
  }

  /**
   * Apply visual effect to element
   */
  private async applyEffect(
    element: HTMLElement,
    effect: EffectDefinition
  ): Promise<void> {
    // Use VisualEffectsEngine for actual effect application
    this.visualEffects.applyEffect(element, effect.type, effect.properties);

    // Add reactive class for tracking
    element.addClass("camo-reactive");
    element.setAttribute("data-camo-effect", effect.type);
  }

  /**
   * Remove visual effect from element
   */
  private async removeEffect(
    element: HTMLElement,
    effect: EffectDefinition
  ): Promise<void> {
    // Remove effect-specific classes and styles
    element.removeClass(`camo-effect-${effect.type}`);
    element.removeAttribute("data-camo-effect");

    // Clean up inline styles applied by the effect
    const stylesToRemove = Object.keys(effect.properties);
    stylesToRemove.forEach((prop) => {
      element.style.removeProperty(prop);
    });
  }

  /**
   * Toggle visual effect on element
   */
  private async toggleEffect(
    element: HTMLElement,
    effect: EffectDefinition
  ): Promise<void> {
    const hasEffect = element.hasClass(`camo-effect-${effect.type}`);

    if (hasEffect) {
      await this.removeEffect(element, effect);
    } else {
      await this.applyEffect(element, effect);
    }
  }

  /**
   * Animate visual effect on element
   */
  private async animateEffect(
    element: HTMLElement,
    effect: EffectDefinition
  ): Promise<void> {
    const animation = effect.animation || "fade";
    const duration = effect.duration || 300;

    // Apply animation class
    element.addClass(`camo-animate-${animation}`);

    // Apply the effect
    await this.applyEffect(element, effect);

    // Remove animation class after duration
    setTimeout(() => {
      element.removeClass(`camo-animate-${animation}`);
    }, duration);
  }

  /**
   * Notify all observers of update
   */
  private notifyObservers(update: RenderUpdate): void {
    this.observers.forEach((observer) => {
      try {
        // Check if observer wants this update
        if (observer.shouldUpdate && !observer.shouldUpdate(update)) {
          return;
        }

        observer.onUpdate(update);
      } catch (error) {
        console.error(`CAMO Reactive: Observer ${observer.id} error:`, error);
      }
    });
  }

  /**
   * Notify observers of error
   */
  private notifyObserversError(error: Error, update: RenderUpdate): void {
    this.observers.forEach((observer) => {
      try {
        if (observer.onError) {
          observer.onError(error, update);
        }
      } catch (observerError) {
        console.error(
          `CAMO Reactive: Observer ${observer.id} error handler failed:`,
          observerError
        );
      }
    });
  }
}
