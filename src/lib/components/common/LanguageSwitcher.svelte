<!--
  LanguageSwitcher — 言語切替ドロップダウン (ja/en)
  Props: なし
  Used by: Header.svelte
-->
<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';

	// 言語表示名のマッピング
	const localeNames: Record<string, () => string> = {
		ja: () => m.languageSwitcher_ja(),
		en: () => m.languageSwitcher_en()
	};

	function handleChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const newLocale = select.value;
		// setLocale はデフォルトで localStorage に保存しページリロードする
		setLocale(newLocale as 'ja' | 'en');
	}
</script>

<label class="flex items-center gap-1 text-sm text-gray-600">
	<span class="sr-only">{m.languageSwitcher_label()}</span>
	<select
		class="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
		value={getLocale()}
		onchange={handleChange}
		data-testid="language-switcher"
	>
		{#each locales as locale}
			<option value={locale}>{localeNames[locale]?.() ?? locale}</option>
		{/each}
	</select>
</label>
