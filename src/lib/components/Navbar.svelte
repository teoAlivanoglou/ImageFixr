<script lang="ts">
	import { theme, history, commitHistory, settings } from '$lib/state.svelte';
	import { Sun, Moon, Undo2, Redo2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils';

	let { onExport, class: className }: { onExport: () => void; class?: string } = $props();

	const ASPECT_RATIOS = [
		{ value: '16:9', label: '16:9 Landscape' },
		{ value: '4:3', label: '4:3 Standard' },
		{ value: '1:1', label: '1:1 Square' },
		{ value: '9:16', label: '9:16 Portrait' },
		{ value: '4:5', label: '4:5 Social' },
		{ value: '3:2', label: '3:2 Photo' },
		{ value: '21:9', label: '21:9 Ultrawide' }
	];
</script>

<div
	class={cn(
		'col-span-full flex h-14 w-full items-center justify-between border-b border-border bg-sidebar px-6',
		className
	)}
>
	<div class="flex shrink items-center gap-3">
		<div
			class="pointer-events-none flex items-baseline text-2xl font-extralight tracking-tight text-muted-foreground select-none"
		>
			<strong class="font-semibold text-foreground"> Image </strong>
			Fixr
		</div>

		<span
			class="inline-flex cursor-pointer text-2xl text-muted-foreground transition-colors hover:text-foreground"
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
				<Sun class="size-5.5" />
			{:else}
				<Moon class="size-5.5" />
			{/if}
		</span>
	</div>

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

	<div class="flex items-center gap-3">
		<Select
			type="single"
			bind:value={settings.current.aspectRatio}
			onValueChange={() => commitHistory()}
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

		<Button class="px-4" onclick={onExport}>Render &amp; Save PNG</Button>
	</div>
</div>
