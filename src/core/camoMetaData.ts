/**
 * CamoMetaData Parser and Processor
 * Handles the parsing and execution of camoMetaData syntax within CAMO blocks
 *
 * Based on specifications in Docs/4_camoMetaData.md
 */

export interface ParsedStatement {
  declaration: {
    type: "newline" | "hierarchical";
    keyword: string;
    variable: string;
    modifiers: string[];
  };
  target: {
    function: string;
    operator: string;
  };
  effect: {
    action: string;
    parameters: Map<string, any>;
    trigger?: string;
  };
  output: {
    outcome: string;
    conditions?: string[];
  };
  line: number;
  column: number;
  depth: number;
  parent?: ParsedStatement;
  children: ParsedStatement[];
}

export interface CamoAST {
  type: "root";
  statements: ParsedStatement[];
}

export interface MetaDataContext {
  blockId: string;
  element: HTMLElement;
  settings: Record<string, string | number | boolean>;
}

export class CamoMetaDataParser {
  private readonly OPERATORS = {
    NEWLINE: "::",
    HIERARCHICAL: ":^:",
    RELATION: "//",
    MODIFIER: "%",
    TRIGGER: "->",
    ACTION_OPEN: "{",
    ACTION_CLOSE: "}",
    VAR_OPEN: "[",
    VAR_CLOSE: "]",
    OPTION_OPEN: "(",
    OPTION_CLOSE: ")",
  };

  private readonly KEYWORDS = {
    // Visual Operations
    set: "Modify visual property",
    apply: "Apply effect or filter",
    remove: "Remove effect or property",

    // Security Operations
    protect: "Apply security measure",
    encrypt: "Encrypt content",
    authenticate: "Require authentication",

    // Display Control
    reveal: "Set reveal conditions",
    hide: "Set hiding conditions",
    toggle: "Define toggle behavior",

    // Navigation
    link: "Connect to other blocks",
    navigate: "Define navigation paths",
    group: "Group related blocks",
  };

  /**
   * Parse camoMetaData lines into structured AST
   */
  parse(metaDataLines: string[]): CamoAST {
    const ast: CamoAST = {
      type: "root",
      statements: [],
    };

    let parentStack: ParsedStatement[] = [];

    for (let i = 0; i < metaDataLines.length; i++) {
      const line = metaDataLines[i];
      const statement = this.parseLine(line, i + 1);

      if (statement) {
        // Determine hierarchy depth
        const depth = this.calculateDepth(line);
        statement.depth = depth;

        // Link hierarchical relationships
        this.linkHierarchy(statement, parentStack, depth);

        // Add to appropriate parent
        if (depth === 0) {
          ast.statements.push(statement);
          parentStack = [statement];
        } else {
          const parent = parentStack[depth - 1];
          if (parent) {
            parent.children.push(statement);
            statement.parent = parent;
          }
        }

        // Update parent stack
        if (parentStack.length <= depth) {
          parentStack.push(statement);
        } else {
          parentStack[depth] = statement;
          parentStack.length = depth + 1;
        }
      }
    }

    return ast;
  }

  /**
   * Parse a single camoMetaData line
   */
  private parseLine(line: string, lineNumber: number): ParsedStatement | null {
    const trimmed = line.trim();
    if (!trimmed.startsWith("::") && !trimmed.startsWith(":^:")) {
      return null;
    }

    // Pattern: :: keyword[variable] // function % {action}(params) -> {outcome}
    const pattern =
      /^(::|\^:)\s+(\w+)\[([^\]]*)\]\s*\/\/\s*([^%]+)\s*%\s*\{([^}]+)\}\(([^)]*)\)\s*->\s*\{([^}]+)\}/;
    const match = trimmed.match(pattern);

    if (!match) {
      console.warn(
        `Invalid camoMetaData syntax at line ${lineNumber}: ${line}`
      );
      return null;
    }

    return {
      declaration: {
        type: match[1] === "::" ? "newline" : "hierarchical",
        keyword: match[2],
        variable: match[3],
        modifiers: [],
      },
      target: {
        function: match[4].trim(),
        operator: "%",
      },
      effect: {
        action: match[5],
        parameters: this.parseParameters(match[6]),
        trigger: undefined,
      },
      output: {
        outcome: match[7],
        conditions: [],
      },
      line: lineNumber,
      column: 1,
      depth: 0,
      children: [],
    };
  }

  /**
   * Calculate indentation depth for hierarchical structure
   */
  private calculateDepth(line: string): number {
    let depth = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === " ") {
        depth++;
      } else {
        break;
      }
    }
    return Math.floor(depth / 2); // Assuming 2 spaces per level
  }

  /**
   * Parse parameters from parameter string
   */
  private parseParameters(paramStr: string): Map<string, any> {
    const params = new Map<string, any>();

    // Simple parameter parsing - can be enhanced
    const parts = paramStr.split(",");
    for (const part of parts) {
      const [key, value] = part.split(":").map((s) => s.trim());
      if (key && value) {
        params.set(key, this.parseValue(value));
      }
    }

    return params;
  }

  /**
   * Parse a parameter value to appropriate type
   */
  private parseValue(value: string): string | number | boolean {
    // Try number
    if (/^\d+$/.test(value)) {
      return parseInt(value);
    }
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Try boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Return as string
    return value;
  }

  /**
   * Link hierarchical relationships
   */
  private linkHierarchy(
    statement: ParsedStatement,
    parentStack: ParsedStatement[],
    depth: number
  ): void {
    // Handle :^: references to parent statements
    if (statement.declaration.type === "hierarchical" && depth > 0) {
      const parent = parentStack[depth - 1];
      if (parent) {
        statement.parent = parent;
      }
    }
  }

  /**
   * Validate camoMetaData syntax
   */
  validateSyntax(metaDataLines: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < metaDataLines.length; i++) {
      const line = metaDataLines[i];
      const lineNum = i + 1;

      // Check basic syntax
      if (!this.isValidSyntax(line)) {
        errors.push(`Invalid syntax at line ${lineNum}: ${line}`);
      }

      // Check keyword validity
      const keyword = this.extractKeyword(line);
      if (keyword && !(keyword in this.KEYWORDS)) {
        warnings.push(`Unknown keyword '${keyword}' at line ${lineNum}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isValidSyntax(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed.startsWith("::") && !trimmed.startsWith(":^:")) {
      return true; // Not a camoMetaData line
    }

    // Basic pattern check
    const pattern =
      /^(::|\^:)\s+\w+\[[^\]]*\]\s*\/\/.*%.*\{[^}]+\}.*->\s*\{[^}]+\}/;
    return pattern.test(trimmed);
  }

  private extractKeyword(line: string): string | null {
    const match = line.match(/^(::|\^:)\s+(\w+)/);
    return match ? match[2] : null;
  }
}

export class CamoMetaDataProcessor {
  private parser: CamoMetaDataParser;

  constructor() {
    this.parser = new CamoMetaDataParser();
  }

  /**
   * Process camoMetaData and apply effects to element
   */
  async process(
    metaDataLines: string[],
    context: MetaDataContext
  ): Promise<ProcessingResult> {
    // Validate syntax first
    const validation = this.parser.validateSyntax(metaDataLines);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    // Parse to AST
    const ast = this.parser.parse(metaDataLines);

    // Execute statements
    const results: StatementResult[] = [];
    for (const statement of ast.statements) {
      const result = await this.executeStatement(statement, context);
      results.push(result);
    }

    return {
      success: true,
      results,
      warnings: validation.warnings,
    };
  }

  /**
   * Execute a single camoMetaData statement
   */
  private async executeStatement(
    statement: ParsedStatement,
    context: MetaDataContext
  ): Promise<StatementResult> {
    try {
      switch (statement.declaration.keyword) {
        case "set":
          return await this.executeSet(statement, context);
        case "apply":
          return await this.executeApply(statement, context);
        case "protect":
          return await this.executeProtect(statement, context);
        case "reveal":
          return await this.executeReveal(statement, context);
        default:
          return {
            success: false,
            error: `Unknown keyword: ${statement.declaration.keyword}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async executeSet(
    statement: ParsedStatement,
    context: MetaDataContext
  ): Promise<StatementResult> {
    const { variable } = statement.declaration;
    const { parameters } = statement.effect;

    // Apply CSS properties based on the set command
    switch (variable) {
      case "blur": {
        const intensity = parameters.get("intensity") || 40;
        context.element.style.filter = `blur(${intensity}px)`;
        break;
      }
      case "opacity": {
        const opacity = parameters.get("value") || 0.5;
        context.element.style.opacity = opacity.toString();
        break;
      }
      case "background": {
        const color = parameters.get("color") || "#000000";
        context.element.style.backgroundColor = color;
        break;
      }
    }

    return { success: true };
  }

  private async executeApply(
    statement: ParsedStatement,
    context: MetaDataContext
  ): Promise<StatementResult> {
    // TODO: Implement apply effects
    return { success: true };
  }

  private async executeProtect(
    statement: ParsedStatement,
    context: MetaDataContext
  ): Promise<StatementResult> {
    // TODO: Implement protection mechanisms
    return { success: true };
  }

  private async executeReveal(
    statement: ParsedStatement,
    context: MetaDataContext
  ): Promise<StatementResult> {
    // TODO: Implement reveal conditions
    return { success: true };
  }
}

// Type definitions
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProcessingResult {
  success: boolean;
  results?: StatementResult[];
  errors?: string[];
  warnings?: string[];
}

export interface StatementResult {
  success: boolean;
  error?: string;
  data?: Record<string, string | number | boolean | null>;
}
