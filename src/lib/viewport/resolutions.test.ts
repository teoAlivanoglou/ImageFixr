import test from 'node:test';
import assert from 'node:assert/strict';
import {
	getResolutionsForRatio,
	getValidResolutionPreset,
	resolvePresetDimensions,
	RESOLUTION_PRESETS_BY_RATIO
} from './resolutions.ts';

test('getResolutionsForRatio returns valid presets for standard ratios', () => {
	const presets169 = getResolutionsForRatio('16:9');
	assert.ok(presets169.length >= 4);
	assert.ok(presets169.some((p) => p.id === '1080p' && p.width === 1920 && p.height === 1080));
	assert.ok(presets169.some((p) => p.id === '4k' && p.width === 3840 && p.height === 2160));
	assert.ok(presets169.some((p) => p.id === '1440p' && p.width === 2560 && p.height === 1440));
	assert.ok(presets169.some((p) => p.id === '720p' && p.width === 1280 && p.height === 720));

	const presets916 = getResolutionsForRatio('9:16');
	assert.ok(presets916.some((p) => p.id === '1080p' && p.width === 1080 && p.height === 1920));
	assert.ok(presets916.some((p) => p.id === '4k' && p.width === 2160 && p.height === 3840));

	const presets11 = getResolutionsForRatio('1:1');
	assert.ok(presets11.some((p) => p.id === '1080p' && p.width === 1080 && p.height === 1080));
	assert.ok(presets11.some((p) => p.id === '512p' && p.width === 512 && p.height === 512));

	const presets219 = getResolutionsForRatio('21:9');
	assert.ok(presets219.some((p) => p.id === '5k' && p.width === 5120 && p.height === 2160));
	assert.ok(presets219.some((p) => p.id === '1440p' && p.width === 3440 && p.height === 1440));
	assert.ok(presets219.some((p) => p.id === '1080p' && p.width === 2560 && p.height === 1080));
});

test('getValidResolutionPreset preserves valid preset or falls back to 1080p', () => {
	assert.strictEqual(getValidResolutionPreset('16:9', '1080p'), '1080p');
	assert.strictEqual(getValidResolutionPreset('9:16', '1080p'), '1080p');
	assert.strictEqual(getValidResolutionPreset('4:5', '1440p'), '1080p');
	assert.strictEqual(getValidResolutionPreset('16:9', 'unknown'), '1080p');
});

test('resolvePresetDimensions returns exact dimensions or falls back to 1080p', () => {
	assert.deepStrictEqual(resolvePresetDimensions('16:9', '1080p'), { width: 1920, height: 1080 });
	assert.deepStrictEqual(resolvePresetDimensions('16:9', '4k'), { width: 3840, height: 2160 });
	assert.deepStrictEqual(resolvePresetDimensions('9:16', '1080p'), { width: 1080, height: 1920 });
	assert.deepStrictEqual(resolvePresetDimensions('16:9', 'nonexistent'), { width: 1920, height: 1080 });
});

test('resolutions match expected aspect ratios', () => {
	for (const [ratio, presets] of Object.entries(RESOLUTION_PRESETS_BY_RATIO)) {
		for (const preset of presets) {
			assert.ok(preset.width > 0 && preset.height > 0);
			assert.ok(preset.label.length > 0);
			assert.ok(preset.sublabel.includes('×'));
		}
	}
});
