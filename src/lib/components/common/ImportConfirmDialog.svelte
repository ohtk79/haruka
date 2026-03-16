<!--
  ImportConfirmDialog — 共有 URL 復元確認ダイアログ
  Props: open: boolean, summary: ImportSummary, onconfirm: () => void, oncancel: () => void
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import type { ImportSummary } from '$lib/models/share-types';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		open: boolean;
		summary: ImportSummary;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let { open, summary, onconfirm, oncancel }: Props = $props();

	let dialogRef: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialogRef) return;
		if (open && !dialogRef.open) {
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
	aria-labelledby="import-dialog-title"
	aria-describedby="import-dialog-desc"
	onclose={oncancel}
>
	<h2 id="import-dialog-title" class="mb-4 text-lg font-semibold text-gray-900">{m.dialog_import_title()}</h2>

	<div id="import-dialog-desc" class="mb-4 space-y-2 text-sm text-gray-600">
		<p>{m.dialog_import_description()}</p>
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
			<dt class="font-medium text-gray-700" data-testid="import-summary-template">{m.dialog_import_template()}</dt>
			<dd>{summary.templateName}</dd>
			<dt class="font-medium text-gray-700" data-testid="import-summary-layers">{m.dialog_import_layerCount()}</dt>
			<dd>{summary.layerCount}</dd>
			<dt class="font-medium text-gray-700" data-testid="import-summary-changes">{m.dialog_import_changedKeys()}</dt>
			<dd>{summary.changedKeyCount}</dd>
			<dt class="font-medium text-gray-700">{m.dialog_import_changedSettings()}</dt>
			<dd>{summary.changedSettingsCount}</dd>
		</dl>
		{#if summary.currentTemplateName}
			<p class="mt-2 rounded bg-yellow-50 p-2 text-yellow-800">
				{m.dialog_import_templateWarning({ currentTemplate: summary.currentTemplateName ?? '' })}
			</p>
		{/if}
	</div>

	<div class="flex justify-end gap-2">
		<button
			class="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
			onclick={oncancel}
			data-testid="btn-dialog-cancel"
		>
			{m.button_cancel()}
		</button>
		<button
			class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
			onclick={onconfirm}
			data-testid="btn-import-confirm"
		>
			{m.dialog_import_confirm()}
		</button>
	</div>
</dialog>
