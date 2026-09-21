<script lang="ts">
	import SliderControl from './SliderControl.svelte';
	import ColorControl from './ColorControl.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import { ChevronDown } from '@lucide/svelte';
	import { settings, media, commitHistory } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let isCollapsed = $state(false);

	let hasForeground = $derived(Boolean(media.current.fgName));
</script>

<div
	class={cn(
		'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
		hasForeground ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0',
		className
	)}
>
	<div class="overflow-hidden">
		<div class="flex flex-col">
			<SectionHeader
				title="Border"
				hasSwitch={true}
				bind:enabled={settings.current.fgBorderEnabled}
				bind:isCollapsed
				onEnableChange={() => {
					if (settings.current.fgBorderWidth === 0) settings.current.fgBorderWidth = 10;
					commitHistory();
				}}
			>
				<div
					class="relative inline-grid w-full @[340px]:w-auto grid-cols-3 rounded-md border border-input bg-muted/40 p-0.5 text-xs"
				>
					<div
						class={cn(
							'absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded bg-background shadow-xs transition-transform duration-200 ease-out',
							settings.current.fgBorderPosition === 'inner' && 'translate-x-0',
							settings.current.fgBorderPosition === 'center' && 'translate-x-full',
							settings.current.fgBorderPosition === 'outer' && 'translate-x-[200%]'
						)}
					></div>

					<button
						type="button"
						class={cn(
							'relative z-10 cursor-pointer rounded px-2 py-0.5 text-center text-[11px] font-medium transition-colors duration-150',
							settings.current.fgBorderPosition === 'inner'
								? 'text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
						onclick={() => {
							settings.current.fgBorderPosition = 'inner';
							commitHistory();
						}}
					>
						Inner
					</button>
					<button
						type="button"
						class={cn(
							'relative z-10 cursor-pointer rounded px-2 py-0.5 text-center text-[11px] font-medium transition-colors duration-150',
							settings.current.fgBorderPosition === 'center'
								? 'text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
						onclick={() => {
							settings.current.fgBorderPosition = 'center';
							commitHistory();
						}}
					>
						Center
					</button>
					<button
						type="button"
						class={cn(
							'relative z-10 cursor-pointer rounded px-2 py-0.5 text-center text-[11px] font-medium transition-colors duration-150',
							settings.current.fgBorderPosition === 'outer'
								? 'text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
						onclick={() => {
							settings.current.fgBorderPosition = 'outer';
							commitHistory();
						}}
					>
						Outer
					</button>
				</div>
			</SectionHeader>

			<div
				class={cn(
					'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
					settings.current.fgBorderEnabled && !isCollapsed
						? 'grid-rows-[1fr] opacity-100'
						: 'pointer-events-none grid-rows-[0fr] opacity-0'
				)}
			>
				<div class="overflow-hidden">
					<div class="mt-2.5 flex flex-col gap-3 pl-2.5">
						<SliderControl
							id="fg-border-width"
							label="Width"
							bind:value={settings.current.fgBorderWidth}
							min={0}
							max={50}
							step={1}
							defaultValue={10}
						/>
						<ColorControl
							id="fg-border-color"
							label="Color"
							bind:value={settings.current.fgBorderColor}
							ariaLabel="Border Color"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
