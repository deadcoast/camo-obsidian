export interface Suggestion {
  text: string;
  type: 'keyword' | 'function' | 'action' | 'parameter' | 'variable' | 'outcome';
  description?: string;
  insertText?: string;
  detail?: string;
}

export interface EditorContext {
  line: number;
  column: number;
  prefix: string;
  currentLine: string;
  position: number;
}

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  insertText: string;
  documentation?: string;
  detail?: string;
  filterText?: string;
  sortText?: string;
}

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export class CamoAutocomplete {
  private readonly keywordSuggestions: CompletionItem[] = [
    {
      label: 'set',
      kind: CompletionItemKind.Keyword,
      insertText: 'set[${1:property}] // ${2:target} % ${3:action} -> ${4:outcome}',
      documentation: 'Set a visual property (background, color, opacity, blur, etc.)',
      detail: 'Visual property modifier',
    },
    {
      label: 'apply',
      kind: CompletionItemKind.Keyword,
      insertText: 'apply[${1:effect}] // ${2:target} % ${3:parameters} -> ${4:outcome}',
      documentation: 'Apply an effect or transformation',
      detail: 'Effect applicator',
    },
    {
      label: 'protect',
      kind: CompletionItemKind.Keyword,
      insertText: 'protect[${1:type}] // ${2:target} % ${3:method} -> ${4:outcome}',
      documentation: 'Apply security protection measures',
      detail: 'Security operation',
    },
    {
      label: 'reveal',
      kind: CompletionItemKind.Keyword,
      insertText: 'reveal[${1:condition}] // ${2:target} % ${3:trigger} -> ${4:outcome}',
      documentation: 'Set reveal conditions and triggers',
      detail: 'Visibility control',
    },
  ];

  private readonly functionSuggestions: CompletionItem[] = [
    {
      label: 'content[all]',
      kind: CompletionItemKind.Function,
      insertText: 'content[all]',
      documentation: 'Select all content in the block',
      detail: 'Content selector',
    },
    {
      label: 'content[lines:1-5]',
      kind: CompletionItemKind.Function,
      insertText: 'content[lines:${1:1}-${2:5}]',
      documentation: 'Select specific line range',
      detail: 'Line range selector',
    },
    {
      label: 'text[headers]',
      kind: CompletionItemKind.Function,
      insertText: 'text[${1:headers}]',
      documentation: 'Select text elements of specific type',
      detail: 'Text selector',
    },
  ];

  private readonly actionSuggestions: CompletionItem[] = [
    {
      label: '{blur}',
      kind: CompletionItemKind.Value,
      insertText: '{blur}(${1:intensity})',
      documentation: 'Apply blur effect with specified intensity',
      detail: 'Visual effect',
    },
    {
      label: '{fade}',
      kind: CompletionItemKind.Value,
      insertText: '{fade}(${1:opacity})',
      documentation: 'Apply fade effect with opacity control',
      detail: 'Visual effect',
    },
  ];

  private readonly snippetSuggestions: CompletionItem[] = [
    {
      label: 'basic-blur',
      kind: CompletionItemKind.Snippet,
      insertText: ':: set[blur] // content[all] % {intensity}(${1:60}) -> {visual[blurred]}',
      documentation: 'Basic blur effect on all content',
      detail: 'Complete statement',
    },
  ];

  /**
   * Get autocompletion suggestions based on current context
   */
  getSuggestions(context: EditorContext): CompletionItem[] {
    const { currentLine, position, prefix } = context;
    const lineUpToCursor = currentLine.substring(0, position);

    if (this.isAfterOperator(lineUpToCursor, '::') || this.isAfterOperator(lineUpToCursor, ':^:')) {
      return this.filterSuggestions(this.keywordSuggestions, prefix);
    }

    if (this.isAfterOperator(lineUpToCursor, '//')) {
      return this.filterSuggestions(this.functionSuggestions, prefix);
    }

    if (this.isInBraces(lineUpToCursor, '{', '}')) {
      return this.filterSuggestions(this.actionSuggestions, prefix);
    }

    return [
      ...this.filterSuggestions(this.snippetSuggestions, prefix),
      ...this.filterSuggestions(this.keywordSuggestions, prefix),
    ];
  }

  private isAfterOperator(text: string, operator: string): boolean {
    const lastOperatorIndex = text.lastIndexOf(operator);
    if (lastOperatorIndex === -1) return false;

    const structuralOperators = ['::', ':^:', '//', '%', '->'];
    const afterOperator = text.substring(lastOperatorIndex + operator.length);

    return !structuralOperators.some(op => afterOperator.includes(op));
  }

  private isInBraces(text: string, openBrace: string, closeBrace: string): boolean {
    let braceCount = 0;
    let inBraces = false;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === openBrace) {
        braceCount++;
        inBraces = true;
      } else if (text[i] === closeBrace) {
        braceCount--;
        if (braceCount === 0) {
          inBraces = false;
        }
      }
    }

    return inBraces && braceCount > 0;
  }

  private filterSuggestions(suggestions: CompletionItem[], prefix: string): CompletionItem[] {
    if (!prefix.trim()) return suggestions;

    const lowerPrefix = prefix.toLowerCase();
    return suggestions
      .filter(
        suggestion =>
          suggestion.label.toLowerCase().includes(lowerPrefix) ||
          suggestion.filterText?.toLowerCase().includes(lowerPrefix)
      )
      .sort((a, b) => {
        const aStarts = a.label.toLowerCase().startsWith(lowerPrefix);
        const bStarts = b.label.toLowerCase().startsWith(lowerPrefix);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.label.localeCompare(b.label);
      });
  }

  getTemplateSuggestions(): CompletionItem[] {
    return this.snippetSuggestions;
  }
}
