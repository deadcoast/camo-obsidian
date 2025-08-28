/**
 * CAMO MetaData Parser System
 *
 * Dedicated parser for camoMetaData syntax with comprehensive tokenization,
 * AST building, and grammar validation:
 * - Tokenization engine for camoMetaData operators and blocks
 * - AST builder for hierarchical statement structures
 * - Grammar validation for syntax correctness
 * - Statement parsing for individual camoMetaData lines
 * - Integration with IR system for execution pipeline
 */

import { CamoAST, CamoASTNode } from "./AST";

// Token types for camoMetaData syntax
export enum TokenType {
  NEWLINE = "NEWLINE", // ::
  HIERARCHICAL = "HIERARCHICAL", // :^:
  RELATION = "RELATION", // //
  OPERATOR = "OPERATOR", // %
  TRIGGER = "TRIGGER", // ->
  ACTION_BLOCK = "ACTION_BLOCK", // {action}
  VARIABLE_BLOCK = "VARIABLE_BLOCK", // [variable]
  OPTION_BLOCK = "OPTION_BLOCK", // (parameters)
  IDENTIFIER = "IDENTIFIER", // keyword, function names
  STRING = "STRING", // "quoted string" or 'quoted string'
  NUMBER = "NUMBER", // 123 or 123.45
  WHITESPACE = "WHITESPACE", // spaces, tabs
  COMMENT = "COMMENT", // // comments (when not relation)
  NEWLINE_CHAR = "NEWLINE_CHAR", // \n
  EOF = "EOF", // End of file
  INVALID = "INVALID", // Invalid token
}

// Token structure
export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  line: number;
  column: number;
}

// Parsed statement structure
export interface ParsedStatement {
  type: "statement" | "declaration" | "target" | "effect" | "output";
  line: number;
  column: number;
  operator: "::" | ":^:";

  declaration: {
    type: "newline" | "hierarchical";
    keyword: string;
    variable?: string;
    modifiers: string[];
  };

  target: {
    function: string;
    selector?: string;
  };

  effect?: {
    action: string;
    parameters: Map<string, any>;
    options?: string[];
  };

  output?: {
    outcome: string;
    conditions?: string[];
  };

  raw: string;
  valid: boolean;
  errors: string[];
}

// Parser configuration
interface ParserConfig {
  strictMode: boolean;
  enableComments: boolean;
  maxLineLength: number;
  allowIncompleteStatements: boolean;
}

/**
 * Tokenization engine for camoMetaData syntax
 */
export class CamoTokenizer {
  private readonly TOKEN_PATTERNS = {
    [TokenType.NEWLINE]: /^::/,
    [TokenType.HIERARCHICAL]: /^:\^:/,
    [TokenType.RELATION]: /^\/\//,
    [TokenType.OPERATOR]: /^%/,
    [TokenType.TRIGGER]: /^->/,
    [TokenType.ACTION_BLOCK]: /^\{([^}]*)\}/,
    [TokenType.VARIABLE_BLOCK]: /^\[([^\]]*)\]/,
    [TokenType.OPTION_BLOCK]: /^\(([^)]*)\)/,
    [TokenType.IDENTIFIER]: /^[a-zA-Z_][a-zA-Z0-9_]*/,
    [TokenType.STRING]: /^("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/,
    [TokenType.NUMBER]: /^\d+(\.\d+)?/,
    [TokenType.WHITESPACE]: /^\s+/,
    [TokenType.NEWLINE_CHAR]: /^\n/,
  };

  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    let line = 1;
    let column = 1;

    while (position < input.length) {
      const token = this.nextToken(input, position, line, column);

      if (token) {
        tokens.push(token);
        position = token.end;

        // Update line/column tracking
        if (token.type === TokenType.NEWLINE_CHAR) {
          line++;
          column = 1;
        } else {
          column += token.value.length;
        }
      } else {
        // Skip invalid character
        position++;
        column++;
      }
    }

    // Add EOF token
    tokens.push({
      type: TokenType.EOF,
      value: "",
      start: position,
      end: position,
      line,
      column,
    });

    return tokens;
  }

  private nextToken(
    input: string,
    position: number,
    line: number,
    column: number
  ): Token | null {
    const remaining = input.slice(position);

    // Try each token pattern
    for (const [type, pattern] of Object.entries(this.TOKEN_PATTERNS)) {
      const match = remaining.match(pattern);
      if (match) {
        const value = match[0];
        const capturedValue = match[1] || value; // Use captured group if available

        return {
          type: type as TokenType,
          value:
            type === TokenType.ACTION_BLOCK ||
            type === TokenType.VARIABLE_BLOCK ||
            type === TokenType.OPTION_BLOCK
              ? capturedValue
              : value,
          start: position,
          end: position + value.length,
          line,
          column,
        };
      }
    }

    // Check for invalid token
    if (remaining.length > 0) {
      return {
        type: TokenType.INVALID,
        value: remaining[0],
        start: position,
        end: position + 1,
        line,
        column,
      };
    }

    return null;
  }
}

/**
 * Grammar validator for camoMetaData syntax
 */
export class CamoGrammar {
  // Keyword specifications with required zones
  private readonly KEYWORD_SPECS: Record<
    string,
    { zones: string[]; description: string }
  > = {
    set: {
      zones: ["declaration", "target", "effect"],
      description: "Set visual property or style",
    },
    apply: {
      zones: ["declaration", "target", "effect"],
      description: "Apply effect or transformation",
    },
    protect: {
      zones: ["declaration", "target", "effect", "output"],
      description: "Apply security protection",
    },
    reveal: {
      zones: ["declaration", "target", "effect"],
      description: "Reveal hidden content",
    },
    hide: {
      zones: ["declaration", "target", "effect"],
      description: "Hide content",
    },
    mask: {
      zones: ["declaration", "target", "effect"],
      description: "Mask content with pattern",
    },
    redact: {
      zones: ["declaration", "target", "effect"],
      description: "Redact sensitive information",
    },
    store: {
      zones: ["declaration", "target", "output"],
      description: "Store state or data",
    },
    retrieve: {
      zones: ["declaration", "target", "output"],
      description: "Retrieve stored data",
    },
    coordinate: {
      zones: ["declaration", "target", "effect"],
      description: "Coordinate with other blocks",
    },
  };

  validateKeyword(keyword: string): boolean {
    return keyword in this.KEYWORD_SPECS;
  }

  getRequiredZones(keyword: string): string[] {
    return this.KEYWORD_SPECS[keyword]?.zones || ["declaration", "target"];
  }

  validateStatement(statement: ParsedStatement): string[] {
    const errors: string[] = [];

    // Check keyword validity
    if (!this.validateKeyword(statement.declaration.keyword)) {
      errors.push(`Unknown keyword: ${statement.declaration.keyword}`);
    }

    // Check required zones
    const requiredZones = this.getRequiredZones(statement.declaration.keyword);
    if (requiredZones.includes("effect") && !statement.effect) {
      errors.push(
        `Keyword '${statement.declaration.keyword}' requires effect zone`
      );
    }
    if (requiredZones.includes("output") && !statement.output) {
      errors.push(
        `Keyword '${statement.declaration.keyword}' requires output zone`
      );
    }

    // Check target function validity
    if (!statement.target.function || statement.target.function.trim() === "") {
      errors.push("Target function is required");
    }

    return errors;
  }

  getKeywordDescription(keyword: string): string {
    return this.KEYWORD_SPECS[keyword]?.description || "Unknown keyword";
  }

  getSupportedKeywords(): string[] {
    return Object.keys(this.KEYWORD_SPECS);
  }
}

/**
 * Statement parser for individual camoMetaData lines
 */
export class CamoStatementParser {
  private grammar: CamoGrammar;

  constructor() {
    this.grammar = new CamoGrammar();
  }

  parseStatement(
    tokens: Token[],
    startIndex: number = 0
  ): {
    statement: ParsedStatement | null;
    nextIndex: number;
  } {
    let current = startIndex;
    const errors: string[] = [];

    // Skip whitespace
    current = this.skipWhitespace(tokens, current);

    if (current >= tokens.length || tokens[current].type === TokenType.EOF) {
      return { statement: null, nextIndex: current };
    }

    // Check for statement start
    const firstToken = tokens[current];
    if (
      firstToken.type !== TokenType.NEWLINE &&
      firstToken.type !== TokenType.HIERARCHICAL
    ) {
      return { statement: null, nextIndex: current };
    }

    const operator = firstToken.value as "::" | ":^:";
    const line = firstToken.line;
    const column = firstToken.column;
    current++;

    // Parse declaration zone
    const declaration = this.parseDeclaration(tokens, current);
    if (!declaration.success) {
      errors.push(...declaration.errors);
      return {
        statement: this.createErrorStatement(tokens, startIndex, errors),
        nextIndex: declaration.nextIndex,
      };
    }
    current = declaration.nextIndex;

    // Parse target zone (required)
    const target = this.parseTarget(tokens, current);
    if (!target.success) {
      errors.push(...target.errors);
      return {
        statement: this.createErrorStatement(tokens, startIndex, errors),
        nextIndex: target.nextIndex,
      };
    }
    current = target.nextIndex;

    // Parse optional effect zone
    let effect: any = null;
    if (
      current < tokens.length &&
      tokens[current].type === TokenType.OPERATOR
    ) {
      const effectResult = this.parseEffect(tokens, current);
      if (effectResult.success) {
        effect = effectResult.data;
        current = effectResult.nextIndex;
      } else {
        errors.push(...effectResult.errors);
      }
    }

    // Parse optional output zone
    let output: any = null;
    if (current < tokens.length && tokens[current].type === TokenType.TRIGGER) {
      const outputResult = this.parseOutput(tokens, current);
      if (outputResult.success) {
        output = outputResult.data;
        current = outputResult.nextIndex;
      } else {
        errors.push(...outputResult.errors);
      }
    }

    // Collect raw text
    const rawTokens = tokens.slice(startIndex, current);
    const raw = rawTokens.map((t) => t.value).join("");

    // Create statement
    const statement: ParsedStatement = {
      type: "statement",
      line,
      column,
      operator,
      declaration: {
        type: operator === "::" ? "newline" : "hierarchical",
        keyword: declaration.data?.keyword || "unknown",
        variable: declaration.data?.variable,
        modifiers: declaration.data?.modifiers || [],
      },
      target: {
        function: target.data?.function || "unknown",
        selector: target.data?.selector,
      },
      effect,
      output,
      raw,
      valid: errors.length === 0,
      errors,
    };

    // Grammar validation
    const grammarErrors = this.grammar.validateStatement(statement);
    statement.errors.push(...grammarErrors);
    statement.valid = statement.errors.length === 0;

    return { statement, nextIndex: current };
  }

  private parseDeclaration(tokens: Token[], startIndex: number) {
    let current = this.skipWhitespace(tokens, startIndex);
    const errors: string[] = [];

    // Parse keyword
    if (
      current >= tokens.length ||
      tokens[current].type !== TokenType.IDENTIFIER
    ) {
      return {
        success: false,
        errors: ["Expected keyword after statement operator"],
        nextIndex: current,
        data: null,
      };
    }

    const keyword = tokens[current].value;
    current++;

    // Parse optional variable
    let variable: string | undefined;
    current = this.skipWhitespace(tokens, current);
    if (
      current < tokens.length &&
      tokens[current].type === TokenType.VARIABLE_BLOCK
    ) {
      variable = tokens[current].value;
      current++;
    }

    // Parse modifiers (additional identifiers)
    const modifiers: string[] = [];
    while (current < tokens.length) {
      current = this.skipWhitespace(tokens, current);
      if (
        current < tokens.length &&
        tokens[current].type === TokenType.IDENTIFIER
      ) {
        modifiers.push(tokens[current].value);
        current++;
      } else {
        break;
      }
    }

    return {
      success: true,
      errors,
      nextIndex: current,
      data: { keyword, variable, modifiers },
    };
  }

  private parseTarget(tokens: Token[], startIndex: number) {
    let current = this.skipWhitespace(tokens, startIndex);
    const errors: string[] = [];

    // Expect relation operator
    if (
      current >= tokens.length ||
      tokens[current].type !== TokenType.RELATION
    ) {
      return {
        success: false,
        errors: ["Expected '//' relation operator before target"],
        nextIndex: current,
        data: null,
      };
    }
    current++;

    // Parse function
    current = this.skipWhitespace(tokens, current);
    if (
      current >= tokens.length ||
      tokens[current].type !== TokenType.IDENTIFIER
    ) {
      return {
        success: false,
        errors: ["Expected target function after '//'"],
        nextIndex: current,
        data: null,
      };
    }

    const func = tokens[current].value;
    current++;

    // Parse optional selector
    let selector: string | undefined;
    current = this.skipWhitespace(tokens, current);
    if (
      current < tokens.length &&
      tokens[current].type === TokenType.VARIABLE_BLOCK
    ) {
      selector = tokens[current].value;
      current++;
    }

    return {
      success: true,
      errors,
      nextIndex: current,
      data: { function: func, selector },
    };
  }

  private parseEffect(tokens: Token[], startIndex: number) {
    let current = startIndex;
    const errors: string[] = [];

    // Skip operator
    if (
      current < tokens.length &&
      tokens[current].type === TokenType.OPERATOR
    ) {
      current++;
    }

    // Parse action
    current = this.skipWhitespace(tokens, current);
    if (
      current >= tokens.length ||
      tokens[current].type !== TokenType.ACTION_BLOCK
    ) {
      return {
        success: false,
        errors: ["Expected action block after '%' operator"],
        nextIndex: current,
        data: null,
      };
    }

    const action = tokens[current].value;
    current++;

    // Parse optional parameters
    const parameters = new Map<string, any>();
    current = this.skipWhitespace(tokens, current);
    if (
      current < tokens.length &&
      tokens[current].type === TokenType.OPTION_BLOCK
    ) {
      const paramString = tokens[current].value;
      // Parse parameters like "intensity=80, duration=500"
      const paramPairs = paramString.split(",");
      for (const pair of paramPairs) {
        const [key, value] = pair.split("=").map((s) => s.trim());
        if (key && value) {
          parameters.set(key, this.parseValue(value));
        }
      }
      current++;
    }

    return {
      success: true,
      errors,
      nextIndex: current,
      data: { action, parameters },
    };
  }

  private parseOutput(tokens: Token[], startIndex: number) {
    let current = startIndex;
    const errors: string[] = [];

    // Skip trigger
    if (current < tokens.length && tokens[current].type === TokenType.TRIGGER) {
      current++;
    }

    // Parse outcome
    current = this.skipWhitespace(tokens, current);
    if (
      current >= tokens.length ||
      tokens[current].type !== TokenType.ACTION_BLOCK
    ) {
      return {
        success: false,
        errors: ["Expected outcome block after '->' trigger"],
        nextIndex: current,
        data: null,
      };
    }

    const outcome = tokens[current].value;
    current++;

    return {
      success: true,
      errors,
      nextIndex: current,
      data: { outcome, conditions: [] },
    };
  }

  private parseValue(value: string): any {
    // Boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Number
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

    // String (remove quotes if present)
    return value.replace(/^["']|["']$/g, "");
  }

  private skipWhitespace(tokens: Token[], startIndex: number): number {
    let current = startIndex;
    while (
      current < tokens.length &&
      tokens[current].type === TokenType.WHITESPACE
    ) {
      current++;
    }
    return current;
  }

  private createErrorStatement(
    tokens: Token[],
    startIndex: number,
    errors: string[]
  ): ParsedStatement {
    const firstToken = tokens[startIndex] || { line: 1, column: 1, value: "" };
    const rawTokens = tokens.slice(
      startIndex,
      Math.min(startIndex + 10, tokens.length)
    );
    const raw = rawTokens.map((t) => t.value).join("");

    return {
      type: "statement",
      line: firstToken.line,
      column: firstToken.column,
      operator: "::" as "::" | ":^:",
      declaration: {
        type: "newline",
        keyword: "invalid",
        modifiers: [],
      },
      target: {
        function: "unknown",
      },
      raw,
      valid: false,
      errors,
    };
  }
}

/**
 * AST builder for camoMetaData statements
 */
export class CamoASTBuilder {
  private statementParser: CamoStatementParser;

  constructor() {
    this.statementParser = new CamoStatementParser();
  }

  build(input: string): CamoAST {
    const tokenizer = new CamoTokenizer();
    const tokens = tokenizer.tokenize(input);

    return this.buildFromTokens(tokens);
  }

  buildFromTokens(tokens: Token[]): CamoAST {
    const root: CamoAST = {
      type: "root",
      statements: [],
    };

    let current = 0;
    while (current < tokens.length && tokens[current].type !== TokenType.EOF) {
      // Skip non-statement tokens (comments, whitespace, etc.)
      if (
        tokens[current].type !== TokenType.NEWLINE &&
        tokens[current].type !== TokenType.HIERARCHICAL
      ) {
        current++;
        continue;
      }

      const { statement, nextIndex } = this.statementParser.parseStatement(
        tokens,
        current
      );

      if (statement) {
        const astNode = this.convertToASTNode(statement);
        root.statements.push(astNode);
      }

      current = nextIndex;
      if (current === tokens.length - 1) break; // EOF
    }

    // Link hierarchical references
    this.linkHierarchicalReferences(root);

    return root;
  }

  private convertToASTNode(statement: ParsedStatement): CamoASTNode {
    const node: CamoASTNode = {
      type: "statement",
      operator: statement.operator,
      keyword: statement.declaration.keyword,
      variable: statement.declaration.variable,
      function: statement.target.function,
      children: [],
      depth: statement.operator === "::" ? 0 : 1,
      line: statement.line,
      column: statement.column,
      startIndex: 0, // Will be set by tokenizer if needed
      endIndex: 0, // Will be set by tokenizer if needed
    };

    // Add effect information
    if (statement.effect) {
      node.action = statement.effect.action;

      // Convert parameters Map to Record
      if (statement.effect.parameters.size > 0) {
        node.parameters = {};
        statement.effect.parameters.forEach((value, key) => {
          if (node.parameters) {
            node.parameters[key] = String(value);
          }
        });
      }
    }

    // Add output information
    if (statement.output) {
      node.outcome = statement.output.outcome;
    }

    return node;
  }

  private linkHierarchicalReferences(ast: CamoAST): void {
    const stack: CamoASTNode[] = [];

    for (const statement of ast.statements) {
      if (statement.operator === "::") {
        // Root level statement
        stack.length = 0; // Clear stack
        stack.push(statement);
        statement.depth = 0;
      } else if (statement.operator === ":^:") {
        // Hierarchical statement
        if (stack.length > 0) {
          const parent = stack[stack.length - 1];
          parent.children = parent.children || [];
          parent.children.push(statement);
          statement.parent = parent;
          statement.depth = parent.depth + 1;
        }
        stack.push(statement);
      }
    }
  }
}

/**
 * Main MetaData parser combining all components
 */
export class CamoMetaDataParser {
  private tokenizer: CamoTokenizer;
  private statementParser: CamoStatementParser;
  private astBuilder: CamoASTBuilder;
  private grammar: CamoGrammar;
  private config: ParserConfig;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = {
      strictMode: false,
      enableComments: true,
      maxLineLength: 1000,
      allowIncompleteStatements: true,
      ...config,
    };

    this.tokenizer = new CamoTokenizer();
    this.statementParser = new CamoStatementParser();
    this.astBuilder = new CamoASTBuilder();
    this.grammar = new CamoGrammar();
  }

  /**
   * Parse camoMetaData lines into structured statements
   */
  parseMetaData(lines: string[]): ParsedStatement[] {
    const statements: ParsedStatement[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and non-metadata lines
      if (
        !trimmed ||
        (!trimmed.startsWith("::") && !trimmed.startsWith(":^:"))
      ) {
        continue;
      }

      const tokens = this.tokenizer.tokenize(trimmed);
      const { statement } = this.statementParser.parseStatement(tokens);

      if (statement) {
        statements.push(statement);
      }
    }

    return statements;
  }

  /**
   * Parse single camoMetaData statement
   */
  parseStatement(input: string): ParsedStatement | null {
    const tokens = this.tokenizer.tokenize(input.trim());
    const { statement } = this.statementParser.parseStatement(tokens);
    return statement;
  }

  /**
   * Build AST from camoMetaData content
   */
  buildAST(input: string): CamoAST {
    return this.astBuilder.build(input);
  }

  /**
   * Validate camoMetaData syntax
   */
  validate(input: string): { valid: boolean; errors: string[] } {
    const ast = this.buildAST(input);
    const errors: string[] = [];

    for (const statement of ast.statements) {
      if (statement.keyword) {
        if (!this.grammar.validateKeyword(statement.keyword)) {
          errors.push(
            `Unknown keyword: ${statement.keyword} at line ${statement.line}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get supported keywords
   */
  getSupportedKeywords(): string[] {
    return this.grammar.getSupportedKeywords();
  }

  /**
   * Get keyword description
   */
  getKeywordDescription(keyword: string): string {
    return this.grammar.getKeywordDescription(keyword);
  }

  /**
   * Get parser configuration
   */
  getConfig(): ParserConfig {
    return { ...this.config };
  }

  /**
   * Update parser configuration
   */
  updateConfig(newConfig: Partial<ParserConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get detailed parsing information for debugging
   */
  getParsingInfo(input: string): {
    tokens: Token[];
    statements: ParsedStatement[];
    ast: CamoAST;
    errors: string[];
  } {
    const tokens = this.tokenizer.tokenize(input);
    const statements = this.parseMetaData(input.split("\n"));
    const ast = this.buildAST(input);
    const validation = this.validate(input);

    return {
      tokens,
      statements,
      ast,
      errors: validation.errors,
    };
  }
}
