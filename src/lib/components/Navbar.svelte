<script lang="ts">
	import { theme, history } from '$lib/state.svelte';
	import { Sun, Moon, Undo2, Redo2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';

	let { onExport }: { onExport: () => void } = $props();
</script>

<div
	class="col-span-full flex h-14 w-full items-center justify-between border-b border-border bg-sidebar px-6"
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
				<Sun size={22} />
			{:else}
				<Moon size={22} />
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
			<Undo2 size={16} />
		</Button>
		<Button
			size="icon"
			variant="outline"
			disabled={!history?.canRedo}
			onclick={() => history?.redo()}
			title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)"
		>
			<Redo2 size={16} />
		</Button>
	</ButtonGroup.Root>

	<Button class="px-4" onclick={onExport}>Render &amp; Save PNG</Button>
</div>
