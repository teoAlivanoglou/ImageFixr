<script lang="ts">
	import { getContext } from 'svelte';
	import SliderControl from './SliderControl.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import PillSwitcher from './PillSwitcher.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
	import { settings, media, commitHistory } from '$lib/state.svelte';
	import * as m from '$paraglide/messages.js';

	let { class: className }: { class?: string } = $props();

	const collapsible = getContext<boolean | undefined>('collapsible') ?? true;
	let hasForeground = $derived(Boolean(media.current.fgName));
	let isSectionOpen = $derived(
		settings.current.fgDropShadowEnabled &&
			(!collapsible || !settings.current.fgDropShadowCollapsed)
	);

	let shadowModeOptions = $derived([
		{ value: 'simple', label: m.control_simple() },
		{ value: 'advanced', label: m.control_advanced() }
	]);
</script>

<CollapsibleSection open={hasForeground || !collapsible} class={className}>
	<div class="flex flex-col">
		<SectionHeader
			title={m.sidebar_dropshadow()}
			hasSwitch={true}
			bind:enabled={settings.current.fgDropShadowEnabled}
			bind:isCollapsed={settings.current.fgDropShadowCollapsed}
			onEnableChange={commitHistory}
		>
			<PillSwitcher
				options={shadowModeOptions}
				bind:value={settings.current.fgDropShadowMode}
				onChange={() => commitHistory()}
				fullWidth={true}
			/>
		</SectionHeader>

		<CollapsibleSection
			open={isSectionOpen}
		>
			<div class="control-section">
				<!-- Simple Mode Controls -->
				<CollapsibleSection open={settings.current.fgDropShadowMode === 'simple'}>
					<SliderControl
						id="fg-drop-shadow-simple-size"
						label={m.control_size()}
						bind:value={settings.current.fgDropShadowSimpleSize}
						min={0}
						max={150}
						step={1}
						defaultValue={30}
					/>
				</CollapsibleSection>

				<!-- Advanced Mode Controls -->
				<CollapsibleSection open={settings.current.fgDropShadowMode === 'advanced'}>
					<div class="flex flex-col gap-3">
						<div class="grid w-full grid-cols-2 items-center gap-3">
							<SliderControl
								id="fg-drop-shadow-strength"
								label={m.control_blur()}
								bind:value={settings.current.fgDropShadowStrength}
								min={0}
								max={200}
								step={1}
								defaultValue={30}
							/>

							<SliderControl
								id="fg-drop-shadow-spread"
								label={m.control_spread()}
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
								label={m.control_offset_x()}
								bind:value={settings.current.fgDropShadowOffsetX}
								min={-100}
								max={100}
								step={1}
								defaultValue={0}
							/>

							<SliderControl
								id="fg-drop-shadow-offset-y"
								label={m.control_offset_y()}
								bind:value={settings.current.fgDropShadowOffsetY}
								min={-100}
								max={100}
								step={1}
								defaultValue={0}
							/>
						</div>
					</div>
				</CollapsibleSection>

				<!-- Shared Opacity Slider -->
				<SliderControl
					id="fg-drop-shadow-alpha"
					label={m.control_opacity()}
					bind:value={settings.current.fgDropShadowAlpha}
					min={0}
					max={100}
					step={1}
					defaultValue={80}
				/>
			</div>
		</CollapsibleSection>
	</div>
</CollapsibleSection>
