/**
 * Lightweight, HTML-aware markdown post-processor.
 *
 * Why not a full markdown parser? Our AI outputs HTML *with* inline markdown
 * mixed in (e.g. <p>저희 빵의 **소금**과 **버터**</p>). A full markdown parser
 * would re-process the HTML and break it. This pass:
 *  - Splits by HTML tags so we only transform text nodes
 *  - Inside text nodes: converts **bold**, *italic*, __bold__, _italic_,
 *    [text](url), and naked http(s) URLs
 *  - Leaves HTML tags / attributes untouched
 *  - Handles standalone-line **bold** as <h3> (typical AI section header pattern)
 */

const TAG_SPLIT = /(<[^>]+>)/;

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function transformInline(text: string): string {
  return (
    text
      // [text](url)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, t, u) =>
        `<a href="${escapeAttr(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`
      )
      // **bold** (non-greedy, single line)
      .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
      // __bold__
      .replace(/__([^_\n]+?)__/g, '<strong>$1</strong>')
      // *italic*  — must not match ** or *word inside word
      .replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>')
      // _italic_  — similar
      .replace(/(^|[^\w_])_([^_\n]+?)_(?!\w)/g, '$1<em>$2</em>')
      // ~~strike~~
      .replace(/~~([^~\n]+?)~~/g, '<del>$1</del>')
      // `code`
      .replace(/`([^`\n]+?)`/g, '<code>$1</code>')
  );
}

/**
 * Lift lines that are *only* a `**bold**` heading-like marker into <h3>.
 * Operates on the raw text (before tag splitting wouldn't matter because
 * these patterns are only meaningful at line boundaries).
 */
function liftStandaloneBoldHeadings(text: string): string {
  return text.replace(
    /(^|\n)\s*\*\*([^*\n]{1,80})\*\*\s*(?=\n|$)/g,
    (_m, lead, content) => `${lead}<h3>${content}</h3>`
  );
}

/**
 * Promote line-leading `>` to <blockquote> and `## ` / `### ` to headings.
 * Skips any line that already lives inside an HTML block tag (best-effort).
 */
function liftBlockMarkers(text: string): string {
  // Only apply to lines that are not part of an obvious HTML block
  return text
    .split(/\n/)
    .map((line) => {
      const trimmed = line.replace(/^\s+/, '');
      // skip if line begins with a tag
      if (/^</.test(trimmed)) return line;
      const m1 = trimmed.match(/^###\s+(.+)$/);
      if (m1) return `<h3>${m1[1]}</h3>`;
      const m2 = trimmed.match(/^##\s+(.+)$/);
      if (m2) return `<h2>${m2[1]}</h2>`;
      const m3 = trimmed.match(/^>\s+(.+)$/);
      if (m3) return `<blockquote>${m3[1]}</blockquote>`;
      return line;
    })
    .join('\n');
}

export function applyMarkdown(input: string): string {
  if (!input) return '';
  // 1) Standalone-line bold → <h3> (do this before splitting on tags so we
  //    can see line boundaries cleanly)
  let html = liftStandaloneBoldHeadings(input);
  // 2) Block markers
  html = liftBlockMarkers(html);
  // 3) Inline transforms only in text segments (between HTML tags)
  const parts = html.split(TAG_SPLIT);
  return parts
    .map((p, i) => (i % 2 === 1 ? p : transformInline(p)))
    .join('');
}
