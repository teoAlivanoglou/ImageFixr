import { saveImageStorage, deleteImageStorage } from './image-db';
import { media } from './state.svelte';

/**
 * Save an image file to IndexedDB and update media state.
 */
export async function selectImage(
	target: 'foreground' | 'background',
	file: File
): Promise<void> {
	if (!file.type.startsWith('image/')) return;
	await saveImageStorage(target, file);

	if (target === 'foreground') {
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
		media.current = { ...media.current, fgName: '', fgVersion: Date.now() };
	} else {
		media.current = { ...media.current, bgName: '', bgVersion: Date.now() };
	}
}
