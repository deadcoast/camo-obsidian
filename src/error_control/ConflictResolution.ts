export class ConflictResolution {
  public knownConflicts: Record<string, string> = {
    dataview: "May process CAMO blocks as queries",
    templater: "May interfere with CAMO syntax",
    "advanced-tables": "Table rendering conflicts",
    "cm-editor-syntax-highlight": "Might override CM decorations",
    "obsidian-languagetool-plugin": "May insert DOM spans inside lines",
    "obsidian-latex-suite": "MathJax blocks may conflict with line mapping",
    "obsidian-admonition": "Admonitions wrap content and affect selectors",
    "obsidian-zoom": "Zoom plugin interferes with line element structure",
  };

  public detectConflicts(plugins: string[]): string[] {
    return Object.keys(this.knownConflicts).filter((p) => plugins.includes(p));
  }

  public enableCompatibilityMode(_plugin: string): void {
    // Example conservative toggles; can be extended per plugin id
    const body = document.body;
    if (!body) return;
    body.classList.add("camo-compatibility-mode");
    // Reduce heavy visuals by default when conflicts detected
    body.classList.add("camo-animations-disabled");
  }

  public resolveConflicts(_conflicts: string[]): void {
    const body = document.body;
    if (!body) return;
    const toggle = (cls: string, on = true) => body.classList.toggle(cls, on);

    _conflicts.forEach((id) => {
      switch (id) {
        case "dataview":
          // Avoid relying on CM decorations that Dataview may replace
          toggle("camo-compat-dataview", true);
          break;
        case "templater":
          // Use more resilient selectors (already in code); add class for CSS fallbacks
          toggle("camo-compat-templater", true);
          break;
        case "advanced-tables":
          // Reduce table-row effects by default
          toggle("camo-compat-advanced-tables", true);
          break;
        case "cm-editor-syntax-highlight":
          // Soften decoration conflicts
          toggle("camo-compat-cm-syntax", true);
          break;
        case "obsidian-languagetool-plugin":
          // Disable glitch in reading/editor modes where spans are injected
          toggle("camo-compat-languagetool", true);
          break;
        case "obsidian-latex-suite":
          // Avoid line mapping assumptions when MathJax present
          toggle("camo-compat-math", true);
          break;
        case "obsidian-admonition":
          // Avoid nested container effects
          toggle("camo-compat-admonition", true);
          break;
        case "obsidian-zoom":
          // Disable transitions that may conflict with zoom transformations
          toggle("camo-compat-zoom", true);
          break;
      }
    });
  }
}
