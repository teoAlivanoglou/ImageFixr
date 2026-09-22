import type { Settings } from '../state.svelte';
import { SAFE_AREA_PRESETS } from '../state.svelte';
import { parseRgbaColor, rgbToHexNumber } from './color-utils';

export interface LogicalDimensions {
	width: number;
	height: number;
}

export interface FitTransform {
	scale: number;
	x: number;
	y: number;
}

export interface BgSpriteLayout {
	width: number;
	height: number;
	x: number;
	y: number;
}

export interface FgLayoutResult {
	safeCenterX: number;
	safeCenterY: number;
	targetW: number;
	targetH: number;
	spriteW: number;
	spriteH: number;
	border: {
		enabled: boolean;
		width: number;
		colorNumber: number;
		alpha: number;
		alignment: number;
		visible: boolean;
	};
	shadow: {
		enabled: boolean;
		quadW: number;
		quadH: number;
		boxHalfW: number;
		boxHalfH: number;
		blur: number;
		alpha: number;
		spread: number;
		offsetX: number;
		offsetY: number;
	};
}

/**
 * Computes logical canvas dimensions based on resolved preset dimensions.
 */
export function computeLogicalDimensions(presetDimensions: {
	width: number;
	height: number;
}): LogicalDimensions {
	return {
		width: presetDimensions.width,
		height: presetDimensions.height
	};
}

/**
 * Computes the scale and centered offset to fit the logical canvas inside the container.
 */
export function computeFitTransform(
	containerWidth: number,
	containerHeight: number,
	logicalWidth: number,
	logicalHeight: number
): FitTransform {
	const scale = Math.min(containerWidth / logicalWidth, containerHeight / logicalHeight);
	const x = (containerWidth - logicalWidth * scale) / 2;
	const y = (containerHeight - logicalHeight * scale) / 2;
	return { scale, x, y };
}

/**
 * Computes layout for the background cover sprite.
 */
export function computeBgSpriteLayout(
	logicalWidth: number,
	logicalHeight: number,
	textureWidth: number,
	textureHeight: number,
	bgActualScale: number
): BgSpriteLayout {
	const coverScale = Math.max(logicalWidth / textureWidth, logicalHeight / textureHeight);
	const baseWidth = textureWidth * coverScale * bgActualScale;
	const baseHeight = textureHeight * coverScale * bgActualScale;

	return {
		width: baseWidth,
		height: baseHeight,
		x: logicalWidth / 2,
		y: logicalHeight / 2
	};
}

/**
 * Computes all layout geometry for foreground sprite, border, and drop shadow.
 */
export function computeFgLayout(
	logicalWidth: number,
	logicalHeight: number,
	fgTextureWidth: number,
	fgTextureHeight: number,
	currentSettings: Settings,
	fgActualScale: number
): FgLayoutResult {
	const minDim = Math.min(logicalWidth, logicalHeight);
	const pixelScale = minDim / 1080;

	// Margins & safe area
	const marginsActive = currentSettings.fgMarginEnabled;
	const standard = marginsActive ? currentSettings.fgSafeAreaStandard || 'none' : 'none';
	const standardPreset = SAFE_AREA_PRESETS[standard] || SAFE_AREA_PRESETS.none;
	const standardPercent = standardPreset.marginPercent;
	const baseMarginPx = minDim * (standardPercent / 100);

	const valTop = marginsActive && currentSettings.fgMarginTop > 0 ? currentSettings.fgMarginTop : 0;
	const valRight =
		marginsActive && currentSettings.fgMarginRight > 0 ? currentSettings.fgMarginRight : 0;
	const valBottom =
		marginsActive && currentSettings.fgMarginBottom > 0 ? currentSettings.fgMarginBottom : 0;
	const valLeft =
		marginsActive && currentSettings.fgMarginLeft > 0 ? currentSettings.fgMarginLeft : 0;

	const unitTop = currentSettings.fgMarginTopUnit || 'percent';
	const unitRight = currentSettings.fgMarginRightUnit || 'percent';
	const unitBottom = currentSettings.fgMarginBottomUnit || 'percent';
	const unitLeft = currentSettings.fgMarginLeftUnit || 'percent';

	const customMarginTopPx = unitTop === 'percent' ? minDim * (valTop / 100) : valTop * pixelScale;
	const customMarginRightPx =
		unitRight === 'percent' ? minDim * (valRight / 100) : valRight * pixelScale;
	const customMarginBottomPx =
		unitBottom === 'percent' ? minDim * (valBottom / 100) : valBottom * pixelScale;
	const customMarginLeftPx =
		unitLeft === 'percent' ? minDim * (valLeft / 100) : valLeft * pixelScale;

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

	// Scale calculations
	const containScale = Math.min(safeWidth / fgTextureWidth, safeHeight / fgTextureHeight);
	const fgCoverScale = Math.max(safeWidth / fgTextureWidth, safeHeight / fgTextureHeight);

	const val = Math.min(2.0, Math.max(0.0, fgActualScale));
	let fgBaseScale = 0;
	if (val <= 1.0) {
		fgBaseScale = val * containScale;
	} else {
		fgBaseScale = containScale + (val - 1.0) * (fgCoverScale - containScale);
	}

	const targetW = fgTextureWidth * fgBaseScale;
	const targetH = fgTextureHeight * fgBaseScale;

	// Border geometry
	const borderEnabled = currentSettings.fgBorderEnabled;
	const borderWidth = borderEnabled ? currentSettings.fgBorderWidth * pixelScale : 0;
	const borderPosition = currentSettings.fgBorderPosition || 'outer';

	const shrinkMultiplier = borderPosition === 'inner' ? 0 : borderPosition === 'center' ? 1 : 2;
	const shrinkPixels = borderWidth * shrinkMultiplier;

	const spriteW = Math.max(0, targetW - shrinkPixels);
	const spriteH = Math.max(0, targetH - shrinkPixels);

	const [br, bg, bb, ba] = parseRgbaColor(currentSettings.fgBorderColor);
	const borderHexCol = rgbToHexNumber(br, bg, bb);
	const borderAlignment = borderPosition === 'inner' ? 1 : borderPosition === 'center' ? 0.5 : 0;

	// Drop shadow geometry
	const shadowEnabled = currentSettings.fgDropShadowEnabled;
	const shadowMode = currentSettings.fgDropShadowMode;

	let blur = 0;
	let spread = 0;
	let offsetX = 0;
	let offsetY = 0;
	let alpha = 0;

	if (shadowEnabled) {
		alpha = currentSettings.fgDropShadowAlpha / 100;
		if (shadowMode === 'simple') {
			const simpleSize = currentSettings.fgDropShadowSimpleSize * pixelScale;
			blur = simpleSize;
			spread = Math.round(simpleSize * 0.5);
			offsetX = 0;
			offsetY = 0;
		} else {
			blur = currentSettings.fgDropShadowStrength * pixelScale;
			spread = currentSettings.fgDropShadowSpread * pixelScale;
			offsetX = currentSettings.fgDropShadowOffsetX * pixelScale;
			offsetY = currentSettings.fgDropShadowOffsetY * pixelScale;
		}
	}

	const shadowBoxW = targetW;
	const shadowBoxH = targetH;

	const padding = Math.max(
		blur * 3 + Math.abs(spread) + Math.max(Math.abs(offsetX), Math.abs(offsetY)) + 20,
		40
	);
	const quadW = shadowBoxW + padding * 2;
	const quadH = shadowBoxH + padding * 2;

	return {
		safeCenterX,
		safeCenterY,
		targetW,
		targetH,
		spriteW,
		spriteH,
		border: {
			enabled: borderEnabled,
			width: borderWidth,
			colorNumber: borderHexCol,
			alpha: ba,
			alignment: borderAlignment,
			visible: borderEnabled && borderWidth > 0 && !currentSettings.shadowOnly
		},
		shadow: {
			enabled: shadowEnabled,
			quadW,
			quadH,
			boxHalfW: shadowBoxW / 2,
			boxHalfH: shadowBoxH / 2,
			blur,
			alpha,
			spread,
			offsetX,
			offsetY
		}
	};
}
