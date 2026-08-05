/* ============================================
   APILens — JSON Editor (CodeMirror wrapper)
   ============================================ */

import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import { highlightSelectionMatches } from '@codemirror/search';

const apiLensTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  '.cm-content': {
    caretColor: '#3B82F6',
    padding: '8px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#3B82F6',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: '#0A0F1E',
    color: '#475569',
    border: 'none',
    borderRight: '1px solid #1E293B',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1E293B',
    color: '#94A3B8',
  },
  '.cm-activeLine': {
    backgroundColor: '#1E293B40',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#3B82F630',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: '#3B82F640',
  },
  '.cm-foldGutter span': {
    color: '#475569',
  },
});

/**
 * Create a CodeMirror JSON editor.
 * @param {HTMLElement} container
 * @param {string} initialValue
 * @param {Object} opts
 * @param {Function} opts.onChange
 * @returns {{ getContent, setContent, formatJSON, destroy }}
 */
export function createJsonEditor(container, initialValue = '', opts = {}) {
  const { onChange = () => {} } = opts;

  const updateListener = EditorView.updateListener.of(update => {
    if (update.docChanged) {
      onChange(update.state.doc.toString());
    }
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        foldGutter(),
        highlightSelectionMatches(),
        json(),
        oneDark,
        apiLensTheme,
        keymap.of([...defaultKeymap, indentWithTab]),
        updateListener,
        EditorView.lineWrapping,
      ],
    }),
    parent: container,
  });

  return {
    getContent() {
      return view.state.doc.toString();
    },
    setContent(text) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
    },
    formatJSON() {
      try {
        const parsed = JSON.parse(view.state.doc.toString());
        const formatted = JSON.stringify(parsed, null, 2);
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: formatted },
        });
      } catch {
        // invalid JSON, do nothing
      }
    },
    destroy() {
      view.destroy();
    },
  };
}
