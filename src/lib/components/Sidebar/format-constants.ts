import * as m from '../../../paraglide/messages.js';

export function getAspectRatios() {
	return [
		{ value: '16:9', label: `16:9 ${m.ratio_landscape()}` },
		{ value: '4:3', label: `4:3 ${m.ratio_classic()}` },
		{ value: '1:1', label: `1:1 ${m.ratio_square()}` },
		{ value: '9:16', label: `9:16 ${m.ratio_portrait()}` },
		{ value: '4:5', label: `4:5 ${m.ratio_social()}` },
		{ value: '3:2', label: `3:2 ${m.ratio_photo()}` },
		{ value: '21:9', label: `21:9 ${m.ratio_ultrawide()}` }
	];
}

export const ASPECT_RATIOS = [
	{ value: '16:9', label: '16:9 Landscape' },
	{ value: '4:3', label: '4:3 Classic' },
	{ value: '1:1', label: '1:1 Square' },
	{ value: '9:16', label: '9:16 Portrait' },
	{ value: '4:5', label: '4:5 Social' },
	{ value: '3:2', label: '3:2 Photo' },
	{ value: '21:9', label: '21:9 Ultrawide' }
];
