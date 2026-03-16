<!--
  KeyPicker — Category-tabbed kanata key selection grid with search
  Props: currentValue, onkeypick, usMode, excludeCategories, templateKanataNames
  Used by: components/panels/ActionPanel.svelte, components/panels/TapHoldForm.svelte
-->
<script lang="ts">
	import { KANATA_KEY_CATEGORIES, US_KEY_LABELS } from '$lib/utils/kanata-keys';
	import { ALL_TEMPLATE_KANATA_NAMES } from '$lib/templates';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		currentValue?: string;
		onkeypick: (kanataKeyName: string) => void;
		usMode?: boolean;
		excludeCategories?: string[];
		/** When provided, hides template-specific keys not in this set */
		templateKanataNames?: ReadonlySet<string>;
	}

	let { currentValue, onkeypick, usMode = false, excludeCategories = [], templateKanataNames }: Props = $props();

	/**
	 * JIS-specific keys that duplicate another key's label in US mode.
	 * Maps JIS key → US equivalent key (e.g. ¥ → \\).
	 */
	const US_MODE_KEY_ALIASES: ReadonlyMap<string, string> = new Map([['¥', '\\']]);

	/**
	 * Normalize a key name in US mode: map JIS-duplicate keys to their US equivalent.
	 * e.g. ¥ → \\ so that the KeyPicker highlights the correct button.
	 */
	function normalizeKey(name: string | undefined): string | undefined {
		if (!name || !usMode) return name;
		return US_MODE_KEY_ALIASES.get(name) ?? name;
	}

	/**
	 * Should a key be visible given the current template?
	 * A key is shown if:
	 * 1. In US mode, JIS-duplicate keys (e.g. ¥) are always hidden
	 * 2. No templateKanataNames provided → show all (backward compat)
	 * 3. Key is in the current template → show
	 * 4. Key is NOT in any template (e.g., media keys, _/XX) → show (generic output)
	 */
	function isKeyAvailable(kanataName: string): boolean {
		if (usMode && US_MODE_KEY_ALIASES.has(kanataName)) return false;
		if (!templateKanataNames) return true;
		if (templateKanataNames.has(kanataName)) return true;
		if (!ALL_TEMPLATE_KANATA_NAMES.has(kanataName)) return true;
		return false;
	}

	/** currentValue normalized for US mode (e.g. ¥ → \\) */
	let effectiveValue = $derived(normalizeKey(currentValue));

	let searchQuery = $state('');
	let activeCategory = $state('basic');
	let userSelectedCategory = $state(false);

	// Auto-switch category tab to follow effectiveValue (only when value actually changes)
	let prevValue = $state<string | undefined>(undefined);
	$effect(() => {
		if (effectiveValue !== prevValue) {
			prevValue = effectiveValue;
			userSelectedCategory = false;
		}
		if (!effectiveValue || userSelectedCategory) return;
		const cat = KANATA_KEY_CATEGORIES.find((c) => c.keys.some((k) => k.name === effectiveValue));
		if (cat && cat.id !== activeCategory) {
			activeCategory = cat.id;
		}
	});

	function selectCategory(catId: string) {
		activeCategory = catId;
		userSelectedCategory = true;
	}

	/** Get display label for a key, considering US mode */
	function getKeyLabel(name: string, jisLabel: string): string {
		if (usMode) {
			const usLabel = US_KEY_LABELS.get(name);
			if (usLabel) return usLabel;
		}
		return jisLabel;
	}

	let availableCategories = $derived(
		KANATA_KEY_CATEGORIES
			.filter((cat) => !excludeCategories.includes(cat.id))
			.map((cat) => ({
				...cat,
				keys: cat.keys.filter((k) => isKeyAvailable(k.name))
			}))
			.filter((cat) => cat.keys.length > 0)
	);

	let filteredCategories = $derived(
		availableCategories.map((cat) => ({
			...cat,
			keys: cat.keys.filter(
				(k) =>
					!searchQuery ||
					k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					k.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(usMode && US_KEY_LABELS.get(k.name)?.toLowerCase().includes(searchQuery.toLowerCase()))
			)
		})).filter((cat) => cat.keys.length > 0)
	);

	let displayCategory = $derived(
		searchQuery
			? filteredCategories
			: filteredCategories.filter((c) => c.id === activeCategory)
	);
</script>

<div class="key-picker">
	<!-- Search -->
	<input
		type="text"
		placeholder={m.panel_searchKeys()}
		bind:value={searchQuery}
		class="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
	/>

	<!-- Category tabs -->
	{#if !searchQuery}
		<div class="mb-2 flex flex-wrap gap-1">
			{#each availableCategories as cat}
				<button
					class="rounded px-2 py-0.5 text-xs transition-colors"
					class:bg-blue-500={activeCategory === cat.id}
					class:text-white={activeCategory === cat.id}
					class:bg-gray-100={activeCategory !== cat.id}
					class:text-gray-600={activeCategory !== cat.id}
					onclick={() => selectCategory(cat.id)}
				>
					{cat.label}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Key grid -->
	<div class="max-h-64 overflow-y-auto">
		{#each displayCategory as cat}
			{#if searchQuery}
				<div class="mb-1 text-xs font-semibold text-gray-400">{cat.label}</div>
			{/if}
			<div class="mb-2 grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
				{#each cat.keys as key}
					<button
						class="rounded border px-1 py-1.5 text-xs transition-colors"
						class:border-blue-500={effectiveValue === key.name}
						class:bg-blue-50={effectiveValue === key.name}
						class:border-gray-200={effectiveValue !== key.name}
						class:hover:bg-gray-50={effectiveValue !== key.name}
						onclick={() => onkeypick(key.name)}
						title={key.name}
					>
						{getKeyLabel(key.name, key.label)}
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>
