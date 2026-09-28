import test from 'node:test';
import assert from 'node:assert/strict';
import { HeaderPillState } from './header-pill-state.ts';

test('HeaderPillState calculates maxRequiredWidth across registered sections', () => {
	const state = new HeaderPillState();
	assert.strictEqual(state.maxRequiredWidth, 0);
	assert.strictEqual(state.shouldWrap, false);

	state.setWidth('border', 360);
	assert.strictEqual(state.maxRequiredWidth, 360);

	state.setWidth('margins', 420);
	assert.strictEqual(state.maxRequiredWidth, 420);

	state.setWidth('shadow', 320);
	assert.strictEqual(state.maxRequiredWidth, 420);

	state.remove('margins');
	assert.strictEqual(state.maxRequiredWidth, 360);
});

test('HeaderPillState determines shouldWrap based on availableWidth vs maxRequiredWidth', () => {
	const state = new HeaderPillState();
	state.setWidth('border', 360);
	state.setWidth('margins', 420);

	// When available width is uninitialized (0), do not wrap prematurely
	state.setAvailableWidth(0);
	assert.strictEqual(state.shouldWrap, false);

	// When available width is less than max required width, wrap all
	state.setAvailableWidth(400);
	assert.strictEqual(state.shouldWrap, true);

	// When available width meets or exceeds max required width, do not wrap
	state.setAvailableWidth(420);
	assert.strictEqual(state.shouldWrap, false);

	state.setAvailableWidth(500);
	assert.strictEqual(state.shouldWrap, false);

	// If the widest section is removed, wrapping dynamically updates
	state.setAvailableWidth(400);
	assert.strictEqual(state.shouldWrap, true);
	state.remove('margins'); // max becomes 360
	assert.strictEqual(state.shouldWrap, false);
});
