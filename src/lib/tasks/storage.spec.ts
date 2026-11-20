import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '#lib/tasks/domain.js';
import { BOARD_STORAGE_KEY, loadBoard, saveBoard, type StoragePort } from '#lib/tasks/storage.js';

function task(overrides: Partial<Task> = {}): Task {
	return {
		id: 'task-1',
		title: 'Write spec',
		description: 'First task',
		priority: 'High',
		status: 'In Progress',
		placedAt: 1,
		...overrides
	};
}

function memory(initial: string | null = null, fail?: (value: string) => void) {
	let current = initial;
	let writes = 0;
	const storage: StoragePort = {
		getItem(key) {
			expect(key).toBe(BOARD_STORAGE_KEY);
			return current;
		},
		setItem(key, value) {
			expect(key).toBe(BOARD_STORAGE_KEY);
			writes += 1;
			if (fail) fail(value);
			current = value;
		}
	};
	return {
		storage,
		read: () => current,
		writes: () => writes
	};
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('loadBoard and saveBoard', () => {
	it('returns no tasks for a missing key and does not write', () => {
		const store = memory(null);
		expect(loadBoard(store.storage)).toEqual({ ok: true, tasks: [] });
		expect(store.writes()).toBe(0);
	});

	it('round-trips a version 1 document without filter or draft fields', () => {
		const store = memory();
		expect(saveBoard(store.storage, [task()])).toEqual({ ok: true });
		const parsed = JSON.parse(store.read() ?? '') as Record<string, unknown>;
		expect(Object.keys(parsed).sort()).toEqual(['tasks', 'version']);
		expect(parsed.version).toBe(1);
		expect(JSON.stringify(parsed)).not.toContain('priorityFilter');
		expect(JSON.stringify(parsed)).not.toContain('draft');
		expect(loadBoard(store.storage)).toEqual({ ok: true, tasks: [task()] });
		expect(store.writes()).toBe(1);
	});

	it('treats corrupt JSON, another version, an invalid task, and extra fields as corrupt without writing', () => {
		for (const initial of [
			'{',
			JSON.stringify({ version: 2, tasks: [] }),
			JSON.stringify({ version: 1, tasks: [{ ...task(), priority: 'Urgent' }] }),
			JSON.stringify({ version: 1, tasks: [], extra: true })
		]) {
			const store = memory(initial);
			expect(loadBoard(store.storage)).toEqual({ ok: false, reason: 'corrupt' });
			expect(store.read()).toBe(initial);
			expect(store.writes()).toBe(0);
		}
	});

	it('returns unavailable when getItem throws and does not write', () => {
		let writes = 0;
		const storage: StoragePort = {
			getItem() {
				throw new Error('blocked');
			},
			setItem() {
				writes += 1;
			}
		};
		expect(loadBoard(storage)).toEqual({ ok: false, reason: 'unavailable' });
		expect(writes).toBe(0);
	});

	it('returns quota or unavailable when setItem throws and leaves the previous string in place', () => {
		const quota = memory('{', () => {
			throw Object.assign(new Error('full'), { name: 'QuotaExceededError' });
		});
		expect(saveBoard(quota.storage, [task()])).toEqual({ ok: false, reason: 'quota' });
		expect(quota.read()).toBe('{');
		const blocked = memory('saved', () => {
			throw new Error('offline');
		});
		expect(saveBoard(blocked.storage, [task()])).toEqual({ ok: false, reason: 'unavailable' });
		expect(blocked.read()).toBe('saved');
		for (const error of [
			Object.assign(new Error('full'), { name: 'NS_ERROR_DOM_QUOTA_REACHED' }),
			Object.assign(new Error('full'), { code: 22 })
		]) {
			const quota = memory('saved', () => {
				throw error;
			});
			expect(saveBoard(quota.storage, [task()])).toEqual({ ok: false, reason: 'quota' });
			expect(quota.read()).toBe('saved');
		}
	});

	it('returns the same tasks from a second load of the same storage', () => {
		const store = memory();
		saveBoard(store.storage, [task(), task({ id: 'task-2', title: 'Other' })]);
		expect(loadBoard(store.storage)).toEqual(loadBoard(store.storage));
	});

	it('does not log task titles or descriptions', () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
		const store = memory();
		saveBoard(store.storage, [task({ title: 'Secret title', description: 'Secret description' })]);
		loadBoard(store.storage);
		const output = [...log.mock.calls, ...info.mock.calls, ...debug.mock.calls].flat().join(' ');
		expect(output).not.toContain('Secret title');
		expect(output).not.toContain('Secret description');
	});
});
