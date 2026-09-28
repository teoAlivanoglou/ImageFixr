<script lang="ts">
	import { getContext } from 'svelte';
	import { settings, commitHistory } from '$lib/state.svelte';
	import { getResolutionsForRatio, getValidResolutionPreset } from '$lib/viewport/resolutions';
	import { ASPECT_RATIOS } from './format-constants';
	import SectionHeader from './SectionHeader.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
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
	import * as m from '$paraglide/messages.js';

	let { class: className }: { class?: string } = $props();

	createLabelGroup();

	const collapsible = getContext('collapsible') ?? true;
	let isCollapsed = $state(false);
	let isSectionOpen = $derived(!collapsible || !isCollapsed);

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

<div class={cn('flex flex-col', className)}>
	<SectionHeader title={m.sidebar_format()} bind:isCollapsed />

	<CollapsibleSection open={isSectionOpen}>
		<div class="flex flex-col gap-3 pt-2">
		<LabeledControlRow label={m.aspect_ratio()} forId="format-aspect-ratio">
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

		<LabeledControlRow label={m.resolution()} forId="format-resolution">
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
	</CollapsibleSection>
</div>
