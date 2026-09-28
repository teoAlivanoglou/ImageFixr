import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLayoutMode } from './layout-mode.ts';

test('computeLayoutMode correctly identifies desktop landscape', () => {
	assert.strictEqual(computeLayoutMode(1920, 1080), 'desktop');
	assert.strictEqual(computeLayoutMode(2560, 1440), 'desktop');
	assert.strictEqual(computeLayoutMode(1024, 768), 'desktop');
	assert.strictEqual(computeLayoutMode(768, 600), 'desktop');
});

test('computeLayoutMode correctly identifies desktop-portrait (vertically mounted monitors and portrait tablets >= 768px)', () => {
	assert.strictEqual(computeLayoutMode(1080, 1920), 'desktop-portrait');
	assert.strictEqual(computeLayoutMode(1440, 2560), 'desktop-portrait');
	assert.strictEqual(computeLayoutMode(1200, 1600), 'desktop-portrait');
	// iPad portrait and portrait tablets (width >= 768)
	assert.strictEqual(computeLayoutMode(820, 1180), 'desktop-portrait');
	assert.strictEqual(computeLayoutMode(768, 1024), 'desktop-portrait');
	assert.strictEqual(computeLayoutMode(834, 1194), 'desktop-portrait');
});

test('computeLayoutMode correctly identifies mobile-portrait for phones in portrait', () => {
	// iPhone 14/15
	assert.strictEqual(computeLayoutMode(390, 844), 'mobile-portrait');
	assert.strictEqual(computeLayoutMode(430, 932), 'mobile-portrait');
	// Screen width < 768 in portrait
	assert.strictEqual(computeLayoutMode(767, 1024), 'mobile-portrait');
});

test('computeLayoutMode correctly identifies mobile-landscape for phones in landscape', () => {
	// iPhone 14/15 landscape (height < 600)
	assert.strictEqual(computeLayoutMode(844, 390), 'mobile-landscape');
	assert.strictEqual(computeLayoutMode(932, 430), 'mobile-landscape');
	// iPhone SE landscape
	assert.strictEqual(computeLayoutMode(667, 375), 'mobile-landscape');
	// Small landscape window
	assert.strictEqual(computeLayoutMode(767, 500), 'mobile-landscape');
});

test('computeLayoutMode prevents phone with zoomed/scaled viewport from being identified as desktop', () => {
	// iPhone 14/15 Pro zoomed out to 811x1758 in portrait
	assert.strictEqual(computeLayoutMode(811, 1758, 393, 852), 'mobile-portrait');

	// iPhone 14/15 Pro zoomed out to 1758x811 in landscape
	assert.strictEqual(computeLayoutMode(1758, 811, 393, 852), 'mobile-landscape');

	// iPad portrait with physical screen dimensions (>= 600 min dimension)
	assert.strictEqual(computeLayoutMode(820, 1180, 820, 1180), 'desktop-portrait');

	// iPad landscape with physical screen dimensions
	assert.strictEqual(computeLayoutMode(1180, 820, 820, 1180), 'desktop');

	// Desktop browser resized to narrow viewport (screenWidth is 1920, width is 400)
	assert.strictEqual(computeLayoutMode(400, 800, 1920, 1080), 'mobile-portrait');
});
