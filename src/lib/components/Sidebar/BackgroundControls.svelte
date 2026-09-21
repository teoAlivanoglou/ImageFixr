<script lang="ts">
	import SliderControl from './SliderControl.svelte';
	import ColorControl from './ColorControl.svelte';
	import ImageDropzone from './ImageDropzone.svelte';
	import { Label } from '$lib/components/ui/label';
	import SectionHeader from './SectionHeader.svelte';
	import { ChevronDown } from '@lucide/svelte';
	import { settings, appState, media, commitHistory } from '$lib/state.svelte';
	import { saveImageStorage, deleteImageStorage } from '$lib/image-db';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let isCollapsed = $state(false);

	let slidersHeight = $state<number>(44);
	let dropzoneHeight = $state<number>(32);

	let imageControlsHeight = $derived.by(() => {
		if (settings.current.bgSource === 'none') return 0;
		if (settings.current.bgSource === 'link') return slidersHeight || 44;
		return (slidersHeight || 44) + 12 + (dropzoneHeight || 32);
	});

	async function handleFileSelect(file: File) {
		if (!file.type.startsWith('image/')) return;
		await saveImageStorage('background', file);
		media.current = {
			...media.current,
			bgName: file.name,
			bgVersion: Date.now()
		};
	}

	function removeImage() {
		void deleteImageStorage('background');
		media.current = {
			...media.current,
			bgName: '',
			bgVersion: Date.now()
		};
	}
</script>

<div class={cn('flex flex-col', className)}>
	<SectionHeader
		title="Background"
		hasSwitch={true}
		bind:enabled={settings.current.bgEnabled}
		bind:isCollapsed
		onEnableChange={commitHistory}
	/>

	<div
		class={cn(
			'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
			settings.current.bgEnabled && !isCollapsed
				? 'grid-rows-[1fr] opacity-100'
				: 'pointer-events-none grid-rows-[0fr] opacity-0'
		)}
	>
		<div class="-mx-2.5 overflow-hidden px-2.5">
			<div class="mt-2.5 flex flex-col gap-3 pl-2.5">
				<!-- Color Row -->
				<ColorControl
					id="background-color"
					label="Color"
					bind:value={settings.current.bgColor}
					ariaLabel="Background Color"
				/>

				<!-- Image Source Row: Label on left, compact pill buttons on right -->
				<div class="flex items-center justify-between gap-2">
					<Label>Image</Label>
					<div
						class="relative inline-grid grid-cols-3 rounded-md border border-input bg-muted/40 p-0.5 text-xs"
					>
						<div
							class={cn(
								'absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded bg-background shadow-xs transition-transform duration-200 ease-out',
								settings.current.bgSource === 'none' && 'translate-x-0',
								settings.current.bgSource === 'link' && 'translate-x-full',
								settings.current.bgSource === 'custom' && 'translate-x-[200%]'
							)}
						></div>

						<button
							type="button"
							class={cn(
								'relative z-10 cursor-pointer rounded px-2 py-0.5 text-center text-[11px] font-medium transition-colors duration-150',
								settings.current.bgSource === 'none'
									? 'text-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
							onclick={() => {
								settings.current.bgSource = 'none';
								commitHistory();
							}}
						>
							None
						</button>
						<button
							type="button"
							class={cn(
								'relative z-10 cursor-pointer rounded px-2 py-0.5 text-center text-[11px] font-medium transition-colors duration-150',
								settings.current.bgSource === 'link'
									? 'text-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
							onclick={() => {
								settings.current.bgSource = 'link';
								commitHistory();
							}}
						>
							Link
						</button>
						<button
							type="button"
							class={cn(
								'relative z-10 cursor-pointer rounded px-2 py-0.5 text-center text-[11px] font-medium transition-colors duration-150',
								settings.current.bgSource === 'custom'
									? 'text-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
							onclick={() => {
								settings.current.bgSource = 'custom';
								commitHistory();
							}}
						>
							Upload
						</button>
					</div>
				</div>

				<!-- Dynamic Image Controls (Scale & Blur and Custom Dropzone) -->
				<div
					class="relative -mx-2.5 overflow-hidden px-2.5 transition-[height,opacity] duration-200 ease-out"
					style="height: {imageControlsHeight}px; opacity: {settings.current.bgSource !== 'none'
						? 1
						: 0}; pointer-events: {settings.current.bgSource !== 'none' ? 'auto' : 'none'};"
				>
					<div class="flex flex-col gap-3">
						<!-- Scale & Blur Sliders -->
						<div bind:clientHeight={slidersHeight} class="w-full self-start">
							<div class="grid w-full grid-cols-2 items-center gap-3">
								<SliderControl
									id="bg-scale"
									label="Scale"
									bind:value={settings.current.bgScale}
									min={0}
									max={2}
									step={0.01}
									defaultValue={1}
									formatValue={() => `${appState.bgActualScale.toFixed(2)}x`}
								/>

								<SliderControl
									id="bg-blur"
									label="Blur"
									bind:value={settings.current.bgBlur}
									min={0}
									max={100}
									step={1}
									defaultValue={100}
								/>
							</div>
						</div>

						<!-- Custom Dropzone -->
						<div
							class={cn(
								'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
								settings.current.bgSource === 'custom'
									? 'grid-rows-[1fr] opacity-100'
									: 'pointer-events-none grid-rows-[0fr] opacity-0'
							)}
						>
							<div class="-mx-2.5 overflow-hidden px-2.5">
								<div bind:clientHeight={dropzoneHeight} class="w-full self-start">
									<ImageDropzone
										label="Image"
										fileName={media.current.bgName}
										placeholder="Choose image"
										onSelect={(file) => handleFileSelect(file)}
										onRemove={() => removeImage()}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
