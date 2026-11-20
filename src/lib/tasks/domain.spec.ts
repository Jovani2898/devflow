import { describe, expect, it } from 'vitest';
import {
	columnTasks,
	createTask,
	deleteTask,
	filtersAfterDelete,
	moveTask,
	parseTask,
	updateTask,
	validateFields,
	visibleColumns,
	type Task
} from '#lib/tasks/domain.js';

function task(overrides: Partial<Task> = {}): Task {
	return {
		id: 'task-1',
		title: 'Write spec',
		description: 'First task',
		priority: 'Medium',
		status: 'To Do',
		placedAt: 1,
		...overrides
	};
}

describe('validation and parsing', () => {
	it('accepts a trimmed title of 1 and 200 characters and an empty or 5000-character description', () => {
		expect(validateFields({ title: ' A ', description: '  ', priority: 'Low', status: 'To Do' })).toEqual({
			ok: true,
			title: 'A',
			description: '',
			priority: 'Low',
			status: 'To Do'
		});
		expect(
			validateFields({ title: 'a'.repeat(200), description: 'b'.repeat(5000), priority: 'High', status: 'Done' }).ok
		).toBe(true);
	});

	it('rejects a missing, whitespace-only, or 201-character title and a 5001-character description', () => {
		expect(validateFields({ title: '   ', description: '', priority: 'Medium', status: 'To Do' })).toEqual({
			ok: false,
			error: 'title-required'
		});
		expect(validateFields({ title: 'a'.repeat(201), description: '', priority: 'Medium', status: 'To Do' })).toEqual({
			ok: false,
			error: 'title-too-long'
		});
		expect(validateFields({ title: 'Ok', description: 'c'.repeat(5001), priority: 'Medium', status: 'To Do' })).toEqual(
			{ ok: false, error: 'description-too-long' }
		);
	});

	it('limits priority and status to the three stored values', () => {
		expect(validateFields({ title: 'Ok', description: '', priority: 'Urgent', status: 'To Do' }).ok).toBe(false);
		expect(validateFields({ title: 'Ok', description: '', priority: 'Low', status: 'Later' }).ok).toBe(false);
		expect(parseTask({ ...task(), priority: 'Urgent' })).toBeNull();
		expect(parseTask({ ...task(), status: 'Later' })).toBeNull();
		expect(parseTask(task())).toEqual(task());
	});

	it('rejects stored tasks with unknown fields, an untrimmed title, or a non-integer placedAt', () => {
		expect(parseTask({ ...task(), extra: true })).toBeNull();
		expect(parseTask({ ...task(), title: ' spaced ' })).toBeNull();
		expect(parseTask({ ...task(), placedAt: 1.5 })).toBeNull();
	});
});

describe('createTask', () => {
	it('stores the supplied id and trimmed fields and allows a duplicate title', () => {
		const first = createTask([], {
			id: 'a',
			title: ' Same ',
			description: ' Note ',
			priority: 'High',
			status: 'In Progress',
			placedAt: 4
		});
		expect(first).toEqual({
			ok: true,
			tasks: [{ id: 'a', title: 'Same', description: 'Note', priority: 'High', status: 'In Progress', placedAt: 4 }]
		});
		if (!first.ok) return;
		const second = createTask(first.tasks, {
			id: 'b',
			title: 'Same',
			description: '',
			priority: 'Low',
			status: 'To Do',
			placedAt: 5
		});
		expect(second.ok).toBe(true);
		if (!second.ok) return;
		expect(second.tasks.map((item) => item.id)).toEqual(['a', 'b']);
	});

	it('leaves the list unchanged when the title is invalid', () => {
		const existing = Object.freeze([task()]);
		const result = createTask(existing, {
			id: 'new',
			title: ' ',
			description: '',
			priority: 'Medium',
			status: 'To Do',
			placedAt: 2
		});
		expect(result).toEqual({ ok: false, error: 'title-required' });
		expect(existing).toEqual([task()]);
	});
});

describe('updateTask', () => {
	it('replaces the saved fields and keeps placedAt when the status stays the same', () => {
		const original = [task(), task({ id: 'other', title: 'Other', placedAt: 2 })];
		const result = updateTask(original, 'task-1', {
			title: 'Renamed',
			description: '',
			priority: 'Low',
			status: 'To Do',
			placedAt: 99
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.tasks[0]).toEqual({ ...task(), title: 'Renamed', description: '', priority: 'Low', placedAt: 1 });
		expect(result.tasks[1]).toEqual(original[1]);
	});

	it('accepts a newer placedAt when the status changes and leaves other tasks unchanged for an unknown id', () => {
		const original = [task(), task({ id: 'other', title: 'Same', placedAt: 2 })];
		const moved = updateTask(original, 'task-1', {
			title: 'Write spec',
			description: 'First task',
			priority: 'Medium',
			status: 'Done',
			placedAt: 8
		});
		expect(moved.ok).toBe(true);
		if (!moved.ok) return;
		expect(moved.tasks[0]).toMatchObject({ status: 'Done', placedAt: 8, title: 'Write spec' });
		expect(moved.tasks[1]).toEqual(original[1]);
		const missing = updateTask(original, 'gone', {
			title: 'Write spec',
			description: '',
			priority: 'Medium',
			status: 'To Do',
			placedAt: 3
		});
		expect(missing).toEqual({ ok: false, error: 'missing' });
		expect(original[0]).toEqual(task());
	});
});

describe('moveTask and order', () => {
	it('changes only status and placedAt, and a same-status move keeps every field', () => {
		const original = task({ description: 'Keep', priority: 'High' });
		const moved = moveTask([original], original.id, 'Done', 6);
		expect(moved.ok).toBe(true);
		if (!moved.ok) return;
		expect(moved.tasks[0]).toEqual({ ...original, status: 'Done', placedAt: 6 });
		const same = moveTask([original], original.id, 'To Do', 6);
		expect(same.ok).toBe(true);
		if (!same.ok) return;
		expect(same.tasks[0]).toEqual(original);
	});

	it('sorts a column by placedAt descending and id ascending', () => {
		const tasks = [
			task({ id: 'b', placedAt: 2 }),
			task({ id: 'c', placedAt: 1 }),
			task({ id: 'a', placedAt: 2 })
		];
		expect(columnTasks(tasks, 'To Do', 'All').map((item) => item.id)).toEqual(['a', 'b', 'c']);
	});
});

describe('deleteTask', () => {
	it('removes only the given id and leaves the list unchanged for a missing id', () => {
		const tasks = [task(), task({ id: 'other', title: 'Other' })];
		const removed = deleteTask(tasks, 'task-1');
		expect(removed.ok).toBe(true);
		if (!removed.ok) return;
		expect(removed.tasks).toEqual([tasks[1]]);
		expect(deleteTask(tasks, 'gone')).toEqual({ ok: false, reason: 'missing' });
		expect(tasks).toHaveLength(2);
	});

	it('restores default filters only when zero tasks remain', () => {
		expect(filtersAfterDelete(0)).toEqual({ statuses: ['To Do', 'In Progress', 'Done'], priority: 'All' });
		expect(filtersAfterDelete(1)).toBeNull();
	});
});

describe('filters', () => {
	it('keeps any status subset in canonical order and matches one priority without mutating tasks', () => {
		expect(visibleColumns([])).toEqual([]);
		expect(visibleColumns(['Done', 'To Do'])).toEqual(['To Do', 'Done']);
		expect(visibleColumns(['To Do', 'In Progress', 'Done'])).toEqual(['To Do', 'In Progress', 'Done']);
		const tasks = [
			task({ id: 'low', priority: 'Low' }),
			task({ id: 'high', priority: 'High', placedAt: 2 }),
			task({ id: 'done', status: 'Done', priority: 'High', placedAt: 3 })
		];
		const snapshot = JSON.stringify(tasks);
		expect(columnTasks(tasks, 'To Do', 'High').map((item) => item.id)).toEqual(['high']);
		expect(columnTasks(tasks, 'To Do', 'All').map((item) => item.id)).toEqual(['high', 'low']);
		expect(JSON.stringify(tasks)).toBe(snapshot);
	});
});

describe('100 tasks', () => {
	it('filters, edits, moves, and deletes a 100-task board', () => {
		const tasks = Array.from({ length: 100 }, (_, index) =>
			task({
				id: `task-${index.toString().padStart(3, '0')}`,
				title: `Task ${index}`,
				description: '',
				priority: index % 2 === 0 ? 'Low' : 'High',
				status: (['To Do', 'In Progress', 'Done'] as const)[index % 3],
				placedAt: index + 1
			})
		);
		expect(columnTasks(tasks, 'To Do', 'High').every((item) => item.priority === 'High')).toBe(true);
		const edited = updateTask(tasks, 'task-000', {
			title: 'Edited',
			description: 'Note',
			priority: 'Low',
			status: 'To Do',
			placedAt: 1000
		});
		expect(edited.ok).toBe(true);
		if (!edited.ok) return;
		expect(edited.tasks).toHaveLength(100);
		expect(edited.tasks.find((item) => item.id === 'task-000')).toMatchObject({ title: 'Edited', placedAt: 1 });
		const moved = moveTask(edited.tasks, 'task-001', 'Done', 1001);
		expect(moved.ok).toBe(true);
		if (!moved.ok) return;
		expect(moved.tasks.find((item) => item.id === 'task-001')).toMatchObject({
			status: 'Done',
			placedAt: 1001,
			title: 'Task 1'
		});
		const deleted = deleteTask(moved.tasks, 'task-002');
		expect(deleted.ok).toBe(true);
		if (!deleted.ok) return;
		expect(deleted.tasks).toHaveLength(99);
		expect(deleted.tasks.some((item) => item.id === 'task-002')).toBe(false);
	});
});
