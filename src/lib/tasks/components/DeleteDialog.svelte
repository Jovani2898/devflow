<script lang="ts">
	import { MESSAGES } from '#lib/tasks/domain.js';

	type Props = {
		open: boolean;
		title: string;
		saveError?: boolean;
		returnFocusId?: string | null;
		onConfirm?: () => void;
		onCancel?: () => void;
	};

	let { open, title, saveError = false, returnFocusId = null, onConfirm, onCancel }: Props = $props();
	let dialog = $state<HTMLDialogElement | null>(null);
	let seenOpen = false;

	function restoreFocus() {
		const target = returnFocusId ? document.getElementById(returnFocusId) : null;
		const fallback = document.getElementById('create-task');
		const chosen = target && target.isConnected ? target : fallback;
		chosen?.focus();
	}

	$effect(() => {
		const element = dialog;
		if (!element) return;
		if (open) {
			seenOpen = true;
			if (!element.open) element.showModal();
			return;
		}
		if (!seenOpen || !element.open) return;
		element.close();
		restoreFocus();
		seenOpen = false;
	});

	function cancel(event: Event) {
		event.preventDefault();
		onCancel?.();
	}
</script>

<dialog
	aria-label="Delete {title}"
	class="w-[min(28rem,calc(100%-2rem))] rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
	bind:this={dialog}
	oncancel={cancel}
>
	<p class="text-lg font-semibold tracking-tight text-slate-950">Delete this task?</p>
	<p class="mt-2 text-sm text-slate-600">Delete {title}?</p>
	{#if saveError}
		<p class="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
			{MESSAGES.saveFailed}
		</p>
	{/if}
	<div class="mt-6 flex justify-end gap-2">
		<button
			type="button"
			class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
			onclick={() => onCancel?.()}
		>
			Cancel
		</button>
		<button
			type="button"
			class="rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
			onclick={() => onConfirm?.()}
		>
			Confirm delete
		</button>
	</div>
</dialog>
