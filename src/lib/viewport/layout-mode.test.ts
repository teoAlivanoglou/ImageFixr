import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLayoutMode } from './layout-mode.ts';

test('computeLayoutMode correctly identifies desktop landscape', () => {
	assert.strictEqual(computeLayoutMode(1920, 1080), 'desktop');
	assert.strictEqual(computeLayoutMode(2560, 1440), 'desktop');
	assert.strictEqual(computeLayoutMode(1024, 768), 'desktop');
});

test('computeLayoutMode correctly identifies desktop-portrait (vertically mounted monitors)', () => {
	assert.strictEqual(computeLayoutMode(1080, 1920), 'desktop-portrait');
	assert.strictEqual(computeLayoutMode(1440, 2560), 'desktop-portrait');
	assert.strictEqual(computeLayoutMode(1200, 1600), 'desktop-portrait');
});

test('computeLayoutMode correctly identifies mobile for phones and portrait tablets', () => {
	// iPhone 14/15
	assert.strictEqual(computeLayoutMode(390, 844), 'mobile');
	// iPad portrait (width < 1024)
	assert.strictEqual(computeLayoutMode(820, 1180), 'mobile');
	assert.strictEqual(computeLayoutMode(768, 1024), 'mobile');
	assert.strictEqual(computeLayoutMode(834, 1194), 'mobile');
	// Phone in landscape (height < 600)
	assert.strictEqual(computeLayoutMode(844, 390), 'mobile');
});
