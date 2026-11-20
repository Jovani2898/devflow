<script lang="ts">
	import { PRIORITY_FILTERS, STATUSES, type PriorityFilter, type Status } from '#lib/tasks/domain.js';

	type Props = {
		selectedStatuses: Status[];
		priority: PriorityFilter;
		onStatusChange?: (status: Status, selected: boolean) => void;
		onPriorityChange?: (priority: PriorityFilter) => void;
		onClear?: () => void;
	};

	let { selectedStatuses, priority, onStatusChange, onPriorityChange, onClear }: Props = $props();

	function choiceClass(selected: boolean) {
		return selected
			? 'border-slate-900 bg-slate-900 text-white'
			: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
	}
</script>

<section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="text-xs font-medium tracking-wide text-slate-500 uppercase" aria-hidden="true">Status</p>
			<div role="group" aria-label="Status" class="mt-2 flex flex-wrap gap-2">
				{#each STATUSES as status (status)}
					<label
						class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm {choiceClass(
							selectedStatuses.includes(status)
						)}"
					>
						<input
							class="accent-slate-900"
							type="checkbox"
							checked={selectedStatuses.includes(status)}
							onchange={(event) =>
								onStatusChange?.(status, (event.currentTarget as HTMLInputElement).checked)}
						/>
						{status}
					</label>
				{/each}
			</div>
		</div>
		<div>
			<p class="text-xs font-medium tracking-wide text-slate-500 uppercase" aria-hidden="true">Priority</p>
			<div role="radiogroup" aria-label="Priority" class="mt-2 flex flex-wrap gap-2">
				{#each PRIORITY_FILTERS as option (option)}
					<label
						class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm {choiceClass(
							priority === option
						)}"
					>
						<input
							class="accent-slate-900"
							type="radio"
							name="board-priority-filter"
							value={option}
							checked={priority === option}
							onchange={() => onPriorityChange?.(option)}
						/>
						{option}
					</label>
				{/each}
			</div>
		</div>
		<button
			type="button"
			class="inline-flex w-fit items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
			onclick={() => onClear?.()}
		>
			Clear filters
		</button>
	</div>
</section>
