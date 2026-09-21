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
}

/**
 * Saves a Blob to the user's filesystem using the File System Access API if available,
 * falling back to an anchor download.
 */
export async function saveBlobAsFile(
	blob: Blob,
	suggestedName = 'image-fixr-render.png'
): Promise<void> {
	const saveFilePicker = (
		window as unknown as {
			showSaveFilePicker?: (options: {
				suggestedName: string;
				types: Array<{
					description: string;
					accept: Record<string, string[]>;
				}>;
			}) => Promise<{
				createWritable: () => Promise<{
					write: (data: Blob) => Promise<void>;
					close: () => Promise<void>;
				}>;
			}>;
		}
	).showSaveFilePicker;

	try {
		if (saveFilePicker) {
			const fileHandle = await saveFilePicker({
				suggestedName,
				types: [
					{
						description: 'PNG image',
						accept: { 'image/png': ['.png'] }
					}
				]
			});

			const writable = await fileHandle.createWritable();
			await writable.write(blob);
			await writable.close();
			return;
		}

		const downloadUrl = URL.createObjectURL(blob);
		const downloadLink = document.createElement('a');
		downloadLink.href = downloadUrl;
		downloadLink.download = suggestedName;
		downloadLink.click();
		URL.revokeObjectURL(downloadUrl);
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') return;
		console.error('Unable to save rendered image:', error);
	}
}

/**
 * Renders the PixiJS scene at 1:1 logical resolution and exports it as a PNG file.
 */
export async function renderAndSave(options: RenderAndSaveOptions): Promise<void> {
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
		filename = 'image-fixr-render.png'
	} = options;

	if (!pixiApp.renderer || !scene) return;

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

	if (!imageBlob) return;

	await saveBlobAsFile(imageBlob, filename);
}
