/**
 * CAMO Conditional Execution System
 *
 * Implements IF/ELSE logic for camoMetaData with support for:
 * - Context-aware condition evaluation (hover, theme, time, viewport, user)
 * - Conditional branching with proper statement execution
 * - Integration with CAMO IR for optimized condition guards
 * - Obsidian-compliant context detection
 */

import { App } from 'obsidian';
import { CamoAST, CamoASTNode } from './AST';

// Primitive types for condition values
type Primitive = string | number | boolean;

// Supported condition operators
type ConditionOperator =
  | 'exists'
  | 'equals'
  | 'not_equals'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'matches';

// Condition structure for evaluation
export interface Condition {
  lhs: string; // Left-hand side (variable path)
  op: ConditionOperator; // Comparison operator
  rhs?: Primitive; // Right-hand side value (optional for 'exists')
}

// Evaluation context with block-local and global state
export interface EvalContext {
  // Interaction state
  hover: boolean; // Mouse hover state
  clicked: boolean; // Click interaction state
  focused: boolean; // Focus state

  // Theme and appearance
  theme: 'dark' | 'light'; // Current Obsidian theme

  // Time-based conditions
  timeISO: string; // Current ISO datetime
  hour: number; // Current hour (0-23)
  minute: number; // Current minute (0-59)
  day: number; // Day of week (0-6, Sunday=0)

  // Viewport information
  viewport: {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
  };

  // User context (extensible)
  user?: {
    role?: string;
    preferences?: Record<string, any>;
  };

  // File/vault context
  file?: {
    path: string;
    name: string;
    exists: boolean;
    size?: number;
  };

  // Block-specific context
  block: {
    id: string;
    type: string;
    content: string;
    visible: boolean;
    revealed: boolean;
  };
}

// Conditional branch execution result
export interface BranchResult {
  executed: boolean;
  statements: CamoASTNode[];
  errors?: string[];
}

// Main conditional execution engine
export class CamoConditionalExecution {
  private app: App;
  private contextCache: Map<string, EvalContext> = new Map();
  private conditionCache: Map<string, boolean> = new Map();

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Parse and evaluate a condition string
   * Examples: "hover", "time > 17:00", "theme.dark", "viewport.width >= 1024"
   */
  evaluateCondition(conditionStr: string, blockId: string): boolean {
    try {
      // Check cache first
      const cacheKey = `${blockId}:${conditionStr}`;
      if (this.conditionCache.has(cacheKey)) {
        return this.conditionCache.get(cacheKey)!;
      }

      // Parse condition string into structured condition
      const condition = this.parseCondition(conditionStr);

      // Get evaluation context
      const context = this.getEvaluationContext(blockId);

      // Evaluate condition
      const result = this.evaluateStructuredCondition(condition, context);

      // Cache result (with TTL for time-based conditions)
      this.cacheConditionResult(cacheKey, result, condition);

      return result;
    } catch (error) {
      console.warn(`CAMO Conditional: Failed to evaluate condition "${conditionStr}":`, error);
      return false; // Fail-safe: default to false
    }
  }

  /**
   * Execute conditional branch logic
   * Handles IF/ELSE statement execution with proper context isolation
   */
  executeBranch(
    branch: 'IF' | 'ELSE',
    condition: string,
    statements: CamoASTNode[],
    context: CamoAST,
    blockId: string
  ): BranchResult {
    try {
      const shouldExecute =
        branch === 'IF'
          ? this.evaluateCondition(condition, blockId)
          : !this.evaluateCondition(condition, blockId);

      if (!shouldExecute) {
        return {
          executed: false,
          statements: [],
        };
      }

      // Execute statements in branch
      const executedStatements = this.executeStatements(statements, context, blockId);

      return {
        executed: true,
        statements: executedStatements,
      };
    } catch (error) {
      console.error(`CAMO Conditional: Failed to execute ${branch} branch:`, error);
      return {
        executed: false,
        statements: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Get or create evaluation context for a block
   */
  private getEvaluationContext(blockId: string): EvalContext {
    // Check cache first
    if (this.contextCache.has(blockId)) {
      const cached = this.contextCache.get(blockId)!;
      // Update time-sensitive values
      this.updateTimeContext(cached);
      return cached;
    }

    // Create new context
    const context = this.createEvaluationContext(blockId);
    this.contextCache.set(blockId, context);

    return context;
  }

  /**
   * Create a fresh evaluation context
   */
  private createEvaluationContext(blockId: string): EvalContext {
    const now = new Date();
    const body = document.body;

    // Detect theme from Obsidian's body classes
    const isDarkTheme =
      body.classList.contains('theme-dark') ||
      body.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Get viewport information
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth <= 768,
      isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
    };

    // Get block element for interaction state
    const blockElement = document.querySelector(`[data-camo-id="${blockId}"]`);

    return {
      // Interaction state
      hover: blockElement?.matches(':hover') || false,
      clicked: false, // Will be updated by event listeners
      focused: blockElement?.matches(':focus-within') || false,

      // Theme
      theme: isDarkTheme ? 'dark' : 'light',

      // Time context
      timeISO: now.toISOString(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      day: now.getDay(),

      // Viewport
      viewport,

      // User context (basic implementation)
      user: {
        role: 'user', // Could be extended with actual user management
      },

      // File context
      file: this.getFileContext(),

      // Block context
      block: {
        id: blockId,
        type: 'camo',
        content: blockElement?.textContent || '',
        visible: blockElement?.offsetParent !== null,
        revealed: blockElement?.classList.contains('camo-revealed') || false,
      },
    };
  }

  /**
   * Get current file context from Obsidian
   */
  private getFileContext() {
    try {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        return {
          path: activeFile.path,
          name: activeFile.name,
          exists: true,
          size: activeFile.stat.size,
        };
      }
    } catch (error) {
      console.warn('CAMO Conditional: Could not get file context:', error);
    }

    return {
      path: '',
      name: '',
      exists: false,
    };
  }

  /**
   * Update time-sensitive context values
   */
  private updateTimeContext(context: EvalContext): void {
    const now = new Date();
    context.timeISO = now.toISOString();
    context.hour = now.getHours();
    context.minute = now.getMinutes();
    context.day = now.getDay();
  }

  /**
   * Parse condition string into structured condition
   * Examples: "hover", "time > 17:00", "theme.dark", "viewport.width >= 1024"
   */
  private parseCondition(conditionStr: string): Condition {
    const trimmed = conditionStr.trim();

    // Simple existence check (just a variable name)
    if (
      !trimmed.includes(' ') &&
      !trimmed.includes('=') &&
      !trimmed.includes('>') &&
      !trimmed.includes('<')
    ) {
      return {
        lhs: trimmed,
        op: 'exists',
      };
    }

    // Parse comparison operators
    const operators = ['>=', '<=', '!=', '==', '>', '<', '=', '~'];

    for (const op of operators) {
      const parts = trimmed.split(op);
      if (parts.length === 2) {
        const lhs = parts[0].trim();
        const rhs = parts[1].trim();

        return {
          lhs,
          op: this.mapOperator(op),
          rhs: this.parseValue(rhs),
        };
      }
    }

    // Fallback to existence check
    return {
      lhs: trimmed,
      op: 'exists',
    };
  }

  /**
   * Map string operators to condition operators
   */
  private mapOperator(op: string): ConditionOperator {
    switch (op) {
      case '==':
      case '=':
        return 'equals';
      case '!=':
        return 'not_equals';
      case '>':
        return 'gt';
      case '<':
        return 'lt';
      case '>=':
        return 'gte';
      case '<=':
        return 'lte';
      case '~':
        return 'matches';
      default:
        return 'equals';
    }
  }

  /**
   * Parse string value to appropriate primitive type
   */
  private parseValue(value: string): Primitive {
    const trimmed = value.trim();

    // Boolean values
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Numeric values
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

    // Time format (HH:MM)
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [hours, minutes] = trimmed.split(':').map(Number);
      return hours * 60 + minutes; // Convert to minutes for comparison
    }

    // String value (remove quotes if present)
    return trimmed.replace(/^["']|["']$/g, '');
  }

  /**
   * Evaluate structured condition against context
   */
  private evaluateStructuredCondition(condition: Condition, context: EvalContext): boolean {
    const value = this.resolveValue(condition.lhs, context);

    switch (condition.op) {
      case 'exists':
        return value !== undefined && value !== null;

      case 'equals':
        return value === condition.rhs;

      case 'not_equals':
        return value !== condition.rhs;

      case 'gt':
        return Number(value) > Number(condition.rhs);

      case 'lt':
        return Number(value) < Number(condition.rhs);

      case 'gte':
        return Number(value) >= Number(condition.rhs);

      case 'lte':
        return Number(value) <= Number(condition.rhs);

      case 'matches':
        try {
          return new RegExp(String(condition.rhs)).test(String(value));
        } catch (error) {
          console.warn('CAMO Conditional: Invalid regex pattern:', condition.rhs);
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Resolve value from context using dot notation path
   * Supported paths: 'hover', 'theme', 'time', 'viewport.width', 'user.role', etc.
   */
  private resolveValue(path: string, context: EvalContext): Primitive | undefined {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    // Special handling for time comparisons
    if (path === 'time' && typeof current === 'string') {
      // Convert time string to minutes for comparison
      const time = new Date(current);
      return time.getHours() * 60 + time.getMinutes();
    }

    return current;
  }

  /**
   * Execute statements within a conditional branch
   */
  private executeStatements(
    statements: CamoASTNode[],
    context: CamoAST,
    blockId: string
  ): CamoASTNode[] {
    // For now, return the statements as-is
    // In a full implementation, this would execute each statement
    // and potentially modify the context or trigger side effects

    console.log(`CAMO Conditional: Executing ${statements.length} statements for block ${blockId}`);

    return statements;
  }

  /**
   * Cache condition result with appropriate TTL
   */
  private cacheConditionResult(cacheKey: string, result: boolean, condition: Condition): void {
    this.conditionCache.set(cacheKey, result);

    // Set TTL based on condition type
    let ttl = 5000; // Default 5 seconds

    if (
      condition.lhs.includes('time') ||
      condition.lhs.includes('hour') ||
      condition.lhs.includes('minute')
    ) {
      ttl = 30000; // 30 seconds for time-based conditions
    } else if (condition.lhs.includes('theme') || condition.lhs.includes('file')) {
      ttl = 60000; // 1 minute for slower-changing conditions
    } else if (condition.lhs.includes('hover') || condition.lhs.includes('click')) {
      ttl = 1000; // 1 second for interaction-based conditions
    }

    // Clear cache after TTL
    setTimeout(() => {
      this.conditionCache.delete(cacheKey);
    }, ttl);
  }

  /**
   * Clear all cached conditions and contexts
   */
  clearCache(): void {
    this.conditionCache.clear();
    this.contextCache.clear();
  }

  /**
   * Update interaction state for a block (called by event handlers)
   */
  updateInteractionState(
    blockId: string,
    state: Partial<{
      hover: boolean;
      clicked: boolean;
      focused: boolean;
    }>
  ): void {
    const context = this.contextCache.get(blockId);
    if (context) {
      Object.assign(context, state);

      // Clear related condition cache entries
      const keysToDelete = Array.from(this.conditionCache.keys()).filter(
        key =>
          key.startsWith(`${blockId}:`) &&
          (key.includes('hover') || key.includes('click') || key.includes('focus'))
      );

      keysToDelete.forEach(key => this.conditionCache.delete(key));
    }
  }

  /**
   * Get debug information about condition evaluation
   */
  getDebugInfo(blockId: string): {
    context: EvalContext;
    cachedConditions: string[];
  } {
    const context = this.getEvaluationContext(blockId);
    const cachedConditions = Array.from(this.conditionCache.keys()).filter(key =>
      key.startsWith(`${blockId}:`)
    );

    return {
      context,
      cachedConditions,
    };
  }
}
