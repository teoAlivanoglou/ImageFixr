import { saveImageStorage, deleteImageStorage } from './image-db';
import { media } from './state.svelte';

let sessionForegroundHandle: FileSystemFileHandle | null = null;
let sessionLastSaveHandle: FileSystemFileHandle | null = null;

/**
 * Returns the handle to use as `startIn` for exports:
 * prioritizes the last saved file handle in this session,
 * falling back to the uploaded foreground image handle.
 */
export function getExportStartInHandle(): FileSystemFileHandle | null {
	return sessionLastSaveHandle || sessionForegroundHandle;
}

/**
 * Cache the last file handle saved during this session.
 */
export function recordSessionSaveHandle(handle: FileSystemFileHandle | null): void {
	sessionLastSaveHandle = handle;
}

/**
 * Explicitly set the session foreground file handle.
 */
export function setForegroundFileHandle(handle: FileSystemFileHandle | null): void {
	sessionForegroundHandle = handle;
}

/**
 * Save an image file to IndexedDB and update media state.
 */
export async function selectImage(
	target: 'foreground' | 'background',
	file: File,
	handle?: FileSystemFileHandle
): Promise<void> {
	if (!file.type.startsWith('image/')) return;
	await saveImageStorage(target, file);

	if (target === 'foreground') {
		sessionForegroundHandle = handle ?? null;
		media.current = { ...media.current, fgName: file.name, fgVersion: Date.now() };
	} else {
		media.current = { ...media.current, bgName: file.name, bgVersion: Date.now() };
	}
}

/**
 * Remove an image from IndexedDB and clear media state.
 */
export function removeImage(target: 'foreground' | 'background'): void {
	void deleteImageStorage(target);

	if (target === 'foreground') {
		sessionForegroundHandle = null;
		media.current = { ...media.current, fgName: '', fgVersion: Date.now() };
	} else {
		media.current = { ...media.current, bgName: '', bgVersion: Date.now() };
	}
}
