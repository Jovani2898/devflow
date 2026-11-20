import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DeleteDialog from './DeleteDialog.svelte';

describe('DeleteDialog.svelte', () => {
	it('names the task and offers confirm and cancel', async () => {
		await render(DeleteDialog, { open: true, title: 'Write spec' });
		const dialog = page.getByRole('dialog', { name: 'Delete Write spec' });
		await expect.element(dialog).toBeInTheDocument();
		await expect.element(dialog.getByText('Write spec')).toBeInTheDocument();
		await expect.element(dialog.getByRole('button', { name: 'Confirm delete' })).toBeInTheDocument();
		await expect.element(dialog.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
	});

	it('shows a save failure inside the open dialog', async () => {
		await render(DeleteDialog, { open: true, title: 'Write spec', saveError: true });
		const dialog = page.getByRole('dialog', { name: 'Delete Write spec' });
		await expect.element(dialog.getByRole('alert')).toHaveTextContent('The task could not be saved');
		await expect.element(dialog.getByRole('button', { name: 'Confirm delete' })).toBeInTheDocument();
	});

	it('cancels with the button and with Escape without confirming', async () => {
		let confirmed = false;
		let cancelled = 0;
		await render(DeleteDialog, {
			open: true,
			title: 'Write spec',
			onConfirm: () => (confirmed = true),
			onCancel: () => (cancelled += 1)
		});
		const dialog = page.getByRole('dialog', { name: 'Delete Write spec' });
		await dialog.getByRole('button', { name: 'Cancel' }).click();
		document.querySelector('dialog')?.dispatchEvent(new Event('cancel', { cancelable: true }));
		expect(confirmed).toBe(false);
		expect(cancelled).toBe(2);
	});
});
