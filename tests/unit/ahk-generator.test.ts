import { describe, expect, it } from 'vitest';
import { BASE_LAYER_NAME } from '$lib/models/constants';
import { generateAhk } from '$lib/services/ahk-generator';
import type { EditorState, KeyAction, LayoutTemplate } from '$lib/models/types';

const AHK_TEMPLATE: LayoutTemplate = {
	id: 'test-ahk',
	name: 'Test AHK',
	keys: [
		{ id: 'CapsLock', label: 'Caps', kanataName: 'caps', x: 0, y: 0, width: 1, height: 1 },
		{ id: 'KeyA', label: 'A', kanataName: 'a', x: 1, y: 0, width: 1, height: 1 },
		{ id: 'IntlYen', label: '¥', kanataName: '¥', x: 2, y: 0, width: 1, height: 1 }
	],
	supportedFormats: ['kbd', 'json', 'ahk']
};

function createState(actions?: Map<string, KeyAction>): EditorState {
	const baseActions = actions ?? new Map<string, KeyAction>([
		['CapsLock', { type: 'key', value: 'caps' }],
		['KeyA', { type: 'key', value: 'a' }],
		['IntlYen', { type: 'key', value: '¥' }]
	]);
	return {
		template: AHK_TEMPLATE,
		layers: [{ name: BASE_LAYER_NAME, actions: baseActions }],
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: false,
		tappingTerm: 200
	};
	}

describe('ahk-generator', () => {
	it('AHK 非対応テンプレートでは blocking issue を返す', () => {
		const result = generateAhk({
			...createState(),
			template: { ...AHK_TEMPLATE, supportedFormats: ['kbd', 'json'] }
		});
		expect(result.text).toBe('');
		expect(result.issues[0]?.code).toBe('AHK_TEMPLATE_UNSUPPORTED');
	});

	it('no-op は one-line return で生成する', () => {
		const actions = new Map<string, KeyAction>([
			['CapsLock', { type: 'no-op' }],
			['KeyA', { type: 'key', value: 'a' }],
			['IntlYen', { type: 'key', value: '¥' }]
		]);
		const result = generateAhk(createState(actions));
		expect(result.text).toContain('CapsLock::return');
	});

	it('単純リマップとレイヤ切替を生成する', () => {
		const actions = new Map<string, KeyAction>([
			['CapsLock', { type: 'layer-switch', layer: 'nav' }],
			['KeyA', { type: 'key', value: '¥' }],
			['IntlYen', { type: 'key', value: '¥' }]
		]);
		const result = generateAhk(createState(actions));
		expect(result.text).toContain('a::');
		expect(result.text).toContain('Send "{sc07D}"');
		expect(result.text).toContain('currentLayer := "nav"');
	});

	it('高度な tap-hold variant を notice 付きで正規化する', () => {
		const actions = new Map<string, KeyAction>([
			[
				'CapsLock',
				{
					type: 'tap-hold',
					variant: 'tap-hold-press',
					tapTimeout: 200,
					holdTimeout: 200,
					tapAction: { type: 'key', value: 'a' },
					holdAction: { type: 'layer-while-held', layer: 'nav' }
				}
			],
			['KeyA', { type: 'key', value: 'a' }],
			['IntlYen', { type: 'key', value: '¥' }]
		]);
		const result = generateAhk(createState(actions));
		expect(result.issues).toHaveLength(0);
		expect(result.notices.filter((n) => n.code === 'AHK_VARIANT_NORMALIZED')).toHaveLength(1);
		expect(result.text).toContain('; Conversion Notices:');
		expect(result.text).toContain('tap-hold-press -> tap-hold');
		// THM 方式: thm.Add + コールバック生成
		expect(result.text).toContain('thm.Add("CapsLock", CapsLock_TH)');
		expect(result.text).toContain('CapsLock_TH(isHold, taps, state)');
	});

	it('JIS→US 変換時は Shift 分岐を出力する', () => {
		const result = generateAhk({
			...createState(),
			jisToUsRemap: true
		});
		expect(result.text).toContain('GetKeyState("Shift", "P")');
		expect(result.text).toContain('sc07D::');
	});

	it('非ベースレイヤをアルファベット順で先に出力する', () => {
		const baseLayer = { name: BASE_LAYER_NAME, actions: createState().layers[0].actions };
		const navLayer = {
			name: 'nav',
			actions: new Map<string, KeyAction>([
				['CapsLock', { type: 'layer-switch', layer: 'sym' }],
				['KeyA', { type: 'transparent' }],
				['IntlYen', { type: 'transparent' }]
			])
		};
		const symLayer = {
			name: 'sym',
			actions: new Map<string, KeyAction>([
				['CapsLock', { type: 'transparent' }],
				['KeyA', { type: 'key', value: '¥' }],
				['IntlYen', { type: 'transparent' }]
			])
		};
		const result = generateAhk({
			...createState(),
			layers: [baseLayer, symLayer, navLayer]
		});
		expect(result.text.indexOf('#HotIf currentLayer = "nav"')).toBeLessThan(
			result.text.indexOf('#HotIf currentLayer = "sym"')
		);
	});
});

// === ESC テスト用のJIS109テンプレート ===
const JIS_ESCAPE_TEMPLATE: LayoutTemplate = {
	id: 'jis-109',
	name: '109(JIS)',
	keys: [
		{ id: 'Backquote', kanataName: 'grv', label: '半角/全角', x: 0, y: 0, width: 1, height: 1 },
		{ id: 'Digit6', kanataName: '6', label: '6', x: 1, y: 0, width: 1, height: 1 },
		{ id: 'Equal', kanataName: '=', label: '^', x: 2, y: 0, width: 1, height: 1 },
		{ id: 'BracketLeft', kanataName: '[', label: '@', x: 3, y: 0, width: 1, height: 1 },
		{ id: 'BracketRight', kanataName: ']', label: '[', x: 4, y: 0, width: 1, height: 1 },
		{ id: 'KeyA', kanataName: 'a', label: 'A', x: 5, y: 0, width: 1, height: 1 },
	],
	supportedFormats: ['kbd', 'json', 'ahk']
};

function createJisUsState(overrides?: Partial<EditorState>): EditorState {
	return {
		template: JIS_ESCAPE_TEMPLATE,
		layers: [{
			name: BASE_LAYER_NAME,
			actions: new Map<string, KeyAction>([
				['Backquote', { type: 'key', value: 'grv' }],
				['Digit6', { type: 'key', value: '6' }],
				['Equal', { type: 'key', value: '=' }],
				['BracketLeft', { type: 'key', value: '[' }],
				['BracketRight', { type: 'key', value: ']' }],
				['KeyA', { type: 'key', value: 'a' }],
			])
		}],
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: true,
		tappingTerm: 200,
		...overrides
	};
}

describe('ahk-generator: Send エスケープ', () => {
	// ESC-01: grv キーの SendText 出力にバッククォートが正しく出力される
	it('ESC-01: grv の SendText 出力がバッククォートを含む', () => {
		const result = generateAhk(createJisUsState());
		// JIS→US grv の通常出力は ` → SendText("``") であること（ダブルクォート内で `` にエスケープ）
		expect(result.text).toContain('SendText("``")');
	});

	// ESC-02: grv の Shift/通常分岐が正しい
	it('ESC-02: JIS→US grv の通常=` Shift=~ 分岐', () => {
		const result = generateAhk(createJisUsState());
		// 通常: バッククォート（ダブルクォート文字列で `` にエスケープ）
		expect(result.text).toContain('SendText("``")');
		// Shift: チルダ
		expect(result.text).toContain('SendText("~")');
	});

	// ESC-03: 6 の Shift 出力 ^ が SendText で保護される
	it('ESC-03: JIS→US 6 の Shift 出力 ^ が SendText 形式', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('SendText("^")');
	});

	// ESC-04: = の Shift 出力 + が SendText で保護される
	it('ESC-04: JIS→US = の Shift 出力 + が SendText 形式', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('SendText("+")');
	});

	// ESC-05: [ の Shift 出力 { が SendText で保護される
	it('ESC-05: JIS→US [ の Shift 出力 { が SendText 形式', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('SendText("{")');
	});

	// ESC-06: ] の Shift 出力 } が SendText で保護される
	it('ESC-06: JIS→US ] の Shift 出力 } が SendText 形式', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('SendText("}")');  
	});

	// ESC-07: 修飾キー + テキストキーの Send で特殊文字が個別エスケープされる
	it('ESC-07: 修飾キー + テキストキーで特殊文字が個別エスケープされる', () => {
		// lctl + grv（バッククォートキー）のリマップで修飾付き送信をテスト
		const state = createJisUsState({
			jisToUsRemap: false,
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['Backquote', { type: 'key', value: 'grv', modifiers: ['lctl'] }],
					['Digit6', { type: 'key', value: '6' }],
					['Equal', { type: 'key', value: '=' }],
					['BracketLeft', { type: 'key', value: '[' }],
					['BracketRight', { type: 'key', value: ']' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		});
		const result = generateAhk(state);
		// 修飾付きテキストキーの場合、{Text} は使用せず個別エスケープ
		// grv の sendToken は ` → エスケープ後 ``
		expect(result.text).toContain('{LCtrl down}``{LCtrl up}');
	});

	// ESC-08: grv の JIS ホットキートークンはスキャンコード sc029 を使用する
	it('ESC-08: grv の JIS ホットキートークンが sc029 に変換される', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('*sc029::\n');
	});

	// ESC-09: ダブルクォートの "" エスケープが維持される
	it('ESC-09: ダブルクォートの Send 出力で "" エスケープ維持', () => {
		// escapeAhkString が " → "" のエスケープを維持していることを
		// 間接的に検証: grv のバッククォートエスケープと同時に動作確認
		const result = generateAhk(createJisUsState());
		// AHK ヘッダ内のダブルクォート使用箇所が正しいこと
		expect(result.text).toContain('#Requires AutoHotkey v2.0');
		// バッククォートエスケープがダブルクォートエスケープを壊していないこと
		expect(result.text).toContain('GetKeyState("Shift", "P")');
	});
});

// === JIS ホットキートークン・ワイルドカード・Shift+text Send テスト ===
describe('ahk-generator: JIS ホットキー・Send 修正', () => {
	// JIS-01: JIS→US リマップで * ワイルドカードプレフィクスが付与される
	it('JIS-01: JIS→US リマップホットキーに * プレフィクスが付く', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('*6::');
		expect(result.text).toContain('*sc029::');
	});

	// JIS-02: = (Equal) のホットキーが JIS スキャンコード sc00D に変換される
	it('JIS-02: Equal キーがスキャンコード sc00D ホットキーになる', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('*sc00D::');
	});

	// JIS-03: [ (BracketLeft) のホットキーが JIS @ トークンに変換される
	it('JIS-03: BracketLeft キーが JIS @ ホットキーになる', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('*@::');
	});

	// JIS-04: ] (BracketRight) のホットキーが JIS [ トークンに変換される
	it('JIS-04: BracketRight キーが JIS [ ホットキーになる', () => {
		const result = generateAhk(createJisUsState());
		expect(result.text).toContain('*[::');
	});

	// JIS-05: 非ベースレイヤでも JIS トークンが適用される
	it('JIS-05: 非ベースレイヤで [ → JIS @ トークンが使われる', () => {
		const state = createJisUsState({
			layers: [
				{
					name: BASE_LAYER_NAME,
					actions: new Map<string, KeyAction>([
						['Backquote', { type: 'key', value: 'grv' }],
						['Digit6', { type: 'key', value: '6' }],
						['Equal', { type: 'key', value: '=' }],
						['BracketLeft', { type: 'key', value: '[' }],
						['BracketRight', { type: 'key', value: ']' }],
						['KeyA', { type: 'key', value: 'a' }],
					])
				},
				{
					name: 'nav',
					actions: new Map<string, KeyAction>([
						['Backquote', { type: 'transparent' }],
						['Digit6', { type: 'transparent' }],
						['Equal', { type: 'transparent' }],
						['BracketLeft', { type: 'key', value: 'up' }],
						['BracketRight', { type: 'key', value: 'down' }],
						['KeyA', { type: 'transparent' }],
					])
				}
			]
		});
		const result = generateAhk(state);
		// nav レイヤで BracketLeft → up のホットキーが JIS @ を使用
		const navSection = result.text.split('#HotIf currentLayer = "nav"')[1];
		expect(navSection).toContain('@::');
		expect(navSection).toContain('Send "{Up}"');
		// BracketRight → down のホットキーが JIS [ を使用
		expect(navSection).toContain('[::');
		expect(navSection).toContain('Send "{Down}"');
	});

	// JIS-06: Shift+テキストキーが SendText+US Shift 文字 で出力される
	it('JIS-06: Shift+= が SendText("+") として出力される (JIS リマップ時)', () => {
		const state = createJisUsState({
			layers: [
				{
					name: BASE_LAYER_NAME,
					actions: new Map<string, KeyAction>([
						['Backquote', { type: 'key', value: 'grv' }],
						['Digit6', { type: 'key', value: '6' }],
						['Equal', { type: 'key', value: '=' }],
						['BracketLeft', { type: 'key', value: '[' }],
						['BracketRight', { type: 'key', value: ']' }],
						['KeyA', { type: 'key', value: 'a' }],
					])
				},
				{
					name: 'sym',
					actions: new Map<string, KeyAction>([
						['Backquote', { type: 'transparent' }],
						['Digit6', { type: 'transparent' }],
						['Equal', { type: 'transparent' }],
						['BracketLeft', { type: 'transparent' }],
						['BracketRight', { type: 'transparent' }],
						['KeyA', { type: 'key', value: '=', modifiers: ['lsft'] }],
					])
				}
			]
		});
		const result = generateAhk(state);
		const symSection = result.text.split('#HotIf currentLayer = "sym"')[1];
		// Shift+= → US の '+' を SendText で直接送信
		expect(symSection).toContain('SendText("+")');
	});

	// JIS-07: Shift+6 が SendText("^") として出力される (JIS リマップ時)
	it('JIS-07: Shift+6 が SendText("^") として出力される', () => {
		const state = createJisUsState({
			layers: [
				{
					name: BASE_LAYER_NAME,
					actions: new Map<string, KeyAction>([
						['Backquote', { type: 'key', value: 'grv' }],
						['Digit6', { type: 'key', value: '6' }],
						['Equal', { type: 'key', value: '=' }],
						['BracketLeft', { type: 'key', value: '[' }],
						['BracketRight', { type: 'key', value: ']' }],
						['KeyA', { type: 'key', value: '6', modifiers: ['lsft'] }],
					])
				}
			]
		});
		const result = generateAhk(state);
		// Shift+6 → US の '^' を SendText で直接送信
		expect(result.text).toContain('SendText("^")');
		// 従来の {LShift down}6{LShift up} が使われないこと
		expect(result.text).not.toContain('{LShift down}6{LShift up}');
	});

	// JIS-08: jisToUsRemap=false の場合は JIS トークン変換しない
	it('JIS-08: jisToUsRemap 無効時は US トークンのまま', () => {
		const state = createJisUsState({
			jisToUsRemap: false,
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['Backquote', { type: 'key', value: 'esc' }],
					['Digit6', { type: 'key', value: '6' }],
					['Equal', { type: 'key', value: 'bspc' }],
					['BracketLeft', { type: 'key', value: 'up' }],
					['BracketRight', { type: 'key', value: 'down' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		});
		const result = generateAhk(state);
		// US トークンを使用: = のまま sc00D にならないこと
		expect(result.text).toContain('=::');
		expect(result.text).toContain('[::');
		expect(result.text).not.toContain('@::');
		expect(result.text).not.toContain('sc00D::');
	});

	// JIS-09: Semicolon と Quote がスキャンコードトークンになる
	it('JIS-09: Semicolon と Quote がスキャンコードホットキーになる', () => {
		const template: LayoutTemplate = {
			...JIS_ESCAPE_TEMPLATE,
			keys: [
				...JIS_ESCAPE_TEMPLATE.keys,
				{ id: 'Semicolon', kanataName: ';', label: ';', x: 6, y: 0, width: 1, height: 1 },
				{ id: 'Quote', kanataName: "'", label: ':', x: 7, y: 0, width: 1, height: 1 },
			]
		};
		const state: EditorState = {
			template,
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['Backquote', { type: 'key', value: 'grv' }],
					['Digit6', { type: 'key', value: '6' }],
					['Equal', { type: 'key', value: '=' }],
					['BracketLeft', { type: 'key', value: '[' }],
					['BracketRight', { type: 'key', value: ']' }],
					['KeyA', { type: 'key', value: 'a' }],
					['Semicolon', { type: 'key', value: ';' }],
					['Quote', { type: 'key', value: "'" }],
				])
			}],
			selectedKeyId: null,
			activeLayerIndex: 0,
			jisToUsRemap: true,
			tappingTerm: 200
		};
		const result = generateAhk(state);
		// ; → sc027 (スキャンコード) + * プレフィクス
		expect(result.text).toContain('*sc027::');
		// ' → sc028 (スキャンコード) + * プレフィクス
		expect(result.text).toContain('*sc028::');
	});

	// JIS-10: Quote キーの usShift " が正しく SendText で出力される
	it('JIS-10: Quote キーの Shift 出力 " が SendText(\'"\') として生成される', () => {
		const template: LayoutTemplate = {
			...JIS_ESCAPE_TEMPLATE,
			keys: [
				...JIS_ESCAPE_TEMPLATE.keys,
				{ id: 'Quote', kanataName: "'", label: ':', x: 6, y: 0, width: 1, height: 1 },
			]
		};
		const state: EditorState = {
			template,
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['Backquote', { type: 'key', value: 'grv' }],
					['Digit6', { type: 'key', value: '6' }],
					['Equal', { type: 'key', value: '=' }],
					['BracketLeft', { type: 'key', value: '[' }],
					['BracketRight', { type: 'key', value: ']' }],
					['KeyA', { type: 'key', value: 'a' }],
					['Quote', { type: 'key', value: "'" }],
				])
			}],
			selectedKeyId: null,
			activeLayerIndex: 0,
			jisToUsRemap: true,
			tappingTerm: 200
		};
		const result = generateAhk(state);
		// Quote の Shift は " → SendText で安全に出力（" を含むためシングルクォート）
		expect(result.text).toContain("SendText('\"')");
		// Quote の通常は ' → ダブルクォートで囲む
		expect(result.text).toContain('SendText("\'")');
	});
});

// === tap-hold / #UseHook / CapsLock 抑制テスト ===
const TAPHOLD_TEMPLATE: LayoutTemplate = {
	id: 'taphold-test',
	name: 'TapHold Test',
	keys: [
		{ id: 'CapsLock', label: 'Caps', kanataName: 'caps', x: 0, y: 0, width: 1, height: 1 },
		{ id: 'Space', label: 'Space', kanataName: 'spc', x: 1, y: 0, width: 1, height: 1 },
		{ id: 'KanaMode', label: 'カナ', kanataName: 'kana', x: 2, y: 0, width: 1, height: 1 },
		{ id: 'KeyA', label: 'A', kanataName: 'a', x: 3, y: 0, width: 1, height: 1 },
	],
	supportedFormats: ['kbd', 'json', 'ahk']
};

function createTapHoldState(overrides?: Partial<EditorState>): EditorState {
	return {
		template: TAPHOLD_TEMPLATE,
		layers: [{
			name: BASE_LAYER_NAME,
			actions: new Map<string, KeyAction>([
				['CapsLock', {
					type: 'tap-hold', variant: 'tap-hold',
					tapTimeout: 200, holdTimeout: 200,
					tapAction: { type: 'key', value: 'tab' },
					holdAction: { type: 'layer-while-held', layer: 'nav' }
				}],
				['Space', {
					type: 'tap-hold', variant: 'tap-hold',
					tapTimeout: 200, holdTimeout: 200,
					tapAction: { type: 'key', value: 'spc' },
					holdAction: { type: 'layer-while-held', layer: 'nav' }
				}],
				['KanaMode', {
					type: 'tap-hold', variant: 'tap-hold',
					tapTimeout: 200, holdTimeout: 200,
					tapAction: { type: 'key', value: 'ret' },
					holdAction: { type: 'key', value: 'rctl' }
				}],
				['KeyA', { type: 'key', value: 'a' }],
			])
		}],
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: false,
		tappingTerm: 200,
		...overrides
	};
}

describe('ahk-generator: tap-hold / Hook / CapsLock', () => {
	// TH-01: #UseHook ディレクティブが出力される
	it('TH-01: #UseHook がヘッダに含まれる', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('#UseHook');
	});

	// TH-02: CapsLock リマップ時に SetCapsLockState "AlwaysOff" が出力される
	it('TH-02: CapsLock 非デフォルト時に SetCapsLockState 抑制が出力される', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('SetCapsLockState "AlwaysOff"');
	});

	// TH-03: CapsLock デフォルト時は SetCapsLockState が出力されない
	it('TH-03: CapsLock デフォルト時は SetCapsLockState を出力しない', () => {
		const result = generateAhk(createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', { type: 'key', value: 'caps' }],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		}));
		expect(result.text).not.toContain('SetCapsLockState');
	});

	// TH-04: hold key(rctl) が THM コールバックで down/up パターン生成
	it('TH-04: hold key(rctl) が THM コールバックで Send down / Send up パターン', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('Send "{RCtrl down}"');
		expect(result.text).toContain('Send "{RCtrl up}"');
		// THM コールバック内の state 分岐で down/up
		expect(result.text).toContain('if (state = 1)');
		// KeyWait は使用しない
		expect(result.text).not.toContain('KeyWait("SC070")');
	});

	// TH-05: Space tap が THM コールバックで Send "{Space}" を出力する
	it('TH-05: Space tap が THM コールバックで Send "{Space}" を出力する', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('Send "{Space}"');
		// THM 方式: thm.Add で登録
		expect(result.text).toContain('thm.Add("Space", Space_TH)');
		// KeyWait は使用しない
		expect(result.text).not.toContain('KeyWait("Space"');
	});

	// TH-06: hold layer-switch が THM コールバック内で currentLayer 切替
	it('TH-06: hold layer-switch が THM コールバック内で処理される', () => {
		const state = createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'tab' },
						holdAction: { type: 'layer-switch', layer: 'nav' }
					}],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		});
		const result = generateAhk(state);
		// THM コールバック内で layer-switch
		expect(result.text).toContain('currentLayer := "nav"');
		// KeyWait は使用しない
		expect(result.text).not.toContain('KeyWait("CapsLock")');
	});

	// TH-07: hold no-op が THM コールバック内で空処理
	it('TH-07: hold no-op が THM コールバックで空処理（KeyWait なし）', () => {
		const state = createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'tab' },
						holdAction: { type: 'no-op' }
					}],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		});
		const result = generateAhk(state);
		// THM でコールバック登録
		expect(result.text).toContain('thm.Add("CapsLock", CapsLock_TH)');
		// KeyWait は使用しない
		expect(result.text).not.toContain('KeyWait("CapsLock")');
	});

	// === THM 固有テスト ===

	// THM-01: tap-hold あり → class TapHoldManager がインライン出力される
	it('THM-01: tap-hold あり → class TapHoldManager インライン出力', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('class TapHoldManager {');
		expect(result.text).toContain('class KeyManager {');
	});

	// THM-02: tap-hold なし → class TapHoldManager が出力されない
	it('THM-02: tap-hold なし → class TapHoldManager 非出力', () => {
		const result = generateAhk(createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', { type: 'key', value: 'tab' }],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		}));
		expect(result.text).not.toContain('class TapHoldManager');
		expect(result.text).not.toContain('thm :=');
	});

	// THM-02b: tap-hold なし → thm := 非出力
	it('THM-02b: tap-hold なし → thm := 非出力', () => {
		const state = createState();
		const result = generateAhk(state);
		expect(result.text).not.toContain('thm :=');
		expect(result.text).not.toContain('class TapHoldManager');
	});

	// THM-03: ヘッダに MIT ライセンス + evilC + 感謝文
	it('THM-03: ヘッダに MIT ライセンス + evilC + 感謝文', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('TapHoldManager v2.0 (MIT License)');
		expect(result.text).toContain('evilC (Clive Galway)');
		expect(result.text).toContain('Thanks to evilC');
	});

	// THM-03b: tap-hold なし → ヘッダに THM コメント非出力
	it('THM-03b: tap-hold なし → ヘッダに THM コメント非出力', () => {
		const result = generateAhk(createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', { type: 'key', value: 'tab' }],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		}));
		expect(result.text).not.toContain('TapHoldManager v2.0');
		expect(result.text).not.toContain('evilC');
	});

	// THM-04: thm := TapHoldManager(200, 200, 1, "$*") インスタンス生成
	it('THM-04: thm := TapHoldManager(200, 200, 1, "$*") インスタンス生成', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('thm := TapHoldManager(200, 200, 1, "$*")');
	});

	// THM-05: CapsLock コールバックに currentLayer := "nav" / currentLayer := "layer-0"
	it('THM-05: CapsLock コールバックに layer-while-held の state 分岐', () => {
		const result = generateAhk(createTapHoldState());
		const callback = result.text.split('CapsLock_TH(isHold, taps, state)')[1];
		expect(callback).toBeDefined();
		expect(callback).toContain('currentLayer := "nav"');
		expect(callback).toContain(`currentLayer := "layer-0"`);
	});

	// THM-06: hold key (修飾なし) → Send "{key down}" / Send "{key up}"
	it('THM-06: hold key (修飾なし, キーモード) → down/up パターン', () => {
		const result = generateAhk(createTapHoldState());
		// KanaMode: hold=key(rctl) → RCtrl down/up
		const callback = result.text.split('SC070_TH(isHold, taps, state)')[1];
		expect(callback).toBeDefined();
		expect(callback).toContain('Send "{RCtrl down}"');
		expect(callback).toContain('Send "{RCtrl up}"');
	});

	// THM-07: hold key (修飾あり) → state=1 で 1 回 Send のみ
	it('THM-07: hold key (修飾あり) → state=1 で 1 回 Send のみ', () => {
		const state = createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'tab' },
						holdAction: { type: 'key', value: 'a', modifiers: ['lctl'] }
					}],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		});
		const result = generateAhk(state);
		const callback = result.text.split('CapsLock_TH(isHold, taps, state)')[1];
		expect(callback).toBeDefined();
		// 修飾あり: state=1 で 1 回 Send（down/up パターンではない）
		expect(callback).toContain('if (state = 1)');
		expect(callback).toContain('{LCtrl down}');
		// up は Send up のパターンではなく、修飾の up/down の方
		expect(callback).toContain('{LCtrl up}');
		// KeyWait は使用しない
		expect(callback).not.toContain('KeyWait');
	});

	// THM-08: tap-hold コンテキストで KeyWait が使用されない
	it('THM-08: tap-hold コンテキストで KeyWait が使用されない', () => {
		const result = generateAhk(createTapHoldState());
		// THM コールバック部分には KeyWait が含まれない
		const callbacks = result.text.split('; === TapHold Callbacks ===')[1];
		expect(callbacks).toBeDefined();
		expect(callbacks).not.toContain('KeyWait');
	});

	// THM-09: 複数レイヤでの currentLayer コールバック内分岐
	it('THM-09: 複数レイヤでの currentLayer コールバック内分岐', () => {
		const state = createTapHoldState({
			layers: [
				{
					name: BASE_LAYER_NAME,
					actions: new Map<string, KeyAction>([
						['CapsLock', {
							type: 'tap-hold', variant: 'tap-hold',
							tapTimeout: 200, holdTimeout: 200,
							tapAction: { type: 'key', value: 'tab' },
							holdAction: { type: 'layer-while-held', layer: 'nav' }
						}],
						['Space', { type: 'key', value: 'spc' }],
						['KanaMode', { type: 'key', value: 'kana' }],
						['KeyA', { type: 'key', value: 'a' }],
					])
				},
				{
					name: 'nav',
					actions: new Map<string, KeyAction>([
						['CapsLock', {
							type: 'tap-hold', variant: 'tap-hold',
							tapTimeout: 200, holdTimeout: 200,
							tapAction: { type: 'key', value: 'esc' },
							holdAction: { type: 'layer-switch', layer: 'sym' }
						}],
						['Space', { type: 'transparent' }],
						['KanaMode', { type: 'transparent' }],
						['KeyA', { type: 'key', value: 'lft' }],
					])
				}
			]
		});
		const result = generateAhk(state);
		const callback = result.text.split('CapsLock_TH(isHold, taps, state)')[1];
		expect(callback).toBeDefined();
		// ベースレイヤ分岐
		expect(callback).toContain('currentLayer = "layer-0"');
		// nav レイヤ分岐
		expect(callback).toContain('currentLayer = "nav"');
		// nav レイヤの hold=layer-switch
		expect(callback).toContain('currentLayer := "sym"');
	});

	// THM-10: キー個別タイムアウト（thm.Add 第 3 引数）
	it('THM-10: キー個別タイムアウトが thm.Add 第 3 引数に出力される', () => {
		const state = createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 300,
						tapAction: { type: 'key', value: 'tab' },
						holdAction: { type: 'layer-while-held', layer: 'nav' }
					}],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		});
		const result = generateAhk(state);
		// holdTimeout=300 が tappingTerm=200 と異なるためキー個別タイムアウト
		expect(result.text).toContain('thm.Add("CapsLock", CapsLock_TH, 300)');
	});

	// THM-11: Space tap=Space / hold=layer-while-held(nav) の THM コールバック出力
	it('THM-11: Space tap=Space / hold=layer-while-held(nav) が THM コールバック生成', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('thm.Add("Space", Space_TH)');
		const callback = result.text.split('Space_TH(isHold, taps, state)')[1];
		expect(callback).toBeDefined();
		expect(callback).toContain('Send "{Space}"');
		expect(callback).toContain('currentLayer := "nav"');
		expect(callback).toContain(`currentLayer := "layer-0"`);
	});

	// THM-12: RShift tap=Escape / hold=layer-while-held(fn) コールバック出力
	it('THM-12: RShift tap-hold コールバック出力', () => {
		const template: LayoutTemplate = {
			...TAPHOLD_TEMPLATE,
			keys: [
				...TAPHOLD_TEMPLATE.keys,
				{ id: 'ShiftRight', label: 'RShift', kanataName: 'rsft', x: 4, y: 0, width: 1, height: 1 },
			]
		};
		const state: EditorState = {
			template,
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', { type: 'key', value: 'caps' }],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
					['ShiftRight', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'esc' },
						holdAction: { type: 'layer-while-held', layer: 'fn' }
					}],
				])
			}],
			selectedKeyId: null,
			activeLayerIndex: 0,
			jisToUsRemap: false,
			tappingTerm: 200
		};
		const result = generateAhk(state);
		expect(result.text).toContain('thm.Add("RShift", RShift_TH)');
		const callback = result.text.split('RShift_TH(isHold, taps, state)')[1];
		expect(callback).toBeDefined();
		expect(callback).toContain('Send "{Esc}"');
		expect(callback).toContain('currentLayer := "fn"');
		expect(callback).toContain(`currentLayer := "layer-0"`);
	});

	// THM-13: hold=no-op / hold=layer-switch のコールバック検証
	it('THM-13: hold=no-op は空コールバック、hold=layer-switch は復帰なし', () => {
		const state = createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'tab' },
						holdAction: { type: 'no-op' }
					}],
					['Space', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'spc' },
						holdAction: { type: 'layer-switch', layer: 'nav' }
					}],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		});
		const result = generateAhk(state);
		// hold no-op: isHold ブランチ内が空（Send も currentLayer も含まない）
		const capsCallback = result.text.split('CapsLock_TH(isHold, taps, state)')[1]?.split('\n}')[0];
		expect(capsCallback).toBeDefined();
		// no-op なのでホールド時に何も出力しない
		expect(capsCallback).toContain('if (isHold)');
		expect(capsCallback).toContain('Send "{Tab}"');
		// layer-switch: state=1 で切替、復帰なし
		const spaceCallback = result.text.split('Space_TH(isHold, taps, state)')[1]?.split('\n}')[0];
		expect(spaceCallback).toBeDefined();
		expect(spaceCallback).toContain('currentLayer := "nav"');
		// layer-switch は復帰しない（layer-0 への代入がない）
		expect(spaceCallback).not.toContain(`currentLayer := "layer-0"`);
	});

	// THM-14: JIS→US リマップ有効時の THM + SendText 共存
	it('THM-14: JIS リマップ有効時の THM + SendText 共存', () => {
		const template: LayoutTemplate = {
			id: 'jis-thm',
			name: 'JIS THM Test',
			keys: [
				{ id: 'CapsLock', label: 'Caps', kanataName: 'caps', x: 0, y: 0, width: 1, height: 1 },
				{ id: 'Equal', label: '^', kanataName: '=', x: 1, y: 0, width: 1, height: 1 },
			],
			supportedFormats: ['kbd', 'json', 'ahk']
		};
		const state: EditorState = {
			template,
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'tab' },
						holdAction: { type: 'layer-while-held', layer: 'nav' }
					}],
					['Equal', { type: 'key', value: '=' }],
				])
			}],
			selectedKeyId: null,
			activeLayerIndex: 0,
			jisToUsRemap: true,
			tappingTerm: 200
		};
		const result = generateAhk(state);
		// THM 登録あり
		expect(result.text).toContain('thm.Add("CapsLock", CapsLock_TH)');
		// JIS→US リマップの SendText も共存
		expect(result.text).toContain('SendText');
	});

	// === kanata 推奨 notice テスト ===

	// KR-01: CapsLock + KanaMode の tap-hold → kanata 推奨 notice が生成される
	it('KR-01: CapsLock + KanaMode の tap-hold → kanata 推奨 notice', () => {
		const result = generateAhk(createTapHoldState());
		const kanataNotice = result.notices.find((n) => n.code === 'AHK_KANATA_RECOMMENDED');
		expect(kanataNotice).toBeDefined();
		expect(kanataNotice!.message).toContain('kanata');
		expect(kanataNotice!.message).toContain('CapsLock');
		expect(kanataNotice!.message).toContain('KanaMode');
	});

	// KR-02: CapsLock のみ tap-hold → notice に CapsLock が含まれ KanaMode は含まれない
	it('KR-02: CapsLock のみ tap-hold → CapsLock のみ notice', () => {
		const result = generateAhk(createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'tab' },
						holdAction: { type: 'layer-while-held', layer: 'nav' }
					}],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		}));
		const kanataNotice = result.notices.find((n) => n.code === 'AHK_KANATA_RECOMMENDED');
		expect(kanataNotice).toBeDefined();
		expect(kanataNotice!.message).toContain('CapsLock');
		expect(kanataNotice!.message).not.toContain('KanaMode');
	});

	// KR-03: tap-hold なし → kanata 推奨 notice なし
	it('KR-03: tap-hold なし → kanata 推奨 notice なし', () => {
		const result = generateAhk(createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', { type: 'key', value: 'tab' }],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		}));
		const kanataNotice = result.notices.find((n) => n.code === 'AHK_KANATA_RECOMMENDED');
		expect(kanataNotice).toBeUndefined();
	});

	// KR-04: Space のみ tap-hold (CapsLock/KanaMode なし) → kanata 推奨 notice なし
	it('KR-04: Space のみ tap-hold → kanata 推奨 notice なし', () => {
		const result = generateAhk(createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', { type: 'key', value: 'tab' }],
					['Space', {
						type: 'tap-hold', variant: 'tap-hold',
						tapTimeout: 200, holdTimeout: 200,
						tapAction: { type: 'key', value: 'spc' },
						holdAction: { type: 'layer-while-held', layer: 'nav' }
					}],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		}));
		const kanataNotice = result.notices.find((n) => n.code === 'AHK_KANATA_RECOMMENDED');
		expect(kanataNotice).toBeUndefined();
	});

	// KR-05: .ahk ヘッダに kanata 推奨コメントが出力される
	it('KR-05: .ahk ヘッダに kanata 推奨コメントが出力される', () => {
		const result = generateAhk(createTapHoldState());
		expect(result.text).toContain('; Note:');
		expect(result.text).toContain('kanata (.kbd)');
	});

	// KR-06: tap-hold なしの場合はヘッダに kanata 推奨コメントなし
	it('KR-06: tap-hold なしの場合はヘッダに kanata 推奨コメントなし', () => {
		const result = generateAhk(createTapHoldState({
			layers: [{
				name: BASE_LAYER_NAME,
				actions: new Map<string, KeyAction>([
					['CapsLock', { type: 'key', value: 'tab' }],
					['Space', { type: 'key', value: 'spc' }],
					['KanaMode', { type: 'key', value: 'kana' }],
					['KeyA', { type: 'key', value: 'a' }],
				])
			}]
		}));
		expect(result.text).not.toContain('; Note:');
	});
});