export interface ValidationResult {
  valid: boolean;
  errors: SyntaxError[];
  warnings: SyntaxWarning[];
}

export interface SyntaxError {
  message: string;
  line: number;
  column: number;
}

export interface SyntaxWarning {
  message: string;
  line: number;
  column: number;
}

export interface ValidationOptions {
  strict: boolean;
  warnings: boolean;
}

export interface ValidationContext {
  filePath?: string;
  blockId?: string;
}

// import { KEYWORD_SPECS } from "./camoMetaData";

export class CamoSyntaxValidator {
  private readonly PATTERNS = {
    INDENTATION: /^\s+/,
    OPERATORS: /(::|:\^:|\/\/|%|->)/g,
    KEYWORDS: /\b(set|apply|protect|reveal|encrypt|hide)\b/g,
    ACTIONS: /\{([^}]+)\}/g,
    VARIABLES: /\[([^\]]+)\]/g,
    PARAMETERS: /\(([^)]+)\)/g,
  };

  private readonly ERRORS = {
    INDENTATION: "Invalid indentation",
    OPERATORS: "Invalid operator usage",
    KEYWORDS: "Invalid keyword usage",
    ACTIONS: "Invalid action usage",
    VARIABLES: "Invalid variable usage",
    PARAMETERS: "Invalid parameter usage",
  };

  private readonly WARNINGS = {
    INDENTATION: "Possible indentation issue",
    OPERATORS: "Possible operator usage issue",
    KEYWORDS: "Possible keyword usage issue",
    ACTIONS: "Possible action usage issue",
    VARIABLES: "Possible variable usage issue",
    PARAMETERS: "Possible parameter usage issue",
  };

  private readonly STRICT_RULES = {
    INDENTATION: true,
    OPERATORS: true,
    KEYWORDS: true,
    ACTIONS: true,
    VARIABLES: true,
    PARAMETERS: true,
  };

  private readonly WARNING_RULES = {
    INDENTATION: true,
    OPERATORS: true,
    KEYWORDS: true,
    ACTIONS: true,
    VARIABLES: true,
    PARAMETERS: true,
  };

  validate(input: string): ValidationResult {
    const errors: SyntaxError[] = [];
    const warnings: SyntaxWarning[] = [];

    // Check indentation rules
    this.validateIndentation(input, errors);

    // Validate operator usage
    this.validateOperators(input, errors);

    // Validate keyword usage (strict)
    this.validateKeywords(input, errors);

    // Validate action usage
    this.validateActions(input, errors);

    // Validate variable usage
    this.validateVariables(input, errors);

    // Validate parameter usage
    this.validateParameters(input, errors);

    // Validate bracket matching
    this.validateBrackets(input, errors);

    // Soft keyword hints
    this.validateKeywords(input, warnings);

    // Check hierarchical references
    this.validateHierarchy(input, errors);

    // Check hierarchical references
    this.validateHierarchy(input, errors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // --- Implementation helpers ---
  private validateIndentation(input: string, errors: SyntaxError[]): void {
    const lines = input.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      // Only spaces or tabs allowed before operators
      const leading = line.slice(0, line.indexOf(trimmed));
      if (/[^ \t]/.test(leading)) {
        errors.push({
          message: this.ERRORS.INDENTATION,
          line: idx + 1,
          column: 1,
        });
      }
    });
  }

  private validateOperators(input: string, errors: SyntaxError[]): void {
    const lines = input.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^(::|:\^:)/.test(trimmed)) {
        // declaration is at start
        const posTarget = trimmed.indexOf("//");
        const posParams = trimmed.indexOf("%", posTarget + 2);
        const posTrigger = trimmed.indexOf("->", posParams + 1);

        // Determine keyword to infer required zones
        const km = trimmed.match(/^(::|:\^:)\s*(\w+)/);
        const kw = (km?.[2] || "").toLowerCase();
        // Define keyword specifications inline since KEYWORD_SPECS is not available
        const keywordSpecs: Record<string, { requiredZones?: string[] }> = {
          set: { requiredZones: ["target", "effect"] },
          apply: { requiredZones: ["target", "effect"] },
          remove: { requiredZones: ["target"] },
          protect: { requiredZones: ["target", "effect"] },
          encrypt: { requiredZones: ["target", "effect"] },
          authenticate: { requiredZones: ["target"] },
          reveal: { requiredZones: ["target", "effect"] },
          hide: { requiredZones: ["target"] },
          toggle: { requiredZones: ["target"] },
          link: { requiredZones: ["target"] },
          navigate: { requiredZones: ["target"] },
          group: { requiredZones: ["target"] },
          coordinate: { requiredZones: ["target"] },
          store: { requiredZones: ["target"] },
          retrieve: { requiredZones: ["target"] },
          reset: { requiredZones: ["target"] },
          snapshot: { requiredZones: ["target"] },
          save: { requiredZones: ["target"] },
          load: { requiredZones: ["target"] },
          track: { requiredZones: ["target"] },
        };
        const spec = keywordSpecs[kw];
        const requiresTarget = spec?.requiredZones?.includes("target");
        const requiresEffect = spec?.requiredZones?.includes("effect");

        // Enforce ordering if tokens are present
        if (requiresTarget && posTarget === -1) {
          errors.push({
            message: this.ERRORS.OPERATORS + ": missing //",
            line: idx + 1,
            column: 1,
          });
        } else if (
          posTarget !== -1 &&
          posParams !== -1 &&
          posParams < posTarget
        ) {
          errors.push({
            message: this.ERRORS.OPERATORS + ": % before //",
            line: idx + 1,
            column: posParams + 1,
          });
        }

        if (requiresEffect && posParams === -1) {
          errors.push({
            message: this.ERRORS.OPERATORS + ": missing %",
            line: idx + 1,
            column: 1,
          });
        } else if (
          posParams !== -1 &&
          posTrigger !== -1 &&
          posTrigger < posParams
        ) {
          errors.push({
            message: this.ERRORS.OPERATORS + ": -> before %",
            line: idx + 1,
            column: posTrigger + 1,
          });
        }

        // Require effect parameter tuple when % exists (e.g., {name}(value))
        if (posParams !== -1) {
          const afterParams = trimmed.slice(posParams + 1);
          if (!/\{[^}]+\}\([^)]+\)/.test(afterParams)) {
            errors.push({
              message: this.ERRORS.PARAMETERS + ": malformed effect parameters",
              line: idx + 1,
              column: posParams + 1,
            });
          }
        }
      }
    });
  }

  private validateKeywords(
    input: string,
    bucket: (SyntaxError | SyntaxWarning)[]
  ): void {
    const lines = input.split("\n");
    const allowNoVariable = new Set(["authenticate", "audit", "navigate"]);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^(::|:\^:)/.test(trimmed)) {
        // Allow IF/ELSE/TRUE/FALSE labels without [variable]
        if (/^(::|:\^:)\s*(if\{|else\b|true\b|false\b)/i.test(trimmed)) {
          return;
        }
        // Expect a keyword followed by [variable]
        const km = trimmed.match(/^(::|:\^:)\s*(\w+)/);
        const kw = (km?.[2] || "").toLowerCase();
        const needsVariable = !allowNoVariable.has(kw);
        const hasVar = /\[/.test(trimmed);
        if (needsVariable && !hasVar) {
          bucket.push({
            message: this.ERRORS.KEYWORDS,
            line: idx + 1,
            column: 1,
          } as SyntaxError);
        }
      }
    });
  }

  private validateActions(input: string, errors: SyntaxError[]): void {
    // Basic balanced braces check is covered by validateBrackets; no-op here
    return;
  }

  private validateVariables(input: string, errors: SyntaxError[]): void {
    const lines = input.split("\n");
    lines.forEach((line, idx) => {
      const open = (line.match(/\[/g) || []).length;
      const close = (line.match(/\]/g) || []).length;
      if (open !== close) {
        errors.push({
          message: this.ERRORS.VARIABLES,
          line: idx + 1,
          column: 1,
        });
      }
    });
  }

  private validateParameters(input: string, errors: SyntaxError[]): void {
    const lines = input.split("\n");
    lines.forEach((line, idx) => {
      const open = (line.match(/\(/g) || []).length;
      const close = (line.match(/\)/g) || []).length;
      if (open !== close) {
        errors.push({
          message: this.ERRORS.PARAMETERS,
          line: idx + 1,
          column: 1,
        });
      }
    });
  }

  private validateBrackets(input: string, errors: SyntaxError[]): void {
    const lines = input.split("\n");
    lines.forEach((line, idx) => {
      const open = (line.match(/\{/g) || []).length;
      const close = (line.match(/\}/g) || []).length;
      if (open !== close) {
        errors.push({ message: this.ERRORS.ACTIONS, line: idx + 1, column: 1 });
      }
    });
  }

  private validateHierarchy(input: string, errors: SyntaxError[]): void {
    const lines = input.split("\n");
    const stack: {
      depth: number;
      idx: number;
      hasCondition: boolean;
      type: "root" | "if" | "stmt";
    }[] = [];
    const getDepth = (src: string) => {
      let i = 0;
      while (i < src.length && (src[i] === " " || src[i] === "\t")) i++;
      return i;
    };
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const depth = getDepth(raw);
      while (stack.length && stack[stack.length - 1].depth >= depth)
        stack.pop();

      const isHier = /^:\^:/.test(trimmed);
      // const isDecl = /^::/.test(trimmed);
      const isIf =
        /^(::|:\^:)\s*if\{/i.test(trimmed) || /if\{[^}]+\}/i.test(trimmed);
      const isLabelTrue = /^(::|:\^:)\s*true\b/i.test(trimmed);
      const isLabelFalse = /^(::|:\^:)\s*false\b/i.test(trimmed);
      const isLabelElse = /^(::|:\^:)\s*else\b/i.test(trimmed);

      if (isHier && stack.length === 0) {
        errors.push({
          message: "Hierarchical line has no parent",
          line: i + 1,
          column: 1,
        });
      }

      if (isLabelTrue || isLabelFalse || isLabelElse) {
        // Must have nearest ancestor with IF condition
        const hasConditionalAncestor = stack.some((s) => s.hasCondition);
        if (!hasConditionalAncestor) {
          errors.push({
            message: "Branch label without IF ancestor",
            line: i + 1,
            column: 1,
          });
        }
      }

      // Enforce ordering: after an IF at a depth, allow TRUE/FALSE/ELSE siblings once; otherwise warn on multiple ELSE
      if (isLabelElse) {
        const hasElseSibling = stack.some(
          (s) =>
            s.type === "stmt" &&
            lines[s.idx].trim().toLowerCase().startsWith(":: else")
        );
        if (hasElseSibling) {
          errors.push({
            message: "Multiple ELSE branches at same level",
            line: i + 1,
            column: 1,
          });
        }
      }

      // Push current node to stack
      stack.push({
        depth,
        idx: i,
        hasCondition: isIf,
        type: isIf ? "if" : "stmt",
      });
    }
  }
}
