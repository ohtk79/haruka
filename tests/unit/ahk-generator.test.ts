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
		expect(result.notices).toHaveLength(1);
		expect(result.text).toContain('; Conversion Notices:');
		expect(result.text).toContain('tap-hold-press -> tap-hold');
		expect(result.text).toContain('KeyWait("CapsLock", "T0.2")');
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