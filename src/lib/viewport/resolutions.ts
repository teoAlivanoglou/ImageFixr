export interface ResolutionPreset {
	id: string;
	label: string;
	sublabel: string;
	width: number;
	height: number;
}

export const RESOLUTION_PRESETS_BY_RATIO: Record<string, ResolutionPreset[]> = {
	'16:9': [
		{ id: '4k', label: '4K UHD', sublabel: '3840 × 2160', width: 3840, height: 2160 },
		{ id: '1440p', label: '1440p QHD', sublabel: '2560 × 1440', width: 2560, height: 1440 },
		{ id: '1080p', label: '1080p FHD', sublabel: '1920 × 1080', width: 1920, height: 1080 },
		{ id: '720p', label: '720p HD', sublabel: '1280 × 720', width: 1280, height: 720 }
	],
	'9:16': [
		{ id: '4k', label: '4K Vertical', sublabel: '2160 × 3840', width: 2160, height: 3840 },
		{ id: '1080p', label: '1080p Story', sublabel: '1080 × 1920', width: 1080, height: 1920 },
		{ id: '720p', label: '720p Vertical', sublabel: '720 × 1280', width: 720, height: 1280 }
	],
	'1:1': [
		{ id: '4k', label: '4K Square', sublabel: '2160 × 2160', width: 2160, height: 2160 },
		{ id: '1080p', label: '1080p Square', sublabel: '1080 × 1080', width: 1080, height: 1080 },
		{ id: '720p', label: '720p Square', sublabel: '720 × 720', width: 720, height: 720 },
		{ id: '512p', label: '512p Avatar', sublabel: '512 × 512', width: 512, height: 512 }
	],
	'4:5': [
		{ id: '4k', label: '4K Social', sublabel: '2160 × 2700', width: 2160, height: 2700 },
		{ id: '1080p', label: '1080p Feed', sublabel: '1080 × 1350', width: 1080, height: 1350 }
	],
	'4:3': [
		{ id: '4k', label: '4K Standard', sublabel: '2880 × 2160', width: 2880, height: 2160 },
		{ id: '1440p', label: 'QXGA / iPad', sublabel: '2048 × 1536', width: 2048, height: 1536 },
		{ id: '1080p', label: '1080p eq', sublabel: '1440 × 1080', width: 1440, height: 1080 },
		{ id: '720p', label: '720p eq', sublabel: '960 × 720', width: 960, height: 720 }
	],
	'3:2': [
		{ id: '4k', label: '4K Photo', sublabel: '3240 × 2160', width: 3240, height: 2160 },
		{ id: '1440p', label: '1440p Photo', sublabel: '2160 × 1440', width: 2160, height: 1440 },
		{ id: '1080p', label: '1080p Photo', sublabel: '1620 × 1080', width: 1620, height: 1080 },
		{ id: '720p', label: '720p Photo', sublabel: '1080 × 720', width: 1080, height: 720 }
	],
	'21:9': [
		{ id: '5k', label: '5K Ultrawide', sublabel: '5120 × 2160', width: 5120, height: 2160 },
		{ id: '1440p', label: 'UWQHD', sublabel: '3440 × 1440', width: 3440, height: 1440 },
		{ id: '1080p', label: 'UWFHD', sublabel: '2560 × 1080', width: 2560, height: 1080 }
	]
};

const DEFAULT_169_PRESET = RESOLUTION_PRESETS_BY_RATIO['16:9'][2]; // 1080p FHD

export function getResolutionsForRatio(aspectRatio: string): ResolutionPreset[] {
	return RESOLUTION_PRESETS_BY_RATIO[aspectRatio] || RESOLUTION_PRESETS_BY_RATIO['16:9'];
}

export function getValidResolutionPreset(aspectRatio: string, currentPreset: string): string {
	const presets = getResolutionsForRatio(aspectRatio);
	if (presets.some((p) => p.id === currentPreset)) {
		return currentPreset;
	}
	const fallback = presets.find((p) => p.id === '1080p') || presets[0];
	return fallback.id;
}

export function resolvePresetDimensions(
	aspectRatio: string,
	presetId: string
): { width: number; height: number } {
	const presets = getResolutionsForRatio(aspectRatio);
	const match = presets.find((p) => p.id === presetId);
	if (match) {
		return { width: match.width, height: match.height };
	}
	const fallback = presets.find((p) => p.id === '1080p') || presets[0] || DEFAULT_169_PRESET;
	return { width: fallback.width, height: fallback.height };
}
