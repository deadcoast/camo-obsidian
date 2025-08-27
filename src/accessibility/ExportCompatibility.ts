export type ExportPolicy = "reveal" | "mask";

export class ExportCompatibility {
  getPrintStyles(policy: ExportPolicy = "reveal"): string {
    if (policy === "mask") {
      return `
      @media print {
        .camo-effect-redact .camo-content { color: transparent !important; background: repeating-linear-gradient(0deg, #000, #000 8px, transparent 8px, transparent 12px) !important; }
        .camo-trigger-hover .camo-content { opacity: 1 !important; }
        .camo-trigger-click .camo-content { display: block !important; }
      }
      `;
    }
    // default: reveal on print/export for readability
    return `
    @media print {
      .camo-content { opacity: 1 !important; }
      .camo-effect-redact .camo-content { color: inherit !important; background: none !important; }
      .camo-effect-scramble .camo-line::before { content: none !important; }
      .camo-trigger-click .camo-content { display: block !important; }
    }
    `;
  }

  getNoScriptStyles(policy: ExportPolicy = "reveal"): string {
    if (policy === "mask") {
      return `.camo-effect-redact .camo-content { color: transparent !important; background: repeating-linear-gradient(0deg, #000, #000 8px, transparent 8px, transparent 12px) !important; }`;
    }
    return `.camo-content { opacity: 1 !important; } .camo-effect-redact .camo-content { color: inherit !important; background: none !important; }`;
  }

  // Markdown/Publish fallbacks (static rendering)
  markdownFallback(block: { content: string; metadata?: string[] }): string {
    // Preserve original content; optionally prepend a note indicating CAMO
    const head = `> [CAMO] Exported content (metadata not executed)\n\n`;
    return `${head}${block.content}`;
  }

  // Basic HTML fallback for Obsidian Publish (no JS)
  publishFallbackHTML(block: { content: string }): string {
    return `<div class="camo-publish-fallback"><pre>${this.escapeHtml(
      block.content
    )}</pre></div>`;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
