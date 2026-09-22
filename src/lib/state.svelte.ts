import { PersistedState, StateHistory } from 'runed';

export const theme = new PersistedState('image-fixr-theme', false, {
	storage: 'local',
	syncTabs: true
});

export type SafeAreaStandard =
	'none' | 'smpte-title' | 'smpte-action' | 'legacy-action' | 'legacy-title' | 'custom';

export type MarginUnit = 'percent' | 'pixel';

export const SAFE_AREA_PRESETS: Record<SafeAreaStandard, { label: string; marginPercent: number }> =
	{
		none: { label: 'None', marginPercent: 0 },
		'smpte-title': { label: 'Title Safe', marginPercent: 5 },
		'smpte-action': { label: 'Action Safe', marginPercent: 3.5 },
		'legacy-action': { label: 'Legacy Action Safe (90%)', marginPercent: 5 },
		'legacy-title': { label: 'Legacy Title Safe (80%)', marginPercent: 10 },
		custom: { label: 'Custom', marginPercent: 0 }
	};

import { resolvePresetDimensions } from '$lib/viewport/resolutions';

export type BorderPosition = 'inner' | 'center' | 'outer';

export interface Settings {
	fgBlur: number;
	bgBlur: number;
	fgScale: number;
	bgScale: number;
	fgSafeAreaStandard: SafeAreaStandard;
	fgMarginEnabled: boolean;
	fgMarginTop: number;
	fgMarginRight: number;
	fgMarginBottom: number;
	fgMarginLeft: number;
	fgMarginTopUnit: MarginUnit;
	fgMarginRightUnit: MarginUnit;
	fgMarginBottomUnit: MarginUnit;
	fgMarginLeftUnit: MarginUnit;
	fgMarginTopEnabled: boolean;
	fgMarginRightEnabled: boolean;
	fgMarginBottomEnabled: boolean;
	fgMarginLeftEnabled: boolean;
	fgMarginsLinked: boolean;
	fgBorderEnabled: boolean;
	fgBorderWidth: number;
	fgBorderColor: string;
	fgBorderPosition: BorderPosition;
	fgDropShadowStrength: number;
	fgDropShadowAlpha: number;
	fgDropShadowSpread: number;
	fgDropShadowOffsetX: number;
	fgDropShadowOffsetY: number;
	fgDropShadowQuality: number;
	fgDropShadowExtra: number;
	fgDropShadowEnabled: boolean;
	fgDropShadowMode: 'simple' | 'advanced';
	fgDropShadowSimpleSize: number;
	filtering: 'linear' | 'nearest';
	aspectRatio: string;
	resolutionPreset: string;
	autoGenerateMipmaps: boolean;
	mipmapFilter: 'linear' | 'nearest';
	swatches: string[];
	bgColor: string;
	bgEnabled: boolean;
	bgSource: 'none' | 'link' | 'custom';
	shadowOnly: boolean;
	advancedSettingsEnabled: boolean;
	fgCollapsed: boolean;
	bgCollapsed: boolean;
	fgMarginCollapsed: boolean;
	fgBorderCollapsed: boolean;
	fgDropShadowCollapsed: boolean;
	advancedCollapsed: boolean;
}

export const DEFAULT_SWATCHES = [
	'#000000',
	'#ffffff',
	'#6b7280',
	'#ef4444',
	'#f97316',
	'#eab308',
	'#22c55e',
	'#3b82f6',
	'#8b5cf6',
	'#ec4899',
	'#007595'
];

export function resetSwatches() {
	settings.current.swatches = [...DEFAULT_SWATCHES];
	commitHistory();
	console.log(
		'%c[ImageFixr] Swatches reset to default:',
		'color: #007595; font-weight: bold;',
		settings.current.swatches
	);
	return settings.current.swatches;
}

if (typeof window !== 'undefined') {
	(window as any).resetSwatches = resetSwatches;
}

export const SETTINGS_DEFAULTS: Settings = {
	fgBlur: 0,
	fgScale: 1,
	fgSafeAreaStandard: 'smpte-title',
	fgMarginTop: 0,
	fgMarginRight: 0,
	fgMarginBottom: 0,
	fgMarginLeft: 0,
	fgMarginTopUnit: 'percent',
	fgMarginRightUnit: 'percent',
	fgMarginBottomUnit: 'percent',
	fgMarginLeftUnit: 'percent',
	fgMarginTopEnabled: false,
	fgMarginRightEnabled: false,
	fgMarginBottomEnabled: false,
	fgMarginLeftEnabled: false,
	fgMarginsLinked: false,
	fgMarginEnabled: true,
	bgBlur: 100,
	bgScale: 1,
	bgEnabled: true,
	bgSource: 'link',
	fgBorderEnabled: true,
	fgBorderWidth: 10,
	fgBorderColor: '#DED7D0',
	fgBorderPosition: 'outer',
	fgDropShadowStrength: 30,
	fgDropShadowAlpha: 80,
	fgDropShadowSpread: 15,
	fgDropShadowOffsetX: 0,
	fgDropShadowOffsetY: 0,
	fgDropShadowQuality: 5,
	fgDropShadowExtra: 0,
	fgDropShadowEnabled: true,
	fgDropShadowMode: 'simple',
	fgDropShadowSimpleSize: 30,
	filtering: 'linear',
	aspectRatio: '16:9',
	resolutionPreset: '1080p',
	autoGenerateMipmaps: true,
	mipmapFilter: 'nearest',
	swatches: [...DEFAULT_SWATCHES],
	bgColor: '#007595',
	shadowOnly: false,
	advancedSettingsEnabled: false,
	fgCollapsed: false,
	bgCollapsed: false,
	fgMarginCollapsed: true,
	fgBorderCollapsed: true,
	fgDropShadowCollapsed: true,
	advancedCollapsed: true
};

export const settings = new PersistedState<Settings>(
	'image-fixr-settings',
	{ ...SETTINGS_DEFAULTS },
	{ storage: 'local', syncTabs: true }
);

// --- Settings migration ---
// Fill in any keys that are missing from persisted state (e.g. newly added settings).
// Legacy rename: fgOutline* → fgBorder*
{
	const legacy = settings.current as unknown as Record<string, unknown>;
	if (settings.current.fgBorderEnabled === undefined) {
		settings.current.fgBorderEnabled =
			typeof legacy.fgOutlineEnabled === 'boolean'
				? legacy.fgOutlineEnabled
				: typeof legacy.fgOutlineWidth === 'number' && legacy.fgOutlineWidth > 0;
	}
	if (settings.current.fgBorderWidth === undefined) {
		settings.current.fgBorderWidth = (legacy.fgOutlineWidth as number) ?? 10;
	}
	if (!settings.current.fgBorderColor) {
		settings.current.fgBorderColor = (legacy.fgOutlineColor as string) ?? '#DED7D0';
	}
}

// Migrate 'action' alias to 'smpte-action'
if ((settings.current.fgSafeAreaStandard as string) === 'action') {
	settings.current.fgSafeAreaStandard = 'smpte-action';
}

// Legacy: per-side margins from single fgMargin value
{
	const legacy = settings.current as unknown as Record<string, unknown>;
	const legacyMargin = (legacy.fgMargin as number) ?? 0;
	const legacyUnit = (legacy.fgMarginUnit as MarginUnit) ?? 'percent';
	const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
	for (const side of sides) {
		const valKey = `fgMargin${side}` as keyof Settings;
		const unitKey = `fgMargin${side}Unit` as keyof Settings;
		if ((settings.current as any)[valKey] === undefined) {
			(settings.current as any)[valKey] = legacyMargin;
		}
		if ((settings.current as any)[unitKey] === undefined) {
			(settings.current as any)[unitKey] = legacyUnit;
		}
	}
}

// Fill all remaining undefined keys from defaults
for (const key of Object.keys(SETTINGS_DEFAULTS) as Array<keyof Settings>) {
	if ((settings.current as any)[key] === undefined) {
		(settings.current as any)[key] = SETTINGS_DEFAULTS[key];
	}
}

// Special sentinel: override stale bgColor
if (settings.current.bgColor === '#000000') {
	settings.current.bgColor = '#007595';
}

// Derive fgMarginEnabled if it was missing
if (
	settings.current.fgMarginEnabled === false &&
	(settings.current.fgSafeAreaStandard !== 'none' ||
		settings.current.fgMarginTopEnabled ||
		settings.current.fgMarginRightEnabled ||
		settings.current.fgMarginBottomEnabled ||
		settings.current.fgMarginLeftEnabled)
) {
	settings.current.fgMarginEnabled = true;
}

// Ensure swatches array is valid
if (!Array.isArray(settings.current.swatches)) {
	settings.current.swatches = [...DEFAULT_SWATCHES];
}

const UI_ONLY_KEYS: (keyof Settings)[] = [
	'fgCollapsed',
	'bgCollapsed',
	'fgMarginCollapsed',
	'fgBorderCollapsed',
	'fgDropShadowCollapsed',
	'advancedCollapsed',
	'swatches'
];

function getVisualSnapshot(s: Settings): Record<string, unknown> {
	const copy: Record<string, unknown> = { ...s };
	for (const key of UI_ONLY_KEYS) {
		delete copy[key];
	}
	return copy;
}

export const historyState = $state<{ value: Settings }>({
	value: $state.snapshot(settings.current)
});

export let history: StateHistory<Settings>;

export function commitHistory() {
	const next = $state.snapshot(settings.current);
	if (
		JSON.stringify(getVisualSnapshot(next)) !==
		JSON.stringify(getVisualSnapshot(historyState.value))
	) {
		// console.log("[History Recorded]", next);
		historyState.value = next;
	}
}

$effect.root(() => {
	history = new StateHistory(
		() => historyState.value,
		(val) => {
			const currentUi = {
				fgCollapsed: settings.current.fgCollapsed,
				bgCollapsed: settings.current.bgCollapsed,
				fgMarginCollapsed: settings.current.fgMarginCollapsed,
				fgBorderCollapsed: settings.current.fgBorderCollapsed,
				fgDropShadowCollapsed: settings.current.fgDropShadowCollapsed,
				advancedCollapsed: settings.current.advancedCollapsed,
				swatches: settings.current.swatches
			};
			Object.assign(settings.current, val, currentUi);
			historyState.value = $state.snapshot(settings.current);
		},
		{ capacity: 50 }
	);
});

export type MediaState = {
	fgName: string;
	fgVersion: number;
	bgName: string;
	bgVersion: number;
	link: boolean;
};

export const media = new PersistedState<MediaState>(
	'image-fixr-media',
	{
		fgName: '',
		fgVersion: 0,
		bgName: '',
		bgVersion: 0,
		link: true
	},
	{ storage: 'local', syncTabs: true }
);

if (media.current.link === undefined) {
	media.current.link = true;
}

export class AppState {
	get aspectWidth() {
		const dims = resolvePresetDimensions(
			settings.current.aspectRatio,
			settings.current.resolutionPreset
		);
		return dims.width;
	}
	get aspectHeight() {
		const dims = resolvePresetDimensions(
			settings.current.aspectRatio,
			settings.current.resolutionPreset
		);
		return dims.height;
	}
	get fgActualBlur() {
		return settings.current.fgBlur / 5;
	}
	get bgActualBlur() {
		return settings.current.bgBlur / 5;
	}
	get fgActualScale() {
		return settings.current.fgScale;
	}
	get bgActualScale() {
		return settings.current.bgScale;
	}
}

export const appState = new AppState();

export function ellipsizeMiddle(value: string, maxLength = 30) {
	if (!value) return '';
	if (value.length <= maxLength) return value;

	const visibleLength = maxLength - 3;
	const startLength = Math.ceil(visibleLength / 2);
	const endLength = Math.floor(visibleLength / 2);

	return `${value.slice(0, startLength)}...${value.slice(-endLength)}`;
}
