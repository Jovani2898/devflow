<script lang="ts">
	import { MESSAGES, type Status, type Task } from '#lib/tasks/domain.js';
	import DeleteDialog from '#lib/tasks/components/DeleteDialog.svelte';
	import TaskColumn from '#lib/tasks/components/TaskColumn.svelte';

	type ColumnView = { status: Status; tasks: Task[] };

	type Props = {
		phase: 'ready' | 'load-error';
		columns?: ColumnView[];
		noTasksYet?: boolean;
		noStatuses?: boolean;
		unavailable?: boolean;
		saveError?: boolean;
		pendingDelete?: { id: string; title: string } | null;
		returnFocusId?: string | null;
		onEdit?: (id: string) => void;
		onDelete?: (id: string) => void;
		onMove?: (id: string, status: Status) => boolean | void;
		onConfirmDelete?: () => void;
		onCancelDelete?: () => void;
	};

	let {
		phase,
		columns = [],
		noTasksYet = false,
		noStatuses = false,
		unavailable = false,
		saveError = false,
		pendingDelete = null,
		returnFocusId = null,
		onEdit,
		onDelete,
		onMove,
		onConfirmDelete,
		onCancelDelete
	}: Props = $props();

	let localUnavailable = $state(false);

	function confirmDelete() {
		const id = pendingDelete?.id;
		const exists = columns.some((column) => column.tasks.some((task) => task.id === id));
		if (!id || !exists) {
			localUnavailable = true;
			onCancelDelete?.();
			return;
		}
		onConfirmDelete?.();
	}
</script>

{#if phase === 'load-error'}
	<p class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-800" role="alert">
		{MESSAGES.loadFailed}
	</p>
{:else}
	{#if noTasksYet}
		<p class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600">
			No tasks yet
		</p>
	{/if}
	{#if noStatuses}
		<p class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600">
			No statuses selected
		</p>
	{:else}
		<div class="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
			{#each columns as column (column.status)}
				<TaskColumn status={column.status} tasks={column.tasks} {onEdit} {onDelete} {onMove} />
			{/each}
		</div>
	{/if}
	{#if localUnavailable || unavailable}
		<p class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
			{MESSAGES.missing}
		</p>
	{/if}
	{#if saveError && pendingDelete === null}
		<p class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
			{MESSAGES.saveFailed}
		</p>
	{/if}
	<DeleteDialog
		open={pendingDelete !== null}
		title={pendingDelete?.title ?? ''}
		saveError={saveError && pendingDelete !== null}
		{returnFocusId}
		onConfirm={confirmDelete}
		onCancel={() => onCancelDelete?.()}
	/>
{/if}
