import { parseTask, type Task } from '#lib/tasks/domain.js';

export const BOARD_STORAGE_KEY = 'devflow.board.v1';

export type StoragePort = {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
};

export type LoadResult = { ok: true; tasks: Task[] } | { ok: false; reason: 'corrupt' | 'unavailable' };
export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' };

function isQuotaError(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;
	const name = 'name' in error ? String(error.name) : '';
	const code = 'code' in error ? error.code : undefined;
	return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || code === 22;
}

export function loadBoard(storage: StoragePort): LoadResult {
	let raw: string | null;
	try {
		raw = storage.getItem(BOARD_STORAGE_KEY);
	} catch {
		return { ok: false, reason: 'unavailable' };
	}
	if (raw === null) return { ok: true, tasks: [] };
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { ok: false, reason: 'corrupt' };
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		return { ok: false, reason: 'corrupt' };
	}
	const record = parsed as Record<string, unknown>;
	const keys = Object.keys(record);
	if (keys.length !== 2 || !Object.hasOwn(record, 'version') || !Object.hasOwn(record, 'tasks')) {
		return { ok: false, reason: 'corrupt' };
	}
	if (record.version !== 1 || !Array.isArray(record.tasks)) return { ok: false, reason: 'corrupt' };
	const tasks: Task[] = [];
	const ids = new Set<string>();
	for (const item of record.tasks) {
		const task = parseTask(item);
		if (!task || ids.has(task.id)) return { ok: false, reason: 'corrupt' };
		ids.add(task.id);
		tasks.push(task);
	}
	return { ok: true, tasks };
}

export function saveBoard(storage: StoragePort, tasks: readonly Task[]): SaveResult {
	const document = {
		version: 1 as const,
		tasks: tasks.map((task) => ({
			id: task.id,
			title: task.title,
			description: task.description,
			priority: task.priority,
			status: task.status,
			placedAt: task.placedAt
		}))
	};
	try {
		storage.setItem(BOARD_STORAGE_KEY, JSON.stringify(document));
		return { ok: true };
	} catch (error) {
		return { ok: false, reason: isQuotaError(error) ? 'quota' : 'unavailable' };
	}
}
