<!--
  TapHoldForm — Tap-Hold action configuration (variant, tap key, hold modifier/layer)
  Props: action, layers, ontaphold, usMode, templateKanataNames, isAppleTemplate
  Used by: components/panels/ActionPanel.svelte
-->
<script lang="ts">
	import type { KeyAction, TapAction, HoldAction, Layer } from '$lib/models/types';
	import {
		TAP_HOLD_DEFAULT_TIMEOUT,
		TAP_HOLD_VARIANTS,
		MODIFIER_KEYS,
		getModifierLabel
	} from '$lib/models/constants';
	import KeyPicker from '../panels/KeyPicker.svelte';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		action?: KeyAction & { type: 'tap-hold' };
		layers: Layer[];
		ontaphold: (action: KeyAction & { type: 'tap-hold' }) => void;
		usMode?: boolean;
		templateKanataNames?: ReadonlySet<string>;
		isAppleTemplate?: boolean;
	}

	let { action, layers, ontaphold, usMode = false, templateKanataNames, isAppleTemplate = false }: Props = $props();

	let variant = $state<'tap-hold' | 'tap-hold-press' | 'tap-hold-release'>('tap-hold');

	// Tap action state
	let tapKeyValue = $state('spc');

	// Hold action state: either a modifier key or a layer
	let holdSelection = $state<string>('lsft');

	function deriveHoldSelection(act: (KeyAction & { type: 'tap-hold' }) | undefined): string {
		if (!act) return 'lsft';
		if (act.holdAction.type === 'key') return act.holdAction.value;
		if (act.holdAction.type === 'layer-while-held') return `layer:${act.holdAction.layer}`;
		return 'lsft';
	}

	// Sync from prop changes
	$effect(() => {
		if (action) {
			variant = action.variant;
			if (action.tapAction.type === 'key') tapKeyValue = action.tapAction.value;
			holdSelection = deriveHoldSelection(action);
		}
	});

	function emitChange() {
		const tapAction: TapAction = { type: 'key', value: tapKeyValue };

		let holdAction: HoldAction;
		if (holdSelection.startsWith('layer:')) {
			holdAction = { type: 'layer-while-held', layer: holdSelection.slice('layer:'.length) };
		} else {
			holdAction = { type: 'key', value: holdSelection };
		}

		ontaphold({
			type: 'tap-hold',
			variant,
			tapTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
			holdTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
			tapAction,
			holdAction
		});
	}

	function selectHold(value: string) {
		holdSelection = value;
		emitChange();
	}
</script>

<div class="tap-hold-form space-y-3">
	<!-- Variant -->
	<div>
		<label for="tap-hold-variant" class="mb-1 block text-xs font-medium text-gray-600">{m.panel_variant()}</label>
		<select
			id="tap-hold-variant"
			class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
			bind:value={variant}
			onchange={emitChange}
		>
			{#each TAP_HOLD_VARIANTS as v}
				<option value={v}>{v}</option>
			{/each}
		</select>
	</div>

	<!-- Tap Action -->
	<fieldset>
		<legend class="mb-1 block text-xs font-medium text-gray-600">{m.panel_tapAction()}</legend>
		<KeyPicker
				currentValue={tapKeyValue}
				{usMode}
				{templateKanataNames}
				{isAppleTemplate}
				excludeCategories={['modifiers']}
				onkeypick={(v) => {
					tapKeyValue = v;
					emitChange();
				}}
			/>
	</fieldset>

	<!-- Hold Action -->
	<fieldset>
		<legend class="mb-1 block text-xs font-medium text-gray-600">{m.panel_holdAction()}</legend>
		<!-- Modifiers -->
		<div class="mb-2">
			<span class="mb-1 block text-xs text-gray-500">{m.panel_modifiers()}</span>
			<div class="grid grid-cols-4 gap-1">
				{#each MODIFIER_KEYS as mod}
					<button
						class="rounded border px-2 py-1 text-xs transition-colors"
						class:bg-blue-500={holdSelection === mod.id}
						class:text-white={holdSelection === mod.id}
						class:border-blue-500={holdSelection === mod.id}
						class:border-gray-300={holdSelection !== mod.id}
						class:hover:bg-gray-50={holdSelection !== mod.id}
						onclick={() => selectHold(mod.id)}
					>
						{getModifierLabel(mod.id)}
					</button>
				{/each}
			</div>
		</div>
		<!-- Layers -->
		<div>
			<span class="mb-1 block text-xs text-gray-500">{m.panel_layers()}</span>
			<div class="flex flex-wrap gap-1">
				{#each layers as layer}
					<button
						class="rounded border px-3 py-1 text-xs transition-colors"
						class:bg-green-500={holdSelection === `layer:${layer.name}`}
						class:text-white={holdSelection === `layer:${layer.name}`}
						class:border-green-500={holdSelection === `layer:${layer.name}`}
						class:border-gray-300={holdSelection !== `layer:${layer.name}`}
						class:hover:bg-gray-50={holdSelection !== `layer:${layer.name}`}
						onclick={() => selectHold(`layer:${layer.name}`)}
					>
						{layer.name}
					</button>
				{/each}
			</div>
		</div>
	</fieldset>
</div>
