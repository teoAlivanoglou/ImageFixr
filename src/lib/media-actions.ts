import { saveImageStorage, deleteImageStorage, setImagePersistence } from './image-db';
import { media, settings } from './state.svelte';

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
	handle?: FileSystemFileHandle,
	persist?: boolean
): Promise<void> {
	if (!file.type.startsWith('image/')) return;
	const isPersist = persist ?? (target === 'foreground' ? settings.current.fgPersist : settings.current.bgPersist);
	await saveImageStorage(target, file, { persist: isPersist });

	if (target === 'foreground') {
		sessionForegroundHandle = handle ?? null;
		media.current = {
			...media.current,
			fgName: file.name,
			fgVersion: Date.now(),
			fgPersist: isPersist
		};
	} else {
		media.current = {
			...media.current,
			bgName: file.name,
			bgVersion: Date.now(),
			bgPersist: isPersist
		};
	}
}

/**
 * Toggle persistence flag for an existing image.
 */
export async function toggleImagePersistence(target: 'foreground' | 'background'): Promise<void> {
	const currentPersist =
		target === 'foreground' ? media.current.fgPersist : media.current.bgPersist;
	const nextPersist = !currentPersist;

	// Optimistic update: flip state immediately for responsive, lag-free UI
	if (target === 'foreground') {
		media.current = { ...media.current, fgPersist: nextPersist };
		settings.current.fgPersist = nextPersist;
	} else {
		media.current = { ...media.current, bgPersist: nextPersist };
		settings.current.bgPersist = nextPersist;
	}

	try {
		await setImagePersistence(target, nextPersist);
	} catch (err) {
		// Roll back if saving to IndexedDB fails
		if (target === 'foreground') {
			media.current = { ...media.current, fgPersist: currentPersist };
			settings.current.fgPersist = currentPersist;
		} else {
			media.current = { ...media.current, bgPersist: currentPersist };
			settings.current.bgPersist = currentPersist;
		}
		console.error(`Failed to update persistence for ${target}:`, err);
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
