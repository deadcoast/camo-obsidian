import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from 'obsidian';
import { CamoAutocomplete } from '../core/camoAutoComplete';

export class CamoMetaSuggest extends EditorSuggest<string> {
  private readonly ac = new CamoAutocomplete();

  constructor(app: App) {
    super(app);
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    _file: TFile | null
  ): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line) || '';
    const prefix = line.slice(0, cursor.ch);
    if (!prefix) return null;
    // Trigger inside camo blocks heuristically: line starts with :: or contains // or {
    if (/::|:\^:|\/\/|\{/.test(prefix)) {
      return {
        start: {
          line: cursor.line,
          ch: Math.max(0, prefix.lastIndexOf(' ') + 1),
        },
        end: cursor,
        query: prefix,
      };
    }
    return null;
  }

  getSuggestions(context: EditorSuggestContext): string[] | Promise<string[]> {
    const currentLine = context.editor.getLine(context.start.line) || '';
    const list = this.ac.getSuggestions({
      line: context.start.line,
      column: context.start.ch,
      prefix: context.query,
      currentLine: currentLine,
      position: context.start.ch,
    });
    return list.map(s => s.label);
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.addClass('camo-suggest-item');
    el.setText(value);
  }

  selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) return;
    const { editor, start, end } = this.context;
    editor.replaceRange(value, start, end);
    // Position cursor at end of inserted text
    const pos: EditorPosition = {
      line: start.line,
      ch: start.ch + value.length,
    };
    editor.setCursor(pos);
  }
}
