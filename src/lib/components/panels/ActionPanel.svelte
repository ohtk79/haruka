<!--
  ActionPanel — Key action editor panel (Key/Tap-Hold mode selection, modifiers, KeyPicker)
  Props: selectedKey, currentAction, layers, onactionchange, usMode, templateKanataNames
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import type { KeyAction, Layer, PhysicalKey } from '$lib/models/types';
	import { ACTION_TYPES, MODIFIER_KEYS, MODIFIER_SORT_ORDER, TAP_HOLD_DEFAULT_TIMEOUT, getModifierLabel } from '$lib/models/constants';
	import KeyPicker from './KeyPicker.svelte';
	import TapHoldForm from './TapHoldForm.svelte';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		selectedKey: PhysicalKey | null;
		currentAction: KeyAction | undefined;
		layers: Layer[];
		onactionchange: (keyId: string, action: KeyAction) => void;
		usMode?: boolean;
		templateKanataNames?: ReadonlySet<string>;
	}

	let { selectedKey, currentAction, layers, onactionchange, usMode = false, templateKanataNames }: Props = $props();

	let actionType = $state<string>(ACTION_TYPES.KEY);

	// Sync actionType from currentAction when selection changes
	$effect(() => {
		if (currentAction) {
			// Transparent and No-op are displayed as Key type (selectable in KeyPicker)
			if (currentAction.type === 'transparent' || currentAction.type === 'no-op') {
				actionType = ACTION_TYPES.KEY;
			} else {
				actionType = currentAction.type;
			}
		} else {
			actionType = ACTION_TYPES.KEY;
		}
	});

	// Key + modifiers state
	let keyModifiers = $state<string[]>([]);

	$effect(() => {
		if (currentAction?.type === 'key') {
			keyModifiers = currentAction.modifiers ? [...currentAction.modifiers] : [];
		}
	});

	function handleActionTypeChange(newType: string) {
		actionType = newType;
		if (!selectedKey) return;

		switch (newType) {
			case ACTION_TYPES.KEY:
				keyModifiers = [];
				onactionchange(selectedKey.id, {
					type: 'key',
					value: currentAction?.type === 'key' ? currentAction.value : (selectedKey.kanataName ?? '_')
				});
				break;
			case ACTION_TYPES.TAP_HOLD:
				// Will be set by TapHoldForm when user configures it
				if (currentAction?.type !== 'tap-hold') {
					onactionchange(selectedKey.id, {
						type: 'tap-hold',
						variant: 'tap-hold',
						tapTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
						holdTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
						tapAction: { type: 'key', value: selectedKey.kanataName ?? '_' },
						holdAction: { type: 'layer-while-held', layer: layers[1]?.name ?? 'layer-0' }
					});
				}
				break;
		}
	}

	function handleKeyPick(kanataKeyName: string) {
		if (!selectedKey) return;
		// Special keys: Transparent and No-op
		if (kanataKeyName === '_') {
			onactionchange(selectedKey.id, { type: 'transparent' });
			return;
		}
		if (kanataKeyName === 'XX') {
			onactionchange(selectedKey.id, { type: 'no-op' });
			return;
		}
		const action: KeyAction = keyModifiers.length > 0
			? { type: 'key', value: kanataKeyName, modifiers: [...keyModifiers] }
			: { type: 'key', value: kanataKeyName };
		onactionchange(selectedKey.id, action);
	}

	function toggleKeyModifier(mod: string) {
		if (keyModifiers.includes(mod)) {
			keyModifiers = keyModifiers.filter((m) => m !== mod);
		} else {
			keyModifiers = [...keyModifiers, mod];
		}
		// Update the action with new modifiers
		if (!selectedKey) return;
		const currentValue = currentAction?.type === 'key' ? currentAction.value : (selectedKey.kanataName ?? '_');
		const sorted = MODIFIER_SORT_ORDER.filter((m) => keyModifiers.includes(m));
		const action: KeyAction = sorted.length > 0
			? { type: 'key', value: currentValue, modifiers: sorted }
			: { type: 'key', value: currentValue };
		onactionchange(selectedKey.id, action);
	}
</script>

<div class="action-panel">
	{#if !selectedKey}
		<p class="py-8 text-center text-sm text-gray-400" data-testid="action-panel-placeholder">{m.panel_selectKey()}</p>
	{:else}
		<!-- Header: key info -->
		<div class="mb-3">
			<div class="text-xs font-semibold text-gray-500">
				{selectedKey.label}
				<span class="font-normal text-gray-400">({selectedKey.kanataName ?? selectedKey.id})</span>
			</div>
		</div>

		<!-- Horizontal layout: controls left + key grid right -->
		<div class="flex gap-4">
			<!-- Left: Action type + modifiers -->
			<div class="w-48 shrink-0">
				<!-- Action type selector -->
				<div class="mb-3">
					<label for="action-type-select" class="mb-1 block text-xs font-medium text-gray-600">{m.panel_actionType()}</label>
					<select
						id="action-type-select"
						class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
						value={actionType}
						onchange={(e) => handleActionTypeChange(e.currentTarget.value)}
					>
						<option value={ACTION_TYPES.KEY}>{m.panel_actionKey()}</option>
						<option value={ACTION_TYPES.TAP_HOLD}>{m.panel_actionTapHold()}</option>
					</select>
				</div>

				{#if actionType === ACTION_TYPES.KEY}
					<!-- Modifier checkboxes (L/R) -->
					<fieldset>
						<legend class="mb-1 block text-xs font-medium text-gray-600">{m.panel_modifiers()}</legend>
						<div class="grid grid-cols-2 gap-1">
							{#each MODIFIER_KEYS as mod}
								<button
									class="rounded border px-2 py-1 text-xs transition-colors"
									class:bg-blue-500={keyModifiers.includes(mod.id)}
									class:text-white={keyModifiers.includes(mod.id)}
									class:border-gray-300={!keyModifiers.includes(mod.id)}
									onclick={() => toggleKeyModifier(mod.id)}
								>
									{getModifierLabel(mod.id)}
								</button>
							{/each}
						</div>
					</fieldset>
				{/if}
			</div>

			<!-- Right: Key picker / Tap-Hold form (fills remaining width) -->
			<div class="min-w-0 flex-1">
				{#if actionType === ACTION_TYPES.KEY}
					<KeyPicker
						currentValue={currentAction?.type === 'key' ? currentAction.value : currentAction?.type === 'transparent' ? '_' : currentAction?.type === 'no-op' ? 'XX' : undefined}
						onkeypick={handleKeyPick}
						{usMode}
						{templateKanataNames}
					/>
				{:else if actionType === ACTION_TYPES.TAP_HOLD}
					<TapHoldForm
						action={currentAction?.type === 'tap-hold' ? currentAction : undefined}
						{layers}
						{usMode}
						{templateKanataNames}
						ontaphold={(act) => {
							if (selectedKey) onactionchange(selectedKey.id, act);
						}}
					/>
				{/if}
			</div>
		</div>
	{/if}
</div>
