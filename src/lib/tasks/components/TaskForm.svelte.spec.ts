import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TaskForm from './TaskForm.svelte';

async function openForm(props: Record<string, unknown> = {}) {
	return render(TaskForm, { open: true, mode: 'create', ...props });
}

describe('TaskForm.svelte', () => {
	it('opens a create dialog with empty text, Medium priority, and To Do status', async () => {
		await openForm();
		await expect.element(page.getByRole('dialog', { name: 'Create task' })).toBeInTheDocument();
		await expect.element(page.getByRole('textbox', { name: 'Title' })).toHaveValue('');
		await expect.element(page.getByRole('textbox', { name: 'Description' })).toHaveValue('');
		await expect.element(page.getByRole('combobox', { name: 'Priority' })).toHaveValue('Medium');
		await expect.element(page.getByRole('combobox', { name: 'Status' })).toHaveValue('To Do');
	});

	it('shows the required, too-long, and description messages without saving', async () => {
		let saved = false;
		await openForm({ onSave: () => (saved = true) });
		const dialog = page.getByRole('dialog', { name: 'Create task' });
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect.element(dialog.getByRole('alert')).toHaveTextContent('Title is required');
		expect(saved).toBe(false);

		await dialog.getByRole('textbox', { name: 'Title' }).fill('a'.repeat(201));
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect.element(dialog.getByRole('alert')).toHaveTextContent('Title is too long');

		await dialog.getByRole('textbox', { name: 'Title' }).fill('Ok');
		await dialog.getByRole('textbox', { name: 'Description' }).fill('b'.repeat(5001));
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect.element(dialog.getByRole('alert')).toHaveTextContent('Description is too long');
		expect(saved).toBe(false);
	});

	it('shows the stored description in the edit dialog and cancel does not save', async () => {
		let saved = false;
		let cancelled = false;
		await openForm({
			mode: 'edit',
			title: 'Write spec',
			description: 'First task',
			priority: 'High',
			status: 'In Progress',
			onSave: () => (saved = true),
			onCancel: () => (cancelled = true)
		});
		const dialog = page.getByRole('dialog', { name: 'Edit task' });
		await expect.element(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('First task');
		await dialog.getByRole('textbox', { name: 'Title' }).fill('');
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect.element(dialog.getByRole('alert')).toHaveTextContent('Title is required');
		await dialog.getByRole('button', { name: 'Cancel' }).click();
		expect(saved).toBe(false);
		expect(cancelled).toBe(true);
	});

	it('keeps the typed title visible when the save fails', async () => {
		const view = await openForm();
		const dialog = page.getByRole('dialog', { name: 'Create task' });
		await dialog.getByRole('textbox', { name: 'Title' }).fill('Keep me');
		await view.rerender({ open: true, mode: 'create', saveError: true, title: '' });
		await expect.element(dialog.getByRole('alert')).toHaveTextContent('The task could not be saved');
		await expect.element(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue('Keep me');
	});

	it('shows the missing-task message', async () => {
		await openForm({ mode: 'edit', unavailable: true, title: 'Gone' });
		await expect
			.element(page.getByRole('dialog', { name: 'Edit task' }).getByRole('alert'))
			.toHaveTextContent('The task is no longer available.');
	});
});
