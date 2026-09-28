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
	import * as m from '$paraglide/messages.js';

	let { class: className }: { class?: string } = $props();

	createLabelGroup();

	const collapsible = getContext<boolean | undefined>('collapsible') ?? true;
	let isSectionOpen = $derived(!collapsible || !settings.current.advancedCollapsed);
</script>

<div class={cn('flex flex-col', className)}>
	<SectionHeader title={m.sidebar_advanced()} bind:isCollapsed={settings.current.advancedCollapsed} />

	<CollapsibleSection open={isSectionOpen}>
		<div class="control-section">
			<div class="flex items-center justify-between gap-2 py-1">
				<Label for="shadow-only">{m.control_shadow_only()}</Label>
				<Switch
					id="shadow-only"
					bind:checked={settings.current.shadowOnly}
					onCheckedChange={() => commitHistory()}
				/>
			</div>

			<LabeledControlRow label={m.control_texture_filtering()} forId="filtering">
				<Select
					type="single"
					bind:value={settings.current.filtering}
					onValueChange={() => commitHistory()}
				>
					<SelectTrigger id="filtering" class="h-9 w-full text-xs">
						{settings.current.filtering === 'linear' ? m.filter_linear() : m.filter_nearest()}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="linear">{m.filter_linear()}</SelectItem>
						<SelectItem value="nearest">{m.filter_nearest()}</SelectItem>
					</SelectContent>
				</Select>
			</LabeledControlRow>

			<LabeledControlRow label={m.control_auto_mipmaps()} forId="auto-mipmaps">
				<Select
					type="single"
					value={settings.current.autoGenerateMipmaps ? 'on' : 'off'}
					onValueChange={(val) => {
						settings.current.autoGenerateMipmaps = val === 'on';
						commitHistory();
					}}
				>
					<SelectTrigger id="auto-mipmaps" class="h-9 w-full text-xs">
						{settings.current.autoGenerateMipmaps ? m.state_enabled() : m.state_disabled()}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="on">{m.state_enabled()}</SelectItem>
						<SelectItem value="off">{m.state_disabled()}</SelectItem>
					</SelectContent>
				</Select>
			</LabeledControlRow>

			<CollapsibleSection open={settings.current.autoGenerateMipmaps}>
				<LabeledControlRow label={m.control_mipmap_filter()} forId="mipmap-filter">
					<Select
						type="single"
						bind:value={settings.current.mipmapFilter}
						onValueChange={() => commitHistory()}
					>
						<SelectTrigger id="mipmap-filter" class="h-9 w-full text-xs">
							{settings.current.mipmapFilter === 'linear'
								? m.mipmap_trilinear()
								: m.mipmap_bilinear()}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="linear">{m.mipmap_trilinear()}</SelectItem>
							<SelectItem value="nearest">{m.mipmap_bilinear()}</SelectItem>
						</SelectContent>
					</Select>
				</LabeledControlRow>
			</CollapsibleSection>
		</div>
	</CollapsibleSection>
</div>
