import type { Application, Container } from 'pixi.js';
import { RenderTexture } from 'pixi.js';
import type { ClampedBlurFilter } from '../filters/clamped-blur-filter';

export interface RenderAndSaveOptions {
	pixiApp: Application;
	scene: Container;
	logicalWidth: number;
	logicalHeight: number;
	stageScale: number;
	fgBlurFilter: ClampedBlurFilter;
	bgBlurFilter: ClampedBlurFilter;
	fgActualBlur: number;
	bgActualBlur: number;
	updateLayout: () => void;
	filename?: string;
	startIn?: FileSystemHandle | null;
}

/**
 * Saves a Blob to the user's filesystem using the File System Access API if available,
 * falling back to an anchor download. Returns the saved FileSystemFileHandle if available.
 */
export async function saveBlobAsFile(
	blob: Blob,
	suggestedName = 'image-fixr-render.png',
	startIn?: FileSystemHandle | null
): Promise<FileSystemFileHandle | null> {
	const saveFilePicker = (
		window as unknown as {
			showSaveFilePicker?: (options: {
				suggestedName: string;
				types: Array<{
					description: string;
					accept: Record<string, string[]>;
				}>;
				startIn?: FileSystemHandle;
			}) => Promise<FileSystemFileHandle & {
				createWritable: () => Promise<{
					write: (data: Blob) => Promise<void>;
					close: () => Promise<void>;
				}>;
			}>;
		}
	).showSaveFilePicker;

	try {
		if (saveFilePicker) {
			const options: {
				suggestedName: string;
				types: Array<{
					description: string;
					accept: Record<string, string[]>;
				}>;
				startIn?: FileSystemHandle;
			} = {
				suggestedName,
				types: [
					{
						description: 'PNG image',
						accept: { 'image/png': ['.png'] }
					}
				]
			};

			if (startIn) {
				options.startIn = startIn;
			}

			let fileHandle: (FileSystemFileHandle & {
				createWritable: () => Promise<{
					write: (data: Blob) => Promise<void>;
					close: () => Promise<void>;
				}>;
			}) | undefined;

			try {
				fileHandle = await saveFilePicker(options);
			} catch (pickerError) {
				if (pickerError instanceof DOMException && pickerError.name === 'AbortError') {
					return null;
				}
				// If startIn failed due to permission or invalid handle, retry once without startIn
				if (options.startIn) {
					delete options.startIn;
					fileHandle = await saveFilePicker(options);
				} else {
					throw pickerError;
				}
			}

			if (!fileHandle) return null;

			const writable = await fileHandle.createWritable();
			await writable.write(blob);
			await writable.close();
			return fileHandle;
		}

		const downloadUrl = URL.createObjectURL(blob);
		const downloadLink = document.createElement('a');
		downloadLink.href = downloadUrl;
		downloadLink.download = suggestedName;
		downloadLink.click();
		URL.revokeObjectURL(downloadUrl);
		return null;
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') return null;
		console.error('Unable to save rendered image:', error);
		return null;
	}
}

/**
 * Renders the PixiJS scene at 1:1 logical resolution and exports it as a PNG file.
 */
export async function renderAndSave(
	options: RenderAndSaveOptions
): Promise<FileSystemFileHandle | null> {
	const {
		pixiApp,
		scene,
		logicalWidth,
		logicalHeight,
		stageScale,
		fgBlurFilter,
		bgBlurFilter,
		fgActualBlur,
		bgActualBlur,
		updateLayout,
		filename = 'image-fixr-render.png',
		startIn
	} = options;

	if (!pixiApp.renderer || !scene) return null;

	// Create a fixed logicalWidth x logicalHeight render texture
	const renderTexture = RenderTexture.create({
		width: logicalWidth,
		height: logicalHeight
	});

	// Save current scene transform & blur values
	const oldScaleX = scene.scale.x;
	const oldScaleY = scene.scale.y;
	const oldX = scene.x;
	const oldY = scene.y;

	// Set scene to full 1.0 scale for high-res export
	scene.scale.set(1);
	scene.x = 0;
	scene.y = 0;
	const pixelScale = Math.min(logicalWidth, logicalHeight) / 1080;
	fgBlurFilter.strength = fgActualBlur * pixelScale;
	bgBlurFilter.strength = bgActualBlur * pixelScale;

	updateLayout();

	// Render scene to high-res renderTexture (captures all layers including bgLayer, shadowLayer, fgLayer, borderLayer)
	pixiApp.renderer.render({
		container: scene,
		target: renderTexture
	});

	// Restore viewport scene transform & preview blur values
	scene.scale.set(oldScaleX, oldScaleY);
	scene.x = oldX;
	scene.y = oldY;
	fgBlurFilter.strength = fgActualBlur * pixelScale * stageScale;
	bgBlurFilter.strength = bgActualBlur * pixelScale * stageScale;

	updateLayout();

	// Extract canvas directly with true pixel colors and alpha channels
	const extractedCanvas = pixiApp.renderer.extract.canvas({
		target: renderTexture
	});

	renderTexture.destroy(true);

	const imageBlob = await new Promise<Blob | null>((resolve) =>
		(extractedCanvas as HTMLCanvasElement).toBlob(resolve, 'image/png')
	);

	if (!imageBlob) return null;

	return await saveBlobAsFile(imageBlob, filename, startIn);
}
