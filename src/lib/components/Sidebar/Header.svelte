<script lang="ts">
	import { theme, history } from '$lib/state.svelte';
	import { Sun, Moon, Undo, Redo } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex items-center justify-between">
	<h1 class="flex items-center gap-2 text-2xl leading-8 font-medium tracking-tight">
		ImageFixr
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
	</h1>

	<div class="flex items-center gap-1">
		<Button
			variant="ghost"
			size="icon"
			disabled={!history?.canUndo}
			onclick={() => history?.undo()}
			title="Undo (Ctrl+Z / Cmd+Z)"
		>
			<Undo size={16} />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			disabled={!history?.canRedo}
			onclick={() => history?.redo()}
			title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)"
		>
			<Redo size={16} />
		</Button>
	</div>
</div>
