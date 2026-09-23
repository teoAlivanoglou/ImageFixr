import test from 'node:test';
import assert from 'node:assert/strict';
import { ASPECT_RATIOS } from './format-constants.ts';
import { getResolutionsForRatio, getValidResolutionPreset } from '../../viewport/resolutions.ts';

test('ASPECT_RATIOS contains all standard aspect ratios', () => {
	const values = ASPECT_RATIOS.map((r) => r.value);
	assert.ok(values.includes('16:9'));
	assert.ok(values.includes('4:3'));
	assert.ok(values.includes('1:1'));
	assert.ok(values.includes('9:16'));
	assert.ok(values.includes('4:5'));
	assert.ok(values.includes('3:2'));
	assert.ok(values.includes('21:9'));
});

test('changing ratio returns valid resolution preset', () => {
	const newPreset = getValidResolutionPreset('9:16', '1080p');
	assert.strictEqual(newPreset, '1080p');
	const resList = getResolutionsForRatio('9:16');
	assert.ok(resList.some((r) => r.id === newPreset));
});
