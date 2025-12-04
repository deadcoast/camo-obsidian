import type { Editor, EditorPosition, MarkdownPostProcessorContext } from 'obsidian';

export class LivePreviewCompatibility {
  private currentEditingBlock: string | null = null;
  private lastCursorPosition: EditorPosition | null = null;

  /**
   * Handle partial rendering in Live Preview
   * Live Preview only renders visible portions - must handle incremental updates
   */
  handlePartialRender(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    // Check if this block is currently being edited
    const blockId = el.getAttribute('data-camo-id');
    if (this.currentEditingBlock === blockId) {
      // Skip reprocessing for block currently being edited
      return;
    }

    // Add Live Preview specific classes for styling
    el.addClass('camo-live-preview');

    // Ensure block is marked for incremental updates
    el.setAttribute('data-live-preview', 'true');

    // Handle partial content updates
    const sectionInfo = ctx.getSectionInfo(el);
    if (sectionInfo) {
      // Store section info for incremental updates
      el.setAttribute('data-section-start', sectionInfo.lineStart.toString());
      el.setAttribute('data-section-end', sectionInfo.lineEnd.toString());
    }
  }

  /**
   * Cursor position awareness
   * Don't reprocess block being edited; maintain state during editing
   */
  trackCursorPosition(editor: Editor): void {
    try {
      const cursor = editor.getCursor();
      this.lastCursorPosition = cursor;

      // Find which CAMO block (if any) contains the cursor
      const currentBlockId = this.findBlockAtPosition(editor, cursor);

      if (currentBlockId !== this.currentEditingBlock) {
        // Clear previous editing block
        if (this.currentEditingBlock) {
          this.clearEditingState(this.currentEditingBlock);
        }

        // Set new editing block
        this.currentEditingBlock = currentBlockId;

        if (currentBlockId) {
          this.setEditingState(currentBlockId);
        }
      }
    } catch (error) {
      console.warn('CAMO: Error tracking cursor position:', error);
    }
  }

  /**
   * Source mode fallback
   * Show readable format in source mode while preserving CAMO syntax visibility
   */
  sourceModeDisplay(source: string): string {
    // In source mode, we want to show the CAMO syntax clearly
    // but make it more readable

    // Add syntax highlighting hints as HTML comments
    let processed = source;

    // Highlight preset triggers
    processed = processed.replace(/```(camo-[a-z0-9-]+)/g, '```$1 <!-- CAMO Preset: $1 -->');

    // Highlight base camo blocks
    processed = processed.replace(/```camo\b/g, '```camo <!-- CAMO Base Block -->');

    // Highlight camoMetaData syntax
    processed = processed.replace(
      /^(::|\s*::\^:)\s*(.+)$/gm,
      '$1 $2 <!-- camoMetaData instruction -->'
    );

    // Highlight flag syntax
    processed = processed.replace(/^--([a-z-]+)(:.*)?$/gm, '--$1$2 <!-- CAMO flag -->');

    return processed;
  }

  /**
   * Find CAMO block at the given cursor position
   */
  private findBlockAtPosition(editor: Editor, cursor: EditorPosition): string | null {
    try {
      // Get line content at cursor
      const line = editor.getLine(cursor.line);

      // Check if cursor is in a CAMO block by scanning backwards for opening
      let startLine = cursor.line;
      let foundStart = false;
      let blockType = '';

      // Scan backwards to find block start
      while (startLine >= 0 && !foundStart) {
        const lineContent = editor.getLine(startLine);
        const camoMatch = lineContent.match(/```(camo(?:-[a-z0-9-]+)?)/);
        if (camoMatch) {
          foundStart = true;
          blockType = camoMatch[1];
          break;
        }
        startLine--;
      }

      if (!foundStart) return null;

      // Scan forwards to find block end
      let endLine = cursor.line;
      let foundEnd = false;
      const totalLines = editor.lineCount();

      while (endLine < totalLines && !foundEnd) {
        const lineContent = editor.getLine(endLine);
        if (lineContent.trim() === '```' && endLine > startLine) {
          foundEnd = true;
          break;
        }
        endLine++;
      }

      if (!foundEnd) return null;

      // Generate block ID from position and type
      return `${blockType}-${startLine}-${endLine}`;
    } catch (error) {
      console.warn('CAMO: Error finding block at position:', error);
      return null;
    }
  }

  /**
   * Mark block as currently being edited
   */
  private setEditingState(blockId: string): void {
    const elements = document.querySelectorAll(`[data-camo-id*="${blockId}"]`);
    elements.forEach(el => {
      el.addClass('camo-editing');
      el.setAttribute('data-editing', 'true');
    });
  }

  /**
   * Clear editing state from block
   */
  private clearEditingState(blockId: string): void {
    const elements = document.querySelectorAll(`[data-camo-id*="${blockId}"]`);
    elements.forEach(el => {
      el.removeClass('camo-editing');
      el.removeAttribute('data-editing');
    });
  }

  /**
   * Check if a block is currently being edited
   */
  isBlockBeingEdited(blockId: string): boolean {
    return this.currentEditingBlock === blockId;
  }

  /**
   * Get current cursor position
   */
  getCurrentCursorPosition(): EditorPosition | null {
    return this.lastCursorPosition;
  }

  /**
   * Force refresh of editing state
   */
  refreshEditingState(editor: Editor): void {
    this.trackCursorPosition(editor);
  }
}
