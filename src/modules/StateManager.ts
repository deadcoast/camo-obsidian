/**
 * State Manager
 * Handles persistent state management for CAMO blocks
 *
 * Based on specifications in Docs/7_systemArchitecture.md
 */

export interface BlockState {
  blockId: string;
  revealed: boolean;
  effectsApplied: string[];
  userInteractions: number;
  lastModified: number;
  customProperties: Record<string, any>;
  preset?: string;
  flags: string[];
  metadata: string[];
}

export interface GlobalState {
  blocks: Record<string, BlockState>;
  userPreferences: UserPreferences;
  sessionData: SessionData;
  version: string;
}

export interface UserPreferences {
  defaultRevealBehavior: "click" | "hover" | "never";
  animationsEnabled: boolean;
  performanceMode: boolean;
  autoSaveInterval: number;
  rememberBlockStates: boolean;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  blocksProcessed: number;
  errorsEncountered: string[];
}

export class CamoStateManager {
  private state: GlobalState;
  private plugin: any; // Obsidian Plugin instance
  private saveQueue: Set<string> = new Set();
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DEBOUNCE_MS = 1000;
  private readonly MAX_BLOCK_HISTORY = 1000;
  private readonly STATE_VERSION = "1.0.0";

  constructor(plugin: any) {
    this.plugin = plugin;
    this.state = this.getDefaultState();
  }

  /**
   * Initialize state manager and load persistent data
   */
  async initialize(): Promise<void> {
    await this.loadState();
    this.setupPeriodicCleanup();
  }

  /**
   * Load state from Obsidian's data storage
   */
  async loadState(): Promise<void> {
    try {
      const data = await this.plugin.loadData();

      if (data?.camoState) {
        this.state = {
          ...this.getDefaultState(),
          ...data.camoState,
        };

        // Migrate old state versions if needed
        this.migrateStateIfNeeded();
      }
    } catch (error) {
      console.error("Failed to load CAMO state:", error);
      this.state = this.getDefaultState();
    }
  }

  /**
   * Save state to Obsidian's data storage
   */
  async saveState(): Promise<void> {
    try {
      const data = (await this.plugin.loadData()) || {};
      data.camoState = this.state;
      await this.plugin.saveData(data);
    } catch (error) {
      console.error("Failed to save CAMO state:", error);
    }
  }

  /**
   * Get default state structure
   */
  private getDefaultState(): GlobalState {
    return {
      blocks: {},
      userPreferences: {
        defaultRevealBehavior: "click",
        animationsEnabled: true,
        performanceMode: false,
        autoSaveInterval: 5000,
        rememberBlockStates: true,
      },
      sessionData: {
        sessionId: this.generateSessionId(),
        startTime: Date.now(),
        blocksProcessed: 0,
        errorsEncountered: [],
      },
      version: this.STATE_VERSION,
    };
  }

  /**
   * Set state for a specific block
   */
  setBlockState(blockId: string, updates: Partial<BlockState>): void {
    const existing = this.state.blocks[blockId];

    this.state.blocks[blockId] = {
      ...existing,
      blockId,
      revealed: false,
      effectsApplied: [],
      userInteractions: 0,
      lastModified: Date.now(),
      customProperties: {},
      flags: [],
      metadata: [],
      ...updates,
    };

    this.queueSave(blockId);
  }

  /**
   * Get state for a specific block
   */
  getBlockState(blockId: string): BlockState | null {
    return this.state.blocks[blockId] || null;
  }

  /**
   * Update block reveal state
   */
  setBlockRevealed(blockId: string, revealed: boolean): void {
    this.setBlockState(blockId, {
      revealed,
      lastModified: Date.now(),
    });

    if (revealed) {
      this.incrementUserInteraction(blockId);
    }
  }

  /**
   * Add effect to block state
   */
  addEffectToBlock(blockId: string, effectId: string): void {
    const state = this.getBlockState(blockId);
    const effectsApplied = state ? [...state.effectsApplied] : [];

    if (!effectsApplied.includes(effectId)) {
      effectsApplied.push(effectId);
      this.setBlockState(blockId, { effectsApplied });
    }
  }

  /**
   * Remove effect from block state
   */
  removeEffectFromBlock(blockId: string, effectId: string): void {
    const state = this.getBlockState(blockId);
    if (state) {
      const effectsApplied = state.effectsApplied.filter(
        (id) => id !== effectId
      );
      this.setBlockState(blockId, { effectsApplied });
    }
  }

  /**
   * Increment user interaction counter
   */
  incrementUserInteraction(blockId: string): void {
    const state = this.getBlockState(blockId);
    const userInteractions = state ? state.userInteractions + 1 : 1;
    this.setBlockState(blockId, { userInteractions });
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(updates: Partial<UserPreferences>): void {
    this.state.userPreferences = {
      ...this.state.userPreferences,
      ...updates,
    };
    this.queueSave("preferences");
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): UserPreferences {
    return { ...this.state.userPreferences };
  }

  /**
   * Record error in session data
   */
  recordError(error: string): void {
    this.state.sessionData.errorsEncountered.push(error);
    this.queueSave("session");
  }

  /**
   * Increment blocks processed counter
   */
  incrementBlocksProcessed(): void {
    this.state.sessionData.blocksProcessed++;
    this.queueSave("session");
  }

  /**
   * Get all blocks matching criteria
   */
  getBlocksBy(criteria: Partial<BlockState>): BlockState[] {
    return Object.values(this.state.blocks).filter((block) => {
      return Object.entries(criteria).every(([key, value]) => {
        return block[key as keyof BlockState] === value;
      });
    });
  }

  /**
   * Get revealed blocks
   */
  getRevealedBlocks(): BlockState[] {
    return this.getBlocksBy({ revealed: true });
  }

  /**
   * Get blocks with specific preset
   */
  getBlocksByPreset(preset: string): BlockState[] {
    return this.getBlocksBy({ preset });
  }

  /**
   * Clear all block states
   */
  clearAllBlocks(): void {
    this.state.blocks = {};
    this.queueSave("clear");
  }

  /**
   * Remove old block states
   */
  cleanupOldBlocks(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const blocksToRemove: string[] = [];

    Object.entries(this.state.blocks).forEach(([blockId, state]) => {
      if (now - state.lastModified > maxAge) {
        blocksToRemove.push(blockId);
      }
    });

    blocksToRemove.forEach((blockId) => {
      delete this.state.blocks[blockId];
    });

    if (blocksToRemove.length > 0) {
      this.queueSave("cleanup");
    }
  }

  /**
   * Enforce block count limit
   */
  enforceBlockLimit(): void {
    const blockEntries = Object.entries(this.state.blocks);

    if (blockEntries.length > this.MAX_BLOCK_HISTORY) {
      // Sort by last modified and keep only the most recent
      blockEntries.sort((a, b) => b[1].lastModified - a[1].lastModified);

      const toKeep = blockEntries.slice(0, this.MAX_BLOCK_HISTORY);
      this.state.blocks = Object.fromEntries(toKeep);

      this.queueSave("limit");
    }
  }

  /**
   * Export state for backup
   */
  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import state from backup
   */
  async importState(stateJson: string): Promise<boolean> {
    try {
      const importedState = JSON.parse(stateJson);

      if (this.validateState(importedState)) {
        this.state = importedState;
        await this.saveState();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to import state:", error);
      return false;
    }
  }

  /**
   * Validate state structure
   */
  private validateState(state: any): state is GlobalState {
    return (
      typeof state === "object" &&
      typeof state.blocks === "object" &&
      typeof state.userPreferences === "object" &&
      typeof state.sessionData === "object" &&
      typeof state.version === "string"
    );
  }

  /**
   * Queue save operation with debouncing
   */
  private queueSave(reason: string): void {
    this.saveQueue.add(reason);

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      await this.saveState();
      this.saveQueue.clear();
      this.saveTimeout = null;
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * Setup periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupOldBlocks();
      this.enforceBlockLimit();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Migrate state from older versions
   */
  private migrateStateIfNeeded(): void {
    if (this.state.version !== this.STATE_VERSION) {
      // Perform migration logic here if needed
      this.state.version = this.STATE_VERSION;
      this.queueSave("migration");
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return (
      "session_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Get session statistics
   */
  getSessionStats(): SessionData {
    return { ...this.state.sessionData };
  }

  /**
   * Get state summary for debugging
   */
  getStateSummary(): {
    totalBlocks: number;
    revealedBlocks: number;
    blocksWithEffects: number;
    sessionAge: number;
  } {
    const blocks = Object.values(this.state.blocks);

    return {
      totalBlocks: blocks.length,
      revealedBlocks: blocks.filter((b) => b.revealed).length,
      blocksWithEffects: blocks.filter((b) => b.effectsApplied.length > 0)
        .length,
      sessionAge: Date.now() - this.state.sessionData.startTime,
    };
  }

  /**
   * Cleanup on plugin unload
   */
  async cleanup(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      await this.saveState();
    }
  }
}
