<!--
  ConfirmDialog — Generic confirmation dialog with OK/Cancel
  Props: open, title, message, onconfirm, oncancel
  Used by: routes/+page.svelte
-->
<script lang="ts">
	interface Props {
		open: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		cancelLabel?: string;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open,
		title,
		description,
		confirmLabel = 'OK',
		cancelLabel = 'Cancel',
		onconfirm,
		oncancel
	}: Props = $props();

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
	aria-labelledby="dialog-title"
	aria-describedby="dialog-desc"
	onclose={oncancel}
>
	<h2 id="dialog-title" class="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
	<p id="dialog-desc" class="mb-4 text-sm text-gray-600">{description}</p>
	<div class="flex justify-end gap-2">
		<button
			class="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
			onclick={oncancel}
		>
			{cancelLabel}
		</button>
		<button
			class="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
			onclick={onconfirm}
		>
			{confirmLabel}
		</button>
	</div>
</dialog>
