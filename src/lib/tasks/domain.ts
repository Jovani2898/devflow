export const STATUSES = ['To Do', 'In Progress', 'Done'] as const;
export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const PRIORITY_FILTERS = ['All', 'Low', 'Medium', 'High'] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type PriorityFilter = (typeof PRIORITY_FILTERS)[number];
export type FieldError = 'title-required' | 'title-too-long' | 'description-too-long';

export type Task = {
	id: string;
	title: string;
	description: string;
	priority: Priority;
	status: Status;
	placedAt: number;
};

export type TaskDraft = {
	id: string;
	title: string;
	description: string;
	priority: string;
	status: string;
	placedAt: number;
};

export const MESSAGES = {
	titleRequired: 'Title is required',
	titleTooLong: 'Title is too long',
	descriptionTooLong: 'Description is too long',
	loadFailed: 'Tasks could not be loaded',
	saveFailed: 'The task could not be saved',
	missing: 'The task is no longer available.'
} as const;

const TASK_KEYS = ['id', 'title', 'description', 'priority', 'status', 'placedAt'] as const;

export function isStatus(value: string): value is Status {
	return (STATUSES as readonly string[]).includes(value);
}

export function isPriority(value: string): value is Priority {
	return (PRIORITIES as readonly string[]).includes(value);
}

export function isPriorityFilter(value: string): value is PriorityFilter {
	return (PRIORITY_FILTERS as readonly string[]).includes(value);
}

export function fieldErrorMessage(error: FieldError): string {
	if (error === 'title-required') return MESSAGES.titleRequired;
	if (error === 'title-too-long') return MESSAGES.titleTooLong;
	return MESSAGES.descriptionTooLong;
}

export function validateFields(input: {
	title: string;
	description: string;
	priority: string;
	status: string;
}):
	| { ok: true; title: string; description: string; priority: Priority; status: Status }
	| { ok: false; error: FieldError | 'invalid' } {
	const title = input.title.trim();
	const description = input.description.trim();
	if (title.length === 0) return { ok: false, error: 'title-required' };
	if (title.length > 200) return { ok: false, error: 'title-too-long' };
	if (description.length > 5000) return { ok: false, error: 'description-too-long' };
	if (!isPriority(input.priority) || !isStatus(input.status)) return { ok: false, error: 'invalid' };
	return { ok: true, title, description, priority: input.priority, status: input.status };
}

export function parseTask(value: unknown): Task | null {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
	const record = value as Record<string, unknown>;
	const keys = Object.keys(record);
	if (keys.length !== TASK_KEYS.length || TASK_KEYS.some((key) => !Object.hasOwn(record, key))) return null;
	const { id, title, description, priority, status, placedAt } = record;
	if (typeof id !== 'string' || id.length === 0) return null;
	if (typeof title !== 'string' || title !== title.trim() || title.length < 1 || title.length > 200) return null;
	if (typeof description !== 'string' || description !== description.trim() || description.length > 5000) {
		return null;
	}
	if (typeof priority !== 'string' || !isPriority(priority)) return null;
	if (typeof status !== 'string' || !isStatus(status)) return null;
	if (typeof placedAt !== 'number' || !Number.isInteger(placedAt)) return null;
	return { id, title, description, priority, status, placedAt };
}

export function createTask(
	tasks: readonly Task[],
	input: TaskDraft
): { ok: true; tasks: Task[] } | { ok: false; error: FieldError | 'invalid' } {
	const validated = validateFields(input);
	if (!validated.ok) return validated;
	if (input.id.trim().length === 0 || !Number.isInteger(input.placedAt)) {
		return { ok: false, error: 'invalid' };
	}
	const task: Task = {
		id: input.id,
		title: validated.title,
		description: validated.description,
		priority: validated.priority,
		status: validated.status,
		placedAt: input.placedAt
	};
	return { ok: true, tasks: [...tasks, task] };
}

export function updateTask(
	tasks: readonly Task[],
	id: string,
	input: { title: string; description: string; priority: string; status: string; placedAt: number }
): { ok: true; tasks: Task[] } | { ok: false; error: FieldError | 'invalid' | 'missing' } {
	const current = tasks.find((task) => task.id === id);
	if (!current) return { ok: false, error: 'missing' };
	const validated = validateFields(input);
	if (!validated.ok) return validated;
	const next: Task = {
		id,
		title: validated.title,
		description: validated.description,
		priority: validated.priority,
		status: validated.status,
		placedAt: validated.status === current.status ? current.placedAt : input.placedAt
	};
	return { ok: true, tasks: tasks.map((task) => (task.id === id ? next : task)) };
}

export function moveTask(
	tasks: readonly Task[],
	id: string,
	status: Status,
	placedAt: number
): { ok: true; tasks: Task[] } | { ok: false; reason: 'missing' } {
	const current = tasks.find((task) => task.id === id);
	if (!current) return { ok: false, reason: 'missing' };
	if (current.status === status) return { ok: true, tasks: tasks.map((task) => ({ ...task })) };
	return {
		ok: true,
		tasks: tasks.map((task) => (task.id === id ? { ...task, status, placedAt } : { ...task }))
	};
}

export function deleteTask(
	tasks: readonly Task[],
	id: string
): { ok: true; tasks: Task[] } | { ok: false; reason: 'missing' } {
	if (!tasks.some((task) => task.id === id)) return { ok: false, reason: 'missing' };
	return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}

export function filtersAfterDelete(remaining: number): { statuses: Status[]; priority: PriorityFilter } | null {
	if (remaining !== 0) return null;
	return { statuses: [...STATUSES], priority: 'All' };
}

export function visibleColumns(selected: readonly Status[]): Status[] {
	const chosen = new Set(selected);
	return STATUSES.filter((status) => chosen.has(status));
}

export function columnTasks(tasks: readonly Task[], status: Status, priority: PriorityFilter): Task[] {
	return tasks
		.filter((task) => task.status === status && (priority === 'All' || task.priority === priority))
		.sort((left, right) => right.placedAt - left.placedAt || left.id.localeCompare(right.id));
}
