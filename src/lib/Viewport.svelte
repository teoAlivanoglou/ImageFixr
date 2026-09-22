<script lang="ts">
	import { untrack, tick } from 'svelte';
	import {
		Application,
		Sprite,
		Container,
		Texture,
		Mesh,
		PlaneGeometry,
		Shader,
		Graphics
	} from 'pixi.js';
	import { useResizeObserver } from 'runed';
	import { settings, appState, media } from './state.svelte';
	import { loadImageStorage } from './image-db';
	import { selectImage, getExportStartInHandle, recordSessionSaveHandle } from './media-actions';
	import { cn } from './utils';
	import { ClampedBlurFilter } from './filters/clamped-blur-filter';
	import { parseRgbaColor, rgbToHexNumber } from './viewport/color-utils';
	import {
		computeLogicalDimensions,
		computeFitTransform,
		computeBgSpriteLayout,
		computeFgLayout
	} from './viewport/layout';
	import { renderAndSave as exportRenderedImage } from './viewport/export';
	import sdfShadowVert from './shaders/sdf-shadow.vert?raw';
	import sdfShadowFrag from './shaders/sdf-shadow.frag?raw';

	let { class: className }: { class?: string } = $props();

	let containerEl = $state<HTMLElement | null>(null);
	let isDragging = $state(false);

	const fgBlurFilter = new ClampedBlurFilter({ strength: 0, quality: 4 });
	const bgBlurFilter = new ClampedBlurFilter({ strength: 0, quality: 4 });

	const sdfShader = Shader.from({
		gl: {
			vertex: sdfShadowVert,
			fragment: sdfShadowFrag,
			name: 'sdf-shadow-gl'
		},
		resources: {
			shadowUniforms: {
				uQuadSize: { value: new Float32Array([100, 100]), type: 'vec2<f32>' },
				uBoxHalfSize: { value: new Float32Array([50, 50]), type: 'vec2<f32>' },
				uBlur: { value: 20, type: 'f32' },
				uAlpha: { value: 1, type: 'f32' },
				uSpread: { value: 0, type: 'f32' },
				uOffset: { value: new Float32Array([0, 0]), type: 'vec2<f32>' },
				uShadowColor: { value: new Float32Array([0, 0, 0]), type: 'vec3<f32>' }
			}
		}
	});

	let pixiApp = $state<Application | null>(null);
	let scene = $state<Container | null>(null);

	let bgLayer = $state<Container | null>(null);
	let shadowLayer = $state<Container | null>(null);
	let fgLayer = $state<Container | null>(null);
	let borderLayer = $state<Container | null>(null);

	let bgColorGraphic = $state<Graphics | null>(null);
	let bgSprite: Sprite | undefined;
	let fgShadowMesh: Mesh<PlaneGeometry, Shader> | undefined;
	let fgSprite: Sprite | undefined;
	let fgBorder: Graphics | undefined;

	let fgTexture = $state<Texture | undefined>(undefined);
	let bgTexture = $state<Texture | undefined>(undefined);

	let stageScale = $state(1);

	function getLogicalDimensions() {
		const refTexture =
			fgTexture || (settings.current.bgSource === 'custom' ? bgTexture : undefined);
		return computeLogicalDimensions(
			appState.aspectWidth,
			appState.aspectHeight,
			refTexture?.width,
			refTexture?.height
		);
	}

	function updateImageLayout() {
		if (!scene) return;
		const { width: logicalWidth, height: logicalHeight } = getLogicalDimensions();

		if (bgColorGraphic) {
			bgColorGraphic.clear();
			if (settings.current.bgEnabled) {
				const [r, g, b, a] = parseRgbaColor(settings.current.bgColor);
				const hexCol = rgbToHexNumber(r, g, b);
				bgColorGraphic.rect(0, 0, logicalWidth, logicalHeight).fill({ color: hexCol, alpha: a });
				bgColorGraphic.visible = true;
			} else {
				bgColorGraphic.visible = false;
			}
		}

		if (bgSprite && bgSprite.texture) {
			const bgLayout = computeBgSpriteLayout(
				logicalWidth,
				logicalHeight,
				bgSprite.texture.width,
				bgSprite.texture.height,
				appState.bgActualScale
			);
			bgSprite.width = bgLayout.width;
			bgSprite.height = bgLayout.height;
			bgSprite.position.set(bgLayout.x, bgLayout.y);
		}

		if (fgSprite && fgSprite.texture) {
			const fgLayout = computeFgLayout(
				logicalWidth,
				logicalHeight,
				fgSprite.texture.width,
				fgSprite.texture.height,
				settings.current,
				appState.fgActualScale
			);

			fgSprite.width = fgLayout.spriteW;
			fgSprite.height = fgLayout.spriteH;
			fgSprite.position.set(fgLayout.safeCenterX, fgLayout.safeCenterY);

			if (fgBorder) {
				fgBorder.clear();
				if (fgLayout.border.visible) {
					fgBorder
						.rect(-fgLayout.spriteW / 2, -fgLayout.spriteH / 2, fgLayout.spriteW, fgLayout.spriteH)
						.stroke({
							width: fgLayout.border.width,
							color: fgLayout.border.colorNumber,
							alpha: fgLayout.border.alpha,
							alignment: fgLayout.border.alignment
						});
					fgBorder.position.set(fgLayout.safeCenterX, fgLayout.safeCenterY);
					fgBorder.visible = true;
				} else {
					fgBorder.visible = false;
				}
			}

			if (fgShadowMesh) {
				fgShadowMesh.width = fgLayout.shadow.quadW;
				fgShadowMesh.height = fgLayout.shadow.quadH;
				fgShadowMesh.position.set(fgLayout.safeCenterX, fgLayout.safeCenterY);

				const uniforms = sdfShader.resources.shadowUniforms.uniforms;
				uniforms.uQuadSize[0] = fgLayout.shadow.quadW;
				uniforms.uQuadSize[1] = fgLayout.shadow.quadH;
				uniforms.uBoxHalfSize[0] = fgLayout.shadow.boxHalfW;
				uniforms.uBoxHalfSize[1] = fgLayout.shadow.boxHalfH;
				uniforms.uBlur = fgLayout.shadow.blur;
				uniforms.uAlpha = fgLayout.shadow.alpha;
				uniforms.uSpread = fgLayout.shadow.spread;
				uniforms.uOffset[0] = fgLayout.shadow.offsetX;
				uniforms.uOffset[1] = fgLayout.shadow.offsetY;
			}
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

		const { width: logicalWidth, height: logicalHeight } = getLogicalDimensions();
		const fit = computeFitTransform(targetW, targetH, logicalWidth, logicalHeight);

		scene.scale.set(fit.scale);
		scene.x = fit.x;
		scene.y = fit.y;

		stageScale = fit.scale;

		pixiApp.render();

		updateImageLayout();
	}

	function applyScaleMode(texture: Texture | undefined) {
		if (!texture || texture.destroyed || !texture.source || texture.source.destroyed) return;
		const mode = settings.current.filtering === 'linear' ? 'linear' : 'nearest';
		const autoMipmaps = settings.current.autoGenerateMipmaps;
		const mipmapFilter = settings.current.mipmapFilter;

		try {
			texture.source.autoGenerateMipmaps = autoMipmaps;
			texture.source.magFilter = mode;
			texture.source.minFilter = mode;
			texture.source.mipmapFilter = mipmapFilter;
			texture.source.style.addressMode = 'clamp-to-edge';
		} catch (err) {
			console.warn('Unable to set texture scale mode:', err);
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
				backgroundAlpha: 0,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true
			});
			if (destroyed) {
				app.destroy();
				return;
			}
			containerEl.appendChild(app.canvas);

			scene = new Container();
			bgLayer = new Container();
			shadowLayer = new Container();
			fgLayer = new Container();
			borderLayer = new Container();

			scene.addChild(bgLayer);
			scene.addChild(shadowLayer);
			scene.addChild(fgLayer);
			scene.addChild(borderLayer);

			bgColorGraphic = new Graphics();
			bgLayer.addChild(bgColorGraphic);

			app.stage.addChild(scene);
			resizeScene(containerEl.clientWidth, containerEl.clientHeight);
		})();

		return () => {
			destroyed = true;
			pixiApp = null;
			scene = null;
			bgLayer = null;
			shadowLayer = null;
			fgLayer = null;
			borderLayer = null;
			bgColorGraphic = null;
			fgSprite = undefined;
			fgShadowMesh = undefined;
			fgBorder = undefined;
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
		// Track reactive settings properties
		const _aspectRatio = settings.current.aspectRatio;
		const _bgEnabled = settings.current.bgEnabled;
		const _bgSource = settings.current.bgSource;
		const _bgColor = settings.current.bgColor;
		const _fgScale = settings.current.fgScale;
		const _safeAreaStandard = settings.current.fgSafeAreaStandard;
		const _fgMarginTop = settings.current.fgMarginTop;
		const _fgMarginRight = settings.current.fgMarginRight;
		const _fgMarginBottom = settings.current.fgMarginBottom;
		const _fgMarginLeft = settings.current.fgMarginLeft;
		const _fgMarginTopUnit = settings.current.fgMarginTopUnit;
		const _fgMarginRightUnit = settings.current.fgMarginRightUnit;
		const _fgMarginBottomUnit = settings.current.fgMarginBottomUnit;
		const _fgMarginLeftUnit = settings.current.fgMarginLeftUnit;
		const _fgMarginTopEnabled = settings.current.fgMarginTopEnabled;
		const _fgMarginRightEnabled = settings.current.fgMarginRightEnabled;
		const _fgMarginBottomEnabled = settings.current.fgMarginBottomEnabled;
		const _fgMarginLeftEnabled = settings.current.fgMarginLeftEnabled;
		const _fgMarginEnabled = settings.current.fgMarginEnabled;
		const _bgScale = settings.current.bgScale;
		const _fgBlur = settings.current.fgBlur;
		const _bgBlur = settings.current.bgBlur;
		const _filtering = settings.current.filtering;
		const _autoMipmaps = settings.current.autoGenerateMipmaps;
		const _mipmapFilter = settings.current.mipmapFilter;
		const _borderEnabled = settings.current.fgBorderEnabled;
		const _borderWidth = settings.current.fgBorderWidth;
		const _borderColor = settings.current.fgBorderColor;
		const _borderPosition = settings.current.fgBorderPosition;
		const _shadowEnabled = settings.current.fgDropShadowEnabled;
		const _shadowMode = settings.current.fgDropShadowMode;
		const _shadowSimpleSize = settings.current.fgDropShadowSimpleSize;
		const _shadowStrength = settings.current.fgDropShadowStrength;
		const _shadowAlpha = settings.current.fgDropShadowAlpha;
		const _shadowSpread = settings.current.fgDropShadowSpread;
		const _shadowOffsetX = settings.current.fgDropShadowOffsetX;
		const _shadowOffsetY = settings.current.fgDropShadowOffsetY;
		const _shadowOnly = settings.current.shadowOnly;

		const { width: logicalWidth, height: logicalHeight } = getLogicalDimensions();
		const pixelScale = Math.min(logicalWidth, logicalHeight) / 1080;

		fgBlurFilter.strength = appState.fgActualBlur * pixelScale * stageScale;
		bgBlurFilter.strength = appState.bgActualBlur * pixelScale * stageScale;

		if (fgSprite) {
			fgSprite.visible = !settings.current.shadowOnly;
			fgSprite.filters = appState.fgActualBlur > 0 ? [fgBlurFilter] : [];
		}
		if (bgSprite) {
			bgSprite.filters = appState.bgActualBlur > 0 ? [bgBlurFilter] : [];
		}
		if (fgBorder) {
			fgBorder.visible =
				!settings.current.shadowOnly &&
				settings.current.fgBorderEnabled &&
				settings.current.fgBorderWidth > 0;
		}
		if (fgShadowMesh) {
			fgShadowMesh.visible =
				settings.current.fgDropShadowEnabled && settings.current.fgDropShadowAlpha > 0;
		}

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

	// Narrowed reactive variables to prevent full settings object from triggering recreation
	const filteringMode = $derived(settings.current.filtering);
	const mipmapEnabled = $derived(settings.current.autoGenerateMipmaps);
	const mipmapMode = $derived(settings.current.mipmapFilter);

	// Sync foreground texture from IndexedDB when version or filtering/mipmap settings change
	$effect(() => {
		const name = media.current.fgName;
		const _version = media.current.fgVersion;
		const _f = filteringMode;
		const _m = mipmapEnabled;
		const _mf = mipmapMode;

		if (!name) {
			if (fgTexture) {
				const old = fgTexture;
				fgTexture = undefined;
				tick().then(() => old.destroy(true));
			}
			return;
		}

		void loadImageStorage('foreground').then((data) => {
			if (!data) {
				if (fgTexture) {
					const old = fgTexture;
					fgTexture = undefined;
					tick().then(() => old.destroy(true));
				}
				return;
			}
			const objectUrl = URL.createObjectURL(data.file);
			const image = new Image();
			image.src = objectUrl;
			void image.decode().then(() => {
				const isRecreate = Boolean(fgTexture);
				const old = fgTexture;
				
				console.log(
					isRecreate
						? '[Texture] Recreating foreground texture'
						: '[Texture] Creating foreground texture',
					{
						width: image.naturalWidth,
						height: image.naturalHeight
					}
				);
				const tex = Texture.from(image);
				applyScaleMode(tex);
				fgTexture = tex;
				
				if (old) {
					tick().then(() => old.destroy(true));
				}
				URL.revokeObjectURL(objectUrl);
			});
		});
	});

	const bgEnabledMode = $derived(settings.current.bgEnabled);
	const bgSourceMode = $derived(settings.current.bgSource);

	// Sync background texture from IndexedDB when version, bgSource, or filtering/mipmap settings change
	$effect(() => {
		const bgEnabled = bgEnabledMode;
		const bgSource = bgSourceMode;
		const isLinked = bgSource === 'link';
		const isCustom = bgSource === 'custom';
		const name = isLinked ? media.current.fgName : isCustom ? media.current.bgName : '';
		const _version = isLinked ? media.current.fgVersion : isCustom ? media.current.bgVersion : 0;
		const targetStorage = isLinked ? 'foreground' : 'background';

		const _f = filteringMode;
		const _m = mipmapEnabled;
		const _mf = mipmapMode;

		if (!bgEnabled || bgSource === 'none' || !name) {
			if (bgTexture) {
				const old = bgTexture;
				bgTexture = undefined;
				tick().then(() => old.destroy(true));
			}
			return;
		}

		void loadImageStorage(targetStorage).then((data) => {
			if (!data) {
				if (bgTexture) {
					const old = bgTexture;
					bgTexture = undefined;
					tick().then(() => old.destroy(true));
				}
				return;
			}
			const objectUrl = URL.createObjectURL(data.file);
			const image = new Image();
			image.src = objectUrl;
			void image.decode().then(() => {
				const isRecreate = Boolean(bgTexture);
				const old = bgTexture;
				
				console.log(
					isRecreate
						? '[Texture] Recreating background texture'
						: '[Texture] Creating background texture',
					{
						source: bgSource,
						width: image.naturalWidth,
						height: image.naturalHeight
					}
				);
				const tex = Texture.from(image);
				applyScaleMode(tex);
				bgTexture = tex;
				
				if (old) {
					tick().then(() => old.destroy(true));
				}
				URL.revokeObjectURL(objectUrl);
			});
		});
	});

	// Sync foreground sprite, SDF shadow mesh & border overlay
	$effect(() => {
		if (!shadowLayer || !fgLayer || !borderLayer) return;

		if (fgBorder) {
			borderLayer.removeChild(fgBorder).destroy();
			fgBorder = undefined;
		}
		if (fgShadowMesh) {
			shadowLayer.removeChild(fgShadowMesh).destroy();
			fgShadowMesh = undefined;
		}
		if (fgSprite) {
			fgLayer.removeChild(fgSprite).destroy();
			fgSprite = undefined;
		}
		if (fgTexture) {
			// 1. Analytical SDF Shadow Mesh in shadowLayer
			const mesh = new Mesh<PlaneGeometry, Shader>({
				geometry: new PlaneGeometry({ width: 1, height: 1, verticesX: 2, verticesY: 2 }),
				shader: sdfShader
			});
			mesh.pivot.set(0.5, 0.5);
			mesh.visible = settings.current.fgDropShadowEnabled && settings.current.fgDropShadowAlpha > 0;
			fgShadowMesh = mesh;
			shadowLayer.addChild(mesh);

			// 2. Crisp foreground sprite in fgLayer
			fgSprite = new Sprite(fgTexture);
			fgSprite.anchor.set(0.5);
			fgSprite.visible = !settings.current.shadowOnly;
			fgSprite.filters = appState.fgActualBlur > 0 ? [fgBlurFilter] : [];
			fgLayer.addChild(fgSprite);

			// 3. Crisp border overlay in borderLayer
			fgBorder = new Graphics();
			fgBorder.visible = !settings.current.shadowOnly;
			borderLayer.addChild(fgBorder);
		}
		updateImageLayout();
	});

	// Sync background sprite
	$effect(() => {
		if (!bgLayer) return;

		if (bgSprite) {
			bgLayer.removeChild(bgSprite).destroy();
			bgSprite = undefined;
		}
		if (bgTexture && settings.current.bgEnabled && settings.current.bgSource !== 'none') {
			bgSprite = new Sprite(bgTexture);
			bgSprite.anchor.set(0.5);
			bgSprite.filters = appState.bgActualBlur > 0 ? [bgBlurFilter] : [];
			bgLayer.addChild(bgSprite);
		}
		updateImageLayout();
	});

	export async function renderAndSave() {
		if (!pixiApp?.renderer || !scene) return;

		const { width: logicalWidth, height: logicalHeight } = getLogicalDimensions();

		const filename = media.current.fgName
			? `${media.current.fgName.replace(/\.[^/.]+$/, '')}-fixed.png`
			: 'image-fixr-render.png';

		const startIn = getExportStartInHandle();

		const savedHandle = await exportRenderedImage({
			pixiApp,
			scene,
			logicalWidth,
			logicalHeight,
			stageScale,
			fgBlurFilter,
			bgBlurFilter,
			fgActualBlur: appState.fgActualBlur,
			bgActualBlur: appState.bgActualBlur,
			updateLayout: updateImageLayout,
			filename,
			startIn
		});

		if (savedHandle) {
			recordSessionSaveHandle(savedHandle);
		}
	}

	export function forceResize() {
		if (containerEl && pixiApp) {
			resizeScene(containerEl.clientWidth, containerEl.clientHeight);
			pixiApp.render();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={cn(
		'@container-size relative flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden bg-background',
		className
	)}
	ondragover={(e) => {
		e.preventDefault();
		isDragging = true;
	}}
	ondragleave={() => (isDragging = false)}
	ondrop={async (e) => {
		e.preventDefault();
		isDragging = false;
		let handle: FileSystemFileHandle | undefined;
		const item = e.dataTransfer?.items?.[0];
		if (item && 'getAsFileSystemHandle' in item) {
			try {
				const droppedHandle = await (
					item as unknown as { getAsFileSystemHandle: () => Promise<FileSystemHandle | null> }
				).getAsFileSystemHandle();
				if (droppedHandle && droppedHandle.kind === 'file') {
					handle = droppedHandle as FileSystemFileHandle;
				}
			} catch {
				// Fallback to standard File
			}
		}

		const file = handle ? await handle.getFile() : e.dataTransfer?.files?.[0];
		if (file) void selectImage('foreground', file, handle);
	}}
>
	<div
		class={cn(
			'relative shrink-0 overflow-hidden rounded-xs transition-[box-shadow,ring] duration-150',
			isDragging && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
		)}
		style={`--aspect-width: ${appState.aspectWidth}; --aspect-height: ${appState.aspectHeight}; width: min(100cqw, calc(100cqh * var(--aspect-width) / var(--aspect-height))); max-height: 100cqh; max-width: 100cqw; aspect-ratio: var(--aspect-width) / var(--aspect-height);`}
	>
		<main bind:this={containerEl} class="checkerboard-bg h-full w-full overflow-hidden"></main>

		{#if isDragging}
			<div
				class="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-1 bg-background/70 backdrop-blur-xs"
			>
				<span class="text-sm font-medium text-foreground">Drop image here</span>
				<span class="text-xs text-muted-foreground">Sets as foreground image</span>
			</div>
		{/if}
	</div>
</div>
