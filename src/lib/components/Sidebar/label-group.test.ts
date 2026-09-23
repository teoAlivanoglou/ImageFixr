import test from 'node:test';
import assert from 'node:assert/strict';
import { LabelGroupState } from './label-group-state.ts';

test('LabelGroupState calculates max width correctly across registered elements', () => {
	const group = new LabelGroupState();
	assert.strictEqual(group.maxWidth, 0);

	group.setWidth('label-1', 65);
	assert.strictEqual(group.maxWidth, 65);

	group.setWidth('label-2', 92);
	assert.strictEqual(group.maxWidth, 92);

	group.setWidth('label-3', 45);
	assert.strictEqual(group.maxWidth, 92);

	group.remove('label-2');
	assert.strictEqual(group.maxWidth, 65);
});
