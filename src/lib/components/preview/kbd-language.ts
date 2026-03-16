// =============================================================================
// .kbd Syntax Highlight Definition — CodeMirror 6 language support for kanata
// =============================================================================
// Depends on: (none — external only: @codemirror/language)
// Tested by: N/A
// Called from: components/preview/KbdPreview.svelte

import { StreamLanguage, type StreamParser } from '@codemirror/language';

interface KbdState {
	inBlock: boolean;
	blockDepth: number;
}

const kbdParser: StreamParser<KbdState> = {
	startState(): KbdState {
		return { inBlock: false, blockDepth: 0 };
	},

	token(stream, state): string | null {
		// Skip whitespace
		if (stream.eatSpace()) return null;

		// Comments: ;; ...
		if (stream.match(';;')) {
			stream.skipToEnd();
			return 'comment';
		}

		// Single line comment: ;
		if (stream.match(';')) {
			stream.skipToEnd();
			return 'comment';
		}

		// Opening paren
		if (stream.eat('(')) {
			state.blockDepth++;
			state.inBlock = true;
			return 'bracket';
		}

		// Closing paren
		if (stream.eat(')')) {
			state.blockDepth = Math.max(0, state.blockDepth - 1);
			if (state.blockDepth === 0) state.inBlock = false;
			return 'bracket';
		}

		// Keywords
		if (
			stream.match(
				/^(defcfg|defsrc|deflayer|defalias|defvar|deftemplate|defoverrides|deffakekeys)\b/
			)
		) {
			return 'keyword';
		}

		// Action keywords
		if (
			stream.match(
				/^(tap-hold|tap-hold-press|tap-hold-release|layer-while-held|layer-switch|process-unmapped-keys)\b/
			)
		) {
			return 'keyword';
		}

		// Alias reference @name
		if (stream.eat('@')) {
			stream.match(/^[a-zA-Z0-9_-]+/);
			return 'variableName';
		}

		// Numbers
		if (stream.match(/^[0-9]+\b/)) {
			return 'number';
		}

		// Special tokens
		if (stream.match(/^(yes|no|true|false)\b/)) {
			return 'atom';
		}

		// Underscore (transparent)
		if (stream.match(/^_\b/)) {
			return 'atom';
		}

		// XX (no-op)
		if (stream.match(/^XX\b/)) {
			return 'atom';
		}

		// Any other word
		stream.match(/^[^\s()]+/);
		return null;
	}
};

export const kbdLanguage = StreamLanguage.define(kbdParser);
