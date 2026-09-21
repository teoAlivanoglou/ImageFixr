<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Application,
		Sprite,
		BlurFilter,
		Container,
		Texture,
		RenderTexture,
		Mesh,
		PlaneGeometry,
		Shader,
		Graphics
	} from 'pixi.js';
	import { useResizeObserver } from 'runed';
	import { settings, appState, media, SAFE_AREA_PRESETS } from './state.svelte';
	import { loadImageStorage } from './image-db';
	import { cn } from './utils';
	import { ClampedBlurFilter } from './filters/clamped-blur-filter';
	import sdfShadowVert from './shaders/sdf-shadow.vert?raw';
	import sdfShadowFrag from './shaders/sdf-shadow.frag?raw';

	let { class: className }: { class?: string } = $props();

	let containerEl = $state<HTMLElement | null>(null);

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
		const aspectW = appState.aspectWidth;
		const aspectH = appState.aspectHeight;
		const targetAspect = aspectW / aspectH;

		const refTexture =
			fgTexture || (settings.current.bgSource === 'custom' ? bgTexture : undefined);

		if (refTexture && refTexture.width > 0 && refTexture.height > 0) {
			const imgW = refTexture.width;
			const imgH = refTexture.height;
			const imgAspect = imgW / imgH;

			if (targetAspect >= imgAspect) {
				// Canvas is wider than image: height matches image, width expands to target aspect ratio
				const height = imgH;
				const width = Math.round(height * targetAspect);
				return { width, height };
			} else {
				// Canvas is taller than image: width matches image, height expands to target aspect ratio
				const width = imgW;
				const height = Math.round(width / targetAspect);
				return { width, height };
			}
		}

		// Fallback when no image is loaded yet: base on 1920
		const baseSize = 1920;
		if (targetAspect >= 1) {
			return { width: baseSize, height: Math.round(baseSize / targetAspect) };
		} else {
			return { width: Math.round(baseSize * targetAspect), height: baseSize };
		}
	}

	function updateImageLayout() {
		if (!scene) return;
		const { width: logicalWidth, height: logicalHeight } = getLogicalDimensions();
		const minDim = Math.min(logicalWidth, logicalHeight);
		const pixelScale = minDim / 1080;

		if (bgColorGraphic) {
			const bgEnabled = settings.current.bgEnabled;
			const colorStr = settings.current.bgColor;
			bgColorGraphic.clear();
			if (bgEnabled) {
				const [r, g, b, a] = parseRgbaColor(colorStr);
				const hexCol =
					(Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255);
				bgColorGraphic.rect(0, 0, logicalWidth, logicalHeight).fill({ color: hexCol, alpha: a });
				bgColorGraphic.visible = true;
			} else {
				bgColorGraphic.visible = false;
			}
		}

		if (bgSprite && bgSprite.texture) {
			const coverScale = Math.max(
				logicalWidth / bgSprite.texture.width,
				logicalHeight / bgSprite.texture.height
			);
			const baseWidth = bgSprite.texture.width * coverScale * appState.bgActualScale;
			const baseHeight = bgSprite.texture.height * coverScale * appState.bgActualScale;

			bgSprite.width = baseWidth;
			bgSprite.height = baseHeight;
			bgSprite.position.set(logicalWidth / 2, logicalHeight / 2);
		}

		if (fgSprite && fgSprite.texture) {
			const marginsActive = settings.current.fgMarginEnabled;
			const standard = marginsActive ? settings.current.fgSafeAreaStandard || 'none' : 'none';
			const standardPreset = SAFE_AREA_PRESETS[standard] || SAFE_AREA_PRESETS.none;
			const standardPercent = standardPreset.marginPercent;

			const minDim = Math.min(logicalWidth, logicalHeight);
			const baseMarginPx = minDim * (standardPercent / 100);

			const valTop =
				marginsActive && settings.current.fgMarginTopEnabled
					? Math.max(0, settings.current.fgMarginTop ?? 0)
					: 0;
			const valRight =
				marginsActive && settings.current.fgMarginRightEnabled
					? Math.max(0, settings.current.fgMarginRight ?? 0)
					: 0;
			const valBottom =
				marginsActive && settings.current.fgMarginBottomEnabled
					? Math.max(0, settings.current.fgMarginBottom ?? 0)
					: 0;
			const valLeft =
				marginsActive && settings.current.fgMarginLeftEnabled
					? Math.max(0, settings.current.fgMarginLeft ?? 0)
					: 0;

			const unitTop = settings.current.fgMarginTopUnit || 'percent';
			const unitRight = settings.current.fgMarginRightUnit || 'percent';
			const unitBottom = settings.current.fgMarginBottomUnit || 'percent';
			const unitLeft = settings.current.fgMarginLeftUnit || 'percent';

			const customMarginTopPx = unitTop === 'percent' ? minDim * (valTop / 100) : valTop * pixelScale;
			const customMarginRightPx = unitRight === 'percent' ? minDim * (valRight / 100) : valRight * pixelScale;
			const customMarginBottomPx =
				unitBottom === 'percent' ? minDim * (valBottom / 100) : valBottom * pixelScale;
			const customMarginLeftPx = unitLeft === 'percent' ? minDim * (valLeft / 100) : valLeft * pixelScale;

			const totalMarginTopPx = Math.min(minDim * 0.48, baseMarginPx + customMarginTopPx);
			const totalMarginRightPx = Math.min(minDim * 0.48, baseMarginPx + customMarginRightPx);
			const totalMarginBottomPx = Math.min(minDim * 0.48, baseMarginPx + customMarginBottomPx);
			const totalMarginLeftPx = Math.min(minDim * 0.48, baseMarginPx + customMarginLeftPx);

			const safeLeft = totalMarginLeftPx;
			const safeTop = totalMarginTopPx;
			const safeRight = Math.max(safeLeft, logicalWidth - totalMarginRightPx);
			const safeBottom = Math.max(safeTop, logicalHeight - totalMarginBottomPx);

			const safeWidth = Math.max(0, safeRight - safeLeft);
			const safeHeight = Math.max(0, safeBottom - safeTop);

			const safeCenterX = safeLeft + safeWidth / 2;
			const safeCenterY = safeTop + safeHeight / 2;

			const containScale = Math.min(
				safeWidth / fgSprite.texture.width,
				safeHeight / fgSprite.texture.height
			);
			const fgCoverScale = Math.max(
				safeWidth / fgSprite.texture.width,
				safeHeight / fgSprite.texture.height
			);

			const val = Math.min(2.0, Math.max(0.0, appState.fgActualScale));
			let fgBaseScale = 0;
			if (val <= 1.0) {
				fgBaseScale = val * containScale;
			} else {
				fgBaseScale = containScale + (val - 1.0) * (fgCoverScale - containScale);
			}

			const targetW = fgSprite.texture.width * fgBaseScale;
			const targetH = fgSprite.texture.height * fgBaseScale;

			const borderEnabled = settings.current.fgBorderEnabled;
			const borderWidth = borderEnabled ? settings.current.fgBorderWidth * pixelScale : 0;
			const borderPosition = settings.current.fgBorderPosition || 'outer';

			const shrinkMultiplier = borderPosition === 'inner' ? 0 : borderPosition === 'center' ? 1 : 2;
			const shrinkPixels = borderWidth * shrinkMultiplier;

			const spriteW = Math.max(0, targetW - shrinkPixels);
			const spriteH = Math.max(0, targetH - shrinkPixels);

			fgSprite.width = spriteW;
			fgSprite.height = spriteH;
			fgSprite.position.set(safeCenterX, safeCenterY);

			if (fgBorder) {
				fgBorder.clear();
				if (borderEnabled && borderWidth > 0) {
					const [br, bg, bb, ba] = parseRgbaColor(settings.current.fgBorderColor);
					const hexCol =
						(Math.round(br * 255) << 16) + (Math.round(bg * 255) << 8) + Math.round(bb * 255);
					const alignment = borderPosition === 'inner' ? 1 : borderPosition === 'center' ? 0.5 : 0;
					fgBorder
						.rect(-spriteW / 2, -spriteH / 2, spriteW, spriteH)
						.stroke({ width: borderWidth, color: hexCol, alpha: ba, alignment });
					fgBorder.position.set(safeCenterX, safeCenterY);
					fgBorder.visible = !settings.current.shadowOnly;
				} else {
					fgBorder.visible = false;
				}
			}

			if (fgShadowMesh) {
				const shadowEnabled = settings.current.fgDropShadowEnabled;
				const shadowMode = settings.current.fgDropShadowMode;

				let blur = 0;
				let spread = 0;
				let offsetX = 0;
				let offsetY = 0;
				let alpha = 0;

				if (shadowEnabled) {
					alpha = settings.current.fgDropShadowAlpha / 100;
					if (shadowMode === 'simple') {
						const simpleSize = settings.current.fgDropShadowSimpleSize * pixelScale;
						blur = simpleSize;
						spread = Math.round(simpleSize * 0.5);
						offsetX = 0;
						offsetY = 0;
					} else {
						blur = settings.current.fgDropShadowStrength * pixelScale;
						spread = settings.current.fgDropShadowSpread * pixelScale;
						offsetX = settings.current.fgDropShadowOffsetX * pixelScale;
						offsetY = settings.current.fgDropShadowOffsetY * pixelScale;
					}
				}

				// The footprint is exactly targetW and targetH, regardless of border
				let shadowBoxW = targetW;
				let shadowBoxH = targetH;

				const padding = Math.max(
					blur * 3 + Math.abs(spread) + Math.max(Math.abs(offsetX), Math.abs(offsetY)) + 20,
					40
				);
				const quadW = shadowBoxW + padding * 2;
				const quadH = shadowBoxH + padding * 2;

				fgShadowMesh.width = quadW;
				fgShadowMesh.height = quadH;
				fgShadowMesh.position.set(safeCenterX, safeCenterY);

				const uniforms = sdfShader.resources.shadowUniforms.uniforms;
				uniforms.uQuadSize[0] = quadW;
				uniforms.uQuadSize[1] = quadH;
				uniforms.uBoxHalfSize[0] = shadowBoxW / 2;
				uniforms.uBoxHalfSize[1] = shadowBoxH / 2;
				uniforms.uBlur = blur;
				uniforms.uAlpha = alpha;
				uniforms.uSpread = spread;
				uniforms.uOffset[0] = offsetX;
				uniforms.uOffset[1] = offsetY;
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
		const scale = Math.min(targetW / logicalWidth, targetH / logicalHeight);

		scene.scale.set(scale);
		scene.x = (targetW - logicalWidth * scale) / 2;
		scene.y = (targetH - logicalHeight * scale) / 2;

		stageScale = scale;
		
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

	function parseRgbaColor(colorStr: string): [number, number, number, number] {
		if (!colorStr) return [0, 0, 0, 1];
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

			r = (parseInt(normalized.slice(0, 2), 16) || 0) / 255;
			g = (parseInt(normalized.slice(2, 4), 16) || 0) / 255;
			b = (parseInt(normalized.slice(4, 6), 16) || 0) / 255;
			if (normalized.length === 8) {
				a = (parseInt(normalized.slice(6, 8), 16) || 0) / 255;
			}
		} else {
			const rgbaMatch = raw.match(
				/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
			);
			if (rgbaMatch) {
				r = (parseFloat(rgbaMatch[1]) || 0) / 255;
				g = (parseFloat(rgbaMatch[2]) || 0) / 255;
				b = (parseFloat(rgbaMatch[3]) || 0) / 255;
				a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
			}
		}
		return [r, g, b, a];
	}

	function parseColorString(colorStr: string): { color: string; alpha: number } {
		if (!colorStr) return { color: '#000000', alpha: 1 };
		const [r, g, b, a] = parseRgbaColor(colorStr);
		const hexR = Math.round(r * 255)
			.toString(16)
			.padStart(2, '0');
		const hexG = Math.round(g * 255)
			.toString(16)
			.padStart(2, '0');
		const hexB = Math.round(b * 255)
			.toString(16)
			.padStart(2, '0');
		return { color: `#${hexR}${hexG}${hexB}`, alpha: a };
	}

	let hasBackgroundImage = $derived(
		settings.current.bgEnabled &&
			(settings.current.bgSource === 'link'
				? Boolean(media.current.fgName)
				: settings.current.bgSource === 'custom'
					? Boolean(media.current.bgName)
					: false)
	);

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
				const isRecreate = Boolean(fgTexture);
				if (fgTexture) {
					const old = fgTexture;
					fgTexture = undefined;
					old.destroy(true);
				}
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
				const isRecreate = Boolean(bgTexture);
				if (bgTexture) {
					const old = bgTexture;
					bgTexture = undefined;
					old.destroy(true);
				}
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
		fgBlurFilter.strength = appState.fgActualBlur * pixelScale;
		bgBlurFilter.strength = appState.bgActualBlur * pixelScale;

		updateImageLayout();

		// Render scene to high-res renderTexture (captures all layers including bgLayer, shadowLayer, fgLayer, borderLayer)
		pixiApp.renderer.render({
			container: scene,
			target: renderTexture
		});

		// Restore viewport scene transform & preview blur values
		scene.scale.set(oldScaleX, oldScaleY);
		scene.x = oldX;
		scene.y = oldY;
		fgBlurFilter.strength = appState.fgActualBlur * pixelScale * stageScale;
		bgBlurFilter.strength = appState.bgActualBlur * pixelScale * stageScale;

		updateImageLayout();

		// Extract canvas directly with true pixel colors and alpha channels
		const extractedCanvas = pixiApp.renderer.extract.canvas({
			target: renderTexture
		});

		renderTexture.destroy(true);

		const imageBlob = await new Promise<Blob | null>((resolve) =>
			(extractedCanvas as HTMLCanvasElement).toBlob(resolve, 'image/png')
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

	export function forceResize() {
		if (containerEl && pixiApp) {
			resizeScene(containerEl.clientWidth, containerEl.clientHeight);
			pixiApp.render();
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
