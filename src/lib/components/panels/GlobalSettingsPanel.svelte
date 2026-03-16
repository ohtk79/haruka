<!--
  GlobalSettingsPanel — Global settings (tapping term) editor
  Props: tappingTerm, ontappingtermchange
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import {
		TAP_HOLD_TIMEOUT_MIN,
		TAP_HOLD_TIMEOUT_MAX,
		TAP_HOLD_DEFAULT_TIMEOUT
	} from '$lib/models/constants';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		tappingTerm: number;
		ontappingtermchange: (value: number) => void;
	}

	let { tappingTerm, ontappingtermchange }: Props =
		$props();

	let inputValue = $state('');
	let error = $state<string | null>(null);

	// Sync from parent when prop changes externally
	$effect(() => {
		inputValue = String(tappingTerm);
	});

	function validate(raw: string): number | null {
		if (raw.trim() === '') return null;
		const num = Number(raw);
		if (!Number.isInteger(num)) {
			error = m.validation_fieldInteger({ fieldName: m.panel_tappingTerm() });
			return null;
		}
		if (num < TAP_HOLD_TIMEOUT_MIN || num > TAP_HOLD_TIMEOUT_MAX) {
			error = m.validation_timeoutRange({ min: String(TAP_HOLD_TIMEOUT_MIN), max: String(TAP_HOLD_TIMEOUT_MAX) });
			return null;
		}
		error = null;
		return num;
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		inputValue = target.value;
		const num = validate(inputValue);
		if (num !== null) {
			ontappingtermchange(num);
		}
	}

	function handleBlur() {
		if (inputValue.trim() === '') {
			inputValue = String(TAP_HOLD_DEFAULT_TIMEOUT);
			error = null;
			ontappingtermchange(TAP_HOLD_DEFAULT_TIMEOUT);
		}
	}
</script>

<div class="space-y-6">
	<h2 class="text-lg font-semibold text-gray-800">{m.panel_globalSettings()}</h2>

	<!-- Tapping Term -->
	<div class="space-y-1">
		<label for="tapping-term" class="block text-sm font-medium text-gray-700">{m.panel_tappingTerm()}</label>
		<div class="flex items-center gap-2">
			<input
				id="tapping-term"
				type="number"
				min={TAP_HOLD_TIMEOUT_MIN}
				max={TAP_HOLD_TIMEOUT_MAX}
				class="w-32 rounded border px-3 py-1.5 text-sm {error
					? 'border-red-400 focus:ring-red-500'
					: 'border-gray-300 focus:ring-blue-500'} focus:outline-none focus:ring-2"
				value={inputValue}
				oninput={handleInput}
				onblur={handleBlur}
			/>
			<span class="text-sm text-gray-500">{m.panel_ms()}</span>
		</div>
		{#if error}
			<p class="text-xs text-red-600">{error}</p>
		{:else}
			<p class="text-xs text-gray-500">{m.panel_tappingTermHelp()}</p>
		{/if}
	</div>
</div>
