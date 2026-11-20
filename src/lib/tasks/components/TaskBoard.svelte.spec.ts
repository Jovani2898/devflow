import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Task } from '#lib/tasks/domain.js';
import Page from '../../../routes/+page.svelte';
import TaskBoard from './TaskBoard.svelte';

function task(overrides: Partial<Task> = {}): Task {
	return {
		id: 'task-1',
		title: 'Write spec',
		description: 'Hidden description',
		priority: 'High',
		status: 'To Do',
		placedAt: 2,
		...overrides
	};
}

const columns = [
	{ status: 'To Do' as const, tasks: [task(), task({ id: 'older', title: 'Older', placedAt: 1, priority: 'Low' })] },
	{ status: 'In Progress' as const, tasks: [] },
	{ status: 'Done' as const, tasks: [] }
];

describe('TaskBoard.svelte', () => {
	it('shows the three columns, card title and priority, and the empty copy', async () => {
		await render(TaskBoard, { phase: 'ready', columns, noTasksYet: false });
		const headings = page.getByRole('heading', { level: 2 });
		await expect.element(headings.nth(0)).toHaveTextContent('To Do');
		await expect.element(headings.nth(1)).toHaveTextContent('In Progress');
		await expect.element(headings.nth(2)).toHaveTextContent('Done');
		const todo = page.getByRole('region', { name: 'To Do' });
		await expect.element(todo.getByText('Write spec', { exact: true })).toBeInTheDocument();
		await expect.element(todo.getByText('High', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Hidden description')).not.toBeInTheDocument();
		await expect.element(page.getByRole('region', { name: 'In Progress' }).getByText('No tasks')).toBeInTheDocument();
		const text = (await todo.element()).textContent ?? '';
		expect(text.indexOf('Write spec')).toBeLessThan(text.indexOf('Older'));
	});

	it('shows No tasks yet when nothing is saved', async () => {
		await render(TaskBoard, {
			phase: 'ready',
			columns: [
				{ status: 'To Do', tasks: [] },
				{ status: 'In Progress', tasks: [] },
				{ status: 'Done', tasks: [] }
			],
			noTasksYet: true
		});
		await expect.element(page.getByText('No tasks yet')).toBeInTheDocument();
		await expect.element(page.getByRole('region', { name: 'Done' }).getByText('No tasks')).toBeInTheDocument();
	});

	it('uses the load error instead of the empty-board copy', async () => {
		await render(TaskBoard, { phase: 'load-error' });
		await expect.element(page.getByRole('alert')).toHaveTextContent('Tasks could not be loaded');
		await expect.element(page.getByText('No tasks yet')).not.toBeInTheDocument();
		await expect.element(page.getByText('No statuses selected')).not.toBeInTheDocument();
	});

	it('shows No statuses selected without columns', async () => {
		await render(TaskBoard, { phase: 'ready', columns: [], noStatuses: true });
		await expect.element(page.getByText('No statuses selected')).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { level: 2 })).not.toBeInTheDocument();
	});

	it('reports a missing task on confirm and leaves the remaining task in place', async () => {
		await render(TaskBoard, {
			phase: 'ready',
			columns: [{ status: 'To Do', tasks: [task({ id: 'kept', title: 'Kept', description: '' })] }],
			pendingDelete: { id: 'gone', title: 'Gone task' }
		});
		await page.getByRole('button', { name: 'Confirm delete' }).click();
		await expect.element(page.getByRole('alert')).toHaveTextContent('The task is no longer available.');
		await expect.element(page.getByText('Kept', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Gone task', { exact: true })).not.toBeInTheDocument();
	});

	it('has one Board heading and no account or board-switcher controls on the page', async () => {
		localStorage.clear();
		await render(Page);
		await expect.element(page.getByRole('heading', { level: 1, name: 'Board' })).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Board');
		await expect.element(page.getByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Account' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Share' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Projects' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Switch board' })).not.toBeInTheDocument();
	});
});
