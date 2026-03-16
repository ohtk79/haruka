// =============================================================================
// .kbd Preview Highlight — CodeMirror 6 decorations for key tracking
// =============================================================================
// Depends on: (none — external only: @codemirror/state, @codemirror/view)
// Tested by: tests/unit/kbd-highlight.test.ts
// Called from: components/preview/KbdPreview.svelte
// Highlights the selected key's position in the .kbd preview:
//   - Blue bold: key selected
//   - Red bold: key action changed

import { StateField, StateEffect } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';

export type HighlightMode = 'selected' | 'changed';

export interface KbdKeyRange {
	from: number;
	to: number;
	section: 'defsrc' | 'deflayer';
	layerIndex?: number;
}

// =============================================================================
// CodeMirror Extensions
// =============================================================================

/** State effect to set or clear highlight decorations */
export const setHighlights = StateEffect.define<{
	ranges: KbdKeyRange[];
	mode: HighlightMode;
} | null>();

const selectedMark = Decoration.mark({ class: 'cm-kbd-selected' });
const changedMark = Decoration.mark({ class: 'cm-kbd-changed' });

/** State field that manages highlight decorations */
export const highlightField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(decos, tr) {
		// Process highlight effects (takes priority over docChanged)
		for (const effect of tr.effects) {
			if (effect.is(setHighlights)) {
				if (!effect.value || effect.value.ranges.length === 0) {
					return Decoration.none;
				}
				const { ranges, mode } = effect.value;
				const mark = mode === 'selected' ? selectedMark : changedMark;
				const docLen = tr.state.doc.length;
				const validRanges = ranges
					.filter((r) => r.from >= 0 && r.to > r.from && r.to <= docLen)
					.sort((a, b) => a.from - b.from);
				if (validRanges.length === 0) return Decoration.none;
				return Decoration.set(validRanges.map((r) => mark.range(r.from, r.to)));
			}
		}
		// Clear decorations on document change (will be re-applied by $effect)
		if (tr.docChanged) {
			return Decoration.none;
		}
		return decos;
	},
	provide: (f) => EditorView.decorations.from(f)
});

/** Theme for highlight CSS classes */
export const highlightTheme = EditorView.theme({
	'.cm-kbd-selected': {
		color: '#2563eb !important',
		fontWeight: 'bold'
	},
	'.cm-kbd-changed': {
		color: '#dc2626 !important',
		fontWeight: 'bold'
	}
});

// =============================================================================
// Range Finder
// =============================================================================

/** Extract whitespace-delimited tokens with their character positions */
function findTokenPositions(line: string): { text: string; start: number; end: number }[] {
	const tokens: { text: string; start: number; end: number }[] = [];
	const regex = /\S+/g;
	let match;
	while ((match = regex.exec(line)) !== null) {
		tokens.push({ text: match[0], start: match.index, end: match.index + match[0].length });
	}
	return tokens;
}

/**
 * Find character ranges in generated .kbd text for a given kanata key name.
 * Returns ranges in the defsrc block and all deflayer blocks.
 *
 * Algorithm:
 * 1. Locate the kanataName token in defsrc → record its row index & token index
 * 2. For each deflayer, find the token at the same (row, token index) position
 */
export function findKeyRangesInKbd(kbdText: string, kanataName: string): KbdKeyRange[] {
	const lines = kbdText.split('\n');
	const ranges: KbdKeyRange[] = [];

	let targetBlockRow = -1;
	let targetTokenIdx = -1;

	let inBlock: 'defsrc' | 'deflayer' | null = null;
	let blockRowIdx = -1;
	let deflayerCount = -1;
	let lineOffset = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.startsWith('(defsrc')) {
			inBlock = 'defsrc';
			blockRowIdx = -1;
		} else if (line.startsWith('(deflayer')) {
			inBlock = 'deflayer';
			blockRowIdx = -1;
			deflayerCount++;
		} else if (inBlock && line === ')') {
			inBlock = null;
		} else if (inBlock && line.startsWith('  ')) {
			blockRowIdx++;
			const tokens = findTokenPositions(line);

			if (inBlock === 'defsrc') {
				const tokenIdx = tokens.findIndex((t) => t.text === kanataName);
				if (tokenIdx !== -1) {
					targetBlockRow = blockRowIdx;
					targetTokenIdx = tokenIdx;
					ranges.push({
						from: lineOffset + tokens[tokenIdx].start,
						to: lineOffset + tokens[tokenIdx].end,
						section: 'defsrc'
					});
				}
			} else if (
				inBlock === 'deflayer' &&
				blockRowIdx === targetBlockRow &&
				targetTokenIdx >= 0
			) {
				if (targetTokenIdx < tokens.length) {
					const token = tokens[targetTokenIdx];
					ranges.push({
						from: lineOffset + token.start,
						to: lineOffset + token.end,
						section: 'deflayer',
						layerIndex: deflayerCount
					});
				}
			}
		}

		lineOffset += line.length + 1; // +1 for \n
	}

	return ranges;
}
