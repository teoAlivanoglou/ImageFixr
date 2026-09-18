<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Switch } from '$lib/components/ui/switch';
	import { Undo, Minus, Plus, ChevronUp, ChevronDown, ChevronsLeftRight } from '@lucide/svelte';
	import SectionHeader from './SectionHeader.svelte';
	import { settings, media, commitHistory, SAFE_AREA_PRESETS } from '$lib/state.svelte';
	import type { MarginUnit } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let isCollapsed = $state(false);

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

	function toggleSide(side: Side) {
		const sideInfo = SIDES.find((s) => s.key === side)!;
		settings.current[sideInfo.enabledProp] = !settings.current[sideInfo.enabledProp];
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
		let num = parseFloat(rawValue);
		if (isNaN(num)) num = 0;
		const max = settings.current[sideInfo.unitProp] === 'percent' ? 40 : 300;
		settings.current[sideInfo.valProp] = Math.min(max, Math.max(0, num));
	}

	const hasAnySideEnabled = $derived(
		settings.current.fgMarginTopEnabled ||
			settings.current.fgMarginRightEnabled ||
			settings.current.fgMarginBottomEnabled ||
			settings.current.fgMarginLeftEnabled
	);

	function resetSideMargin(side: Side) {
		const sideInfo = SIDES.find((s) => s.key === side)!;
		settings.current[sideInfo.valProp] = 0;
		commitHistory();
	}

	function stepValue(side: Side, delta: number) {
		const sideInfo = SIDES.find((s) => s.key === side)!;
		const max = settings.current[sideInfo.unitProp] === 'percent' ? 40 : 300;
		const current = settings.current[sideInfo.valProp] || 0;
		settings.current[sideInfo.valProp] = Math.min(max, Math.max(0, current + delta));
		commitHistory();
	}

	let isScrubbing = $state(false);
	let scrubStartX = 0;
	let scrubStartVal = 0;

	function handleScrubStart(e: PointerEvent) {
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);
		isScrubbing = true;
		scrubStartX = e.clientX;
		scrubStartVal = settings.current.fgMarginLeft || 0;

		const onPointerMove = (ev: PointerEvent) => {
			if (!isScrubbing) return;
			const delta = ev.clientX - scrubStartX;
			const mult = ev.shiftKey ? 5 : ev.altKey ? 0.2 : 1;
			const max = settings.current.fgMarginLeftUnit === 'percent' ? 40 : 300;
			const next = Math.min(max, Math.max(0, Math.round(scrubStartVal + delta * 0.5 * mult)));
			settings.current.fgMarginLeft = next;
		};

		const onPointerUp = (ev: PointerEvent) => {
			isScrubbing = false;
			try {
				target.releasePointerCapture(ev.pointerId);
			} catch {}
			target.removeEventListener('pointermove', onPointerMove as EventListener);
			target.removeEventListener('pointerup', onPointerUp as EventListener);
			target.removeEventListener('pointercancel', onPointerUp as EventListener);
			commitHistory();
		};

		target.addEventListener('pointermove', onPointerMove as EventListener);
		target.addEventListener('pointerup', onPointerUp as EventListener);
		target.addEventListener('pointercancel', onPointerUp as EventListener);
	}
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
				title="Safe Area"
				hasSwitch={true}
				bind:enabled={settings.current.fgMarginEnabled}
				bind:isCollapsed
				onEnableChange={commitHistory}
			/>

			<!-- Collapsible Margin Controls -->
			<div
				class={cn(
					'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
					settings.current.fgMarginEnabled && !isCollapsed
						? 'grid-rows-[1fr] opacity-100'
						: 'pointer-events-none grid-rows-[0fr] opacity-0'
				)}
			>
				<div class="overflow-hidden">
					<!-- Inset Section Controls -->
					<div class="mt-2.5 flex flex-col gap-3 pl-2.5">
						<!-- Standard Dropdown -->
						<div class="flex items-center justify-between gap-2">
							<Label for="margin-safe-area" class="text-xs text-muted-foreground">Standard</Label>
							<Select
								type="single"
								bind:value={settings.current.fgSafeAreaStandard}
								onValueChange={() => commitHistory()}
							>
								<SelectTrigger id="margin-safe-area" class="h-7 w-[180px] text-xs">
									{SAFE_AREA_PRESETS[settings.current.fgSafeAreaStandard]?.label || 'None'}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									<SelectItem value="smpte-title">Title Safe</SelectItem>
									<SelectItem value="smpte-action">Action Safe</SelectItem>
									<!-- <SelectItem value="legacy-action">Legacy Action Safe (90%)</SelectItem> -->
									<!-- <SelectItem value="legacy-title">Legacy Title Safe (80%)</SelectItem> -->
									<!-- <SelectItem value="custom">Custom</SelectItem> -->
								</SelectContent>
							</Select>
						</div>

						<!-- Additional Margins Section Header -->
						<div class="flex items-center justify-between pt-1">
							<Label class="text-xs text-muted-foreground">Additional Margins</Label>
							<!-- 4-Side Switchers: T, R, B, L -->
							<div
								class="inline-flex items-center rounded-md border border-input/60 bg-muted/30 p-0.5"
								role="group"
								aria-label="Toggle margins per side"
							>
								{#each SIDES as side}
									<button
										type="button"
										class={cn(
											'flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[10px] font-semibold transition-all select-none',
											settings.current[side.enabledProp]
												? 'bg-primary text-primary-foreground shadow-xs'
												: 'text-muted-foreground/60 hover:bg-background/50 hover:text-foreground'
										)}
										title={`${side.label} Margin (${settings.current[side.enabledProp] ? 'Click to disable' : 'Click to enable'})`}
										aria-pressed={settings.current[side.enabledProp]}
										onclick={() => toggleSide(side.key)}
									>
										{side.short}
									</button>
								{/each}
							</div>
						</div>

						<!-- Enabled Side Rows: Side   Reset   Control   Px/% -->
						{#if hasAnySideEnabled}
							<div class="flex flex-col gap-1.5 pt-0.5">
								{#each SIDES as side}
									{#if settings.current[side.enabledProp]}
										<div class="flex items-center gap-1.5">
											<!-- Label -->
											<span class="w-12 shrink-0 text-xs text-muted-foreground select-none">
												{side.label}
											</span>

											<!-- Reset button on the left of control -->
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

											<!-- Control: Different per side (with joined unit toggle) -->
											{#if side.key === 'top'}
												<!-- TOP: Chevron Stepper (Joined with Px/%) -->
												<div
													class="flex min-w-0 flex-1 items-center rounded-md border border-input bg-input/20 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:bg-input/30"
												>
													<input
														type="number"
														min="0"
														max={settings.current.fgMarginTopUnit === 'percent' ? 40 : 300}
														step="1"
														value={settings.current.fgMarginTop}
														oninput={(e) =>
															handleSideValueInput('top', (e.target as HTMLInputElement).value)}
														onchange={() => commitHistory()}
														class="h-7 w-full min-w-0 flex-1 [appearance:textfield] bg-transparent py-0.5 pr-1 pl-2.5 text-right font-mono text-xs text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
													/>
													<div class="flex flex-col items-center justify-center px-0.5">
														<button
															type="button"
															class="flex h-3 w-4 cursor-pointer items-center justify-center rounded-xs text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground"
															onclick={() => stepValue('top', 1)}
															tabindex="-1"
															title="Increment"
														>
															<ChevronUp size={10} />
														</button>
														<button
															type="button"
															class="flex h-3 w-4 cursor-pointer items-center justify-center rounded-xs text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground"
															onclick={() => stepValue('top', -1)}
															tabindex="-1"
															title="Decrement"
														>
															<ChevronDown size={10} />
														</button>
													</div>
													<div class="h-4 w-px shrink-0 bg-border/60"></div>
													<button
														type="button"
														onclick={() => toggleSideUnit('top')}
														class="flex h-7 w-8 shrink-0 cursor-pointer items-center justify-center rounded-r-md font-mono text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
														title={`Click to switch to ${settings.current.fgMarginTopUnit === 'percent' ? 'pixels (px)' : 'percentage (%)'}`}
													>
														{settings.current.fgMarginTopUnit === 'percent' ? '%' : 'px'}
													</button>
												</div>
											{:else if side.key === 'right'}
												<!-- RIGHT: Slider (Joined with Px/%) -->
												<div
													class="flex min-w-0 flex-1 items-center rounded-md border border-input bg-input/20 pl-2 transition-colors dark:bg-input/30"
												>
													<div class="flex min-w-0 flex-1 items-center gap-2">
														<Slider
															type="single"
															bind:value={settings.current.fgMarginRight}
															min={0}
															max={settings.current.fgMarginRightUnit === 'percent' ? 40 : 300}
															step={1}
															onValueCommit={() => commitHistory()}
															class="flex-1 py-1 [&_[data-slot=slider-track]]:bg-foreground/12 dark:[&_[data-slot=slider-track]]:bg-white/18"
														/>
														<span
															class="w-6 shrink-0 text-right font-mono text-xs text-foreground select-none"
														>
															{settings.current.fgMarginRight}
														</span>
													</div>
													<div class="mx-1 h-4 w-px shrink-0 bg-border/60"></div>
													<button
														type="button"
														onclick={() => toggleSideUnit('right')}
														class="flex h-7 w-8 shrink-0 cursor-pointer items-center justify-center rounded-r-md font-mono text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
														title={`Click to switch to ${settings.current.fgMarginRightUnit === 'percent' ? 'pixels (px)' : 'percentage (%)'}`}
													>
														{settings.current.fgMarginRightUnit === 'percent' ? '%' : 'px'}
													</button>
												</div>
											{:else if side.key === 'bottom'}
												<!-- BOTTOM: Stepper | - | Value | + | Px/% | -->
												<div
													class="flex min-w-0 flex-1 items-center rounded-md border border-input bg-input/20 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:bg-input/30"
												>
													<button
														type="button"
														class="flex h-7 w-6 shrink-0 cursor-pointer items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
														onclick={() => stepValue('bottom', -1)}
														tabindex="-1"
														title="Decrease margin"
													>
														<Minus size={12} />
													</button>
													<div class="h-4 w-px shrink-0 bg-border/60"></div>
													<input
														type="number"
														min="0"
														max={settings.current.fgMarginBottomUnit === 'percent' ? 40 : 300}
														step="1"
														value={settings.current.fgMarginBottom}
														oninput={(e) =>
															handleSideValueInput('bottom', (e.target as HTMLInputElement).value)}
														onchange={() => commitHistory()}
														class="h-7 w-full min-w-0 flex-1 [appearance:textfield] bg-transparent px-1 text-center font-mono text-xs text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
													/>
													<div class="h-4 w-px shrink-0 bg-border/60"></div>
													<button
														type="button"
														class="flex h-7 w-6 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
														onclick={() => stepValue('bottom', 1)}
														tabindex="-1"
														title="Increase margin"
													>
														<Plus size={12} />
													</button>
													<div class="h-4 w-px shrink-0 bg-border/60"></div>
													<button
														type="button"
														onclick={() => toggleSideUnit('bottom')}
														class="flex h-7 w-8 shrink-0 cursor-pointer items-center justify-center rounded-r-md font-mono text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
														title={`Click to switch to ${settings.current.fgMarginBottomUnit === 'percent' ? 'pixels (px)' : 'percentage (%)'}`}
													>
														{settings.current.fgMarginBottomUnit === 'percent' ? '%' : 'px'}
													</button>
												</div>
											{:else if side.key === 'left'}
												<!-- LEFT: Figma Style Scrubbable (Joined with Px/%) -->
												<div
													class="flex min-w-0 flex-1 items-center rounded-md border border-input bg-input/20 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:bg-input/30"
												>
													<button
														type="button"
														tabindex="-1"
														class="flex h-7 w-6 shrink-0 cursor-ew-resize items-center justify-center rounded-l-md text-muted-foreground/50 transition-colors select-none hover:text-foreground"
														title="Drag horizontally to scrub (Shift: 5x, Alt: fine)"
														onpointerdown={handleScrubStart}
													>
														<ChevronsLeftRight size={11} />
													</button>
													<input
														type="number"
														min="0"
														max={settings.current.fgMarginLeftUnit === 'percent' ? 40 : 300}
														step="1"
														value={settings.current.fgMarginLeft}
														oninput={(e) =>
															handleSideValueInput('left', (e.target as HTMLInputElement).value)}
														onchange={() => commitHistory()}
														class="h-7 w-full min-w-0 flex-1 [appearance:textfield] bg-transparent px-2 text-right font-mono text-xs text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
													/>
													<div class="h-4 w-px shrink-0 bg-border/60"></div>
													<button
														type="button"
														onclick={() => toggleSideUnit('left')}
														class="flex h-7 w-8 shrink-0 cursor-pointer items-center justify-center rounded-r-md font-mono text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
														title={`Click to switch to ${settings.current.fgMarginLeftUnit === 'percent' ? 'pixels (px)' : 'percentage (%)'}`}
													>
														{settings.current.fgMarginLeftUnit === 'percent' ? '%' : 'px'}
													</button>
												</div>
											{/if}
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
