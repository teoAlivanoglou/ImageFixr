<script lang="ts">
	import SliderControl from './SliderControl.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import { settings, media, commitHistory } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let isCollapsed = $state(false);

	let hasForeground = $derived(Boolean(media.current.fgName));

	let simpleHeight = $state<number>(44);
	let advancedHeight = $state<number>(108);

	let modeHeight = $derived(
		settings.current.fgDropShadowMode === 'simple' ? simpleHeight || 44 : advancedHeight || 108
	);
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
				title="Shadow"
				hasSwitch={true}
				bind:enabled={settings.current.fgDropShadowEnabled}
				bind:isCollapsed
				onEnableChange={commitHistory}
			>
				<div
					class="relative inline-grid grid-cols-2 rounded-md border border-input bg-muted/40 p-0.5 text-xs"
				>
					<div
						class={cn(
							'absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/2)] rounded bg-background shadow-xs transition-transform duration-200 ease-out',
							settings.current.fgDropShadowMode === 'simple' && 'translate-x-0',
							settings.current.fgDropShadowMode === 'advanced' && 'translate-x-full'
						)}
					></div>

					<button
						type="button"
						class={cn(
							'relative z-10 cursor-pointer rounded px-2.5 py-0.5 text-center text-[11px] font-medium transition-colors duration-150',
							settings.current.fgDropShadowMode === 'simple'
								? 'text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
						onclick={() => {
							settings.current.fgDropShadowMode = 'simple';
							commitHistory();
						}}
					>
						Simple
					</button>
					<button
						type="button"
						class={cn(
							'relative z-10 cursor-pointer rounded px-2.5 py-0.5 text-center text-[11px] font-medium transition-colors duration-150',
							settings.current.fgDropShadowMode === 'advanced'
								? 'text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
						onclick={() => {
							settings.current.fgDropShadowMode = 'advanced';
							commitHistory();
						}}
					>
						Advanced
					</button>
				</div>
			</SectionHeader>

			<div
				class={cn(
					'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
					settings.current.fgDropShadowEnabled && !isCollapsed
						? 'grid-rows-[1fr] opacity-100'
						: 'pointer-events-none grid-rows-[0fr] opacity-0'
				)}
			>
				<div class="overflow-hidden">
					<div class="mt-2.5 flex flex-col gap-3 pl-2.5">
						<div
							class="relative grid overflow-hidden transition-[height] duration-200 ease-out"
							style="height: {modeHeight}px;"
						>
							<!-- Simple Mode Controls -->
							<div
								bind:clientHeight={simpleHeight}
								class={cn(
									'col-start-1 row-start-1 flex w-full flex-col justify-start self-start transition-opacity duration-150',
									settings.current.fgDropShadowMode === 'simple'
										? 'opacity-100'
										: 'pointer-events-none opacity-0'
								)}
							>
								<SliderControl
									id="fg-drop-shadow-simple-size"
									label="Shadow Size"
									bind:value={settings.current.fgDropShadowSimpleSize}
									min={0}
									max={150}
									step={1}
									defaultValue={30}
								/>
							</div>

							<!-- Advanced Mode Controls -->
							<div
								bind:clientHeight={advancedHeight}
								class={cn(
									'col-start-1 row-start-1 flex w-full flex-col gap-3 self-start transition-opacity duration-150',
									settings.current.fgDropShadowMode === 'advanced'
										? 'opacity-100'
										: 'pointer-events-none opacity-0'
								)}
							>
								<div class="grid w-full grid-cols-2 items-center gap-3">
									<SliderControl
										id="fg-drop-shadow-strength"
										label="Blur"
										bind:value={settings.current.fgDropShadowStrength}
										min={0}
										max={200}
										step={1}
										defaultValue={30}
									/>

									<SliderControl
										id="fg-drop-shadow-spread"
										label="Spread"
										bind:value={settings.current.fgDropShadowSpread}
										min={-50}
										max={100}
										step={1}
										defaultValue={15}
									/>
								</div>

								<div class="grid w-full grid-cols-2 items-center gap-3">
									<SliderControl
										id="fg-drop-shadow-offset-x"
										label="X-Offset"
										bind:value={settings.current.fgDropShadowOffsetX}
										min={-100}
										max={100}
										step={1}
										defaultValue={0}
									/>

									<SliderControl
										id="fg-drop-shadow-offset-y"
										label="Y-Offset"
										bind:value={settings.current.fgDropShadowOffsetY}
										min={-100}
										max={100}
										step={1}
										defaultValue={0}
									/>
								</div>
							</div>
						</div>

						<!-- Shared Opacity Slider -->
						<SliderControl
							id="fg-drop-shadow-alpha"
							label="Opacity"
							bind:value={settings.current.fgDropShadowAlpha}
							min={0}
							max={100}
							step={1}
							defaultValue={100}
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
