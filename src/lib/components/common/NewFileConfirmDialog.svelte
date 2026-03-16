<!--
  NewFileConfirmDialog — Confirm dialog for creating a new file
  Props: open, onconfirm, oncancel
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	interface Props {
		open: boolean;
		templateName: string;
		showJisUsToggle: boolean;
		showKeOnlyNotice: boolean;
		oncreate: (jisToUsRemap: boolean) => void;
		oncancel: () => void;
	}

	let { open, templateName, showJisUsToggle, showKeOnlyNotice, oncreate, oncancel }: Props = $props();

	let jisToUsRemap = $state(false);
	let dialogRef: HTMLDialogElement | undefined = $state();

	/** ネイティブdialogのバックドロップクリックで閉じる */
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialogRef) {
			oncancel();
		}
	}

	// Reset toggle state and manage dialog open/close
	$effect(() => {
		if (!dialogRef) return;
		if (open && !dialogRef.open) {
			jisToUsRemap = false;
			dialogRef.showModal();
		} else if (!open && dialogRef.open) {
			dialogRef.close();
		}
	});
</script>

<dialog
	bind:this={dialogRef}
	class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl backdrop:bg-black/50"
	role="alertdialog"
	aria-labelledby="newfile-dialog-title"
	aria-describedby="newfile-dialog-desc"
	onclose={oncancel}
	onclick={handleBackdropClick}
>
	<h2 id="newfile-dialog-title" class="mb-2 text-lg font-semibold text-gray-900">
		{m.dialog_newFile_title()}
	</h2>
	<p id="newfile-dialog-desc" class="mb-4 text-sm text-gray-600">
		{m.dialog_newFile_message({ templateName })}
	</p>

	{#if showKeOnlyNotice}
		<p class="mb-4 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800" data-testid="newfile-ke-only-notice">
			{m.dialog_newFile_keOnlyNotice()}
		</p>
	{/if}

	{#if showJisUsToggle}
		<div class="mb-4 border-t border-gray-200 pt-3">
			<label class="flex cursor-pointer select-none items-center gap-3">
				<span class="text-sm font-medium text-gray-700">{m.dialog_newFile_useAsUs()}</span>
				<button
					type="button"
					role="switch"
					aria-checked={jisToUsRemap}
					aria-label={m.dialog_newFile_useAsUs()}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {jisToUsRemap
						? 'bg-blue-600'
						: 'bg-gray-300'}"
					onclick={() => (jisToUsRemap = !jisToUsRemap)}
				>
					<span
						class="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 {jisToUsRemap
							? 'translate-x-6'
							: 'translate-x-1'}"
					></span>
				</button>
				<span class="text-xs text-gray-500">{jisToUsRemap ? m.toggle_on() : m.toggle_off()}</span>
			</label>
		</div>
	{/if}

	<div class="flex justify-end gap-2">
		<button
			class="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
			onclick={oncancel}
			data-testid="btn-dialog-cancel"
		>
			{m.button_cancel()}
		</button>
		<button
			class="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
			onclick={() => oncreate(jisToUsRemap)}
			data-testid="btn-confirm-create"
		>
			{m.dialog_newFile_confirm()}
		</button>
	</div>
</dialog>
