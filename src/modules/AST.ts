import { Token } from "../lexer/index";

export interface CamoAST {
  type: "root";
  statements: CamoASTNode[];
}

export interface CamoASTNode {
  type: "statement" | "declaration" | "target" | "effect" | "output";
  operator: string;
  endIndex: number;
  startIndex: number;
  depth: number;
  children?: CamoASTNode[];
  parent?: CamoASTNode;
  line: number;
  column: number;
  // Enriched fields for downstream transform
  hierarchical?: boolean;
  keyword?: string;
  variable?: string;
  function?: string;
  action?: string;
  parameters?: Record<string, string>;
  outcome?: string;
  condition?: string;
  label?: string;
}

export class CamoASTBuilder {
  build(tokens: Token[]): CamoAST {
    const root: CamoAST = {
      type: "root",
      statements: [],
    };

    let current = 0;
    while (current < tokens.length) {
      const statement = this.parseStatement(tokens, current);
      if (statement) {
        root.statements.push(statement);
        current = statement.endIndex + 1;
      } else {
        current++;
      }
    }

    this.linkHierarchicalReferences(root);
    return root;
  }

  private parseStatement(
    tokens: Token[],
    current: number
  ): CamoASTNode | undefined {
    if (current >= tokens.length) {
      return undefined;
    }

    const start = current;
    const opener = tokens[current];
    const isHier = opener.value === ":^:";
    if (!(opener.value === "::" || isHier)) return undefined;

    const statement: CamoASTNode = {
      type: "statement",
      operator: opener.value,
      startIndex: start,
      endIndex: start,
      depth: Math.max(0, (opener.column || 1) - 1),
      line: opener.line || 0,
      column: opener.column || 0,
      children: [],
      hierarchical: isHier,
    };

    current++;
    // Declaration: keyword [variable]
    const decl: CamoASTNode = {
      type: "declaration",
      operator: "",
      startIndex: current,
      endIndex: current,
      depth: statement.depth,
      line: opener.line || 0,
      column: opener.column || 0,
    };
    // keyword
    if (tokens[current] && tokens[current].line === opener.line) {
      const first = tokens[current].value || "";
      decl.operator += first;
      decl.keyword = first.toLowerCase();
      current++;
    }
    // IF/ELSE/labels detection: capture condition from immediate {..}
    if (decl.keyword === "if") {
      const ct = tokens[current];
      if (ct && ct.line === opener.line && /^\{/.test(ct.value || "")) {
        const inner = (ct.value || "").replace(/^\{/, "").replace(/\}$/, "");
        statement.condition = inner.trim();
        current++;
      }
    } else if (
      decl.keyword === "else" ||
      decl.keyword === "true" ||
      decl.keyword === "false"
    ) {
      statement.label = decl.keyword;
    }
    // variable block(s) like [var][var2]... capture first as variable
    while (
      tokens[current] &&
      tokens[current].line === opener.line &&
      tokens[current].value?.startsWith("[")
    ) {
      const vb = tokens[current].value;
      decl.operator += vb;
      if (!decl.variable) {
        decl.variable = vb.replace(/^\[/, "").replace(/\]$/, "").trim();
      }
      current++;
    }
    if (statement.children) statement.children.push(decl);

    // Target: after // accumulate until % or -> or new statement
    if (
      tokens[current] &&
      tokens[current].line === opener.line &&
      tokens[current].value === "//"
    ) {
      const targetStart = current;
      current++;
      let tgt = "";
      while (current < tokens.length) {
        const tv = tokens[current].value;
        if (
          tokens[current].line !== opener.line ||
          tv === "%" ||
          tv === "->" ||
          tv === "::" ||
          tv === ":^:"
        )
          break;
        tgt += tokens[current].value;
        current++;
      }
      const targetNode: CamoASTNode = {
        type: "target",
        operator: tgt.trim(),
        function: tgt.trim().toLowerCase(),
        startIndex: targetStart,
        endIndex: current - 1,
        depth: statement.depth,
        line: opener.line || 0,
        column: opener.column || 0,
      };
      if (statement.children) statement.children.push(targetNode);
    }

    // Effect: after % parse {action}(param) pairs (multi-pairs)
    if (
      tokens[current] &&
      tokens[current].line === opener.line &&
      tokens[current].value === "%"
    ) {
      const effectStart = current;
      current++;
      let eff = "";
      const params: Record<string, string> = {};
      let firstAction: string | undefined;
      while (current < tokens.length) {
        const ev = tokens[current].value;
        if (
          tokens[current].line !== opener.line ||
          ev === "->" ||
          ev === "::" ||
          ev === ":^:"
        )
          break;
        const val = tokens[current].value || "";
        eff += val;
        // ACTION_BLOCK then OPTION_BLOCK pairs
        const isAction = /\{([^}]+)\}/.test(tokens[current].value || "");
        if (isAction) {
          const m = (tokens[current].value || "").match(/\{([^}]+)\}/);
          const name = m && m[1] ? m[1].trim() : "";
          if (name && !firstAction) firstAction = name;
          // Lookahead for option block
          const next = tokens[current + 1];
          if (next && next.value && /^\(/.test(next.value)) {
            const nv = next.value.replace(/^\(/, "").replace(/\)$/, "").trim();
            params[name] = nv;
            eff += next.value;
            current += 2;
            continue;
          }
        }
        current++;
      }
      const effectNode: CamoASTNode = {
        type: "effect",
        operator: eff.trim(),
        startIndex: effectStart,
        endIndex: current - 1,
        depth: statement.depth,
        line: opener.line || 0,
        column: opener.column || 0,
        action: firstAction,
        parameters: Object.keys(params).length ? params : undefined,
      };
      if (statement.children) statement.children.push(effectNode);
    }

    // Output: after -> {outcome}
    if (
      tokens[current] &&
      tokens[current].line === opener.line &&
      tokens[current].value === "->"
    ) {
      const outStart = current;
      current++;
      let out = "";
      if (tokens[current] && tokens[current].line === opener.line) {
        out = tokens[current].value || "";
        current++;
      }
      const outNode: CamoASTNode = {
        type: "output",
        operator: out.trim(),
        startIndex: outStart,
        endIndex: current - 1,
        depth: statement.depth,
        line: opener.line || 0,
        column: opener.column || 0,
        outcome: out.trim(),
      };
      if (statement.children) statement.children.push(outNode);
    }

    statement.endIndex = current - 1;
    return statement;
  }

  private linkHierarchicalReferences(root: CamoAST): void {
    const stack: CamoASTNode[] = [];
    for (const statement of root.statements) {
      while (stack.length && stack[stack.length - 1].depth >= statement.depth) {
        stack.pop();
      }
      if (stack.length) {
        const parent = stack[stack.length - 1];
        statement.parent = parent;
        parent.children = parent.children || [];
        parent.children.push(statement);
      }
      stack.push(statement);
    }
  }

  private parseDeclaration(
    tokens: Token[],
    current: number
  ): CamoASTNode | undefined {
    if (current >= tokens.length) {
      return undefined;
    }

    const token = tokens[current];
    const declaration: CamoASTNode = {
      type: "declaration",
      operator: token.value || "",
      startIndex: current,
      endIndex: current,
      depth: 0,
      line: token.line || 0,
      column: token.column || 0,
    };

    return declaration;
  }

  private parseTarget(
    tokens: Token[],
    current: number
  ): CamoASTNode | undefined {
    if (current >= tokens.length) {
      return undefined;
    }

    const token = tokens[current];
    const target: CamoASTNode = {
      type: "target",
      operator: token.value || "",
      startIndex: current,
      endIndex: current,
      depth: 0,
      children: [],
      line: token.line || 0,
      column: token.column || 0,
    };

    return target;
  }

  private parseEffect(
    tokens: Token[],
    current: number
  ): CamoASTNode | undefined {
    if (current >= tokens.length) {
      return undefined;
    }

    const token = tokens[current];
    const effect: CamoASTNode = {
      type: "effect",
      operator: token.value || "",
      startIndex: current,
      endIndex: current,
      depth: 0,
      children: [],
      line: token.line || 0,
      column: token.column || 0,
    };

    return effect;
  }

  private parseOutput(
    tokens: Token[],
    current: number
  ): CamoASTNode | undefined {
    if (current >= tokens.length) {
      return undefined;
    }

    const token = tokens[current];
    const output: CamoASTNode = {
      type: "output",
      operator: token.value || "",
      startIndex: current,
      endIndex: current,
      depth: 0,
      children: [],
      line: token.line || 0,
      column: token.column || 0,
    };

    return output;
  }
}
