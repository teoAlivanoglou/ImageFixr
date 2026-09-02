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
	filtering: 'linear' | 'nearest';
	aspectRatio: '16:9' | '4:3' | '1:1';
	autoGenerateMipmaps: boolean;
	mipmapFilter: 'linear' | 'nearest';
	swatches: string[];
	bgColor: string;
};

export const settings = new PersistedState<Settings>(
	'image-fixr-settings',
	{
		fgBlur: 0,
		fgScale: 1,
		bgBlur: 0,
		bgScale: 1,
		filtering: 'linear',
		aspectRatio: '16:9',
		autoGenerateMipmaps: true,
		mipmapFilter: 'nearest',
		swatches: [
			'#000000',
			'#ffffff',
			'#6b7280',
			'#ef4444',
			'#f97316',
			'#eab308',
			'#22c55e',
			'#3b82f6',
			'#8b5cf6',
			'#ec4899'
		],
		bgColor: '#000000'
	},
	{ storage: 'local', syncTabs: true }
);

if (!settings.current.bgColor) {
	settings.current.bgColor = '#000000';
}
if (!settings.current.swatches || !Array.isArray(settings.current.swatches)) {
	settings.current.swatches = [
		'#000000',
		'#ffffff',
		'#6b7280',
		'#ef4444',
		'#f97316',
		'#eab308',
		'#22c55e',
		'#3b82f6',
		'#8b5cf6',
		'#ec4899'
	];
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
