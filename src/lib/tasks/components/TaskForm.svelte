<script lang="ts">
	import {
		fieldErrorMessage,
		MESSAGES,
		PRIORITIES,
		STATUSES,
		validateFields,
		type FieldError,
		type Priority,
		type Status
	} from '#lib/tasks/domain.js';

	type Props = {
		open: boolean;
		mode?: 'create' | 'edit';
		title?: string;
		description?: string;
		priority?: Priority;
		status?: Status;
		fieldError?: FieldError | null;
		saveError?: boolean;
		unavailable?: boolean;
		returnFocusId?: string | null;
		onSave?: (values: { title: string; description: string; priority: string; status: string }) => void;
		onCancel?: () => void;
	};

	let {
		open,
		mode = 'create',
		title = '',
		description = '',
		priority = 'Medium',
		status = 'To Do',
		fieldError = null,
		saveError = false,
		unavailable = false,
		returnFocusId = null,
		onSave,
		onCancel
	}: Props = $props();

	let draftTitle = $state('');
	let draftDescription = $state('');
	let draftPriority = $state<Priority>('Medium');
	let draftStatus = $state<Status>('To Do');
	let localError = $state<FieldError | null>(null);
	let dialog = $state<HTMLDialogElement | null>(null);
	let seenOpen = false;

	const shownError = $derived(localError ?? fieldError);
	const dialogTitle = $derived(mode === 'edit' ? 'Edit task' : 'Create task');

	function restoreFocus() {
		const target = returnFocusId ? document.getElementById(returnFocusId) : null;
		const fallback = document.getElementById('create-task');
		const chosen = target && target.isConnected ? target : fallback;
		chosen?.focus();
	}

	$effect(() => {
		if (!open || seenOpen) return;
		draftTitle = title;
		draftDescription = description;
		draftPriority = priority;
		draftStatus = status;
		localError = null;
		seenOpen = true;
	});

	$effect(() => {
		if (!open) seenOpen = false;
	});

	$effect(() => {
		const element = dialog;
		if (!element) return;
		if (open) {
			if (!element.open) element.showModal();
			return;
		}
		if (!element.open) return;
		element.close();
		restoreFocus();
	});

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const result = validateFields({
			title: draftTitle,
			description: draftDescription,
			priority: draftPriority,
			status: draftStatus
		});
		if (!result.ok) {
			if (result.error !== 'invalid') localError = result.error;
			return;
		}
		localError = null;
		onSave?.({
			title: draftTitle,
			description: draftDescription,
			priority: draftPriority,
			status: draftStatus
		});
	}
</script>

<dialog
	aria-labelledby="task-form-title"
	class="max-h-[calc(100%-2rem)] w-[min(32rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
	bind:this={dialog}
	oncancel={(event) => {
		event.preventDefault();
		onCancel?.();
	}}
>
	<h2 id="task-form-title" class="text-lg font-semibold tracking-tight text-slate-950">{dialogTitle}</h2>
	<form class="mt-4 flex flex-col gap-4" novalidate onsubmit={submit}>
		<label class="flex flex-col gap-1 text-sm font-medium text-slate-700">
			Title
			<input class="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900" bind:value={draftTitle} />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-slate-700">
			Description
			<textarea class="min-h-28 rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900" bind:value={draftDescription}></textarea>
		</label>
		<div class="grid gap-4 sm:grid-cols-2">
			<label class="flex flex-col gap-1 text-sm font-medium text-slate-700">
				Priority
				<select class="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900" bind:value={draftPriority}>
					{#each PRIORITIES as option (option)}
						<option>{option}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-slate-700">
				Status
				<select class="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900" bind:value={draftStatus}>
					{#each STATUSES as option (option)}
						<option>{option}</option>
					{/each}
				</select>
			</label>
		</div>
		{#if shownError}
			<p class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{fieldErrorMessage(shownError)}</p>
		{/if}
		{#if saveError}
			<p class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{MESSAGES.saveFailed}</p>
		{/if}
		{#if unavailable}
			<p class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{MESSAGES.missing}</p>
		{/if}
		<div class="flex flex-row-reverse justify-start gap-2">
			<button
				type="submit"
				class="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
			>
				Save
			</button>
			<button
				type="button"
				class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
				onclick={() => onCancel?.()}
			>
				Cancel
			</button>
		</div>
	</form>
</dialog>
