<script lang="ts">
	import SliderControl from './SliderControl.svelte';
	import ImageDropzone from './ImageDropzone.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
	import { settings, appState, media } from '$lib/state.svelte';
	import { selectImage, removeImage } from '$lib/media-actions';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let hasForeground = $derived(Boolean(media.current.fgName));
</script>

<div class={cn('flex flex-col', className)}>
	<SectionHeader title="Foreground" bind:isCollapsed={settings.current.fgCollapsed} />

	<CollapsibleSection open={!settings.current.fgCollapsed} innerClass="-mx-2.5 px-2.5">
		<div class="control-section">
			<ImageDropzone
				label="Image"
				fileName={media.current.fgName}
				placeholder="Drop or choose an image"
				onSelect={(file, handle) => selectImage('foreground', file, handle)}
				onRemove={() => removeImage('foreground')}
			/>

			<CollapsibleSection open={hasForeground} innerClass="-mx-2.5 px-2.5">
				<div class="flex flex-col gap-3">
					<div class="grid w-full grid-cols-2 items-center gap-3">
						<SliderControl
							id="fg-scale"
							label="Scale"
							bind:value={settings.current.fgScale}
							min={0}
							max={2}
							step={0.01}
							defaultValue={1}
							formatValue={() => `${appState.fgActualScale.toFixed(2)}x`}
						/>

						<SliderControl
							id="fg-blur"
							label="Blur"
							bind:value={settings.current.fgBlur}
							min={0}
							max={100}
							step={1}
							defaultValue={0}
						/>
					</div>
				</div>
			</CollapsibleSection>
		</div>
	</CollapsibleSection>
</div>
