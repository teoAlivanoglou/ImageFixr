<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { commitHistory, settings } from '$lib/state.svelte';
</script>

<!-- Canvas Settings -->
<div class="control flex flex-col gap-2">
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

<div class="control flex flex-col gap-2">
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

{#if settings.current.autoGenerateMipmaps}
	<div class="control flex flex-col gap-2">
		<Label for="mipmap-filter">Mipmap Filter</Label>
		<Select
			type="single"
			bind:value={settings.current.mipmapFilter}
			onValueChange={() => commitHistory()}
		>
			<SelectTrigger id="mipmap-filter" class="w-full">
				{settings.current.mipmapFilter === 'linear' ? 'Linear (Trilinear)' : 'Nearest (Bilinear)'}
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="linear">Linear (Trilinear)</SelectItem>
				<SelectItem value="nearest">Nearest (Bilinear)</SelectItem>
			</SelectContent>
		</Select>
	</div>
{/if}

<div class="flex flex-col gap-2">
	<Label for="aspect-ratio">Canvas Aspect Ratio</Label>
	<Select
		type="single"
		bind:value={settings.current.aspectRatio}
		onValueChange={() => commitHistory()}
	>
		<SelectTrigger id="aspect-ratio" class="w-full">
			{settings.current.aspectRatio}
		</SelectTrigger>
		<SelectContent>
			<SelectItem value="1:1">1:1</SelectItem>
			<SelectItem value="4:3">4:3</SelectItem>
			<SelectItem value="16:9">16:9</SelectItem>
		</SelectContent>
	</Select>
</div>
