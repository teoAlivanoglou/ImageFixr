<script lang="ts">
	import { getContext } from 'svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { commitHistory, settings } from '$lib/state.svelte';
	import { cn } from '$lib/utils';
	import { Switch } from '$lib/components/ui/switch';
	import SectionHeader from './SectionHeader.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
	import { createLabelGroup } from './label-group.svelte';
	import LabeledControlRow from './LabeledControlRow.svelte';

	let { class: className }: { class?: string } = $props();

	createLabelGroup();

	const collapsible = getContext<boolean | undefined>('collapsible') ?? true;
	let isSectionOpen = $derived(!collapsible || !settings.current.advancedCollapsed);
</script>

<div class={cn('flex flex-col', className)}>
	<SectionHeader title="Advanced" bind:isCollapsed={settings.current.advancedCollapsed} />

	<CollapsibleSection open={isSectionOpen}>
		<div class="control-section">
			<div class="flex items-center justify-between gap-2 py-1">
				<Label for="shadow-only">Shadow Only (Debug)</Label>
				<Switch
					id="shadow-only"
					bind:checked={settings.current.shadowOnly}
					onCheckedChange={() => commitHistory()}
				/>
			</div>

			<LabeledControlRow label="Texture Filtering" forId="filtering">
				<Select
					type="single"
					bind:value={settings.current.filtering}
					onValueChange={() => commitHistory()}
				>
					<SelectTrigger id="filtering" class="h-9 w-full text-xs">
						{settings.current.filtering === 'linear' ? 'Linear' : 'Nearest'}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="linear">Linear</SelectItem>
						<SelectItem value="nearest">Nearest</SelectItem>
					</SelectContent>
				</Select>
			</LabeledControlRow>

			<LabeledControlRow label="Auto Mipmaps" forId="auto-mipmaps">
				<Select
					type="single"
					value={settings.current.autoGenerateMipmaps ? 'on' : 'off'}
					onValueChange={(val) => {
						settings.current.autoGenerateMipmaps = val === 'on';
						commitHistory();
					}}
				>
					<SelectTrigger id="auto-mipmaps" class="h-9 w-full text-xs">
						{settings.current.autoGenerateMipmaps ? 'Enabled' : 'Disabled'}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="on">Enabled</SelectItem>
						<SelectItem value="off">Disabled</SelectItem>
					</SelectContent>
				</Select>
			</LabeledControlRow>

			<CollapsibleSection open={settings.current.autoGenerateMipmaps}>
				<LabeledControlRow label="Mipmap Filter" forId="mipmap-filter">
					<Select
						type="single"
						bind:value={settings.current.mipmapFilter}
						onValueChange={() => commitHistory()}
					>
						<SelectTrigger id="mipmap-filter" class="h-9 w-full text-xs">
							{settings.current.mipmapFilter === 'linear'
								? 'Linear (Trilinear)'
								: 'Nearest (Bilinear)'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="linear">Linear (Trilinear)</SelectItem>
							<SelectItem value="nearest">Nearest (Bilinear)</SelectItem>
						</SelectContent>
					</Select>
				</LabeledControlRow>
			</CollapsibleSection>
		</div>
	</CollapsibleSection>
</div>
