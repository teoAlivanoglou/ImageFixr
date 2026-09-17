import { PersistedState, StateHistory } from 'runed';

export const theme = new PersistedState('image-fixr-theme', false, {
	storage: 'local',
	syncTabs: true
});

export type Settings = {
	fgBlur: number;
	fgScale: number;
	bgBlur: number;
	bgScale: number;
	fgBorderEnabled: boolean;
	fgBorderWidth: number;
	fgBorderColor: string;
	fgBorderPosition: 'inner' | 'center' | 'outer';
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
	autoGenerateMipmaps: boolean;
	mipmapFilter: 'linear' | 'nearest';
	swatches: string[];
	bgColor: string;
	bgEnabled: boolean;
	bgSource: 'none' | 'link' | 'custom';
	shadowOnly: boolean;
	advancedSettingsEnabled: boolean;
};

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

export const settings = new PersistedState<Settings>(
	'image-fixr-settings',
	{
		fgBlur: 0,
		fgScale: 1,
		bgBlur: 0,
		bgScale: 1,
		bgEnabled: true,
		bgSource: 'link',
		fgBorderEnabled: false,
		fgBorderWidth: 0,
		fgBorderColor: '#000000',
		fgBorderPosition: 'outer',
		fgDropShadowStrength: 16,
		fgDropShadowAlpha: 100,
		fgDropShadowSpread: 8,
		fgDropShadowOffsetX: 0,
		fgDropShadowOffsetY: 0,
		fgDropShadowQuality: 5,
		fgDropShadowExtra: 0,
		fgDropShadowEnabled: true,
		fgDropShadowMode: 'simple',
		fgDropShadowSimpleSize: 16,
		filtering: 'linear',
		aspectRatio: '16:9',
		autoGenerateMipmaps: true,
		mipmapFilter: 'nearest',
		swatches: [...DEFAULT_SWATCHES],
		bgColor: '#007595',
		shadowOnly: false,
		advancedSettingsEnabled: false
	},
	{ storage: 'local', syncTabs: true }
);

if (settings.current.bgEnabled === undefined) {
	settings.current.bgEnabled = true;
}
if (!settings.current.bgSource) {
	settings.current.bgSource = 'link';
}
if (!settings.current.bgColor || settings.current.bgColor === '#000000') {
	settings.current.bgColor = '#007595';
}
if (settings.current.shadowOnly === undefined) {
	settings.current.shadowOnly = false;
}
if (settings.current.fgBorderEnabled === undefined) {
	const legacyOutline = (settings.current as Record<string, unknown>).fgOutlineEnabled;
	const legacyWidth = (settings.current as Record<string, unknown>).fgOutlineWidth;
	settings.current.fgBorderEnabled =
		typeof legacyOutline === 'boolean'
			? legacyOutline
			: typeof legacyWidth === 'number' && legacyWidth > 0;
}
if (settings.current.fgBorderWidth === undefined) {
	settings.current.fgBorderWidth = (settings.current as any).fgOutlineWidth ?? 0;
}
if (!settings.current.fgBorderColor) {
	settings.current.fgBorderColor = (settings.current as any).fgOutlineColor ?? '#000000';
}
if (settings.current.fgBorderPosition === undefined) {
	settings.current.fgBorderPosition = 'outer';
}
if (settings.current.fgDropShadowSpread === undefined) {
	settings.current.fgDropShadowSpread = 0;
}
if (settings.current.fgDropShadowOffsetX === undefined) {
	settings.current.fgDropShadowOffsetX = 0;
}
if (settings.current.fgDropShadowOffsetY === undefined) {
	settings.current.fgDropShadowOffsetY = 0;
}
if (settings.current.fgDropShadowExtra === undefined) {
	settings.current.fgDropShadowExtra = 0;
}
if (settings.current.fgDropShadowEnabled === undefined) {
	settings.current.fgDropShadowEnabled = true;
}
if (settings.current.fgDropShadowMode === undefined) {
	settings.current.fgDropShadowMode = 'simple';
}
if (settings.current.fgDropShadowSimpleSize === undefined) {
	settings.current.fgDropShadowSimpleSize = 16;
}
if (settings.current.advancedSettingsEnabled === undefined) {
	settings.current.advancedSettingsEnabled = false;
}
if (!settings.current.swatches || !Array.isArray(settings.current.swatches)) {
	settings.current.swatches = [...DEFAULT_SWATCHES];
}

export const historyState = $state<{ value: Settings }>({
	value: $state.snapshot(settings.current)
});

export let history: StateHistory<Settings>;

export function commitHistory() {
	const next = $state.snapshot(settings.current);
	if (JSON.stringify(next) !== JSON.stringify(historyState.value)) {
		// console.log("[History Recorded]", next);
		historyState.value = next;
	}
}

$effect.root(() => {
	history = new StateHistory(
		() => historyState.value,
		(val) => {
			//   console.log("[History Restored (Undo/Redo)]", val);
			Object.assign(settings.current, val);
			historyState.value = $state.snapshot(val);
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
		return Number(settings.current.aspectRatio.split(':')[0]) || 16;
	}
	get aspectHeight() {
		return Number(settings.current.aspectRatio.split(':')[1]) || 9;
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
