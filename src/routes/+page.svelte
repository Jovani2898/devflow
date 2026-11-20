<script lang="ts">
	import { browser } from '$app/env';
	import { MESSAGES } from '#lib/tasks/domain.js';
	import { board } from '#lib/tasks/board.svelte.js';
	import FilterBar from '#lib/tasks/components/FilterBar.svelte';
	import TaskBoard from '#lib/tasks/components/TaskBoard.svelte';
	import TaskForm from '#lib/tasks/components/TaskForm.svelte';

	$effect(() => {
		if (browser) board.init();
	});
</script>

<div class="min-h-screen">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
			<div>
				<p class="text-sm font-semibold tracking-tight text-slate-500">DevFlow</p>
				<h1 class="text-2xl font-semibold tracking-tight text-slate-950">Board</h1>
				<p class="mt-1 text-sm text-slate-600">One board for the tasks in this browser.</p>
			</div>
			{#if board.phase === 'ready'}
				<button
					id="create-task"
					type="button"
					class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
					onclick={() => board.openCreate()}
				>
					Create task
				</button>
			{/if}
		</div>
	</header>
	<main class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
		{#if board.phase === 'loading'}
			<p class="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600" role="status">
				Loading tasks
			</p>
		{:else if board.phase === 'load-error'}
			<TaskBoard phase="load-error" />
		{:else}
			<FilterBar
				selectedStatuses={board.selectedStatuses}
				priority={board.priorityFilter}
				onStatusChange={(status, selected) => board.setStatus(status, selected)}
				onPriorityChange={(priority) => board.setPriority(priority)}
				onClear={() => board.clearFilters()}
			/>
			{#if board.saveError && !board.formOpen && !board.pendingDelete()}
				<p class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
					{MESSAGES.saveFailed}
				</p>
			{/if}
			<TaskBoard
				phase="ready"
				columns={board.columns()}
				noTasksYet={board.showNoTasksYet()}
				noStatuses={board.showNoStatuses()}
				unavailable={board.unavailable && !board.formOpen}
				saveError={board.pendingDelete() !== null && board.saveError}
				pendingDelete={board.pendingDelete()}
				returnFocusId={board.returnFocusId}
				onEdit={(id) => board.openEdit(id)}
				onDelete={(id) => board.requestDelete(id)}
				onMove={(id, status) => board.move(id, status)}
				onConfirmDelete={() => board.confirmDelete()}
				onCancelDelete={() => board.cancelDelete()}
			/>
			<TaskForm
				open={board.formOpen}
				mode={board.formMode}
				title={board.formTitle}
				description={board.formDescription}
				priority={board.formPriority}
				status={board.formStatus}
				fieldError={board.fieldError}
				saveError={board.saveError}
				unavailable={board.unavailable && board.formOpen}
				returnFocusId={board.returnFocusId}
				onSave={(values) => board.submit(values)}
				onCancel={() => board.cancelForm()}
			/>
		{/if}
	</main>
</div>
