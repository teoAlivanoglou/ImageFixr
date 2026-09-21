<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Undo, Link, Unlink } from '@lucide/svelte';
	import SectionHeader from './SectionHeader.svelte';
	import PillSwitcher from './PillSwitcher.svelte';
	import { CollapsibleSection } from '$lib/components/ui/collapsible-section';
	import { settings, media, commitHistory, SAFE_AREA_PRESETS } from '$lib/state.svelte';
	import type { MarginUnit, SafeAreaStandard } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let hasForeground = $derived(Boolean(media.current.fgName));

	type Side = 'top' | 'right' | 'bottom' | 'left';

	const SIDES = [
		{
			key: 'top' as Side,
			label: 'Top',
			short: 'T',
			valProp: 'fgMarginTop' as const,
			unitProp: 'fgMarginTopUnit' as const,
			enabledProp: 'fgMarginTopEnabled' as const
		},
		{
			key: 'right' as Side,
			label: 'Right',
			short: 'R',
			valProp: 'fgMarginRight' as const,
			unitProp: 'fgMarginRightUnit' as const,
			enabledProp: 'fgMarginRightEnabled' as const
		},
		{
			key: 'bottom' as Side,
			label: 'Bottom',
			short: 'B',
			valProp: 'fgMarginBottom' as const,
			unitProp: 'fgMarginBottomUnit' as const,
			enabledProp: 'fgMarginBottomEnabled' as const
		},
		{
			key: 'left' as Side,
			label: 'Left',
			short: 'L',
			valProp: 'fgMarginLeft' as const,
			unitProp: 'fgMarginLeftUnit' as const,
			enabledProp: 'fgMarginLeftEnabled' as const
		}
	] as const;

	const safeAreaOptions = [
		{ value: 'custom', label: 'Custom' },
		{ value: 'smpte-action', label: 'Action' },
		{ value: 'smpte-title', label: 'Title' }
	];

	const linkOptions = [
		{ value: 'linked', label: '', icon: Link, title: 'Link all margins' },
		{ value: 'unlinked', label: '', icon: Unlink, title: 'Independent per-side margins' }
	];

	let currentStandard = $derived(
		settings.current.fgSafeAreaStandard === 'none' ? 'custom' : settings.current.fgSafeAreaStandard
	);

	function handleStandardChange(val: string) {
		settings.current.fgSafeAreaStandard = val as SafeAreaStandard;
		commitHistory();
	}

	let linkMode = $derived(settings.current.fgMarginsLinked ? 'linked' : 'unlinked');

	function handleLinkModeChange(val: string) {
		const nextLinked = val === 'linked';
		if (settings.current.fgMarginsLinked === nextLinked) return;
		settings.current.fgMarginsLinked = nextLinked;
		if (nextLinked) {
			const primaryVal =
				settings.current.fgMarginTop ||
				settings.current.fgMarginRight ||
				settings.current.fgMarginBottom ||
				settings.current.fgMarginLeft ||
				0;
			const primaryUnit = settings.current.fgMarginTopUnit || 'percent';

			setLinkedMargin(primaryVal);
			settings.current.fgMarginTopUnit = primaryUnit;
			settings.current.fgMarginRightUnit = primaryUnit;
			settings.current.fgMarginBottomUnit = primaryUnit;
			settings.current.fgMarginLeftUnit = primaryUnit;
		}
		commitHistory();
	}

	function setLinkedMargin(val: number) {
		settings.current.fgMarginTop = val;
		settings.current.fgMarginRight = val;
		settings.current.fgMarginBottom = val;
		settings.current.fgMarginLeft = val;

		settings.current.fgMarginTopEnabled = true;
		settings.current.fgMarginRightEnabled = true;
		settings.current.fgMarginBottomEnabled = true;
		settings.current.fgMarginLeftEnabled = true;
	}

	function toggleLinkedUnit() {
		const nextUnit: MarginUnit =
			settings.current.fgMarginTopUnit === 'percent' ? 'pixel' : 'percent';
		const max = nextUnit === 'percent' ? 40 : 300;
		const nextVal = Math.min(max, Math.max(0, settings.current.fgMarginTop || 0));

		settings.current.fgMarginTopUnit = nextUnit;
		settings.current.fgMarginRightUnit = nextUnit;
		settings.current.fgMarginBottomUnit = nextUnit;
		settings.current.fgMarginLeftUnit = nextUnit;

		setLinkedMargin(nextVal);
		commitHistory();
	}

	function handleLinkedInput(rawValue: string) {
		if (rawValue === '') {
			setLinkedMargin(0);
			return;
		}
		let num = parseFloat(rawValue);
		if (isNaN(num)) num = 0;
		const max = settings.current.fgMarginTopUnit === 'percent' ? 40 : 300;
		setLinkedMargin(Math.min(max, Math.max(0, num)));
	}

	function resetLinkedMargin() {
		setLinkedMargin(0);
		commitHistory();
	}

	function toggleSideUnit(side: Side) {
		const sideInfo = SIDES.find((s) => s.key === side)!;
		const nextUnit: MarginUnit =
			settings.current[sideInfo.unitProp] === 'percent' ? 'pixel' : 'percent';
		settings.current[sideInfo.unitProp] = nextUnit;
		const max = nextUnit === 'percent' ? 40 : 300;
		settings.current[sideInfo.valProp] = Math.min(
			max,
			Math.max(0, settings.current[sideInfo.valProp] || 0)
		);
		commitHistory();
	}

	function handleSideValueInput(side: Side, rawValue: string) {
		const sideInfo = SIDES.find((s) => s.key === side)!;
		settings.current[sideInfo.enabledProp] = true;
		if (rawValue === '') {
			settings.current[sideInfo.valProp] = 0;
			return;
		}
		let num = parseFloat(rawValue);
		if (isNaN(num)) num = 0;
		const max = settings.current[sideInfo.unitProp] === 'percent' ? 40 : 300;
		settings.current[sideInfo.valProp] = Math.min(max, Math.max(0, num));
	}

	function resetSideMargin(side: Side) {
		const sideInfo = SIDES.find((s) => s.key === side)!;
		settings.current[sideInfo.valProp] = 0;
		commitHistory();
	}
</script>

<CollapsibleSection open={hasForeground} class={className}>
	<div class="flex flex-col">
		<SectionHeader
			title="Safe Area"
			hasSwitch={true}
			bind:enabled={settings.current.fgMarginEnabled}
			bind:isCollapsed={settings.current.fgMarginCollapsed}
			onEnableChange={commitHistory}
		>
			<PillSwitcher
				options={safeAreaOptions}
				value={currentStandard}
				onChange={handleStandardChange}
				fullWidth={true}
			/>
		</SectionHeader>

		<!-- Collapsible Margin Controls -->
		<CollapsibleSection
			open={settings.current.fgMarginEnabled && !settings.current.fgMarginCollapsed}
			innerClass="-mx-2.5 px-2.5"
		>
			<div class="mt-2.5 flex flex-col gap-3 pl-2.5">
				<!-- Additional Margins Section Header with Pill Switcher -->
				<div class="flex items-center justify-between pt-1">
					<Label class="text-xs text-muted-foreground">
						{currentStandard === 'custom' ? 'Margins' : 'Additional Margins'}
					</Label>
					<PillSwitcher
						options={linkOptions}
						value={linkMode}
						onChange={handleLinkModeChange}
						buttonClass="w-9 justify-center"
					/>
				</div>

				<!-- Margin Controls: Single Linked vs 4 Individual Sides with smooth collapse animations -->
				<div class="flex flex-col pt-0.5">
					<CollapsibleSection open={settings.current.fgMarginsLinked}>
						<!-- Linked Margin Row -->
						<div class="flex items-center gap-1.5 py-1">
							<span class="w-12 shrink-0 text-xs text-muted-foreground select-none"> All </span>

							{#if settings.current.fgMarginTop > 0}
								<button
									type="button"
									class="group flex h-7 w-5 shrink-0 cursor-pointer items-center justify-center"
									aria-label="Reset all margins"
									title="Reset all margins to 0"
									onclick={resetLinkedMargin}
								>
									<Undo
										size={14}
										class="text-muted-foreground transition-colors group-hover:text-foreground"
									/>
								</button>
							{:else}
								<div class="w-5 shrink-0"></div>
							{/if}

							<div
								class="flex min-w-0 flex-1 items-center rounded-md border border-input bg-input/20 pl-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:bg-input/30"
							>
								<div class="flex min-w-0 flex-1 items-center gap-1.5">
									<Slider
										type="single"
										value={settings.current.fgMarginTop}
										min={0}
										max={settings.current.fgMarginTopUnit === 'percent' ? 40 : 300}
										step={1}
										onValueChange={(val) => {
											const num = Array.isArray(val) ? val[0] : val;
											setLinkedMargin(num);
										}}
										onValueCommit={() => commitHistory()}
										class="flex-1 py-1 **:data-[slot=slider-track]:bg-foreground/12 dark:**:data-[slot=slider-track]:bg-white/18"
									/>
									<input
										type="number"
										min="0"
										max={settings.current.fgMarginTopUnit === 'percent' ? 40 : 300}
										step="1"
										value={settings.current.fgMarginTop}
										oninput={(e) => handleLinkedInput((e.target as HTMLInputElement).value)}
										onchange={() => commitHistory()}
										onfocus={(e) => (e.target as HTMLInputElement).select()}
										onblur={(e) => {
											(e.target as HTMLInputElement).value = String(settings.current.fgMarginTop);
										}}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === 'Escape') {
												(e.target as HTMLInputElement).blur();
											}
										}}
										class="h-7 w-8 shrink-0 [appearance:textfield] bg-transparent text-right font-mono text-xs text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
									/>
								</div>
								<div class="mx-1 h-4 w-px shrink-0 bg-border/60"></div>
								<button
									type="button"
									onclick={toggleLinkedUnit}
									class="flex h-7 w-8 shrink-0 cursor-pointer items-center justify-center rounded-r-md font-mono text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									title={`Click to switch to ${settings.current.fgMarginTopUnit === 'percent' ? 'pixels (px)' : 'percentage (%)'}`}
								>
									{settings.current.fgMarginTopUnit === 'percent' ? '%' : 'px'}
								</button>
							</div>
						</div>
					</CollapsibleSection>

					<CollapsibleSection open={!settings.current.fgMarginsLinked}>
						<!-- 4 Individual Side Rows -->
						{#each SIDES as side}
							<div class="flex items-center gap-1.5 py-1">
								<span class="w-12 shrink-0 text-xs text-muted-foreground select-none">
									{side.label}
								</span>

								{#if settings.current[side.valProp] > 0}
									<button
										type="button"
										class="group flex h-7 w-5 shrink-0 cursor-pointer items-center justify-center"
										aria-label={`Reset ${side.label} margin`}
										title={`Reset ${side.label} margin to 0`}
										onclick={() => resetSideMargin(side.key)}
									>
										<Undo
											size={14}
											class="text-muted-foreground transition-colors group-hover:text-foreground"
										/>
									</button>
								{:else}
									<div class="w-5 shrink-0"></div>
								{/if}

								<div
									class="flex min-w-0 flex-1 items-center rounded-md border border-input bg-input/20 pl-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:bg-input/30"
								>
									<div class="flex min-w-0 flex-1 items-center gap-1.5">
										<Slider
											type="single"
											bind:value={settings.current[side.valProp]}
											min={0}
											max={settings.current[side.unitProp] === 'percent' ? 40 : 300}
											step={1}
											onValueChange={() => {
												settings.current[side.enabledProp] = true;
											}}
											onValueCommit={() => commitHistory()}
											class="flex-1 py-1 **:data-[slot=slider-track]:bg-foreground/12 dark:**:data-[slot=slider-track]:bg-white/18"
										/>
										<input
											type="number"
											min="0"
											max={settings.current[side.unitProp] === 'percent' ? 40 : 300}
											step="1"
											value={settings.current[side.valProp]}
											oninput={(e) =>
												handleSideValueInput(side.key, (e.target as HTMLInputElement).value)}
											onchange={() => commitHistory()}
											onfocus={(e) => (e.target as HTMLInputElement).select()}
											onblur={(e) => {
												(e.target as HTMLInputElement).value = String(
													settings.current[side.valProp]
												);
											}}
											onkeydown={(e) => {
												if (e.key === 'Enter' || e.key === 'Escape') {
													(e.target as HTMLInputElement).blur();
												}
											}}
											class="h-7 w-8 shrink-0 [appearance:textfield] bg-transparent text-right font-mono text-xs text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
										/>
									</div>
									<div class="mx-1 h-4 w-px shrink-0 bg-border/60"></div>
									<button
										type="button"
										onclick={() => toggleSideUnit(side.key)}
										class="flex h-7 w-8 shrink-0 cursor-pointer items-center justify-center rounded-r-md font-mono text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										title={`Click to switch to ${settings.current[side.unitProp] === 'percent' ? 'pixels (px)' : 'percentage (%)'}`}
									>
										{settings.current[side.unitProp] === 'percent' ? '%' : 'px'}
									</button>
								</div>
							</div>
						{/each}
					</CollapsibleSection>
				</div>
			</div>
		</CollapsibleSection>
	</div>
</CollapsibleSection>
