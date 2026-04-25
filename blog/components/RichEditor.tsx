'use client';

import { useEffect, useRef } from 'react';
import styles from './RichEditor.module.css';

interface Props {
  value: string;          // HTML content
  onChange: (html: string) => void;
  imageUrls?: string[];   // available image URLs for "사진 삽입" toolbar action
}

/**
 * Lightweight WYSIWYG editor based on contentEditable + execCommand.
 * - Toolbar: bold, italic, h2, h3, blockquote, ul, ol, link, image insert
 * - Markdown shortcuts: typing **bold**, *italic*, > quote, ## heading at line start
 *   gets converted on Enter/Space.
 * - Always emits clean HTML via onChange.
 */
export default function RichEditor({ value, onChange, imageUrls = [] }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef<string>('');

  // Sync external value into the editor only when it actually differs
  // (avoid moving the caret while user is typing)
  useEffect(() => {
    if (!ref.current) return;
    if (value !== lastEmittedRef.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || '';
      lastEmittedRef.current = value;
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastEmittedRef.current = html;
    onChange(html);
  };

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    emit();
  };

  const wrapBlock = (tag: 'h2' | 'h3' | 'blockquote' | 'p') => {
    document.execCommand('formatBlock', false, tag);
    ref.current?.focus();
    emit();
  };

  const insertImage = () => {
    let url = imageUrls[0] || '';
    if (imageUrls.length > 1) {
      const list = imageUrls.map((u, i) => `${i + 1}. ${u.split('/').pop()?.slice(0, 30)}`).join('\n');
      const choice = window.prompt(`삽입할 사진 번호 (1-${imageUrls.length}):\n${list}`, '1');
      if (!choice) return;
      const idx = parseInt(choice, 10) - 1;
      if (Number.isNaN(idx) || idx < 0 || idx >= imageUrls.length) return;
      url = imageUrls[idx];
    } else if (!url) {
      url = window.prompt('이미지 URL') || '';
      if (!url) return;
    }
    document.execCommand('insertHTML', false, `<img src="${url}" alt=""/>`);
    emit();
  };

  const insertLink = () => {
    const url = window.prompt('링크 URL');
    if (!url) return;
    exec('createLink', url);
  };

  // Markdown shortcuts on key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent || '';
    const before = text.slice(0, range.startOffset);

    // Line-start patterns trigger only on Space
    if (e.key === ' ') {
      let blockTag: 'h2' | 'h3' | 'blockquote' | null = null;
      let prefixLen = 0;
      if (before === '##') { blockTag = 'h2'; prefixLen = 2; }
      else if (before === '###') { blockTag = 'h3'; prefixLen = 3; }
      else if (before === '>') { blockTag = 'blockquote'; prefixLen = 1; }
      if (blockTag) {
        e.preventDefault();
        // Remove the marker
        node.textContent = text.slice(prefixLen + 0); // keep rest of text after the marker
        // After removal, set caret to start
        range.setStart(node, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        wrapBlock(blockTag);
        return;
      }
    }
  };

  // Convert pasted plain markdown-ish content to HTML basics
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    if (html) return; // let browser handle rich paste
    if (!text) return;
    e.preventDefault();
    // Simple markdown conversion for plain text paste
    const converted = text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1<em>$2</em>')
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    document.execCommand('insertHTML', false, converted);
    emit();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => exec('bold')} className={styles.tbtn} title="굵게 (Cmd/Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => exec('italic')} className={styles.tbtn} title="기울임 (Cmd/Ctrl+I)">
          <em>I</em>
        </button>
        <span className={styles.divider} />
        <button type="button" onClick={() => wrapBlock('h2')} className={styles.tbtn} title="대제목">H2</button>
        <button type="button" onClick={() => wrapBlock('h3')} className={styles.tbtn} title="중제목">H3</button>
        <button type="button" onClick={() => wrapBlock('p')} className={styles.tbtn} title="본문">¶</button>
        <span className={styles.divider} />
        <button type="button" onClick={() => wrapBlock('blockquote')} className={styles.tbtn} title="인용">❝</button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className={styles.tbtn} title="• 목록">•</button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={styles.tbtn} title="1. 목록">1.</button>
        <span className={styles.divider} />
        <button type="button" onClick={insertLink} className={styles.tbtn} title="링크">🔗</button>
        <button type="button" onClick={insertImage} className={styles.tbtn} title="이미지">🖼️</button>
        <button type="button" onClick={() => exec('removeFormat')} className={styles.tbtn} title="서식 제거">✕</button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={styles.editor}
        onInput={emit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder="본문을 입력하세요... 마크다운 단축키 지원: ## 제목, > 인용, **굵게**, *기울임*"
      />
      <p className={styles.hint}>
        💡 단축키: <code>**굵게**</code> · <code>*기울임*</code> · 줄 시작에 <code>##</code> + Space → H2 · <code>&gt;</code> + Space → 인용
      </p>
    </div>
  );
}
