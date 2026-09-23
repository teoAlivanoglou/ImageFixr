<script lang="ts">
	import { getContext } from 'svelte';
	import SliderControl from './SliderControl.svelte';
	import ColorControl from './ColorControl.svelte';
	import ImageDropzone from './ImageDropzone.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import PillSwitcher from './PillSwitcher.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
	import { settings, appState, media, commitHistory } from '$lib/state.svelte';
	import { selectImage, removeImage } from '$lib/media-actions';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	const collapsible = getContext<boolean | undefined>('collapsible') ?? true;
	let hasForeground = $derived(Boolean(media.current.fgName));
	let isSectionOpen = $derived(
		settings.current.bgEnabled && (!collapsible || !settings.current.bgCollapsed)
	);

	const bgSourceOptions = [
		{ value: 'none', label: 'None' },
		{ value: 'link', label: 'Link' },
		{ value: 'custom', label: 'Upload' }
	];
</script>

<CollapsibleSection open={hasForeground || !collapsible} class={className}>
	<div class="flex flex-col">
		<SectionHeader
			title="Background"
			hasSwitch={true}
			bind:enabled={settings.current.bgEnabled}
			bind:isCollapsed={settings.current.bgCollapsed}
			onEnableChange={commitHistory}
		>
			<PillSwitcher
				options={bgSourceOptions}
				bind:value={settings.current.bgSource}
				onChange={() => commitHistory()}
				fullWidth={true}
			/>
		</SectionHeader>

		<CollapsibleSection
			open={isSectionOpen}
			innerClass="-mx-2.5 px-2.5"
		>
			<div class="control-section">
				<!-- Color Row -->
				<ColorControl
					id="background-color"
					label="Color"
					bind:value={settings.current.bgColor}
					ariaLabel="Background Color"
				/>

				<!-- Custom Dropzone -->
				<CollapsibleSection open={settings.current.bgSource === 'custom'}>
					<ImageDropzone
						label="Image"
						fileName={media.current.bgName}
						placeholder="Choose image"
						onSelect={(file, handle) => selectImage('background', file, handle)}
						onRemove={() => removeImage('background')}
					/>
				</CollapsibleSection>

				<!-- Scale & Blur Sliders -->
				<CollapsibleSection open={settings.current.bgSource !== 'none'} innerClass="-mx-2.5 px-2.5">
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
				</CollapsibleSection>
			</div>
		</CollapsibleSection>
	</div>
</CollapsibleSection>
