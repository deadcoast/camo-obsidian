/**
 * Content Parser
 * Advanced content targeting and selection system
 *
 * Based on specifications in Docs/4_camoMetaData.md
 */

export interface ParsedContent {
  fullContent: string;
  selectedContent: string;
  elements: ContentElement[];
  metadata: ContentMetadata;
}

export interface ContentElement {
  type: "text" | "code" | "link" | "header" | "list" | "table" | "image";
  content: string;
  startIndex: number;
  endIndex: number;
  attributes?: Record<string, string>;
  children?: ContentElement[];
}

export interface ContentMetadata {
  totalCharacters: number;
  totalLines: number;
  containsCode: boolean;
  containsLinks: boolean;
  containsHeaders: boolean;
  language?: string;
}

export interface ContentSelector {
  type: "all" | "lines" | "pattern" | "element" | "marked" | "range";
  target: string;
  modifiers?: string[];
}

export class ContentParser {
  private readonly LINE_PATTERNS = {
    header: /^#{1,6}\s+(.+)$/,
    codeBlock: /^```(\w+)?\s*$/,
    link: /\[([^\]]+)\]\(([^)]+)\)/g,
    listItem: /^[\s]*[-*+]\s+(.+)$/,
    orderedList: /^[\s]*\d+\.\s+(.+)$/,
    table: /^\|.*\|$/,
    emphasis: /(\*\*|__)(.*?)\1/g,
    inlineCode: /`([^`]+)`/g,
  };

  private readonly ELEMENT_PATTERNS = {
    sensitiveData:
      /\b(?:api[_-]?key|password|secret|token|credential|auth)\b/gi,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
    ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    phoneNumber: /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s\d{3}-\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  };

  /**
   * Parse content and extract structure
   */
  parseContent(content: string): ParsedContent {
    const lines = content.split("\n");
    const elements = this.extractElements(content);
    const metadata = this.extractMetadata(content, lines);

    return {
      fullContent: content,
      selectedContent: content,
      elements,
      metadata,
    };
  }

  /**
   * Select content based on selector criteria
   */
  selectContent(content: string, selector: ContentSelector): string {
    switch (selector.type) {
      case "all":
        return content;

      case "lines":
        return this.selectLines(content, selector.target);

      case "pattern":
        return this.selectByPattern(content, selector.target);

      case "element":
        return this.selectByElement(content, selector.target);

      case "marked":
        return this.selectMarkedContent(content, selector.target);

      case "range":
        return this.selectRange(content, selector.target);

      default:
        return content;
    }
  }

  /**
   * Select specific lines
   */
  private selectLines(content: string, target: string): string {
    const lines = content.split("\n");

    if (target.includes(":")) {
      // Range selection: "1:5" or "3:end"
      const [start, end] = target.split(":");
      const startIndex = parseInt(start) - 1;
      const endIndex = end === "end" ? lines.length : parseInt(end);

      return lines.slice(startIndex, endIndex).join("\n");
    } else if (target.includes(",")) {
      // Multiple specific lines: "1,3,5"
      const lineNumbers = target.split(",").map((n) => parseInt(n.trim()) - 1);
      return lineNumbers.map((i) => lines[i] || "").join("\n");
    } else {
      // Single line
      const lineIndex = parseInt(target) - 1;
      return lines[lineIndex] || "";
    }
  }

  /**
   * Select content by regex pattern
   */
  private selectByPattern(content: string, pattern: string): string {
    try {
      const regex = new RegExp(pattern, "g");
      const matches = content.match(regex);
      return matches ? matches.join("\n") : "";
    } catch (error) {
      console.warn("Invalid regex pattern:", pattern);
      return "";
    }
  }

  /**
   * Select content by element type
   */
  private selectByElement(content: string, elementType: string): string {
    const elements = this.extractElements(content);
    const matchingElements = elements.filter((el) => el.type === elementType);

    return matchingElements.map((el) => el.content).join("\n");
  }

  /**
   * Select marked/highlighted content
   */
  private selectMarkedContent(content: string, markType: string): string {
    // Look for highlighted text patterns
    const patterns: Record<string, RegExp> = {
      bold: /\*\*(.*?)\*\*/g,
      italic: /\*(.*?)\*/g,
      code: /`(.*?)`/g,
      highlight: /==(.*?)==/g,
    };

    const pattern = patterns[markType];
    if (!pattern) {
      return "";
    }

    const matches = content.match(pattern);
    return matches
      ? matches.map((match) => match.replace(pattern, "$1")).join("\n")
      : "";
  }

  /**
   * Select content by character range
   */
  private selectRange(content: string, range: string): string {
    const [start, end] = range.split(":").map((n) => parseInt(n));
    return content.substring(start, end);
  }

  /**
   * Extract content elements
   */
  private extractElements(content: string): ContentElement[] {
    const elements: ContentElement[] = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const startIndex = content.indexOf(
        line,
        i > 0 ? elements[elements.length - 1]?.endIndex || 0 : 0
      );
      const endIndex = startIndex + line.length;

      // Determine element type
      let type: ContentElement["type"] = "text";

      if (this.LINE_PATTERNS.header.test(line)) {
        type = "header";
      } else if (this.LINE_PATTERNS.codeBlock.test(line)) {
        type = "code";
      } else if (
        this.LINE_PATTERNS.listItem.test(line) ||
        this.LINE_PATTERNS.orderedList.test(line)
      ) {
        type = "list";
      } else if (this.LINE_PATTERNS.table.test(line)) {
        type = "table";
      } else if (this.LINE_PATTERNS.link.test(line)) {
        type = "link";
      }

      elements.push({
        type,
        content: line,
        startIndex,
        endIndex,
      });
    }

    return elements;
  }

  /**
   * Extract content metadata
   */
  private extractMetadata(content: string, lines: string[]): ContentMetadata {
    return {
      totalCharacters: content.length,
      totalLines: lines.length,
      containsCode: this.LINE_PATTERNS.codeBlock.test(content),
      containsLinks: this.LINE_PATTERNS.link.test(content),
      containsHeaders: lines.some((line) =>
        this.LINE_PATTERNS.header.test(line)
      ),
      language: this.detectLanguage(content),
    };
  }

  /**
   * Detect code language from content
   */
  private detectLanguage(content: string): string | undefined {
    const codeBlockMatch = content.match(/^```(\w+)/m);
    return codeBlockMatch ? codeBlockMatch[1] : undefined;
  }

  /**
   * Find sensitive data patterns
   */
  findSensitiveData(
    content: string
  ): Array<{ type: string; matches: string[] }> {
    const sensitiveData: Array<{ type: string; matches: string[] }> = [];

    Object.entries(this.ELEMENT_PATTERNS).forEach(([type, pattern]) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        sensitiveData.push({ type, matches });
      }
    });

    return sensitiveData;
  }

  /**
   * Mask sensitive content
   */
  maskSensitiveContent(content: string, maskChar = "•"): string {
    let maskedContent = content;

    Object.entries(this.ELEMENT_PATTERNS).forEach(([type, pattern]) => {
      maskedContent = maskedContent.replace(pattern, (match) => {
        return maskChar.repeat(match.length);
      });
    });

    return maskedContent;
  }

  /**
   * Split content into chunks
   */
  chunkContent(content: string, maxChunkSize = 1000): string[] {
    if (content.length <= maxChunkSize) {
      return [content];
    }

    const chunks: string[] = [];
    let currentChunk = "";
    const lines = content.split("\n");

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = "";
        }
      }

      if (currentChunk) {
        currentChunk += "\n";
      }
      currentChunk += line;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Parse selector string into ContentSelector
   */
  parseSelector(selectorString: string): ContentSelector {
    // Parse patterns like "content[all]", "text[headers]", "pattern[/regex/]"
    const match = selectorString.match(/^(\w+)\[([^\]]+)\]$/);

    if (!match) {
      return { type: "all", target: "" };
    }

    const [, type, target] = match;

    // Map function names to selector types
    const typeMap: Record<string, ContentSelector["type"]> = {
      content: "all",
      text: "element",
      line: "lines",
      pattern: "pattern",
      marked: "marked",
      range: "range",
    };

    return {
      type: typeMap[type] || "all",
      target: target,
    };
  }

  /**
   * Get content statistics
   */
  getContentStats(content: string): {
    words: number;
    characters: number;
    lines: number;
    paragraphs: number;
    codeBlocks: number;
    links: number;
    headers: number;
  } {
    const lines = content.split("\n");

    return {
      words: content.split(/\s+/).filter((word) => word.length > 0).length,
      characters: content.length,
      lines: lines.length,
      paragraphs: content.split(/\n\s*\n/).length,
      codeBlocks: (content.match(/```/g) || []).length / 2,
      links: (content.match(this.LINE_PATTERNS.link) || []).length,
      headers: lines.filter((line) => this.LINE_PATTERNS.header.test(line))
        .length,
    };
  }
}
