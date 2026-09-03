<script lang="ts">
	import { untrack } from 'svelte';
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
	import { cn } from './utils';

	let { class: className }: { class?: string } = $props();

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
			const baseWidth = bgSprite.texture.width * coverScale * appState.bgActualScale;
			const baseHeight = bgSprite.texture.height * coverScale * appState.bgActualScale;

			// Base anti-bleed offset (2px) + dynamic blur edge expansion (bgBlur / 2)
			const autoBlurOffset = 2 + settings.current.bgBlur / 2;
			const offsetPixels = autoBlurOffset * 2;

			bgSprite.width = baseWidth + offsetPixels;
			bgSprite.height = baseHeight + offsetPixels;
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

	function resizeScene(w?: number, h?: number) {
		if (!pixiApp || !scene) return;

		const targetW = w ?? containerEl?.clientWidth ?? pixiApp.screen.width;
		const targetH = h ?? containerEl?.clientHeight ?? pixiApp.screen.height;

		if (targetW <= 0 || targetH <= 0) return;

		if (
			Math.round(pixiApp.screen.width) !== Math.round(targetW) ||
			Math.round(pixiApp.screen.height) !== Math.round(targetH)
		) {
			pixiApp.renderer.resize(targetW, targetH);
		}

		const logicalHeight = getLogicalHeight();
		const scale = Math.min(
			targetW / logicalWidth,
			targetH / logicalHeight
		);

		scene.scale.set(scale);
		scene.x = (targetW - logicalWidth * scale) / 2;
		scene.y = (targetH - logicalHeight * scale) / 2;

		stageScale = scale;

		updateImageLayout();
	}

	function applyScaleMode(texture: Texture | undefined) {
		if (!texture || texture.destroyed || !texture.source || texture.source.destroyed) return;
		const mode = settings.current.filtering === 'linear' ? 'linear' : 'nearest';
		const autoMipmaps = settings.current.autoGenerateMipmaps;
		const mipmapMode = settings.current.mipmapFilter;

		try {
			texture.source.autoGenerateMipmaps = autoMipmaps;
			texture.source.magFilter = mode;
			texture.source.minFilter = mode;
			texture.source.mipmapFilter = mipmapMode;
		} catch (err) {
			console.warn('Unable to set texture scale mode:', err);
		}
	}

	function parseColorString(colorStr: string): { color: string; alpha: number } {
		if (!colorStr) return { color: '#000000', alpha: 1 };
		const raw = colorStr.trim();

		let r = 0;
		let g = 0;
		let b = 0;
		let a = 1;

		if (raw.startsWith('#')) {
			const hex = raw.slice(1);
			const normalized =
				hex.length <= 4
					? hex
							.split('')
							.map((char) => `${char}${char}`)
							.join('')
					: hex;

			r = parseInt(normalized.slice(0, 2), 16) || 0;
			g = parseInt(normalized.slice(2, 4), 16) || 0;
			b = parseInt(normalized.slice(4, 6), 16) || 0;
			if (normalized.length === 8) {
				a = parseInt(normalized.slice(6, 8), 16) / 255;
			}
		} else {
			const rgbaMatch = raw.match(
				/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i
			);
			if (rgbaMatch) {
				r = parseInt(rgbaMatch[1], 10) || 0;
				g = parseInt(rgbaMatch[2], 10) || 0;
				b = parseInt(rgbaMatch[3], 10) || 0;
				a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
			}
		}

		// Premultiply RGB by Alpha so WebGL premultiplied canvas compositing works correctly
		const pr = Math.round(r * a);
		const pg = Math.round(g * a);
		const pb = Math.round(b * a);

		const premultipliedHex = `#${((1 << 24) + (pr << 16) + (pg << 8) + pb).toString(16).slice(1)}`;
		return { color: premultipliedHex, alpha: a };
	}

	$effect(() => {
		if (!containerEl) return;
		const app = new Application();
		pixiApp = app;

		let destroyed = false;
		void (async () => {
			const initialBg = untrack(() => settings.current.bgColor);
			const parsedBg = parseColorString(initialBg);
			await app.init({
				resizeTo: containerEl,
				backgroundColor: parsedBg.color,
				backgroundAlpha: parsedBg.alpha,
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

	$effect(() => {
		const bg = settings.current.bgColor;
		if (pixiApp?.renderer) {
			const parsed = parseColorString(bg);
			pixiApp.renderer.background.color = parsed.color;
			pixiApp.renderer.background.alpha = parsed.alpha;
		}
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
		// Track reactive settings properties
		const _aspectRatio = settings.current.aspectRatio;
		const _fgScale = settings.current.fgScale;
		const _bgScale = settings.current.bgScale;
		const _fgBlur = settings.current.fgBlur;
		const _bgBlur = settings.current.bgBlur;
		const _filtering = settings.current.filtering;
		const _autoMipmaps = settings.current.autoGenerateMipmaps;
		const _mipmapFilter = settings.current.mipmapFilter;

		fgBlurFilter.strength = appState.fgActualBlur * stageScale;
		bgBlurFilter.strength = appState.bgActualBlur * stageScale;

		if (fgTexture) {
			applyScaleMode(fgTexture);
		}
		if (bgTexture) {
			applyScaleMode(bgTexture);
		}

		if (pixiApp && scene && containerEl) {
			resizeScene(containerEl.clientWidth, containerEl.clientHeight);
		} else {
			updateImageLayout();
		}
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
				const old = fgTexture;
				fgTexture = undefined;
				old.destroy(true);
			}
			return;
		}

		void loadImageStorage('foreground').then((data) => {
			if (!data) {
				if (fgTexture) {
					const old = fgTexture;
					fgTexture = undefined;
					old.destroy(true);
				}
				return;
			}
			const objectUrl = URL.createObjectURL(data.file);
			const image = new Image();
			image.src = objectUrl;
			void image.decode().then(() => {
				if (fgTexture) {
					const old = fgTexture;
					fgTexture = undefined;
					old.destroy(true);
				}
				const tex = Texture.from(image);
				applyScaleMode(tex);
				fgTexture = tex;
				URL.revokeObjectURL(objectUrl);
			});
		});
	});

	// Sync background texture from IndexedDB when version, link toggle, or filtering/mipmap settings change
	$effect(() => {
		const isLinked = media.current.link;
		const name = isLinked ? media.current.fgName : media.current.bgName;
		const version = isLinked ? media.current.fgVersion : media.current.bgVersion;
		const targetStorage = isLinked ? 'foreground' : 'background';

		const _filtering = settings.current.filtering;
		const _autoMipmaps = settings.current.autoGenerateMipmaps;
		const _mipmapFilter = settings.current.mipmapFilter;

		if (!name) {
			if (bgTexture) {
				const old = bgTexture;
				bgTexture = undefined;
				old.destroy(true);
			}
			return;
		}

		void loadImageStorage(targetStorage).then((data) => {
			if (!data) {
				if (bgTexture) {
					const old = bgTexture;
					bgTexture = undefined;
					old.destroy(true);
				}
				return;
			}
			const objectUrl = URL.createObjectURL(data.file);
			const image = new Image();
			image.src = objectUrl;
			void image.decode().then(() => {
				if (bgTexture) {
					const old = bgTexture;
					bgTexture = undefined;
					old.destroy(true);
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

		if (bgSprite) {
			scene.removeChild(bgSprite).destroy();
			bgSprite = undefined;
		}
		if (bgTexture) {
			bgSprite = new Sprite(bgTexture);
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

		// Fill canvas background color on export canvas
		const exportCanvas = document.createElement('canvas');
		exportCanvas.width = logicalWidth;
		exportCanvas.height = logicalHeight;
		const ctx = exportCanvas.getContext('2d');

		if (ctx) {
			const parsedBg = parseColorString(settings.current.bgColor);
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.fillStyle = parsedBg.color;
			ctx.globalAlpha = parsedBg.alpha;
			ctx.fillRect(0, 0, logicalWidth, logicalHeight);
			ctx.globalAlpha = 1.0;
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

<div
	class={cn(
		'@container-size relative flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden bg-background',
		className
	)}
>
	<main
		bind:this={containerEl}
		class="checkerboard-bg shrink-0 overflow-hidden rounded-xs"
		style={`--aspect-width: ${appState.aspectWidth}; --aspect-height: ${appState.aspectHeight}; width: min(100cqw, calc(100cqh * var(--aspect-width) / var(--aspect-height))); max-height: 100cqh; max-width: 100cqw; aspect-ratio: var(--aspect-width) / var(--aspect-height);`}
	></main>
</div>
