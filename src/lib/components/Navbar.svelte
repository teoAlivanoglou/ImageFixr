<script lang="ts">
	import { theme, history, commitHistory, settings } from '$lib/state.svelte';
	import { Sun, Moon, Undo2, Redo2, Maximize, Minimize } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils';
	import { layoutMode } from '$lib/viewport/layout-mode.svelte';

	import {
		getResolutionsForRatio,
		getValidResolutionPreset,
		getLocalizedResolutionLabel
	} from '$lib/viewport/resolutions';
	import { getAspectRatios } from './Sidebar/format-constants';
	import * as m from '$paraglide/messages.js';

	let { onExport, class: className }: { onExport: () => void; class?: string } = $props();

	let aspectRatios = $derived(getAspectRatios());
	let availableResolutions = $derived(getResolutionsForRatio(settings.current.aspectRatio));
	let currentRes = $derived(
		availableResolutions.find((r) => r.id === settings.current.resolutionPreset) ||
			availableResolutions[0]
	);

	function handleRatioChange(newRatio: string) {
		settings.current.resolutionPreset = getValidResolutionPreset(
			newRatio,
			settings.current.resolutionPreset
		);
		commitHistory();
	}

	let isDesktopNavbar = $derived(
		layoutMode.current === 'desktop' || layoutMode.current === 'desktop-portrait'
	);

	let isFullscreen = $state(false);
	let canFullscreen = $state(false);

	$effect(() => {
		if (typeof document !== 'undefined') {
			canFullscreen = Boolean(document.fullscreenEnabled);
			const updateFs = () => {
				isFullscreen = Boolean(document.fullscreenElement);
			};
			document.addEventListener('fullscreenchange', updateFs);
			return () => document.removeEventListener('fullscreenchange', updateFs);
		}
	});

	async function toggleFullscreen() {
		try {
			if (!document.fullscreenElement) {
				await document.documentElement.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch {
			// Graceful fallback for unsupported or rejected fullscreen requests
		}
	}
</script>

<div
	class={cn(
		'col-span-full grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-border bg-sidebar pt-[env(safe-area-inset-top,0px)] transition-[padding,height] duration-150',
		isDesktopNavbar
			? 'h-[calc(3.5rem+env(safe-area-inset-top,0px))] px-4 sm:px-6'
			: 'h-[calc(3rem+env(safe-area-inset-top,0px))] px-3 pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))]',
		className
	)}
>
	<!-- Left: Brand & Theme Toggle -->
	<div class="flex min-w-0 items-center justify-start gap-2" class:gap-3={isDesktopNavbar}>
		<div
			class={cn(
				'pointer-events-none flex items-baseline tracking-tight select-none',
				isDesktopNavbar ? 'text-2xl' : 'text-lg'
			)}
		>
			<strong class="font-semibold text-foreground">Image</strong><span
				class="ml-0.5 font-extralight text-muted-foreground">Fixr</span
			>
		</div>

		<span
			class={cn(
				'inline-flex cursor-pointer text-muted-foreground transition-colors hover:text-foreground',
				isDesktopNavbar ? 'text-2xl' : 'text-xl'
			)}
			role="button"
			tabindex="0"
			aria-label={m.action_theme()}
			title={m.action_theme()}
			onclick={() => (theme.current = !theme.current)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					theme.current = !theme.current;
				}
			}}
		>
			{#if theme.current}
				<Sun class={isDesktopNavbar ? 'size-5.5' : 'size-4.5'} />
			{:else}
				<Moon class={isDesktopNavbar ? 'size-5.5' : 'size-4.5'} />
			{/if}
		</span>
	</div>

	<!-- Center: Undo/Redo (Centered across mobile and desktop) -->
	<div class="flex shrink-0 items-center justify-center">
		<ButtonGroup.Root>
			<Button
				size="icon"
				variant="outline"
				class={isDesktopNavbar ? 'size-9' : 'size-8.5'}
				disabled={!history?.canUndo}
				onclick={() => history?.undo()}
				title={`${m.action_undo()} (Ctrl+Z / Cmd+Z)`}
				aria-label={m.action_undo()}
			>
				<Undo2 class="size-4" />
			</Button>
			<Button
				size="icon"
				variant="outline"
				class={isDesktopNavbar ? 'size-9' : 'size-8.5'}
				disabled={!history?.canRedo}
				onclick={() => history?.redo()}
				title={`${m.action_redo()} (Ctrl+Shift+Z / Cmd+Shift+Z)`}
				aria-label={m.action_redo()}
			>
				<Redo2 class="size-4" />
			</Button>
		</ButtonGroup.Root>
	</div>

	<!-- Desktop & Desktop-Portrait Right: Aspect Ratio, Resolution & Export -->
	{#if isDesktopNavbar}
		<div class="flex min-w-0 items-center justify-end gap-2.5 sm:gap-3">
			<Select
				type="single"
				bind:value={settings.current.aspectRatio}
				onValueChange={handleRatioChange}
			>
				<SelectTrigger
					id="navbar-aspect-ratio"
					class="h-9 w-auto min-w-20 px-2.5 text-xs xl:min-w-32"
				>
					<span class="hidden text-muted-foreground xl:inline">{m.aspect_ratio()}:</span>
					{settings.current.aspectRatio}
				</SelectTrigger>
				<SelectContent>
					{#each aspectRatios as ratio (ratio.value)}
						<SelectItem value={ratio.value}>{ratio.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>

			<Select
				type="single"
				bind:value={settings.current.resolutionPreset}
				onValueChange={() => commitHistory()}
			>
				<SelectTrigger
					id="navbar-resolution"
					class="h-9 min-w-28 text-xs xl:min-w-38"
					title={`${getLocalizedResolutionLabel(currentRes.label)} (${currentRes.sublabel})`}
				>
					<span class="hidden text-muted-foreground xl:inline">{m.resolution()}:</span>
					<span class="font-medium text-foreground"
						>{getLocalizedResolutionLabel(currentRes.label)}</span
					>
				</SelectTrigger>
				<SelectContent class="w-max min-w-max">
					{#each availableResolutions as res (res.id)}
						<SelectItem value={res.id}>
							<div class="flex w-full items-center justify-between gap-4">
								<span class="font-medium">{getLocalizedResolutionLabel(res.label)}</span>
								<span class="text-xs text-muted-foreground tabular-nums">{res.sublabel}</span>
							</div>
						</SelectItem>
					{/each}
				</SelectContent>
			</Select>

			<Button class="shrink-0 px-4" onclick={onExport}>{m.action_export()}</Button>
		</div>
	{:else}
		<!-- Mobile Right: Fullscreen Toggle and Save -->
		<div class="flex min-w-0 items-center justify-end gap-1">
			{#if canFullscreen}
				<Button
					size="icon"
					variant="ghost"
					class="size-8.5 text-muted-foreground hover:text-foreground"
					onclick={toggleFullscreen}
					title={m.action_fullscreen()}
					aria-label={m.action_fullscreen()}
				>
					{#if isFullscreen}
						<Minimize class="size-4" />
					{:else}
						<Maximize class="size-4" />
					{/if}
				</Button>
			{/if}

			<Button class="h-8.5 shrink-0 px-3 text-xs" onclick={onExport}>{m.action_export()}</Button>
		</div>
	{/if}
</div>
