<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { ColorPicker } from '$lib/components/ui/color-picker';
	import { commitHistory, settings } from '$lib/state.svelte';
	import { cn } from '$lib/utils';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col gap-4', className)}>
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

	<div class="flex items-center justify-between gap-2">
		<Label for="background-color">Background Color</Label>
		<Popover.Root>
			<Popover.Trigger>
				<Button variant="outline" class="checkerboard-bg relative h-8 w-14 overflow-hidden p-0">
					<span class="absolute inset-0" style={`background-color: ${settings.current.bgColor}`}
					></span>
				</Button>
			</Popover.Trigger>
			<Popover.Content side="right" align="end" class="border-none bg-transparent p-0 shadow-none">
				<ColorPicker
					bind:value={settings.current.bgColor}
					bind:swatches={settings.current.swatches}
					onChange={() => commitHistory()}
				/>
			</Popover.Content>
		</Popover.Root>
	</div>

	<Accordion.Root type="single" class="w-full border-0 bg-transparent! px-0!" value="item-1">
		<Accordion.Item value="item-1" class="bg-transparent! px-0!">
			<Accordion.Trigger class="px-0! text-sm! font-light">Advanced</Accordion.Trigger>
			<!-- <Accordion.Content class="bg-transparent! px-0! py-2"> -->
			<Accordion.Content class={cn('flex flex-col gap-4 bg-transparent! px-0! py-2', className)}>
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
				{/if}
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>
