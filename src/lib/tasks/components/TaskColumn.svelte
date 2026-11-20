<script lang="ts">
	import type { Status, Task } from '#lib/tasks/domain.js';
	import TaskCard from '#lib/tasks/components/TaskCard.svelte';

	type Props = {
		status: Status;
		tasks: Task[];
		onEdit?: (id: string) => void;
		onDelete?: (id: string) => void;
		onMove?: (id: string, status: Status) => boolean | void;
	};

	let { status, tasks, onEdit, onDelete, onMove }: Props = $props();
	const headingId = $derived(`column-${status.toLowerCase().replaceAll(' ', '-')}`);
	const accent: Record<Status, string> = {
		'To Do': 'border-t-sky-500',
		'In Progress': 'border-t-amber-500',
		Done: 'border-t-emerald-500'
	};
</script>

<section class="flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200 border-t-4 bg-slate-100/80 p-3 {accent[status]}" aria-labelledby={headingId}>
	<div class="mb-3 flex items-center justify-between gap-2">
		<h2 id={headingId} class="text-base font-semibold text-slate-800">{status}</h2>
		<p class="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{tasks.length}</p>
	</div>
	{#if tasks.length === 0}
		<p class="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">No tasks</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each tasks as task (task.id)}
				<TaskCard
					id={task.id}
					title={task.title}
					priority={task.priority}
					status={task.status}
					{onEdit}
					{onDelete}
					{onMove}
				/>
			{/each}
		</div>
	{/if}
</section>
