// =============================================================================
// EditorStore — Svelte 5 runes-based state management
// =============================================================================
// Depends on: models/constants.ts, models/types.ts, models/jis-us-map.ts,
//             services/kbd-generator.ts, services/ke-generator.ts,
//             services/ahk-generator.ts, services/export-format-support.ts,
//             services/validation.ts, services/debug-logger.svelte.ts
// Tested by: tests/unit/editor-store.test.ts
// Called from: components/common/DebugPanel.svelte, routes/+page.svelte

import { BASE_LAYER_NAME, TAP_HOLD_DEFAULT_TIMEOUT, MAX_LAYERS } from '$lib/models/constants';
import type {
	EditorState,
	KeyAction,
	KbdTargetOs,
	KbdTargetExportStatus,
	Layer,
	LayoutTemplate,
	PhysicalKey
} from '$lib/models/types';
import { isTopLevelAction } from '$lib/models/types';
import type { AhkGeneratorResult, ExportFormatStatus } from '$lib/models/export-format';
import { generateKbd } from '$lib/services/kbd-generator';
import { generateKeJson, toUnifiedKeJson, type KeGeneratorResult } from '$lib/services/ke-generator';
import { generateAhk } from '$lib/services/ahk-generator';
import {
	isFormatStaticallySupported,
	resolveExportFormatStatuses,
	validateKbdExport
} from '$lib/services/export-format-support';
import { validateLayerCount, validateLayerName } from '$lib/services/validation';
import { debugLog } from '$lib/services/debug-logger.svelte';
import { JIS_TO_US_MAPPINGS } from '$lib/models/jis-us-map';
import * as m from '$lib/paraglide/messages';

/**
 * Create a default base layer for a given template
 */
function createBaseLayer(template: LayoutTemplate): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of template.keys) {
		if (key.kanataName) {
			actions.set(key.id, { type: 'key', value: key.kanataName });
		} else {
			// kanata 非対応キー（Fn など）: デフォルトは transparent
			actions.set(key.id, { type: 'transparent' });
		}
	}
	return { name: BASE_LAYER_NAME, actions };
}

/**
 * Create a new transparent layer
 */
function createTransparentLayer(name: string, template: LayoutTemplate): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of template.keys) {
		actions.set(key.id, { type: 'transparent' });
	}
	return { name, actions };
}

/**
 * EditorStore class — manages the full editor state using Svelte 5 $state runes
 */
export class EditorStore {
	// Reactive state
	template: LayoutTemplate = $state() as LayoutTemplate;
	layers: Layer[] = $state([]);
	selectedKeyId: string | null = $state(null);
	activeLayerIndex: number = $state(0);
	jisToUsRemap: boolean = $state(false);
	tappingTerm: number = $state(TAP_HOLD_DEFAULT_TIMEOUT);
	kbdTarget: KbdTargetOs = $state('windows');

	// Derived
	readonly activeLayer: Layer = $derived(this.layers[this.activeLayerIndex]);
	readonly kbdText: string = $derived.by(() => {
		if (!isFormatStaticallySupported(this.template, 'kbd')) return '';
		const { template, layers, jisToUsRemap, tappingTerm, kbdTarget } = this;
		return generateKbd({ template, layers, jisToUsRemap, tappingTerm, selectedKeyId: null, activeLayerIndex: 0 }, kbdTarget);
	});
	readonly keResult: KeGeneratorResult = $derived.by(() => {
		const { template, layers, jisToUsRemap, tappingTerm } = this;
		return generateKeJson({ template, layers, jisToUsRemap, tappingTerm, selectedKeyId: null, activeLayerIndex: 0 });
	});
	readonly keJsonText: string = $derived(JSON.stringify(this.keResult.json, null, 2));
	readonly keUnifiedJsonText: string = $derived.by(() => {
		const unified = toUnifiedKeJson(this.keResult, this.template.name);
		return JSON.stringify(unified, null, 2);
	});
	readonly ahkResult: AhkGeneratorResult = $derived.by(() => {
		const { template, layers, jisToUsRemap, tappingTerm } = this;
		return generateAhk({ template, layers, jisToUsRemap, tappingTerm, selectedKeyId: null, activeLayerIndex: 0 });
	});
	readonly ahkText: string = $derived(this.ahkResult.text);
	// 全ターゲットのバリデーション結果を一括キャッシュ（重複呼び出し排除）
	private readonly _kbdValidationMap = $derived.by(() => {
		if (!isFormatStaticallySupported(this.template, 'kbd')) return null;
		const state: EditorState = { template: this.template, layers: this.layers, jisToUsRemap: this.jisToUsRemap, tappingTerm: this.tappingTerm, selectedKeyId: null, activeLayerIndex: 0 };
		const targets: KbdTargetOs[] = ['windows', 'macos', 'linux'];
		return new Map(targets.map(t => [t, validateKbdExport(state, t)]));
	});
	readonly kbdValidation = $derived.by(() => {
		return this._kbdValidationMap?.get(this.kbdTarget) ?? { valid: true, unsupportedActions: [] };
	});
	readonly formatStatuses: ExportFormatStatus[] = $derived.by(() =>
		resolveExportFormatStatuses({
			template: this.template,
			kbdText: this.kbdText,
			keJsonText: this.keJsonText,
			keUnifiedJsonText: this.keUnifiedJsonText,
			ahkResult: this.ahkResult
		})
	);
	readonly kbdTargetStatuses: KbdTargetExportStatus[] = $derived.by(() => {
		const targets: KbdTargetOs[] = ['windows', 'macos', 'linux'];
		const validationMap = this._kbdValidationMap;
		if (!validationMap) {
			const reason = this.template.keOnly
				? m.header_appleKarabinerOnly()
				: m.export_templateFormatUnsupported({ format: m.header_exportKbd() });
			return targets.map(target => ({ target, available: false, disabledReason: reason, notice: null }));
		}
		const hasKanaKey = this.template.keys.some(k => k.kanataName === 'jp-kana');
		return targets.map(target => {
			const validation = validationMap.get(target);
			if (!validation || !validation.valid) {
				const first = validation?.unsupportedActions[0];
				const reason = first ? `${first.actionId}: ${first.reason}` : '';
				return { target, available: false, disabledReason: reason, notice: null };
			}
			const notice = (target === 'windows' && hasKanaKey) ? m.export_kbdWinterceptNotice() : null;
			return { target, available: true, disabledReason: null, notice };
		});
	});
	readonly kbdNotice: string | null = $derived(
		this.kbdTargetStatuses.find(s => s.target === this.kbdTarget)?.notice ?? null
	);

	/** 選択中のキーの PhysicalKey (未選択時は null) */
	readonly selectedKey: PhysicalKey | null = $derived(
		this.selectedKeyId
			? this.template.keys.find((k) => k.id === this.selectedKeyId) ?? null
			: null
	);

	/** 選択中のキーに対する現在のアクション */
	readonly currentAction: KeyAction | undefined = $derived(
		this.selectedKeyId ? this.activeLayer?.actions.get(this.selectedKeyId) : undefined
	);

	/** US ラベルを使用するか (テンプレートが US またはユーザーが JIS→US 変換を有効にしている) */
	readonly useUsLabels: boolean = $derived(this.jisToUsRemap || this.template.usLayout === true);

	/** 現在のテンプレートの kanataName 一覧 (KeyPicker フィルタ用) */
	readonly templateKanataNames: Set<string> = $derived(
		new Set(this.template.keys.map((k) => k.kanataName).filter((name): name is string => name !== undefined))
	);

	constructor(template: LayoutTemplate, layers?: Layer[]) {
		this.template = template;
		this.layers = layers ?? [createBaseLayer(template)];
	}

	// =========================================================================
	// Key Selection
	// =========================================================================

	selectKey(keyId: string | null): void {
		this.selectedKeyId = keyId;
		debugLog.logSelectKey(keyId);
	}

	// =========================================================================
	// KBD Target OS
	// =========================================================================

	setKbdTarget(target: KbdTargetOs): void {
		this.kbdTarget = target;
	}

	/** 指定ターゲット OS 用の .kbd テキストを生成する（エクスポート時に使用） */
	generateKbdForTarget(target: KbdTargetOs): string {
		if (!isFormatStaticallySupported(this.template, 'kbd')) return '';
		return generateKbd(
			{ template: this.template, layers: this.layers, jisToUsRemap: this.jisToUsRemap, tappingTerm: this.tappingTerm, selectedKeyId: null, activeLayerIndex: 0 },
			target
		);
	}

	// =========================================================================
	// Tapping Term
	// =========================================================================

	setTappingTerm(value: number): void {
		this.tappingTerm = value;
	}

	// =========================================================================
	// JIS → US Remap Toggle
	// =========================================================================

	toggleJisToUsRemap(): void {
		this.jisToUsRemap = !this.jisToUsRemap;
		if (!this.jisToUsRemap) {
			// US変換OFF: ベースレイヤの16キーをデフォルトアクションにリセット
			const baseLayer = this.layers[0];
			if (baseLayer) {
				const newActions = new Map(baseLayer.actions);
				for (const mapping of JIS_TO_US_MAPPINGS) {
					const key = this.template.keys.find((k) => k.id === mapping.physicalKeyId);
					if (key && key.kanataName) {
						newActions.set(key.id, { type: 'key', value: key.kanataName });
					}
				}
				this.layers[0] = { name: baseLayer.name, actions: newActions };
			}
		}
		debugLog.log('toggleJisToUsRemap', `jisToUsRemap=${this.jisToUsRemap}`);
	}

	// =========================================================================
	// Layer Navigation
	// =========================================================================

	switchLayer(index: number): void {
		if (index >= 0 && index < this.layers.length) {
			this.activeLayerIndex = index;
			debugLog.logSwitchLayer(index, this.layers[index].name);
		}
	}

	// =========================================================================
	// Action Mutations
	// =========================================================================

	setAction(keyId: string, action: KeyAction): void {
		// Validate: only TopLevelAction allowed at top level
		if (!isTopLevelAction(action)) {
			debugLog.log('setAction', `Rejected non-top-level action type: ${action.type}`);
			return;
		}
		const idx = this.activeLayerIndex;
		const layer = this.layers[idx];
		if (layer) {
			const newActions = new Map(layer.actions);
			newActions.set(keyId, action);
			this.layers[idx] = { name: layer.name, actions: newActions };
			debugLog.logSetAction(keyId, action);
		}
	}

	// =========================================================================
	// Layer Management
	// =========================================================================

	addLayer(name: string): string | null {
		const error = validateLayerCount(this.layers.length);
		if (error) return error;

		const existingNames = this.layers.map((l) => l.name);
		const nameError = validateLayerName(name, existingNames);
		if (nameError) return nameError;

		this.layers.push(createTransparentLayer(name, this.template));
		this.activeLayerIndex = this.layers.length - 1;
		debugLog.logAddLayer(name, null);
		return null;
	}

	deleteLayer(index: number): string | null {
		if (index === 0) { debugLog.logDeleteLayer(index, 'base', 'ベースレイヤは削除できません'); return 'ベースレイヤは削除できません'; }
		if (index < 0 || index >= this.layers.length) return '無効なレイヤインデックスです';
		const deletedName = this.layers[index].name;

		this.layers.splice(index, 1);

		// Adjust active layer index
		if (this.activeLayerIndex >= this.layers.length) {
			this.activeLayerIndex = this.layers.length - 1;
		} else if (this.activeLayerIndex > index) {
			this.activeLayerIndex--;
		}
		debugLog.logDeleteLayer(index, deletedName, null);
		return null;
	}

	renameLayer(index: number, name: string): string | null {
		if (index === 0) return 'ベースレイヤの名前は変更できません';
		if (index < 0 || index >= this.layers.length) return '無効なレイヤインデックスです';

		const oldName = this.layers[index].name;
		const existingNames = this.layers.map((l) => l.name);
		const error = validateLayerName(name, existingNames, oldName);
		if (error) { debugLog.logRenameLayer(index, oldName, name, error); return error; }

		this.layers[index].name = name;
		debugLog.logRenameLayer(index, oldName, name, null);
		return null;
	}

	reorderLayer(fromIndex: number, toIndex: number): string | null {
		if (fromIndex === 0 || toIndex === 0) return 'ベースレイヤは移動できません';
		if (
			fromIndex < 1 ||
			fromIndex >= this.layers.length ||
			toIndex < 1 ||
			toIndex >= this.layers.length
		) {
			return '無効なレイヤインデックスです';
		}

		const [layer] = this.layers.splice(fromIndex, 1);
		this.layers.splice(toIndex, 0, layer);

		// Adjust active layer
		if (this.activeLayerIndex === fromIndex) {
			this.activeLayerIndex = toIndex;
		} else if (fromIndex < this.activeLayerIndex && toIndex >= this.activeLayerIndex) {
			this.activeLayerIndex--;
		} else if (fromIndex > this.activeLayerIndex && toIndex <= this.activeLayerIndex) {
			this.activeLayerIndex++;
		}

		debugLog.logReorderLayer(fromIndex, toIndex);
		return null;
	}

	// =========================================================================
	// Physical Key Customization
	// =========================================================================

	addPhysicalKey(key: PhysicalKey): void {
		if (this.template.keys.some((k) => k.id === key.id)) return;
		this.template.keys.push(key);
		// Add default action for all layers
		for (const layer of this.layers) {
			if (layer.name === BASE_LAYER_NAME && key.kanataName) {
				layer.actions.set(key.id, { type: 'key', value: key.kanataName });
			} else {
				layer.actions.set(key.id, { type: 'transparent' });
			}
		}
	}

	removePhysicalKey(keyId: string): void {
		const idx = this.template.keys.findIndex((k) => k.id === keyId);
		if (idx === -1) return;
		this.template.keys.splice(idx, 1);
		// Remove from all layers
		for (const layer of this.layers) {
			layer.actions.delete(keyId);
		}
		// Deselect if removed
		if (this.selectedKeyId === keyId) {
			this.selectedKeyId = null;
		}
	}

	// =========================================================================
	// Reset
	// =========================================================================

	resetToNew(): void {
		this.layers = [createBaseLayer(this.template)];
		this.selectedKeyId = null;
		this.activeLayerIndex = 0;
		this.jisToUsRemap = false;
		this.tappingTerm = TAP_HOLD_DEFAULT_TIMEOUT;
		debugLog.logResetToNew();
	}

	/**
	 * Reset with a new template (used for template switching)
	 */
	resetWithTemplate(template: LayoutTemplate, jisToUsRemap: boolean = false): void {
		this.template = template;
		this.layers = [createBaseLayer(template)];
		this.selectedKeyId = null;
		this.activeLayerIndex = 0;
		this.jisToUsRemap = jisToUsRemap;
		this.tappingTerm = TAP_HOLD_DEFAULT_TIMEOUT;
		debugLog.log('resetWithTemplate', `template=${template.id}, jisToUsRemap=${jisToUsRemap}`);
	}

	// =========================================================================
	// State snapshot (for persistence)
	// =========================================================================

	getState(): EditorState {
		return {
			template: this.template,
			layers: this.layers,
			selectedKeyId: this.selectedKeyId,
			activeLayerIndex: this.activeLayerIndex,
			jisToUsRemap: this.jisToUsRemap,
			tappingTerm: this.tappingTerm
		};
	}

	/**
	 * Restore state from deserialized data
	 */
	restoreState(state: Partial<EditorState>): void {
		if (state.template) {
			this.template = state.template;
			if (!state.layers) {
				this.layers = [createBaseLayer(state.template)];
			}
		}
		if (state.layers) {
			this.layers = state.layers;
		}
		if (state.selectedKeyId !== undefined) {
			this.selectedKeyId = state.selectedKeyId;
		}
		if (state.activeLayerIndex !== undefined) {
			this.activeLayerIndex = state.activeLayerIndex;
		}
		if (state.jisToUsRemap !== undefined) {
			this.jisToUsRemap = state.jisToUsRemap;
		}
		if (state.tappingTerm !== undefined) {
			this.tappingTerm = state.tappingTerm;
		}
	}
}
