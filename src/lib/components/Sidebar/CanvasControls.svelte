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

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col', className)}>
	<!-- Advanced Section -->
	<div
		class="mt-1 flex h-7 items-center gap-2 text-xs transition-colors"
	>
		<Switch
			id="advanced-enable"
			size="sm"
			bind:checked={settings.current.advancedSettingsEnabled}
			onCheckedChange={() => commitHistory()}
			aria-label="Toggle Advanced Settings"
		/>
		<span
			role="button"
			tabindex="-1"
			class={cn(
				'cursor-pointer select-none text-[11px] font-medium tracking-wider uppercase transition-colors',
				settings.current.advancedSettingsEnabled
					? 'text-muted-foreground'
					: 'text-muted-foreground/45'
			)}
			onclick={() => {
				settings.current.advancedSettingsEnabled = !settings.current.advancedSettingsEnabled;
				commitHistory();
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					settings.current.advancedSettingsEnabled = !settings.current.advancedSettingsEnabled;
					commitHistory();
				}
			}}
		>
			Advanced
		</span>
		<div class="h-px flex-1 bg-border/40"></div>
	</div>

	<div
		class={cn(
			'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
			settings.current.advancedSettingsEnabled
				? 'grid-rows-[1fr] opacity-100'
				: 'grid-rows-[0fr] opacity-0 pointer-events-none'
		)}
	>
		<div class="overflow-hidden">
			<div class="mt-2.5 flex flex-col gap-3 pl-2.5">
				<div class="flex items-center justify-between gap-2 py-1">
					<Label for="shadow-only">Shadow Only (Debug)</Label>
					<Switch
						id="shadow-only"
						bind:checked={settings.current.shadowOnly}
						onCheckedChange={() => commitHistory()}
					/>
				</div>

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

				<div
					class={cn(
						'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
						settings.current.autoGenerateMipmaps
							? 'grid-rows-[1fr] opacity-100'
							: 'grid-rows-[0fr] opacity-0 pointer-events-none'
					)}
				>
					<div class="overflow-hidden">
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
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
