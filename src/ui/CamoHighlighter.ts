import { CAMO_SYNTAX_HIGHLIGHTING } from '../core/camoSyntaxHighlighting';

export class CamoHighlighter {
  private readonly re = new RegExp(
    [
      CAMO_SYNTAX_HIGHLIGHTING.operators.pattern.source,
      CAMO_SYNTAX_HIGHLIGHTING.keywords.pattern.source,
      CAMO_SYNTAX_HIGHLIGHTING.actions.pattern.source,
      CAMO_SYNTAX_HIGHLIGHTING.variables.pattern.source,
      CAMO_SYNTAX_HIGHLIGHTING.parameters.pattern.source,
    ].join('|'),
    'g'
  );

  highlight(text: string): DocumentFragment {
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    const src = String(text);
    const re = new RegExp(this.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const start = m.index;
      const end = re.lastIndex;
      if (start > lastIdx) frag.appendChild(this.makeText(src.slice(lastIdx, start)));
      const token = src.slice(start, end);
      const cls = this.classFor(token);
      if (cls) frag.appendChild(this.makeSpan(token, cls));
      else frag.appendChild(this.makeText(token));
      lastIdx = end;
    }
    if (lastIdx < src.length) frag.appendChild(this.makeText(src.slice(lastIdx)));
    return frag;
  }

  private classFor(token: string): string | null {
    if (CAMO_SYNTAX_HIGHLIGHTING.operators.pattern.test(token))
      return CAMO_SYNTAX_HIGHLIGHTING.operators.class;
    if (CAMO_SYNTAX_HIGHLIGHTING.keywords.pattern.test(token))
      return CAMO_SYNTAX_HIGHLIGHTING.keywords.class;
    if (CAMO_SYNTAX_HIGHLIGHTING.actions.pattern.test(token))
      return CAMO_SYNTAX_HIGHLIGHTING.actions.class;
    if (CAMO_SYNTAX_HIGHLIGHTING.variables.pattern.test(token))
      return CAMO_SYNTAX_HIGHLIGHTING.variables.class;
    if (CAMO_SYNTAX_HIGHLIGHTING.parameters.pattern.test(token))
      return CAMO_SYNTAX_HIGHLIGHTING.parameters.class;
    return null;
  }

  private makeSpan(text: string, cls: string): HTMLElement {
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = text;
    return span;
  }

  private makeText(text: string): Text {
    return document.createTextNode(text);
  }
}
