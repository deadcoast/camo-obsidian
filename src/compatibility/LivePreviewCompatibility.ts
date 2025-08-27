import type { Editor, MarkdownPostProcessorContext } from "obsidian";

export class LivePreviewCompatibility {
  // Handle partial rendering in Live Preview
  handlePartialRender(
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext
  ): void {
    void el;
  }

  // Cursor position awareness
  trackCursorPosition(_editor: Editor): void {
    // no-op stub
  }

  // Source mode fallback
  sourceModeDisplay(source: string): string {
    return source;
  }
}
