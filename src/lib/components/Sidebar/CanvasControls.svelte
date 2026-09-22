<script lang="ts">
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

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col', className)}>
	<SectionHeader title="Advanced" bind:isCollapsed={settings.current.advancedCollapsed} />

	<CollapsibleSection open={!settings.current.advancedCollapsed}>
		<div class="control-section">
			<div class="flex items-center justify-between gap-2 py-1">
				<Label for="shadow-only">Shadow Only (Debug)</Label>
				<Switch
					id="shadow-only"
					bind:checked={settings.current.shadowOnly}
					onCheckedChange={() => commitHistory()}
				/>
			</div>

			<div class="control">
				<Label for="filtering">Texture Filtering</Label>
				<Select
					type="single"
					bind:value={settings.current.filtering}
					onValueChange={() => commitHistory()}
				>
					<SelectTrigger id="filtering" class="w-full">
						{settings.current.filtering === 'linear' ? 'Linear' : 'Nearest'}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="linear">Linear</SelectItem>
						<SelectItem value="nearest">Nearest</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="control">
				<Label for="auto-mipmaps">Auto Mipmaps</Label>
				<Select
					type="single"
					value={settings.current.autoGenerateMipmaps ? 'on' : 'off'}
					onValueChange={(val) => {
						settings.current.autoGenerateMipmaps = val === 'on';
						commitHistory();
					}}
				>
					<SelectTrigger id="auto-mipmaps" class="w-full">
						{settings.current.autoGenerateMipmaps ? 'Enabled' : 'Disabled'}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="on">Enabled</SelectItem>
						<SelectItem value="off">Disabled</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<CollapsibleSection open={settings.current.autoGenerateMipmaps}>
				<div class="control">
					<Label for="mipmap-filter">Mipmap Filter</Label>
					<Select
						type="single"
						bind:value={settings.current.mipmapFilter}
						onValueChange={() => commitHistory()}
					>
						<SelectTrigger id="mipmap-filter" class="w-full">
							{settings.current.mipmapFilter === 'linear'
								? 'Linear (Trilinear)'
								: 'Nearest (Bilinear)'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="linear">Linear (Trilinear)</SelectItem>
							<SelectItem value="nearest">Nearest (Bilinear)</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CollapsibleSection>
		</div>
	</CollapsibleSection>
</div>
