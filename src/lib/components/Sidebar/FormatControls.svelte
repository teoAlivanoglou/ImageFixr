<script lang="ts">
	import { settings, commitHistory } from '$lib/state.svelte';
	import { getResolutionsForRatio, getValidResolutionPreset } from '$lib/viewport/resolutions';
	import { ASPECT_RATIOS } from './format-constants';
	import SectionHeader from './SectionHeader.svelte';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import CanvasControls from './CanvasControls.svelte';
	import { cn } from '$lib/utils';
	import { createLabelGroup } from './label-group.svelte';
	import LabeledControlRow from './LabeledControlRow.svelte';

	let { class: className }: { class?: string } = $props();

	createLabelGroup();

	let availableResolutions = $derived(getResolutionsForRatio(settings.current.aspectRatio));
	let currentRes = $derived(
		availableResolutions.find((r) => r.id === settings.current.resolutionPreset) ||
			availableResolutions[0]
	);

	function handleRatioChange(newRatio: string) {
		settings.current.resolutionPreset = getValidResolutionPreset(
			newRatio,
			settings.current.resolutionPreset
		);
		commitHistory();
	}
</script>

<div class={cn('flex flex-col gap-4', className)}>
	<SectionHeader title="Canvas Format" />

	<div class="flex flex-col gap-3">
		<LabeledControlRow label="Aspect Ratio" forId="format-aspect-ratio">
			<Select
				type="single"
				bind:value={settings.current.aspectRatio}
				onValueChange={handleRatioChange}
			>
				<SelectTrigger id="format-aspect-ratio" class="h-9 w-full text-xs">
					{settings.current.aspectRatio}
				</SelectTrigger>
				<SelectContent>
					{#each ASPECT_RATIOS as ratio (ratio.value)}
						<SelectItem value={ratio.value}>{ratio.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</LabeledControlRow>

		<LabeledControlRow label="Resolution" forId="format-resolution">
			<Select
				type="single"
				bind:value={settings.current.resolutionPreset}
				onValueChange={() => commitHistory()}
			>
				<SelectTrigger
					id="format-resolution"
					class="h-9 w-full text-xs"
					title={`${currentRes.label} (${currentRes.sublabel})`}
				>
					<span class="font-medium text-foreground">{currentRes.label}</span>
					<span class="ml-auto text-xs text-muted-foreground tabular-nums"
						>{currentRes.sublabel}</span
					>
				</SelectTrigger>
				<SelectContent>
					{#each availableResolutions as res (res.id)}
						<SelectItem value={res.id}>
							<div class="flex w-full items-center justify-between gap-4">
								<span class="font-medium">{res.label}</span>
								<span class="text-xs text-muted-foreground tabular-nums">{res.sublabel}</span>
							</div>
						</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</LabeledControlRow>

		{#if import.meta.env.DEV}
			<div class="border-t border-border pt-3">
				<CanvasControls />
			</div>
		{/if}
	</div>
</div>
