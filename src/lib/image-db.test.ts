import test from 'node:test';
import assert from 'node:assert/strict';
import { isRecordExpired, DEFAULT_SESSION_DURATION_MS } from './image-db.ts';

test('isRecordExpired returns false if record is persistent regardless of age', () => {
	const record = {
		persist: true,
		lastAccess: Date.now() - 100 * DEFAULT_SESSION_DURATION_MS,
		ttlMs: DEFAULT_SESSION_DURATION_MS
	};
	assert.strictEqual(isRecordExpired(record), false);
});

test('isRecordExpired returns false if record is within session duration', () => {
	const now = 1_000_000_000;
	const record = {
		persist: false,
		lastAccess: now - 1000,
		ttlMs: DEFAULT_SESSION_DURATION_MS
	};
	assert.strictEqual(isRecordExpired(record, now), false);
});

test('isRecordExpired returns true if record exceeds session duration', () => {
	const now = 1_000_000_000;
	const record = {
		persist: false,
		lastAccess: now - (DEFAULT_SESSION_DURATION_MS + 1),
		ttlMs: DEFAULT_SESSION_DURATION_MS
	};
	assert.strictEqual(isRecordExpired(record, now), true);
});
