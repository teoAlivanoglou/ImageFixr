<script lang="ts">
	import { getContext } from 'svelte';
	import SliderControl from './SliderControl.svelte';
	import ColorControl from './ColorControl.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import PillSwitcher from './PillSwitcher.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
	import { settings, media, commitHistory } from '$lib/state.svelte';

	let { class: className }: { class?: string } = $props();

	const collapsible = getContext<boolean | undefined>('collapsible') ?? true;
	let hasForeground = $derived(Boolean(media.current.fgName));
	let isSectionOpen = $derived(
		settings.current.fgBorderEnabled && (!collapsible || !settings.current.fgBorderCollapsed)
	);

	const borderPositionOptions = [
		{ value: 'inner', label: 'Inner' },
		{ value: 'center', label: 'Center' },
		{ value: 'outer', label: 'Outer' }
	];
</script>

<CollapsibleSection open={hasForeground || !collapsible} class={className}>
	<div class="flex flex-col">
		<SectionHeader
			title="Border"
			hasSwitch={true}
			bind:enabled={settings.current.fgBorderEnabled}
			bind:isCollapsed={settings.current.fgBorderCollapsed}
			onEnableChange={() => {
				if (settings.current.fgBorderWidth === 0) settings.current.fgBorderWidth = 10;
				commitHistory();
			}}
		>
			<PillSwitcher
				options={borderPositionOptions}
				bind:value={settings.current.fgBorderPosition}
				onChange={() => commitHistory()}
				fullWidth={true}
			/>
		</SectionHeader>

		<CollapsibleSection
			open={isSectionOpen}
		>
			<div class="control-section">
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
		</CollapsibleSection>
	</div>
</CollapsibleSection>
