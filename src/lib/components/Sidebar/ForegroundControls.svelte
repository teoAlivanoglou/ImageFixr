<script lang="ts">
	import { getContext } from 'svelte';
	import SliderControl from './SliderControl.svelte';
	import ImageDropzone from './ImageDropzone.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
	import { settings, appState, media } from '$lib/state.svelte';
	import { selectImage, removeImage, toggleImagePersistence } from '$lib/media-actions';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	const collapsible = getContext<boolean | undefined>('collapsible') ?? true;
	let hasForeground = $derived(Boolean(media.current.fgName));
	let isSectionOpen = $derived(!collapsible || !settings.current.fgCollapsed);
</script>

<div class={cn('flex flex-col', className)}>
	<SectionHeader title="Foreground" bind:isCollapsed={settings.current.fgCollapsed} />

	<CollapsibleSection open={isSectionOpen} innerClass="-mx-2.5 px-2.5">
		<div class="control-section">
			<ImageDropzone
				label="Image"
				fileName={media.current.fgName}
				placeholder="Drop or choose an image"
				persist={media.current.fgPersist}
				onTogglePersist={() => toggleImagePersistence('foreground')}
				onSelect={(file, handle) => selectImage('foreground', file, handle, media.current.fgPersist)}
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
