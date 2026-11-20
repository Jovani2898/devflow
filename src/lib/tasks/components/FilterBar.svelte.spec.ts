import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FilterBar from './FilterBar.svelte';

describe('FilterBar.svelte', () => {
	it('exposes the status checkboxes, priority radios, and clear button', async () => {
		let cleared = false;
		await render(FilterBar, {
			selectedStatuses: ['To Do', 'In Progress', 'Done'],
			priority: 'All',
			onClear: () => (cleared = true)
		});
		await expect.element(page.getByRole('group', { name: 'Status' })).toBeInTheDocument();
		await expect.element(page.getByRole('checkbox', { name: 'To Do' })).toBeChecked();
		await expect.element(page.getByRole('checkbox', { name: 'In Progress' })).toBeChecked();
		await expect.element(page.getByRole('checkbox', { name: 'Done' })).toBeChecked();
		await expect.element(page.getByRole('radiogroup', { name: 'Priority' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'All' })).toBeChecked();
		await expect.element(page.getByRole('radio', { name: 'Low' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'Medium' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'High' })).toBeInTheDocument();
		await page.getByRole('button', { name: 'Clear filters' }).click();
		expect(cleared).toBe(true);
	});
});
