<script lang="ts">
	import { isStatus, STATUSES, type Priority, type Status } from '#lib/tasks/domain.js';

	type Props = {
		id: string;
		title: string;
		priority: Priority;
		status: Status;
		onEdit?: (id: string) => void;
		onDelete?: (id: string) => void;
		onMove?: (id: string, status: Status) => boolean | void;
	};

	let { id, title, priority, status, onEdit, onDelete, onMove }: Props = $props();

	const priorityClass: Record<Priority, string> = {
		Low: 'bg-slate-100 text-slate-700',
		Medium: 'bg-amber-100 text-amber-950',
		High: 'bg-rose-100 text-rose-800'
	};

	function changeStatus(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const value = select.value;
		if (!isStatus(value) || value === status) return;
		const stored = onMove?.(id, value);
		if (stored !== true && select.value !== status) select.value = status;
	}
</script>

<article class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
	<div class="flex items-start justify-between gap-3">
		<p class="min-w-0 font-medium break-words text-slate-950">{title}</p>
		<p class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium {priorityClass[priority]}">
			<span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
			{priority}
		</p>
	</div>
	<label class="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-500">
		<span class="sr-only">Status for {title}</span>
		<span aria-hidden="true">Status</span>
		<select
			class="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-900"
			oninput={changeStatus}
			onchange={changeStatus}
		>
			{#each STATUSES as option (option)}
				<option value={option} selected={status === option}>{option}</option>
			{/each}
		</select>
	</label>
	<div class="mt-3 flex items-center gap-2">
		<button
			id="edit-{id}"
			type="button"
			aria-label="Edit {title}"
			class="rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
			onclick={() => onEdit?.(id)}
		>
			Edit
		</button>
		<button
			id="delete-{id}"
			type="button"
			aria-label="Delete {title}"
			class="rounded-md px-2 py-1 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
			onclick={() => onDelete?.(id)}
		>
			Delete
		</button>
	</div>
</article>
