import { expect, test, type Page } from '@playwright/test';

const KEY = 'devflow.board.v1';

type Draft = {
	title: string;
	description?: string;
	priority?: string;
	status?: string;
};

async function settle(page: Page) {
	await page.goto('/');
	await expect(page.getByRole('status', { name: 'Loading tasks' })).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 1, name: 'Board' })).toBeVisible();
}

async function createTask(page: Page, draft: Draft) {
	await page.getByRole('button', { name: 'Create task' }).click();
	const dialog = page.getByRole('dialog', { name: 'Create task' });
	await dialog.getByRole('textbox', { name: 'Title' }).fill(draft.title);
	await dialog.getByRole('textbox', { name: 'Description' }).fill(draft.description ?? '');
	await dialog.getByRole('combobox', { name: 'Priority' }).selectOption(draft.priority ?? 'Medium');
	await dialog.getByRole('combobox', { name: 'Status' }).selectOption(draft.status ?? 'To Do');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toHaveCount(0);
}

async function column(page: Page, status: string) {
	return page.getByRole('region', { name: status, exact: true });
}

async function failBoardSaves(page: Page, kind: 'quota' | 'unavailable') {
	await page.evaluate((failure) => {
		const original = Storage.prototype.setItem;
		Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
			if (key === 'devflow.board.v1') {
				if (failure === 'quota') throw new DOMException('full', 'QuotaExceededError');
				throw new Error('offline');
			}
			original.call(this, key, value);
		};
		(window as unknown as { __restoreBoardSave?: () => void }).__restoreBoardSave = () => {
			Storage.prototype.setItem = original;
		};
	}, kind);
}

test('server HTML shows the loading status before the board is read', async ({ page }) => {
	const response = await page.goto('/');
	const html = await response?.text();
	expect(html).toContain('Loading tasks');
	expect(html).not.toContain('No tasks yet');
	expect(html).not.toContain('Tasks could not be loaded');
});

test('AC-001 and AC-004 save a task in its column and show the description when opened', async ({ page }) => {
	await settle(page);
	await expect(page.getByText('No tasks yet', { exact: true })).toBeVisible();
	await expect(page.getByRole('region', { name: 'To Do' }).getByText('No tasks', { exact: true })).toBeVisible();
	await createTask(page, {
		title: 'Write spec',
		description: 'First task',
		priority: 'High',
		status: 'In Progress'
	});
	const progress = await column(page, 'In Progress');
	await expect(progress.getByText('Write spec', { exact: true })).toBeVisible();
	await expect(progress.getByText('High', { exact: true })).toBeVisible();
	await expect(progress.getByText('First task', { exact: true })).toHaveCount(0);
	await expect((await column(page, 'To Do')).getByText('Write spec', { exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: 'Edit Write spec' }).click();
	await expect(page.getByRole('dialog', { name: 'Edit task' }).getByLabel('Description')).toHaveValue('First task');
});

test('AC-002 blank title shows Title is required and adds no task', async ({ page }) => {
	await settle(page);
	await page.getByRole('button', { name: 'Create task' }).click();
	const dialog = page.getByRole('dialog', { name: 'Create task' });
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog.getByRole('alert')).toHaveText('Title is required');
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByText('No tasks yet', { exact: true })).toBeVisible();
});

test('AC-010 and AC-011 refresh keeps saved tasks, resets filters, and drops an unsaved title', async ({ page }) => {
	await settle(page);
	await createTask(page, { title: 'Persisted', description: 'Kept', priority: 'Low', status: 'Done' });
	await page.getByRole('checkbox', { name: 'To Do' }).uncheck();
	await page.getByRole('radio', { name: 'High' }).check();
	await page.getByRole('button', { name: 'Create task' }).click();
	await page.getByRole('dialog', { name: 'Create task' }).getByLabel('Title').fill('Unsaved draft');
	await page.reload();
	await expect(page.getByRole('status', { name: 'Loading tasks' })).toHaveCount(0);
	await expect(page.getByText('Unsaved draft')).toHaveCount(0);
	await expect(page.getByText('Persisted', { exact: true })).toBeVisible();
	await expect(page.getByRole('checkbox', { name: 'To Do' })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'In Progress' })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Done' })).toBeChecked();
	await expect(page.getByRole('radio', { name: 'All' })).toBeChecked();
	await page.getByRole('button', { name: 'Edit Persisted' }).click();
	await expect(page.getByRole('dialog', { name: 'Edit task' }).getByLabel('Description')).toHaveValue('Kept');
});

test('AC-013 corrupt storage shows the load error and is left unchanged', async ({ page }) => {
	await page.addInitScript((key) => {
		localStorage.setItem(key, '{');
	}, KEY);
	await settle(page);
	await expect(page.getByRole('alert')).toHaveText('Tasks could not be loaded');
	await expect(page.getByText('No tasks yet', { exact: true })).toHaveCount(0);
	await expect(page.getByText('No statuses selected', { exact: true })).toHaveCount(0);
	expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe('{');
});

test('AC-014 a failed save keeps the typed title and does not store the task', async ({ page }) => {
	await page.addInitScript(() => {
		const original = Storage.prototype.setItem;
		Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
			if (key === 'devflow.board.v1') throw new DOMException('full', 'QuotaExceededError');
			original.call(this, key, value);
		};
	});
	await settle(page);
	await page.getByRole('button', { name: 'Create task' }).click();
	const dialog = page.getByRole('dialog', { name: 'Create task' });
	await dialog.getByLabel('Title').fill('Cannot save');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog.getByRole('alert')).toHaveText('The task could not be saved');
	await expect(dialog.getByLabel('Title')).toHaveValue('Cannot save');
	await page.reload();
	await expect(page.getByRole('status', { name: 'Loading tasks' })).toHaveCount(0);
	await expect(page.getByText('Cannot save')).toHaveCount(0);
});

test('a failed delete shows the error in the dialog, keeps the task, and can be retried', async ({ page }) => {
	await settle(page);
	await createTask(page, { title: 'Keep me', status: 'To Do' });
	const before = await page.evaluate((key) => localStorage.getItem(key), KEY);
	await failBoardSaves(page, 'quota');
	await page.getByRole('button', { name: 'Delete Keep me' }).click();
	const dialog = page.getByRole('dialog', { name: 'Delete Keep me' });
	await dialog.getByRole('button', { name: 'Confirm delete' }).click();
	await expect(dialog.getByRole('alert')).toHaveText('The task could not be saved');
	await expect(page.getByRole('alert')).toHaveCount(1);
	await expect(dialog).toBeVisible();
	await expect(page.getByText('Keep me', { exact: true })).toBeVisible();
	expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(before);
	await page.evaluate(() => {
		(window as unknown as { __restoreBoardSave: () => void }).__restoreBoardSave();
	});
	await dialog.getByRole('button', { name: 'Confirm delete' }).click();
	await expect(dialog).toHaveCount(0);
	await expect(page.getByText('Keep me', { exact: true })).toHaveCount(0);
});

test('a failed move keeps the saved status selected when storage throws', async ({ page }) => {
	await settle(page);
	await createTask(page, { title: 'Stay put', status: 'To Do' });
	const before = await page.evaluate((key) => localStorage.getItem(key), KEY);
	await failBoardSaves(page, 'unavailable');
	const select = page.getByRole('combobox', { name: 'Status for Stay put' });
	await select.selectOption('Done');
	await expect(page.getByRole('alert')).toHaveText('The task could not be saved');
	await expect(select).toHaveValue('To Do');
	await expect((await column(page, 'To Do')).getByText('Stay put', { exact: true })).toBeVisible();
	await expect((await column(page, 'Done')).getByText('Stay put', { exact: true })).toHaveCount(0);
	expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(before);
});

test('AC-005 cancel keeps the old title and save keeps the new title and position', async ({ page }) => {
	await settle(page);
	await createTask(page, { title: 'Older', status: 'To Do' });
	await createTask(page, { title: 'Newer', status: 'To Do' });
	await page.getByRole('button', { name: 'Edit Older' }).click();
	const dialog = page.getByRole('dialog', { name: 'Edit task' });
	await dialog.getByLabel('Title').fill('Changed mind');
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByRole('button', { name: 'Edit Older' })).toBeFocused();
	await page.reload();
	await expect(page.getByRole('status', { name: 'Loading tasks' })).toHaveCount(0);
	await expect(page.getByText('Older', { exact: true })).toBeVisible();
	await expect(page.getByText('Changed mind')).toHaveCount(0);
	await page.getByRole('button', { name: 'Edit Older' }).click();
	const edit = page.getByRole('dialog', { name: 'Edit task' });
	await edit.getByLabel('Title').fill('Older renamed');
	await edit.getByRole('button', { name: 'Save' }).click();
	await page.reload();
	await expect(page.getByRole('status', { name: 'Loading tasks' })).toHaveCount(0);
	const text = await (await column(page, 'To Do')).innerText();
	expect(text.indexOf('Newer')).toBeGreaterThan(-1);
	expect(text.indexOf('Newer')).toBeLessThan(text.indexOf('Older renamed'));
});

test('AC-006 and AC-019 move with keyboard and pointer, and the newest or moved task is first', async ({ page }) => {
	await settle(page);
	await createTask(page, { title: 'Stay put', description: 'Same details', priority: 'High', status: 'In Progress' });
	await createTask(page, { title: 'Move me', description: 'Carry me', priority: 'Low', status: 'To Do' });
	const select = page.getByRole('combobox', { name: 'Status for Move me' });
	await select.focus();
	await page.keyboard.press('i');
	await expect((await column(page, 'In Progress')).getByText('Move me', { exact: true })).toBeVisible();
	const afterKeyboard = await (await column(page, 'In Progress')).innerText();
	expect(afterKeyboard.indexOf('Move me')).toBeLessThan(afterKeyboard.indexOf('Stay put'));
	await page.getByRole('combobox', { name: 'Status for Move me' }).selectOption('Done');
	await expect((await column(page, 'Done')).getByText('Move me', { exact: true })).toBeVisible();
	await expect((await column(page, 'In Progress')).getByText('Move me', { exact: true })).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole('status', { name: 'Loading tasks' })).toHaveCount(0);
	await expect((await column(page, 'Done')).getByText('Move me', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Edit Move me' }).click();
	const dialog = page.getByRole('dialog', { name: 'Edit task' });
	await expect(dialog.getByLabel('Description')).toHaveValue('Carry me');
	await expect(dialog.getByLabel('Priority')).toHaveValue('Low');
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await page.getByRole('button', { name: 'Edit Stay put' }).click();
	const edit = page.getByRole('dialog', { name: 'Edit task' });
	await edit.getByLabel('Status').selectOption('Done');
	await edit.getByRole('button', { name: 'Save' }).click();
	const done = await (await column(page, 'Done')).innerText();
	expect(done.indexOf('Stay put')).toBeLessThan(done.indexOf('Move me'));
});

test('AC-007 cancel keeps a task and confirm removes only that task after reload', async ({ page }) => {
	await settle(page);
	await createTask(page, { title: 'Keep me' });
	await createTask(page, { title: 'Remove me' });
	await page.getByRole('button', { name: 'Delete Remove me' }).click();
	const dialog = page.getByRole('dialog', { name: 'Delete Remove me' });
	await expect(dialog.getByText('Remove me')).toBeVisible();
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByRole('button', { name: 'Delete Remove me' })).toBeFocused();
	await expect(page.getByText('Remove me', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Delete Remove me' }).click();
	await page.getByRole('button', { name: 'Confirm delete' }).click();
	await expect(page.getByRole('button', { name: 'Create task' })).toBeFocused();
	await page.reload();
	await expect(page.getByRole('status', { name: 'Loading tasks' })).toHaveCount(0);
	await expect(page.getByText('Remove me')).toHaveCount(0);
	await expect(page.getByText('Keep me', { exact: true })).toBeVisible();
});

test('AC-007 deleting the last saved task resets filters and shows No tasks yet', async ({ page }) => {
	await settle(page);
	await createTask(page, { title: 'Last one', priority: 'High', status: 'To Do' });
	await page.getByRole('checkbox', { name: 'Done' }).uncheck();
	await page.getByRole('radio', { name: 'High' }).check();
	await page.getByRole('button', { name: 'Delete Last one' }).click();
	await page.getByRole('button', { name: 'Confirm delete' }).click();
	await expect(page.getByText('No tasks yet', { exact: true })).toBeVisible();
	await expect(page.getByRole('checkbox', { name: 'To Do' })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'In Progress' })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Done' })).toBeChecked();
	await expect(page.getByRole('radio', { name: 'All' })).toBeChecked();
});

test('AC-003, AC-008, AC-009, and ES-002 filters, clear, hidden moves, and a visible-only delete', async ({ page }) => {
	await settle(page);
	await createTask(page, { title: 'Visible one', priority: 'High', status: 'To Do' });
	await createTask(page, { title: 'Hidden one', priority: 'Low', status: 'In Progress' });
	await createTask(page, { title: 'Done high', priority: 'High', status: 'Done' });
	await page.getByRole('checkbox', { name: 'In Progress' }).uncheck();
	await page.getByRole('radio', { name: 'High' }).check();
	await page.getByRole('button', { name: 'Edit Visible one' }).click();
	await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByRole('checkbox', { name: 'In Progress' })).not.toBeChecked();
	await expect(page.getByRole('radio', { name: 'High' })).toBeChecked();
	await expect(page.getByRole('heading', { name: 'In Progress', exact: true })).toHaveCount(0);
	await expect(page.getByText('Visible one', { exact: true })).toBeVisible();
	await expect(page.getByText('Hidden one', { exact: true })).toHaveCount(0);
	await expect(page.getByText('Done high', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'To Do', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Done', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Clear filters' }).click();
	await expect(page.getByText('Hidden one', { exact: true })).toBeVisible();
	await page.getByRole('checkbox', { name: 'To Do' }).uncheck();
	await page.getByRole('checkbox', { name: 'In Progress' }).uncheck();
	await page.getByRole('checkbox', { name: 'Done' }).uncheck();
	await expect(page.getByText('No statuses selected', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
	await page.getByRole('button', { name: 'Clear filters' }).click();
	await page.getByRole('checkbox', { name: 'In Progress' }).uncheck();
	await page.getByRole('checkbox', { name: 'Done' }).uncheck();
	await page.getByRole('button', { name: 'Delete Visible one' }).click();
	await page.getByRole('button', { name: 'Confirm delete' }).click();
	await expect((await column(page, 'To Do')).getByText('No tasks', { exact: true })).toBeVisible();
	await expect(page.getByText('No tasks yet', { exact: true })).toHaveCount(0);
	await expect(page.getByRole('checkbox', { name: 'To Do' })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'In Progress' })).not.toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Done' })).not.toBeChecked();
	await page.getByRole('checkbox', { name: 'In Progress' }).check();
	await expect(page.getByText('Hidden one', { exact: true })).toBeVisible();
	await page.getByRole('combobox', { name: 'Status for Hidden one' }).selectOption('Done');
	await expect(page.getByText('Hidden one')).toHaveCount(0);
	await page.getByRole('checkbox', { name: 'Done' }).check();
	await expect((await column(page, 'Done')).getByText('Hidden one', { exact: true })).toBeVisible();
	await expect(page.getByRole('radio', { name: 'All' })).toBeChecked();
});

test('AC-015 keyboard create, edit, move, filter, clear, and confirmed delete', async ({ page }) => {
	await settle(page);
	await page.getByRole('button', { name: 'Create task' }).focus();
	await page.keyboard.press('Enter');
	await page.keyboard.type('Keyboard task');
	await page.keyboard.press('Tab');
	await page.keyboard.type('Typed');
	await page.keyboard.press('Tab');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Tab');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Tab');
	await page.keyboard.press('Enter');
	await expect(page.getByText('Keyboard task', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Edit Keyboard task' }).focus();
	await page.keyboard.press('Enter');
	await page.keyboard.press('ControlOrMeta+A');
	await page.keyboard.type('Keyboard edited');
	await page.keyboard.press('Tab');
	await page.keyboard.press('Tab');
	await page.keyboard.press('Tab');
	await page.keyboard.press('Tab');
	await page.keyboard.press('Enter');
	await expect(page.getByText('Keyboard edited', { exact: true })).toBeVisible();
	await page.getByRole('combobox', { name: 'Status for Keyboard edited' }).focus();
	await page.keyboard.press('d');
	await expect((await column(page, 'Done')).getByText('Keyboard edited', { exact: true })).toBeVisible();
	await page.getByRole('checkbox', { name: 'To Do' }).focus();
	await page.keyboard.press('Space');
	await expect(page.getByRole('heading', { name: 'To Do', exact: true })).toHaveCount(0);
	await page.getByRole('radio', { name: 'Low' }).focus();
	await page.keyboard.press('Space');
	await expect(page.getByRole('radio', { name: 'Low' })).toBeChecked();
	await page.getByRole('button', { name: 'Clear filters' }).focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('checkbox', { name: 'To Do' })).toBeChecked();
	await expect(page.getByRole('radio', { name: 'All' })).toBeChecked();
	await page.getByRole('button', { name: 'Delete Keyboard edited' }).focus();
	await page.keyboard.press('Enter');
	await page.getByRole('button', { name: 'Confirm delete' }).focus();
	await page.keyboard.press('Enter');
	await expect(page.getByText('Keyboard edited')).toHaveCount(0);
});

test('AC-016 narrow and desktop layouts keep status order and can reveal a hidden column', async ({ page }) => {
	await settle(page);
	for (const viewport of [
		{ width: 390, height: 844, axis: 'y' as const },
		{ width: 1280, height: 800, axis: 'x' as const }
	]) {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await page.getByRole('button', { name: 'Clear filters' }).click();
		for (const name of ['To Do', 'In Progress', 'Done']) {
			await page.getByRole('heading', { level: 2, name, exact: true }).scrollIntoViewIfNeeded();
		}
		const boxes = await page.evaluate(() =>
			['To Do', 'In Progress', 'Done'].map((name) => {
				const heading = [...document.querySelectorAll('h2')].find((element) => element.textContent === name);
				const rect = heading?.getBoundingClientRect();
				return rect ? { x: rect.x + window.scrollX, y: rect.y + window.scrollY } : null;
			})
		);
		expect(boxes[0]).not.toBeNull();
		expect(boxes[1]).not.toBeNull();
		expect(boxes[2]).not.toBeNull();
		expect(boxes[0]![viewport.axis]).toBeLessThan(boxes[1]![viewport.axis]);
		expect(boxes[1]![viewport.axis]).toBeLessThan(boxes[2]![viewport.axis]);
		await page.getByRole('checkbox', { name: 'In Progress' }).uncheck();
		await expect(page.getByRole('heading', { name: 'In Progress', exact: true })).toHaveCount(0);
		await page.getByRole('checkbox', { name: 'In Progress' }).check();
		await expect(page.getByRole('heading', { name: 'In Progress', exact: true })).toBeVisible();
	}
});

test('AC-017 and AC-018 one board is shared after the second view reloads', async ({ context }) => {
	const first = await context.newPage();
	const second = await context.newPage();
	await settle(first);
	await settle(second);
	await expect(first.getByRole('heading', { level: 1 })).toHaveText('Board');
	await expect(first.getByRole('button', { name: /sign in|account|share|projects|switch board/i })).toHaveCount(0);
	await createTask(first, { title: 'Shared task' });
	await expect(second.getByText('Shared task')).toHaveCount(0);
	await second.reload();
	await expect(second.getByRole('status', { name: 'Loading tasks' })).toHaveCount(0);
	await expect(second.getByText('Shared task', { exact: true })).toBeVisible();
	await first.close();
	await second.close();
});

test('SC-010 create, edit, move, delete, and filter 100 seeded tasks', async ({ page }) => {
	const tasks = Array.from({ length: 100 }, (_, index) => ({
		id: `task-${index.toString().padStart(3, '0')}`,
		title: `Task ${index.toString().padStart(3, '0')}`,
		description: '',
		priority: 'Low',
		status: 'To Do',
		placedAt: index + 1
	}));
	await page.addInitScript(
		({ key, value }) => {
			localStorage.setItem(key, value);
		},
		{ key: KEY, value: JSON.stringify({ version: 1, tasks }) }
	);
	await settle(page);
	await createTask(page, { title: 'Scale added', priority: 'High', status: 'To Do' });
	const created = await (await column(page, 'To Do')).innerText();
	expect(created.indexOf('Scale added')).toBeLessThan(created.indexOf('Task 099'));
	await page.getByRole('button', { name: 'Edit Task 099' }).click();
	const dialog = page.getByRole('dialog', { name: 'Edit task' });
	await dialog.getByLabel('Title').fill('Task 099 edited');
	await dialog.getByRole('button', { name: 'Save' }).click();
	const edited = await (await column(page, 'To Do')).innerText();
	expect(edited.indexOf('Scale added')).toBeLessThan(edited.indexOf('Task 099 edited'));
	expect(edited.indexOf('Task 099 edited')).toBeLessThan(edited.indexOf('Task 098'));
	await page.getByRole('combobox', { name: 'Status for Task 098' }).selectOption('Done');
	await expect((await column(page, 'Done')).getByText('Task 098', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Delete Task 097' }).click();
	await page.getByRole('button', { name: 'Confirm delete' }).click();
	await expect(page.getByText('Task 097')).toHaveCount(0);
	await page.getByRole('radio', { name: 'High' }).check();
	await expect(page.getByText('Scale added', { exact: true })).toBeVisible();
	await expect(page.getByText('Task 096')).toHaveCount(0);
	await expect(page.getByRole('radio', { name: 'High' })).toBeChecked();
});
