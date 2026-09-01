<script lang="ts">
	import {
		Application,
		Sprite,
		BlurFilter,
		Container,
		Texture,
		TextureStyle,
		RenderTexture
	} from 'pixi.js';
	import { useResizeObserver } from 'runed';
	import { settings, appState, media } from './state.svelte';
	import { loadImageStorage } from './image-db';

	let containerEl = $state<HTMLElement | null>(null);

	const fgBlurFilter = new BlurFilter({ strength: 0 });
	const bgBlurFilter = new BlurFilter({ strength: 0 });

	let pixiApp = $state<Application | null>(null);
	let scene = $state<Container | null>(null);

	let fgSprite: Sprite | undefined;
	let bgSprite: Sprite | undefined;

	let fgTexture = $state<Texture | undefined>(undefined);
	let bgTexture = $state<Texture | undefined>(undefined);

	let fgBaseScale = 1;
	let stageScale = $state(1);
	const logicalWidth = 1920;

	function getLogicalHeight() {
		return (logicalWidth * appState.aspectHeight) / appState.aspectWidth;
	}

	function updateImageLayout() {
		if (!scene) return;
		const logicalHeight = getLogicalHeight();

		if (bgSprite && bgSprite.texture) {
			const coverScale = Math.max(
				logicalWidth / bgSprite.texture.width,
				logicalHeight / bgSprite.texture.height
			);
			bgSprite.scale.set(coverScale * appState.bgActualScale);
			bgSprite.position.set(logicalWidth / 2, logicalHeight / 2);
		}

		if (fgSprite && fgSprite.texture) {
			const containScale = Math.min(
				logicalWidth / fgSprite.texture.width,
				logicalHeight / fgSprite.texture.height
			);
			const fgCoverScale = Math.max(
				logicalWidth / fgSprite.texture.width,
				logicalHeight / fgSprite.texture.height
			);

			const val = Math.min(2.0, Math.max(0.0, appState.fgActualScale));
			let fgScale = 0;
			if (val <= 1.0) {
				fgScale = val * containScale;
			} else {
				fgScale = containScale + (val - 1.0) * (fgCoverScale - containScale);
			}

			fgSprite.scale.set(fgScale);
			fgSprite.position.set(logicalWidth / 2, logicalHeight / 2);
		}
	}

	function resizeScene(w: number, h: number) {
		if (!pixiApp || !scene) return;

		const logicalHeight = getLogicalHeight();
		const scale = Math.min(
			pixiApp.screen.width / logicalWidth,
			pixiApp.screen.height / logicalHeight
		);

		scene.scale.set(scale);
		scene.x = (pixiApp.screen.width - logicalWidth * scale) / 2;
		scene.y = (pixiApp.screen.height - logicalHeight * scale) / 2;

		stageScale = scale;

		updateImageLayout();
	}

	function applyScaleMode(texture: Texture | undefined) {
		if (!texture?.source) return;
		const mode = settings.current.filtering === 'linear' ? 'linear' : 'nearest';
		const autoMipmaps = settings.current.autoGenerateMipmaps;
		const mipmapMode = settings.current.mipmapFilter;

		texture.source.autoGenerateMipmaps = autoMipmaps;
		texture.source.magFilter = mode;
		texture.source.minFilter = mode;
		texture.source.mipmapFilter = mipmapMode;

		if (texture.source.style) {
			texture.source.style.magFilter = mode;
			texture.source.style.minFilter = mode;
			texture.source.style.mipmapFilter = mipmapMode;
			texture.source.style.update();
		}
	}

	$effect(() => {
		if (!containerEl) return;
		const app = new Application();
		pixiApp = app;

		let destroyed = false;
		void (async () => {
			await app.init({
				resizeTo: containerEl,
				backgroundColor: 0x1099bb,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true
			});
			if (destroyed) {
				app.destroy();
				return;
			}
			containerEl.appendChild(app.canvas);
			scene = new Container();
			app.stage.addChild(scene);
			resizeScene(containerEl.clientWidth, containerEl.clientHeight);
		})();

		return () => {
			destroyed = true;
			pixiApp = null;
			scene = null;
			fgSprite = undefined;
			bgSprite = undefined;
			app.destroy(true, { children: true, texture: true });
		};
	});

	useResizeObserver(
		() => containerEl,
		(entries) => {
			const entry = entries[0];
			if (entry && containerEl) {
				resizeScene(entry.contentRect.width, entry.contentRect.height);
			}
		}
	);

	// Reload and recreate textures from scratch when settings change
	$effect(() => {
		fgBlurFilter.strength = appState.fgActualBlur * stageScale;
		bgBlurFilter.strength = appState.bgActualBlur * stageScale;

		// Track reactive settings properties
		const _filtering = settings.current.filtering;
		const _autoMipmaps = settings.current.autoGenerateMipmaps;
		const _mipmapFilter = settings.current.mipmapFilter;

		if (fgTexture) {
			applyScaleMode(fgTexture);
		}
		if (bgTexture) {
			applyScaleMode(bgTexture);
		}

		updateImageLayout();
	});

	// Sync foreground texture from IndexedDB when version or filtering/mipmap settings change
	$effect(() => {
		const name = media.current.fgName;
		const version = media.current.fgVersion;
		const _filtering = settings.current.filtering;
		const _autoMipmaps = settings.current.autoGenerateMipmaps;
		const _mipmapFilter = settings.current.mipmapFilter;

		if (!name) {
			if (fgTexture) {
				fgTexture.destroy(true);
				fgTexture = undefined;
			}
			return;
		}

		void loadImageStorage('foreground').then((data) => {
			if (!data) {
				if (fgTexture) {
					fgTexture.destroy(true);
					fgTexture = undefined;
				}
				return;
			}
			const objectUrl = URL.createObjectURL(data.file);
			const image = new Image();
			image.src = objectUrl;
			void image.decode().then(() => {
				if (fgTexture) {
					fgTexture.destroy(true);
				}
				const tex = Texture.from(image);
				applyScaleMode(tex);
				fgTexture = tex;
				URL.revokeObjectURL(objectUrl);
			});
		});
	});

	// Sync background texture from IndexedDB when version or filtering/mipmap settings change
	$effect(() => {
		const name = media.current.bgName;
		const version = media.current.bgVersion;
		const _filtering = settings.current.filtering;
		const _autoMipmaps = settings.current.autoGenerateMipmaps;
		const _mipmapFilter = settings.current.mipmapFilter;

		if (!name) {
			if (bgTexture) {
				bgTexture.destroy(true);
				bgTexture = undefined;
			}
			return;
		}

		void loadImageStorage('background').then((data) => {
			if (!data) {
				if (bgTexture) {
					bgTexture.destroy(true);
					bgTexture = undefined;
				}
				return;
			}
			const objectUrl = URL.createObjectURL(data.file);
			const image = new Image();
			image.src = objectUrl;
			void image.decode().then(() => {
				if (bgTexture) {
					bgTexture.destroy(true);
				}
				const tex = Texture.from(image);
				applyScaleMode(tex);
				bgTexture = tex;
				URL.revokeObjectURL(objectUrl);
			});
		});
	});

	// Sync foreground sprite
	$effect(() => {
		if (!scene) return;
		if (fgSprite) {
			scene.removeChild(fgSprite).destroy();
			fgSprite = undefined;
		}
		if (fgTexture) {
			fgSprite = new Sprite(fgTexture);
			fgSprite.anchor.set(0.5);
			fgSprite.filters = [fgBlurFilter];
			scene.addChild(fgSprite);
		}
		updateImageLayout();
	});

	// Sync background sprite
	$effect(() => {
		if (!scene) return;
		const tex = bgTexture || fgTexture;

		if (bgSprite) {
			scene.removeChild(bgSprite).destroy();
			bgSprite = undefined;
		}
		if (tex) {
			bgSprite = new Sprite(tex);
			bgSprite.anchor.set(0.5);
			bgSprite.filters = [bgBlurFilter];
			scene.addChildAt(bgSprite, 0);
		}
		updateImageLayout();
	});

	export async function renderAndSave() {
		if (!pixiApp?.renderer || !scene || !fgSprite) return;

		const logicalHeight = getLogicalHeight();

		// Create a fixed 1920x(logicalHeight) render texture
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
		fgBlurFilter.strength = appState.fgActualBlur;
		bgBlurFilter.strength = appState.bgActualBlur;

		updateImageLayout();

		// Render scene to high-res renderTexture
		pixiApp.renderer.render({
			container: scene,
			target: renderTexture
		});

		// Restore viewport scene transform & preview blur values
		scene.scale.set(oldScaleX, oldScaleY);
		scene.x = oldX;
		scene.y = oldY;
		fgBlurFilter.strength = appState.fgActualBlur * stageScale;
		bgBlurFilter.strength = appState.bgActualBlur * stageScale;

		updateImageLayout();

		// Extract canvas from high-res renderTexture
		const extractedCanvas = pixiApp.renderer.extract.canvas({
			target: renderTexture
		});

		renderTexture.destroy(true);

		// Fill solid canvas background color (#1099bb) on export canvas
		const exportCanvas = document.createElement('canvas');
		exportCanvas.width = logicalWidth;
		exportCanvas.height = logicalHeight;
		const ctx = exportCanvas.getContext('2d');

		if (ctx) {
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.fillStyle = '#1099bb';
			ctx.fillRect(0, 0, logicalWidth, logicalHeight);
			ctx.drawImage(extractedCanvas as HTMLCanvasElement, 0, 0);
		}

		const imageBlob = await new Promise<Blob | null>((resolve) =>
			(ctx ? exportCanvas : (extractedCanvas as HTMLCanvasElement)).toBlob(resolve, 'image/png')
		);

		if (!imageBlob) return;

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
					suggestedName: 'image-fixr-render.png',
					types: [
						{
							description: 'PNG image',
							accept: { 'image/png': ['.png'] }
						}
					]
				});

				const writable = await fileHandle.createWritable();
				await writable.write(imageBlob);
				await writable.close();
				return;
			}

			const downloadUrl = URL.createObjectURL(imageBlob);
			const downloadLink = document.createElement('a');
			downloadLink.href = downloadUrl;
			downloadLink.download = 'image-fixr-render.png';
			downloadLink.click();
			URL.revokeObjectURL(downloadUrl);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			console.error('Unable to save rendered image:', error);
		}
	}
</script>

<main
	class="min-h-0 min-w-0 self-center justify-self-center overflow-hidden bg-muted"
	style={`--aspect-width: ${appState.aspectWidth}; --aspect-height: ${appState.aspectHeight}; width: min(100%, calc(100dvh * var(--aspect-width) / var(--aspect-height))); aspect-ratio: var(--aspect-width) / var(--aspect-height);`}
	bind:this={containerEl}
></main>
