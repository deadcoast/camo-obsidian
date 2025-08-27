export enum TokenKind {
  NEWLINE = "NEWLINE",
  HIERARCHICAL = "HIERARCHICAL",
  RELATION = "RELATION",
  OPERATOR = "OPERATOR",
  TRIGGER = "TRIGGER",
  ACTION_BLOCK = "ACTION_BLOCK",
  VARIABLE_BLOCK = "VARIABLE_BLOCK",
  OPTION_BLOCK = "OPTION_BLOCK",
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",
  WHITESPACE = "WHITESPACE",
}

export interface Token {
  type: TokenKind;
  value: string;
  line: number;
  column: number;
}

export class Tokenizer {
  private readonly TOKEN_PATTERNS = {
    NEWLINE: /^::/,
    HIERARCHICAL: /^:\^:/,
    RELATION: /\/\//,
    OPERATOR: /%/,
    TRIGGER: /->/,
    ACTION_BLOCK: /\{([^}]+)\}/,
    VARIABLE_BLOCK: /\[([^\]]+)\]/,
    OPTION_BLOCK: /\(([^)]+)\)/,
    IDENTIFIER: /[a-zA-Z_][a-zA-Z0-9_]*/,
    STRING: /"([^"]+)"|'([^']+)'/,
    NUMBER: /\d+(\.\d+)?/,
    WHITESPACE: /\s+/,
  };

  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let line = 1;
    let column = 1;
    let i = 0;
    const order: Array<keyof typeof this.TOKEN_PATTERNS> = [
      "NEWLINE",
      "HIERARCHICAL",
      "RELATION",
      "OPERATOR",
      "TRIGGER",
      "ACTION_BLOCK",
      "VARIABLE_BLOCK",
      "OPTION_BLOCK",
      "IDENTIFIER",
      "STRING",
      "NUMBER",
      "WHITESPACE",
    ];

    while (i < input.length) {
      if (input[i] === "\n") {
        line++;
        column = 1;
        i++;
        continue;
      }
      const slice = input.slice(i);
      let matched = false;
      for (const k of order) {
        const pattern = this.TOKEN_PATTERNS[k];
        const m = slice.match(pattern);
        if (m && m.index === 0) {
          const value = (m[1] || m[2] || m[0]) as string;
          // Ignore whitespace tokens in output; still advance indices
          if (k !== "WHITESPACE") {
            tokens.push({ type: k as TokenKind, value, line, column });
          }
          i += m[0].length;
          column += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        i++;
        column++;
      }
    }
    return tokens;
  }

  // Helper to reconstruct raw source from token range (inclusive)
  reconstruct(tokens: Token[], startIndex: number, endIndex: number): string {
    if (startIndex < 0 || endIndex < startIndex || endIndex >= tokens.length)
      return "";
    let buf = "";
    for (let i = startIndex; i <= endIndex; i++) buf += tokens[i].value || "";
    return buf;
  }
}
