import { browser } from '$app/env';
import {
	columnTasks,
	createTask,
	deleteTask,
	filtersAfterDelete,
	isStatus,
	STATUSES,
	updateTask,
	validateFields,
	visibleColumns,
	moveTask,
	type FieldError,
	type Priority,
	type PriorityFilter,
	type Status,
	type Task
} from '#lib/tasks/domain.js';
import { loadBoard, saveBoard, type StoragePort } from '#lib/tasks/storage.js';

export type Phase = 'loading' | 'ready' | 'load-error';
export type ColumnView = { status: Status; tasks: Task[] };

class Board {
	phase = $state<Phase>('loading');
	tasks = $state<Task[]>([]);
	selectedStatuses = $state<Status[]>([...STATUSES]);
	priorityFilter = $state<PriorityFilter>('All');
	formOpen = $state(false);
	formMode = $state<'create' | 'edit'>('create');
	editingId = $state<string | null>(null);
	formTitle = $state('');
	formDescription = $state('');
	formPriority = $state<Priority>('Medium');
	formStatus = $state<Status>('To Do');
	fieldError = $state<FieldError | null>(null);
	saveError = $state(false);
	unavailable = $state(false);
	deleteTaskId = $state<string | null>(null);
	returnFocusId = $state<string | null>(null);

	private started = false;
	private clock = 0;
	private storage: StoragePort | null = null;

	init() {
		if (!browser || this.started) return;
		this.started = true;
		this.storage = localStorage;
		const loaded = loadBoard(localStorage);
		if (!loaded.ok) {
			this.phase = 'load-error';
			return;
		}
		this.tasks = loaded.tasks;
		this.clock = loaded.tasks.reduce((max, task) => Math.max(max, task.placedAt), 0);
		this.selectedStatuses = [...STATUSES];
		this.priorityFilter = 'All';
		this.phase = 'ready';
	}

	columns(): ColumnView[] {
		return visibleColumns(this.selectedStatuses).map((status) => ({
			status,
			tasks: columnTasks(this.tasks, status, this.priorityFilter)
		}));
	}

	showNoTasksYet(): boolean {
		return this.phase === 'ready' && this.tasks.length === 0 && this.selectedStatuses.length > 0;
	}

	showNoStatuses(): boolean {
		return this.phase === 'ready' && this.selectedStatuses.length === 0;
	}

	pendingDelete(): { id: string; title: string } | null {
		if (!this.deleteTaskId) return null;
		const task = this.tasks.find((item) => item.id === this.deleteTaskId);
		return { id: this.deleteTaskId, title: task?.title ?? '' };
	}

	openCreate() {
		this.returnFocusId = 'create-task';
		this.formMode = 'create';
		this.editingId = null;
		this.formTitle = '';
		this.formDescription = '';
		this.formPriority = 'Medium';
		this.formStatus = 'To Do';
		this.fieldError = null;
		this.saveError = false;
		this.unavailable = false;
		this.formOpen = true;
	}

	openEdit(id: string) {
		const task = this.tasks.find((item) => item.id === id);
		if (!task) {
			this.unavailable = true;
			return;
		}
		this.returnFocusId = `edit-${id}`;
		this.formMode = 'edit';
		this.editingId = id;
		this.formTitle = task.title;
		this.formDescription = task.description;
		this.formPriority = task.priority;
		this.formStatus = task.status;
		this.fieldError = null;
		this.saveError = false;
		this.unavailable = false;
		this.formOpen = true;
	}

	cancelForm() {
		this.formOpen = false;
		this.fieldError = null;
		this.saveError = false;
	}

	submit(values: { title: string; description: string; priority: string; status: string }) {
		this.fieldError = null;
		this.saveError = false;
		const validated = validateFields(values);
		if (!validated.ok) {
			if (validated.error !== 'invalid') this.fieldError = validated.error;
			return;
		}
		if (this.formMode === 'create') {
			const created = createTask(this.tasks, {
				id: crypto.randomUUID(),
				title: values.title,
				description: values.description,
				priority: values.priority,
				status: values.status,
				placedAt: this.allocatePlacedAt()
			});
			if (!created.ok) {
				if (created.error !== 'invalid') this.fieldError = created.error;
				return;
			}
			if (this.persist(created.tasks)) this.formOpen = false;
			return;
		}
		const id = this.editingId;
		const existing = id ? this.tasks.find((task) => task.id === id) : undefined;
		if (!id || !existing) {
			this.unavailable = true;
			return;
		}
		const updated = updateTask(this.tasks, id, {
			...values,
			placedAt: validated.status === existing.status ? existing.placedAt : this.allocatePlacedAt()
		});
		if (!updated.ok) {
			if (updated.error === 'missing') this.unavailable = true;
			else if (updated.error !== 'invalid') this.fieldError = updated.error;
			return;
		}
		if (this.persist(updated.tasks)) this.formOpen = false;
	}

	move(id: string, status: string): boolean {
		if (!isStatus(status)) return false;
		const existing = this.tasks.find((task) => task.id === id);
		if (!existing || existing.status === status) return false;
		const moved = moveTask(this.tasks, id, status, this.allocatePlacedAt());
		if (!moved.ok) return false;
		return this.persist(moved.tasks);
	}

	requestDelete(id: string) {
		this.returnFocusId = `delete-${id}`;
		this.deleteTaskId = id;
		this.saveError = false;
	}

	cancelDelete() {
		this.deleteTaskId = null;
	}

	confirmDelete() {
		const id = this.deleteTaskId;
		if (!id) return;
		const removed = deleteTask(this.tasks, id);
		if (!removed.ok) {
			this.unavailable = true;
			this.deleteTaskId = null;
			return;
		}
		if (!this.persist(removed.tasks)) return;
		this.deleteTaskId = null;
		const reset = filtersAfterDelete(removed.tasks.length);
		if (!reset) return;
		this.selectedStatuses = reset.statuses;
		this.priorityFilter = reset.priority;
	}

	setStatus(status: Status, selected: boolean) {
		const next = new Set(this.selectedStatuses);
		if (selected) next.add(status);
		else next.delete(status);
		this.selectedStatuses = STATUSES.filter((item) => next.has(item));
	}

	setPriority(priority: PriorityFilter) {
		this.priorityFilter = priority;
	}

	clearFilters() {
		this.selectedStatuses = [...STATUSES];
		this.priorityFilter = 'All';
	}

	private allocatePlacedAt(): number {
		const highest = this.tasks.reduce((max, task) => Math.max(max, task.placedAt), this.clock);
		this.clock = highest + 1;
		return this.clock;
	}

	private persist(tasks: Task[]): boolean {
		if (!this.storage) return false;
		const saved = saveBoard(this.storage, tasks);
		if (!saved.ok) {
			this.saveError = true;
			return false;
		}
		this.tasks = tasks;
		this.saveError = false;
		return true;
	}
}

export const board = new Board();
