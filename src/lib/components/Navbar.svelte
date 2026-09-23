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

	import {
		getResolutionsForRatio,
		getValidResolutionPreset
	} from '$lib/viewport/resolutions';
	import { ASPECT_RATIOS } from './Sidebar/format-constants';

	let { onExport, class: className }: { onExport: () => void; class?: string } = $props();

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
		'col-span-full flex h-12 md:h-14 w-full items-center justify-between border-b border-border bg-sidebar px-3 md:px-6 pt-[env(safe-area-inset-top)]',
		className
	)}
>
	<!-- Left: Brand & Theme Toggle -->
	<div class="flex shrink items-center gap-2 md:gap-3">
		<div
			class="pointer-events-none flex items-baseline text-lg md:text-2xl font-extralight tracking-tight text-muted-foreground select-none"
		>
			<strong class="font-semibold text-foreground"> Image </strong>
			<span class="hidden sm:inline">&nbsp;Fixr</span>
			<span class="inline sm:hidden">Fixr</span>
		</div>

		<span
			class="inline-flex cursor-pointer text-xl md:text-2xl text-muted-foreground transition-colors hover:text-foreground"
			role="button"
			tabindex="0"
			aria-label={theme.current ? 'Use light mode' : 'Use dark mode'}
			onclick={() => (theme.current = !theme.current)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					theme.current = !theme.current;
				}
			}}
		>
			{#if theme.current}
				<Sun class="size-4.5 md:size-5.5" />
			{:else}
				<Moon class="size-4.5 md:size-5.5" />
			{/if}
		</span>
	</div>

	<!-- Desktop Center: Undo/Redo -->
	<div class="hidden md:flex">
		<ButtonGroup.Root>
			<Button
				size="icon"
				variant="outline"
				disabled={!history?.canUndo}
				onclick={() => history?.undo()}
				title="Undo (Ctrl+Z / Cmd+Z)"
			>
				<Undo2 class="size-4" />
			</Button>
			<Button
				size="icon"
				variant="outline"
				disabled={!history?.canRedo}
				onclick={() => history?.redo()}
				title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)"
			>
				<Redo2 class="size-4" />
			</Button>
		</ButtonGroup.Root>
	</div>

	<!-- Desktop Right: Aspect Ratio, Resolution & Export -->
	<div class="hidden md:flex items-center gap-3">
		<Select
			type="single"
			bind:value={settings.current.aspectRatio}
			onValueChange={handleRatioChange}
		>
			<SelectTrigger id="navbar-aspect-ratio" class="h-9 w-28 text-xs">
				<span class="text-muted-foreground">Ratio:</span>
				{settings.current.aspectRatio}
			</SelectTrigger>
			<SelectContent>
				{#each ASPECT_RATIOS as ratio (ratio.value)}
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
				class="h-9 min-w-38 text-xs"
				title={`${currentRes.label} (${currentRes.sublabel})`}
			>
				<span class="text-muted-foreground">Res:</span>
				<span class="font-medium text-foreground">{currentRes.label}</span>
			</SelectTrigger>
			<SelectContent class="w-max min-w-max">
				{#each availableResolutions as res (res.id)}
					<SelectItem value={res.id}>
						<div class="flex w-full items-center justify-between gap-4">
							<span class="font-medium">{res.label}</span>
							<span class="text-xs text-muted-foreground tabular-nums">{res.sublabel}</span>
						</div>
					</SelectItem>
				{/each}
			</SelectContent>
		</Select>

		<Button class="px-4" onclick={onExport}>Render &amp; Save PNG</Button>
	</div>

	<!-- Mobile Right: Undo/Redo, Fullscreen Toggle, and Compact Export -->
	<div class="flex md:hidden items-center gap-1.5">
		<ButtonGroup.Root>
			<Button
				size="icon"
				variant="outline"
				class="size-8"
				disabled={!history?.canUndo}
				onclick={() => history?.undo()}
				title="Undo"
			>
				<Undo2 class="size-3.5" />
			</Button>
			<Button
				size="icon"
				variant="outline"
				class="size-8"
				disabled={!history?.canRedo}
				onclick={() => history?.redo()}
				title="Redo"
			>
				<Redo2 class="size-3.5" />
			</Button>
		</ButtonGroup.Root>

		{#if canFullscreen}
			<Button
				size="icon"
				variant="outline"
				class="size-8"
				onclick={toggleFullscreen}
				title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
			>
				{#if isFullscreen}
					<Minimize class="size-3.5" />
				{:else}
					<Maximize class="size-3.5" />
				{/if}
			</Button>
		{/if}

		<Button size="sm" class="h-8 px-2.5 text-xs font-semibold" onclick={onExport}>
			Save
		</Button>
	</div>
</div>
