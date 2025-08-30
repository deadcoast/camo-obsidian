import type { Extension } from '@codemirror/state';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { CAMO_SYNTAX_HIGHLIGHTING } from '../core/camoSyntaxHighlighting';

const decoFor = (cls: string) => Decoration.mark({ class: cls });

function classForToken(token: string): string | null {
  const op = new RegExp(CAMO_SYNTAX_HIGHLIGHTING.operators.pattern.source);
  const kw = new RegExp(CAMO_SYNTAX_HIGHLIGHTING.keywords.pattern.source);
  const act = new RegExp(CAMO_SYNTAX_HIGHLIGHTING.actions.pattern.source);
  const vr = new RegExp(CAMO_SYNTAX_HIGHLIGHTING.variables.pattern.source);
  const pr = new RegExp(CAMO_SYNTAX_HIGHLIGHTING.parameters.pattern.source);
  if (op.test(token)) return CAMO_SYNTAX_HIGHLIGHTING.operators.class;
  if (kw.test(token)) return CAMO_SYNTAX_HIGHLIGHTING.keywords.class;
  if (act.test(token)) return CAMO_SYNTAX_HIGHLIGHTING.actions.class;
  if (vr.test(token)) return CAMO_SYNTAX_HIGHLIGHTING.variables.class;
  if (pr.test(token)) return CAMO_SYNTAX_HIGHLIGHTING.parameters.class;
  return null;
}

export function createCamoSyntaxHighlightExtension(): Extension {
  const combined = new RegExp(
    [
      CAMO_SYNTAX_HIGHLIGHTING.operators.pattern.source,
      CAMO_SYNTAX_HIGHLIGHTING.keywords.pattern.source,
      CAMO_SYNTAX_HIGHLIGHTING.actions.pattern.source,
      CAMO_SYNTAX_HIGHLIGHTING.variables.pattern.source,
      CAMO_SYNTAX_HIGHLIGHTING.parameters.pattern.source,
    ].join('|'),
    'g'
  );

  return ViewPlugin.fromClass(
    class {
      decorations: ReturnType<typeof Decoration.set>;

      constructor(view: EditorView) {
        this.decorations = this.buildDecos(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecos(update.view);
        }
      }

      private buildDecos(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        for (const { from, to } of view.visibleRanges) {
          let pos = from;
          while (pos <= to) {
            const line = view.state.doc.lineAt(pos);
            const text = line.text;
            combined.lastIndex = 0;
            let m: RegExpExecArray | null;
            while ((m = combined.exec(text))) {
              const s = line.from + m.index;
              const e = line.from + combined.lastIndex;
              const token = text.slice(m.index, combined.lastIndex);
              const cls = classForToken(token);
              if (cls) builder.add(s, e, decoFor(cls));
            }
            if (line.to + 1 <= to) pos = line.to + 1;
            else break;
          }
        }
        return builder.finish();
      }
    },
    { decorations: v => v.decorations }
  );
}
