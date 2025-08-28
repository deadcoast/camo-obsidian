/**
 * CAMO IR Extractor System
 *
 * Transforms AST to normalized Intermediate Representation (IR) instructions:
 * - AST to IR transformation with operation buckets (visual→state)
 * - Selector normalization for consistent targeting
 * - Conditional branch processing with guard conditions
 * - Hierarchical instruction mapping with inheritance
 * - Integration with existing IR executor pipeline
 * - Performance optimization for large ASTs
 */

import { CamoIR, IRCondition, IRStatement } from "../core/camoIRExecutor";
import { CamoAST, CamoASTNode } from "../modules/AST";

// Operation priority buckets (from Docs/3_camoIR.md)
export type OperationBucket = 1 | 2 | 3 | 4 | 5;

// Normalized selector structure
export interface NormalizedSelector {
  type: "content" | "text" | "paragraph" | "line" | "element" | "pattern";
  pattern: string;
  index?: number | [number, number]; // For range selections like paragraph[1-3]
  modifier?: string;
  scope: "block" | "content" | "element";
}

// Enhanced IR instruction format
export interface CamoIRInstruction {
  id: string; // Stable per-line identifier
  bucket: OperationBucket; // Operation priority bucket
  target: NormalizedSelector; // Normalized target selector
  effect?: {
    type: string; // Effect type (blur, redact, etc.)
    params: Record<string, string | number | boolean>;
  };
  outcome?: string; // Outcome symbol for debug/UX
  conditions?: IRCondition[]; // Conditional evaluator predicates
  children?: CamoIRInstruction[]; // Hierarchical child instructions
  metadata: {
    line: number;
    column: number;
    operator: string;
    keyword: string;
    original: string;
  };
}

// Keyword to bucket mapping
interface KeywordSpec {
  bucket: OperationBucket;
  requiredZones: string[];
  description: string;
}

// Transformation context for inheritance
interface TransformContext {
  parentTarget?: NormalizedSelector;
  parentConditions?: IRCondition[];
  depth: number;
  blockId: string;
}

// Transformation result
export interface IRExtractionResult {
  instructions: CamoIRInstruction[];
  errors: string[];
  warnings: string[];
  stats: {
    totalInstructions: number;
    conditionalBranches: number;
    hierarchicalDepth: number;
    operationDistribution: Record<OperationBucket, number>;
  };
}

/**
 * Main IR extractor for transforming AST to normalized IR instructions
 */
export class CamoIRExtractor {
  // Keyword specifications with operation buckets
  private readonly KEYWORD_SPECS: Record<string, KeywordSpec> = {
    // Visual operations (bucket 1)
    set: {
      bucket: 1,
      requiredZones: ["declaration", "target", "effect"],
      description: "Set visual property or style",
    },
    apply: {
      bucket: 1,
      requiredZones: ["declaration", "target", "effect"],
      description: "Apply visual effect",
    },
    blur: {
      bucket: 1,
      requiredZones: ["declaration", "target"],
      description: "Apply blur effect",
    },
    hide: {
      bucket: 1,
      requiredZones: ["declaration", "target"],
      description: "Hide content",
    },
    reveal: {
      bucket: 1,
      requiredZones: ["declaration", "target"],
      description: "Reveal content",
    },
    mask: {
      bucket: 1,
      requiredZones: ["declaration", "target", "effect"],
      description: "Mask content with pattern",
    },
    redact: {
      bucket: 1,
      requiredZones: ["declaration", "target"],
      description: "Redact sensitive information",
    },

    // Layout operations (bucket 2)
    resize: {
      bucket: 2,
      requiredZones: ["declaration", "target", "effect"],
      description: "Resize element",
    },
    position: {
      bucket: 2,
      requiredZones: ["declaration", "target", "effect"],
      description: "Position element",
    },

    // Animation operations (bucket 3)
    animate: {
      bucket: 3,
      requiredZones: ["declaration", "target", "effect"],
      description: "Animate element",
    },
    transition: {
      bucket: 3,
      requiredZones: ["declaration", "target", "effect"],
      description: "Apply transition",
    },

    // Interaction operations (bucket 4)
    click: {
      bucket: 4,
      requiredZones: ["declaration", "target", "effect"],
      description: "Click interaction",
    },
    hover: {
      bucket: 4,
      requiredZones: ["declaration", "target", "effect"],
      description: "Hover interaction",
    },

    // State operations (bucket 5)
    store: {
      bucket: 5,
      requiredZones: ["declaration", "target", "output"],
      description: "Store state or data",
    },
    retrieve: {
      bucket: 5,
      requiredZones: ["declaration", "target", "output"],
      description: "Retrieve stored data",
    },
    protect: {
      bucket: 5,
      requiredZones: ["declaration", "target", "effect", "output"],
      description: "Apply security protection",
    },
    coordinate: {
      bucket: 5,
      requiredZones: ["declaration", "target", "effect"],
      description: "Coordinate with other blocks",
    },
  };

  // Target function to selector type mapping
  private readonly TARGET_MAPPING: Record<string, NormalizedSelector["type"]> =
    {
      content: "content",
      text: "text",
      paragraph: "paragraph",
      line: "line",
      pattern: "pattern",
      element: "element",
      all: "content", // Default mapping
    };

  /**
   * Transform AST to IR instructions
   */
  transformASTtoIR(ast: CamoAST, blockId: string): IRExtractionResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const instructions: CamoIRInstruction[] = [];
    const stats = {
      totalInstructions: 0,
      conditionalBranches: 0,
      hierarchicalDepth: 0,
      operationDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      } as Record<OperationBucket, number>,
    };

    const context: TransformContext = {
      depth: 0,
      blockId,
    };

    try {
      for (const statement of ast.statements) {
        const result = this.transformStatement(statement, context);

        if (result.instruction) {
          instructions.push(result.instruction);
          stats.totalInstructions++;
          stats.operationDistribution[result.instruction.bucket]++;
          stats.hierarchicalDepth = Math.max(
            stats.hierarchicalDepth,
            context.depth
          );

          if (
            result.instruction.conditions &&
            result.instruction.conditions.length > 0
          ) {
            stats.conditionalBranches++;
          }
        }

        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    } catch (error) {
      errors.push(`IR transformation failed: ${error.message}`);
    }

    return {
      instructions,
      errors,
      warnings,
      stats,
    };
  }

  /**
   * Transform single AST statement to IR instruction
   */
  private transformStatement(
    node: CamoASTNode,
    context: TransformContext
  ): {
    instruction: CamoIRInstruction | null;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate statement structure
      const validation = this.validateStatement(node);
      if (!validation.valid) {
        errors.push(...validation.errors);
        return { instruction: null, errors, warnings };
      }

      // Generate instruction ID
      const instructionId = this.generateInstructionId(node, context);

      // Determine operation bucket
      const bucket = this.getOperationBucket(node.keyword || "set");

      // Normalize target selector
      const target = this.normalizeSelector(node, context);
      if (!target) {
        errors.push(
          `Failed to normalize target for statement at line ${node.line}`
        );
        return { instruction: null, errors, warnings };
      }

      // Extract effect parameters
      const effect = this.extractEffect(node);

      // Process conditions
      const conditions = this.extractConditions(node, context);

      // Process children recursively
      const children: CamoIRInstruction[] = [];
      if (node.children && node.children.length > 0) {
        const childContext: TransformContext = {
          ...context,
          parentTarget: target,
          parentConditions: conditions,
          depth: context.depth + 1,
        };

        for (const child of node.children) {
          const childResult = this.transformStatement(child, childContext);
          if (childResult.instruction) {
            children.push(childResult.instruction);
          }
          errors.push(...childResult.errors);
          warnings.push(...childResult.warnings);
        }
      }

      // Create IR instruction
      const instruction: CamoIRInstruction = {
        id: instructionId,
        bucket,
        target,
        effect,
        outcome: node.outcome,
        conditions: conditions.length > 0 ? conditions : undefined,
        children: children.length > 0 ? children : undefined,
        metadata: {
          line: node.line,
          column: node.column,
          operator: node.operator,
          keyword: node.keyword || "unknown",
          original: this.reconstructOriginal(node),
        },
      };

      return { instruction, errors, warnings };
    } catch (error) {
      errors.push(
        `Failed to transform statement at line ${node.line}: ${error.message}`
      );
      return { instruction: null, errors, warnings };
    }
  }

  /**
   * Validate AST statement structure
   */
  private validateStatement(node: CamoASTNode): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for required keyword
    if (!node.keyword) {
      errors.push(`Statement at line ${node.line} is missing keyword`);
    } else {
      // Check if keyword is supported
      if (!this.KEYWORD_SPECS[node.keyword]) {
        errors.push(`Unknown keyword '${node.keyword}' at line ${node.line}`);
      } else {
        // Check required zones
        const spec = this.KEYWORD_SPECS[node.keyword];
        if (spec.requiredZones.includes("effect") && !node.action) {
          errors.push(
            `Keyword '${node.keyword}' requires effect zone at line ${node.line}`
          );
        }
        if (spec.requiredZones.includes("output") && !node.outcome) {
          errors.push(
            `Keyword '${node.keyword}' requires output zone at line ${node.line}`
          );
        }
      }
    }

    // Check for required function (target)
    if (!node.function) {
      errors.push(`Statement at line ${node.line} is missing target function`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get operation bucket for keyword
   */
  private getOperationBucket(keyword: string): OperationBucket {
    return this.KEYWORD_SPECS[keyword]?.bucket || 1; // Default to visual
  }

  /**
   * Normalize target selector
   */
  private normalizeSelector(
    node: CamoASTNode,
    context: TransformContext
  ): NormalizedSelector | null {
    const func = node.function;
    const variable = node.variable;

    if (!func) return null;

    // Determine selector type
    const type = this.TARGET_MAPPING[func] || "content";

    // Parse variable for additional selector information
    let pattern = func;
    let index: number | [number, number] | undefined;
    let modifier: string | undefined;

    if (variable) {
      // Handle different variable patterns
      if (/^\d+$/.test(variable)) {
        // Single index: text[5]
        index = parseInt(variable, 10);
      } else if (/^\d+-\d+$/.test(variable)) {
        // Range index: paragraph[1-3]
        const [start, end] = variable.split("-").map(Number);
        index = [start, end];
      } else {
        // Named selector: text[sensitive]
        modifier = variable;
        pattern = variable;
      }
    }

    // Inherit from parent if applicable
    const scope = this.determineScope(type, context);

    return {
      type,
      pattern,
      index,
      modifier,
      scope,
    };
  }

  /**
   * Determine selector scope based on type and context
   */
  private determineScope(
    type: NormalizedSelector["type"],
    context: TransformContext
  ): "block" | "content" | "element" {
    // Inherit scope from parent if narrower
    if (context.parentTarget) {
      if (context.parentTarget.scope === "element") {
        return "element";
      }
      if (context.parentTarget.scope === "content" && type !== "content") {
        return "content";
      }
    }

    // Default scope based on type
    switch (type) {
      case "content":
        return "block";
      case "text":
      case "paragraph":
      case "line":
        return "content";
      case "element":
      case "pattern":
        return "element";
      default:
        return "content";
    }
  }

  /**
   * Extract effect parameters from AST node
   */
  private extractEffect(
    node: CamoASTNode
  ): CamoIRInstruction["effect"] | undefined {
    if (!node.action) return undefined;

    const type =
      typeof node.action === "string"
        ? node.action
        : node.action.name || "unknown";
    const params: Record<string, string | number | boolean> = {};

    // Extract parameters from node.parameters
    if (node.parameters) {
      Object.entries(node.parameters).forEach(([key, value]) => {
        params[key] = this.normalizeParameterValue(value);
      });
    }

    return {
      type,
      params,
    };
  }

  /**
   * Extract conditions from AST node
   */
  private extractConditions(
    node: CamoASTNode,
    context: TransformContext
  ): IRCondition[] {
    const conditions: IRCondition[] = [];

    // Inherit parent conditions
    if (context.parentConditions) {
      conditions.push(...context.parentConditions);
    }

    // Extract node-specific conditions
    if (node.operator === ":^:") {
      // Hierarchical nodes might have conditional logic
      if (node.keyword && node.keyword.startsWith("IF{")) {
        const conditionMatch = node.keyword.match(/IF\{([^}]+)\}/);
        if (conditionMatch) {
          conditions.push({
            type: "IF",
            expression: conditionMatch[1],
            operator: "equals",
            value: true,
          });
        }
      }
    }

    return conditions;
  }

  /**
   * Generate stable instruction ID
   */
  private generateInstructionId(
    node: CamoASTNode,
    context: TransformContext
  ): string {
    const keyword = node.keyword || "unknown";
    const line = node.line;
    const blockId = context.blockId;

    return `${blockId}-${keyword}-${line}-${Date.now().toString(36)}`;
  }

  /**
   * Normalize parameter value to appropriate type
   */
  private normalizeParameterValue(value: any): string | number | boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value;

    const str = String(value);

    // Try boolean conversion
    if (str === "true") return true;
    if (str === "false") return false;

    // Try number conversion
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    if (/^\d+\.\d+$/.test(str)) return parseFloat(str);

    // Return as string
    return str;
  }

  /**
   * Reconstruct original statement text for debugging
   */
  private reconstructOriginal(node: CamoASTNode): string {
    const parts = [node.operator];

    if (node.keyword) {
      parts.push(node.keyword);
      if (node.variable) {
        parts.push(`[${node.variable}]`);
      }
    }

    if (node.function) {
      parts.push("//", node.function);
    }

    if (node.action) {
      const action =
        typeof node.action === "string" ? node.action : node.action.name;
      parts.push("%", `{${action}}`);
    }

    if (node.outcome) {
      parts.push("->", `{${node.outcome}}`);
    }

    return parts.join(" ");
  }

  /**
   * Convert IR instructions to legacy CamoIR format for compatibility
   */
  convertToLegacyIR(
    instructions: CamoIRInstruction[],
    blockId: string
  ): CamoIR {
    const statements: IRStatement[] = instructions.map(
      (instruction, index) => ({
        id: instruction.id,
        type: this.bucketToType(instruction.bucket),
        operation: instruction.effect?.type || instruction.metadata.keyword,
        target: {
          selector: this.selectorToString(instruction.target),
          scope: instruction.target.scope,
          pattern: instruction.target.pattern,
        },
        parameters: instruction.effect?.params || {},
        conditions: instruction.conditions || [],
        priority: instruction.bucket,
      })
    );

    return {
      version: "1.0.0",
      statements,
      metadata: {
        blockId,
        created: Date.now(),
        version: "1.0.0",
        optimized: false,
      },
    };
  }

  /**
   * Convert operation bucket to legacy type
   */
  private bucketToType(bucket: OperationBucket): IRStatement["type"] {
    switch (bucket) {
      case 1:
        return "visual";
      case 2:
        return "layout";
      case 3:
        return "visual"; // Animation maps to visual
      case 4:
        return "interaction";
      case 5:
        return "state";
      default:
        return "visual";
    }
  }

  /**
   * Convert normalized selector to string representation
   */
  private selectorToString(selector: NormalizedSelector): string {
    let result = selector.pattern;

    if (selector.index !== undefined) {
      if (Array.isArray(selector.index)) {
        result += `[${selector.index[0]}-${selector.index[1]}]`;
      } else {
        result += `[${selector.index}]`;
      }
    } else if (selector.modifier) {
      result += `[${selector.modifier}]`;
    }

    return result;
  }

  /**
   * Get supported keywords
   */
  getSupportedKeywords(): string[] {
    return Object.keys(this.KEYWORD_SPECS);
  }

  /**
   * Get keyword specification
   */
  getKeywordSpec(keyword: string): KeywordSpec | undefined {
    return this.KEYWORD_SPECS[keyword];
  }

  /**
   * Get operation distribution statistics
   */
  getOperationStats(
    instructions: CamoIRInstruction[]
  ): Record<OperationBucket, number> {
    const stats: Record<OperationBucket, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    instructions.forEach((instruction) => {
      stats[instruction.bucket]++;
    });

    return stats;
  }
}
