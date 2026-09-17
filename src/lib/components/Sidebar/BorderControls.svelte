<script lang="ts">
	import SliderControl from './SliderControl.svelte';
	import ColorControl from './ColorControl.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { settings, media, commitHistory } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let hasForeground = $derived(Boolean(media.current.fgName));
</script>

<div
	class={cn(
		'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
		hasForeground
			? 'grid-rows-[1fr] opacity-100'
			: 'grid-rows-[0fr] opacity-0 pointer-events-none',
		className
	)}
>
	<div class="overflow-hidden">
		<div class="flex flex-col">
			<!-- Header with Enabled/Disabled Switch -->
			<div
				class="mt-1 flex h-7 items-center justify-between gap-2 text-xs transition-colors"
			>
				<div class="flex items-center gap-2">
					<Switch
						id="fg-border-enable"
						size="sm"
						bind:checked={settings.current.fgBorderEnabled}
						onCheckedChange={(checked) => {
							if (checked && settings.current.fgBorderWidth === 0) {
								settings.current.fgBorderWidth = 10;
							}
							commitHistory();
						}}
						aria-label="Toggle Border"
					/>
					<span
						role="button"
						tabindex="-1"
						class={cn(
							'cursor-pointer select-none text-[11px] font-medium tracking-wider uppercase transition-colors',
							settings.current.fgBorderEnabled
								? 'text-muted-foreground'
								: 'text-muted-foreground/45'
						)}
						onclick={() => {
							settings.current.fgBorderEnabled = !settings.current.fgBorderEnabled;
							if (settings.current.fgBorderWidth === 0) {
								settings.current.fgBorderWidth = 10;
							}
							commitHistory();
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								settings.current.fgBorderEnabled = !settings.current.fgBorderEnabled;
								if (settings.current.fgBorderWidth === 0) {
									settings.current.fgBorderWidth = 10;
								}
								commitHistory();
							}
						}}
					>
						Border
					</span>
				</div>

				<div class="h-px flex-1 bg-border/40"></div>

				<div
					class={cn(
						'relative inline-grid grid-cols-3 rounded-md border border-input bg-muted/40 p-0.5 text-xs transition-opacity duration-150',
						settings.current.fgBorderEnabled
							? 'opacity-100'
							: 'opacity-0 pointer-events-none'
					)}
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
			</div>

			<div
				class={cn(
					'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
					settings.current.fgBorderEnabled
						? 'grid-rows-[1fr] opacity-100'
						: 'grid-rows-[0fr] opacity-0 pointer-events-none'
				)}
			>
				<div class="overflow-hidden">
					<div class="mt-2.5 flex items-end gap-2.5 pl-2.5">
						<div class="flex-1">
							<SliderControl
								id="fg-border-width"
								label="Width"
								bind:value={settings.current.fgBorderWidth}
								min={0}
								max={50}
								step={1}
								defaultValue={10}
							/>
						</div>
						<ColorControl
							bind:value={settings.current.fgBorderColor}
							ariaLabel="Border Color"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
