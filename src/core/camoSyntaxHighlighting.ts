export interface SyntaxHighlightingRule {
  pattern: RegExp;
  class: string;
  priority?: number;
}

export interface SyntaxHighlighting {
  operators: SyntaxHighlightingRule;
  keywords: SyntaxHighlightingRule;
  actions: SyntaxHighlightingRule;
  variables: SyntaxHighlightingRule;
  parameters: SyntaxHighlightingRule;
  strings: SyntaxHighlightingRule;
  numbers: SyntaxHighlightingRule;
  comments: SyntaxHighlightingRule;
}

export class CamoSyntaxHighlighter {
  private readonly highlightingRules: SyntaxHighlighting = {
    operators: {
      pattern: /(::|:\^:|\/\/|%|->)/g,
      class: "camo-operator",
      priority: 1,
    },
    keywords: {
      pattern:
        /\b(set|apply|remove|toggle|protect|encrypt|decrypt|authenticate|audit|reveal|hide|mask|redact|select|filter|transform|link|navigate|group|coordinate|store|retrieve|reset|snapshot|save|load|track|IF|ELSE|WHEN|WHILE)\b/g,
      class: "camo-keyword",
      priority: 2,
    },
    actions: {
      pattern: /\{([^}]+)\}/g,
      class: "camo-action",
      priority: 3,
    },
    variables: {
      pattern: /\[([^\]]+)\]/g,
      class: "camo-variable",
      priority: 3,
    },
    parameters: {
      pattern: /\(([^)]+)\)/g,
      class: "camo-parameter",
      priority: 4,
    },
    strings: {
      pattern: /"([^"]+)"|'([^']+)'/g,
      class: "camo-string",
      priority: 5,
    },
    numbers: {
      pattern: /\b\d+(\.\d+)?(px|%|em|rem|s|ms)?\b/g,
      class: "camo-number",
      priority: 5,
    },
    comments: {
      pattern: /\/\*.*?\*\/|\/\/.*$/gm,
      class: "camo-comment",
      priority: 0,
    },
  };

  /**
   * Apply syntax highlighting to camoMetaData text
   */
  highlight(text: string): string {
    let highlightedText = text;
    const appliedHighlights: Array<{
      start: number;
      end: number;
      replacement: string;
    }> = [];

    // Sort rules by priority (higher priority first)
    const rules = Object.entries(this.highlightingRules).sort(
      ([, a], [, b]) => (b.priority || 0) - (a.priority || 0)
    );

    for (const [, rule] of rules) {
      let match;
      rule.pattern.lastIndex = 0; // Reset regex

      while ((match = rule.pattern.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        // Check if this range overlaps with any already applied highlights
        const overlaps = appliedHighlights.some(
          (applied) => start < applied.end && end > applied.start
        );

        if (!overlaps) {
          const replacement = `<span class="${rule.class}">${match[0]}</span>`;
          appliedHighlights.push({ start, end, replacement });
        }
      }
    }

    // Sort highlights by start position (descending) to apply from end to beginning
    appliedHighlights.sort((a, b) => b.start - a.start);

    // Apply highlights
    for (const highlight of appliedHighlights) {
      highlightedText =
        highlightedText.slice(0, highlight.start) +
        highlight.replacement +
        highlightedText.slice(highlight.end);
    }

    return highlightedText;
  }

  /**
   * Get CSS styles for syntax highlighting
   */
  getHighlightingStyles(): string {
    return `
      /* camoMetaData Syntax Highlighting */
      .camo-metadata-highlight {
        font-family: var(--font-monospace);
        font-size: 0.9em;
        line-height: 1.4;
        background: var(--background-secondary);
        padding: 0.5em;
        border-radius: 4px;
        border: 1px solid var(--background-modifier-border);
      }

      .camo-operator {
        color: var(--text-accent);
        font-weight: bold;
      }

      .camo-keyword {
        color: var(--color-purple);
        font-weight: bold;
      }

      .camo-action {
        color: var(--color-blue);
        font-style: italic;
      }

      .camo-variable {
        color: var(--color-green);
      }

      .camo-parameter {
        color: var(--color-orange);
      }

      .camo-string {
        color: var(--color-red);
      }

      .camo-number {
        color: var(--color-cyan);
      }

      .camo-comment {
        color: var(--text-muted);
        font-style: italic;
      }

      /* Dark theme adjustments */
      .theme-dark .camo-operator {
        color: #64B5F6;
      }

      .theme-dark .camo-keyword {
        color: #CE93D8;
      }

      .theme-dark .camo-action {
        color: #81C784;
      }

      .theme-dark .camo-variable {
        color: #FFB74D;
      }

      .theme-dark .camo-parameter {
        color: #F06292;
      }

      .theme-dark .camo-string {
        color: #A5D6A7;
      }

      .theme-dark .camo-number {
        color: #80DEEA;
      }

      /* Light theme adjustments */
      .theme-light .camo-operator {
        color: #1976D2;
      }

      .theme-light .camo-keyword {
        color: #7B1FA2;
      }

      .theme-light .camo-action {
        color: #388E3C;
      }

      .theme-light .camo-variable {
        color: #F57C00;
      }

      .theme-light .camo-parameter {
        color: #C2185B;
      }

      .theme-light .camo-string {
        color: #2E7D32;
      }

      .theme-light .camo-number {
        color: #0097A7;
      }
    `;
  }

  /**
   * Highlight camoMetaData lines in a container
   */
  highlightMetaDataLines(container: HTMLElement): void {
    const textContent = container.textContent || "";
    const lines = textContent.split("\n");
    let hasMetaData = false;

    const highlightedLines = lines.map((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("::") || trimmedLine.startsWith(":^:")) {
        hasMetaData = true;
        return this.highlight(line);
      }
      return line;
    });

    if (hasMetaData) {
      container.innerHTML = highlightedLines.join("\n");
      container.addClass("camo-metadata-highlight");
    }
  }

  /**
   * Create a highlighted preview of camoMetaData
   */
  createHighlightedPreview(metaDataText: string): HTMLElement {
    const previewEl = document.createElement("div");
    previewEl.className = "camo-metadata-preview";
    previewEl.innerHTML = this.highlight(metaDataText);
    return previewEl;
  }

  /**
   * Validate syntax and provide error highlighting
   */
  highlightWithErrors(
    text: string,
    errors: Array<{ line: number; message: string }>
  ): string {
    const lines = text.split("\n");
    const errorLines = new Set(errors.map((e) => e.line));

    const highlightedLines = lines.map((line, index) => {
      const lineNumber = index + 1;
      let highlightedLine = this.highlight(line);

      if (errorLines.has(lineNumber)) {
        highlightedLine = `<span class="camo-error-line">${highlightedLine}</span>`;
      }

      return highlightedLine;
    });

    return highlightedLines.join("\n");
  }
}

// Legacy export for compatibility
export const CAMO_SYNTAX_HIGHLIGHTING: SyntaxHighlighting =
  new CamoSyntaxHighlighter()["highlightingRules"];
