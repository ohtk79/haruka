// =============================================================================
// EditorStore — Svelte 5 runes-based state management
// =============================================================================
// Depends on: models/constants.ts, models/types.ts, models/jis-us-map.ts,
//             services/kbd-generator.ts, services/ke-generator.ts,
//             services/validation.ts, services/debug-logger.svelte.ts
// Tested by: tests/unit/editor-store.test.ts
// Called from: components/common/DebugPanel.svelte, routes/+page.svelte

import { BASE_LAYER_NAME, TAP_HOLD_DEFAULT_TIMEOUT, MAX_LAYERS } from '$lib/models/constants';
import type {
	EditorState,
	KeyAction,
	Layer,
	LayoutTemplate,
	PhysicalKey
} from '$lib/models/types';
import { isTopLevelAction } from '$lib/models/types';
import { generateKbd } from '$lib/services/kbd-generator';
import { generateKeJson, type KeGeneratorResult } from '$lib/services/ke-generator';
import { validateLayerCount, validateLayerName } from '$lib/services/validation';
import { debugLog } from '$lib/services/debug-logger.svelte';
import { JIS_TO_US_MAPPINGS } from '$lib/models/jis-us-map';

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

	// Derived
	readonly activeLayer: Layer = $derived(this.layers[this.activeLayerIndex]);
	readonly kbdText: string = $derived.by(() => {
		if (this.template.keOnly) return '';
		const { template, layers, jisToUsRemap, tappingTerm } = this;
		return generateKbd({ template, layers, jisToUsRemap, tappingTerm, selectedKeyId: null, activeLayerIndex: 0 });
	});
	readonly keResult: KeGeneratorResult = $derived.by(() => {
		const { template, layers, jisToUsRemap, tappingTerm } = this;
		return generateKeJson({ template, layers, jisToUsRemap, tappingTerm, selectedKeyId: null, activeLayerIndex: 0 });
	});
	readonly keJsonText: string = $derived(JSON.stringify(this.keResult.json, null, 2));

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
