import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TaskCard from './TaskCard.svelte';

describe('TaskCard.svelte', () => {
	it('offers a status select named for the task', async () => {
		await render(TaskCard, {
			id: 'task-1',
			title: 'Write spec',
			priority: 'High',
			status: 'To Do'
		});
		const select = page.getByRole('combobox', { name: 'Status for Write spec' });
		await expect.element(select).toBeInTheDocument();
		await expect.element(select.getByRole('option', { name: 'To Do' })).toBeInTheDocument();
		await expect.element(select.getByRole('option', { name: 'In Progress' })).toBeInTheDocument();
		await expect.element(select.getByRole('option', { name: 'Done' })).toBeInTheDocument();
	});

	it('keeps the saved status selected when the move is not stored', async () => {
		await render(TaskCard, {
			id: 'task-1',
			title: 'Write spec',
			priority: 'High',
			status: 'To Do',
			onMove: () => {}
		});
		const select = page.getByRole('combobox', { name: 'Status for Write spec' });
		const element = (await select.element()) as HTMLSelectElement;
		element.value = 'In Progress';
		element.dispatchEvent(new Event('input', { bubbles: true }));
		element.dispatchEvent(new Event('change', { bubbles: true }));
		await expect.element(select).toHaveValue('To Do');
	});

	it('renders the title as text', async () => {
		await render(TaskCard, {
			id: 'task-1',
			title: '<b>unsafe</b>',
			priority: 'Low',
			status: 'Done'
		});
		await expect.element(page.getByText('<b>unsafe</b>', { exact: true })).toBeInTheDocument();
		expect(document.querySelector('b')).toBeNull();
	});
});
