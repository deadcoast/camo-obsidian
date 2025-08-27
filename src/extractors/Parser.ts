// Define types for CAMO parsing
export type ParseCamoType = "base" | "preset" | "unknown";

export interface CamoParseResult {
  type: ParseCamoType;
  flags: string[];
  metadata: string[];
  content: string;
  preset: string | null;
}

export class CamoParser {
  constructor(
    private readonly languageHint: string,
    private readonly source: string
  ) {}

  // Main parse entry point - content-based parsing
  parse(source: string, languageHint: string): CamoParseResult {
    const lines = source.split("\n");
    let currentLine = 0;

    // Determine input type from language hint
    const type = this.detectType(languageHint);

    const result: CamoParseResult = {
      type,
      flags: [],
      metadata: [],
      content: "",
      preset: null,
    };

    // Parse flags from first line if present
    if (lines[0] && lines[0].trim().startsWith("--")) {
      result.flags = this.parseFlags(lines[0]);
      currentLine = 1;
    }

    // Parse metadata lines
    while (currentLine < lines.length) {
      const line = lines[currentLine].trim();
      if (line.startsWith("::") || line.startsWith(":^:")) {
        result.metadata.push(line);
        currentLine++;
      } else {
        break;
      }
    }

    // Remaining lines are content
    result.content = lines.slice(currentLine).join("\n");

    // Set preset if applicable
    if (languageHint.startsWith("camo-")) {
      result.preset = languageHint.substring(5);
    }

    return result;
  }

  private detectType(language: string): ParseCamoType {
    if (language === "camo") {
      return "base";
    } else if (language.startsWith("camo-")) {
      return "preset";
    }
    return "unknown";
  }

  // Parse flags from content line
  private parseFlags(line: string): string[] {
    return line
      .trim()
      .split(/\s+/)
      .filter((token) => token.startsWith("--"));
  }
}
