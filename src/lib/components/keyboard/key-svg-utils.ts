// =============================================================================
// key-svg-utils — キー SVG 描画のユーティリティ関数
// =============================================================================
// Depends on: (なし)
// Tested by: tests/e2e/ (visual verification)
// Called from: components/keyboard/KeySvg.svelte

/**
 * キー幅・高さに基づくベースフォントサイズを計算する。
 * 1u 以下のキーサイズに対して統一的なスケーリングを適用。
 */
export function calcBaseFontSize(keyWidth: number, keyHeight: number): number {
	return Math.min(keyWidth, keyHeight, 1) * 0.28;
}

/**
 * 複数行ラベルの場合にフォントサイズを縮小する。
 * 全角文字を幅2、半角文字を幅1として見積もり、
 * 視覚幅が4文字を超える場合に比例縮小する。
 */
export function calcFontSize(baseFontSize: number, labelLines: string[]): number {
	if (labelLines.length <= 1) return baseFontSize;
	const maxVisualWidth = Math.max(...labelLines.map(l =>
		[...l].reduce((w, c) => w + (c.charCodeAt(0) > 0x7F ? 2 : 1), 0)
	));
	return maxVisualWidth <= 4 ? baseFontSize : baseFontSize * (5 / maxVisualWidth);
}
