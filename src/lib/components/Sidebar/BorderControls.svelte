<script lang="ts">
	import { getContext } from 'svelte';
	import SliderControl from './SliderControl.svelte';
	import ColorControl from './ColorControl.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import PillSwitcher from './PillSwitcher.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
	import { settings, media, commitHistory } from '$lib/state.svelte';
	import * as m from '$paraglide/messages.js';

	let { class: className }: { class?: string } = $props();

	const collapsible = getContext<boolean | undefined>('collapsible') ?? true;
	let hasForeground = $derived(Boolean(media.current.fgName));
	let isSectionOpen = $derived(
		settings.current.fgBorderEnabled && (!collapsible || !settings.current.fgBorderCollapsed)
	);

	let borderPositionOptions = $derived([
		{ value: 'inner', label: m.border_inner() },
		{ value: 'center', label: m.border_center() },
		{ value: 'outer', label: m.border_outer() }
	]);
</script>

<CollapsibleSection open={hasForeground || !collapsible} class={className}>
	<div class="flex flex-col">
		<SectionHeader
			title={m.sidebar_border()}
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
					label={m.control_width()}
					bind:value={settings.current.fgBorderWidth}
					min={0}
					max={50}
					step={1}
					defaultValue={10}
				/>
				<ColorControl
					id="fg-border-color"
					label={m.control_color()}
					bind:value={settings.current.fgBorderColor}
					ariaLabel={m.control_color()}
				/>
			</div>
		</CollapsibleSection>
	</div>
</CollapsibleSection>
