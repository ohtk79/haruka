<!--
  ShareDialog — 共有 URL 表示ダイアログ
  Props: open: boolean, url: string, onclose: () => void
  Used by: Header.svelte
-->
<script lang="ts">
	import { URL_LENGTH_WARNING, URL_LENGTH_ERROR } from '$lib/models/constants';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		open: boolean;
		url: string;
		onclose: () => void;
	}

	let { open, url, onclose }: Props = $props();

	let dialogRef: HTMLDialogElement | undefined = $state();
	let copied = $state(false);

	$effect(() => {
		if (!dialogRef) return;
		if (open && !dialogRef.open) {
			dialogRef.showModal();
			copied = false;
		} else if (!open && dialogRef.open) {
			dialogRef.close();
		}
	});

	/** URL の長さに応じた色クラスを返す */
	const lengthColorClass = $derived.by(() => {
		const len = url.length;
		if (len >= URL_LENGTH_ERROR) return 'text-red-600';
		if (len >= URL_LENGTH_WARNING) return 'text-yellow-600';
		return 'text-gray-500';
	});

	/** URL の長さに応じたメッセージ */
	const lengthMessage = $derived.by(() => {
		const len = url.length;
		if (len >= URL_LENGTH_ERROR) return m.dialog_share_warningLong();
		if (len >= URL_LENGTH_WARNING) return m.dialog_share_warningMedium();
		return '';
	});

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		} catch {
			// フォールバック: テキスト選択
			const input = dialogRef?.querySelector('input');
			if (input) {
				input.select();
				document.execCommand('copy');
				copied = true;
				setTimeout(() => { copied = false; }, 2000);
			}
		}
	}
</script>

<dialog
	bind:this={dialogRef}
	class="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl backdrop:bg-black/50"
	aria-labelledby="share-dialog-title"
	onclose={onclose}
>
	<h2 id="share-dialog-title" class="mb-4 text-lg font-semibold text-gray-900">{m.dialog_share_title()}</h2>

	<div class="mb-3">
		<label for="share-url-input" class="mb-1 block text-sm text-gray-600">{m.dialog_share_urlLabel()}</label>
		<div class="flex gap-2">
			<input
				id="share-url-input"
				type="text"
				readonly
				value={url}
				class="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
				onclick={(e) => (e.target as HTMLInputElement).select()}
			/>
			<button
				class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				onclick={handleCopy}
				data-testid="btn-copy-url"
			>
				{copied ? m.dialog_share_copied() : m.dialog_share_copy()}
			</button>
		</div>
	</div>

	<div class="mb-4 flex items-center justify-between text-sm">
		<span class={lengthColorClass} data-testid="share-url-char-count">{m.dialog_share_charCount({ count: url.length.toLocaleString() })}</span>
		{#if lengthMessage}
			<span class={lengthColorClass}>{lengthMessage}</span>
		{/if}
	</div>

	<div class="flex justify-end">
		<button
			class="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
			onclick={onclose}
			data-testid="btn-dialog-close"
		>
			{m.button_close()}
		</button>
	</div>
</dialog>
