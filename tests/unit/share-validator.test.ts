// =============================================================================
// share-validator テスト
// =============================================================================

import { describe, it, expect } from 'vitest';
import { validateShareData } from '$lib/services/share-validator';
import { SHARE_FORMAT_VERSION, MAX_LAYERS } from '$lib/models/constants';
import * as m from '$lib/paraglide/messages';

describe('validateShareData', () => {
	/** 有効な最小 ShareData */
	function validData() {
		return {
			v: 1,
			t: 'ansi-104',
			l: [{ n: 'layer-0', a: {} }]
		};
	}

	// =================================================================
	// 正常系
	// =================================================================

	it('有効な最小 ShareData を受け入れる', () => {
		expect(validateShareData(validData())).toEqual({ valid: true });
	});

	it('アクション付きの ShareData を受け入れる', () => {
		const data = {
			...validData(),
			l: [{ n: 'layer-0', a: { KeyA: { t: 'k', v: 'z' } } }]
		};
		expect(validateShareData(data)).toEqual({ valid: true });
	});

	it('tap-hold アクションを受け入れる', () => {
		const data = {
			...validData(),
			l: [{
				n: 'layer-0',
				a: {
					KeyA: {
						t: 'th',
						vr: 'thp',
						to: 200,
						ho: 150,
						ta: { t: 'k', v: 'a' },
						ha: { t: 'lh', l: 'nav' }
					}
				}
			}]
		};
		expect(validateShareData(data)).toEqual({ valid: true });
	});

	it('j と tt のオプションフィールドを受け入れる', () => {
		const data = { ...validData(), j: true, tt: 300 };
		expect(validateShareData(data)).toEqual({ valid: true });
	});

	it('複数レイヤを受け入れる', () => {
		const data = {
			...validData(),
			l: [
				{ n: 'layer-0', a: {} },
				{ n: 'nav', a: { KeyA: { t: 'k', v: 'h' } } }
			]
		};
		expect(validateShareData(data)).toEqual({ valid: true });
	});

	// =================================================================
	// 異常系: トップレベル
	// =================================================================

	it('null を拒否する', () => {
		const result = validateShareData(null);
		expect(result.valid).toBe(false);
	});

	it('配列を拒否する', () => {
		const result = validateShareData([]);
		expect(result.valid).toBe(false);
	});

	it('v が欠落している場合を拒否する', () => {
		const data = { t: 'ansi-104', l: [{ n: 'layer-0', a: {} }] };
		const result = validateShareData(data);
		expect(result.valid).toBe(false);
		expect(result.error).toBe(m.error_share_invalidFormat());
	});

	it('v が文字列の場合を拒否する', () => {
		const data = { ...validData(), v: '1' };
		expect(validateShareData(data).valid).toBe(false);
	});

	it('v がサポートバージョンより大きい場合を拒否する', () => {
		const data = { ...validData(), v: SHARE_FORMAT_VERSION + 1 };
		const result = validateShareData(data);
		expect(result.valid).toBe(false);
		expect(result.error).toBe(m.error_share_newerVersion());
	});

	it('t が欠落している場合を拒否する', () => {
		const data = { v: 1, l: [{ n: 'layer-0', a: {} }] };
		expect(validateShareData(data).valid).toBe(false);
	});

	it('t が存在しないテンプレートの場合を拒否する', () => {
		const data = { ...validData(), t: 'nonexistent' };
		const result = validateShareData(data);
		expect(result.valid).toBe(false);
		expect(result.error).toBe(m.error_share_unsupportedTemplate());
	});

	it('l が配列でない場合を拒否する', () => {
		const data = { ...validData(), l: {} };
		expect(validateShareData(data).valid).toBe(false);
	});

	it('l が空配列の場合を拒否する', () => {
		const data = { ...validData(), l: [] };
		const result = validateShareData(data);
		expect(result.valid).toBe(false);
		expect(result.error).toBe(m.error_share_layerCountOutOfRange());
	});

	it(`l が ${MAX_LAYERS} レイヤを超える場合を拒否する`, () => {
		const layers = Array.from({ length: MAX_LAYERS + 1 }, (_, i) => ({
			n: `layer-${i}`,
			a: {}
		}));
		const data = { ...validData(), l: layers };
		const result = validateShareData(data);
		expect(result.valid).toBe(false);
		expect(result.error).toBe(m.error_share_layerCountOutOfRange());
	});

	// =================================================================
	// 異常系: レイヤ
	// =================================================================

	it('レイヤ名がない場合を拒否する', () => {
		const data = { ...validData(), l: [{ a: {} }] };
		expect(validateShareData(data).valid).toBe(false);
	});

	it('レイヤ名が不正パターンの場合を拒否する', () => {
		const data = { ...validData(), l: [{ n: 'invalid name!', a: {} }] };
		const result = validateShareData(data);
		expect(result.valid).toBe(false);
		expect(result.error).toBe(m.error_share_invalidLayerName({ name: 'invalid name!' }));
	});

	it('レイヤの actions が配列の場合を拒否する', () => {
		const data = { ...validData(), l: [{ n: 'layer-0', a: [] }] };
		expect(validateShareData(data).valid).toBe(false);
	});

	// =================================================================
	// 異常系: アクション
	// =================================================================

	it('不正なアクション type を拒否する', () => {
		const data = {
			...validData(),
			l: [{ n: 'layer-0', a: { KeyA: { t: 'invalid' } } }]
		};
		expect(validateShareData(data).valid).toBe(false);
	});

	it('key アクションで v が欠落の場合を拒否する', () => {
		const data = {
			...validData(),
			l: [{ n: 'layer-0', a: { KeyA: { t: 'k' } } }]
		};
		expect(validateShareData(data).valid).toBe(false);
	});

	it('layer-while-held で l が欠落の場合を拒否する', () => {
		const data = {
			...validData(),
			l: [{ n: 'layer-0', a: { KeyA: { t: 'lh' } } }]
		};
		expect(validateShareData(data).valid).toBe(false);
	});

	it('tap-hold で vr が不正の場合を拒否する', () => {
		const data = {
			...validData(),
			l: [{
				n: 'layer-0',
				a: {
					KeyA: {
						t: 'th',
						vr: 'invalid',
						to: 200,
						ho: 200,
						ta: { t: 'k', v: 'a' },
						ha: { t: 'x' }
					}
				}
			}]
		};
		expect(validateShareData(data).valid).toBe(false);
	});

	// =================================================================
	// 異常系: オプションフィールド
	// =================================================================

	it('j が boolean でない場合を拒否する', () => {
		const data = { ...validData(), j: 'true' };
		expect(validateShareData(data).valid).toBe(false);
	});

	it('tt が number でない場合を拒否する', () => {
		const data = { ...validData(), tt: '300' };
		expect(validateShareData(data).valid).toBe(false);
	});
});
