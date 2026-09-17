<script lang="ts">
	import { theme, history, commitHistory } from '$lib/state.svelte';
	import ForegroundControls from './components/Sidebar/ForegroundControls.svelte';
	import BorderControls from './components/Sidebar/BorderControls.svelte';
	import DropShadowControls from './components/Sidebar/DropShadowControls.svelte';
	import BackgroundControls from './components/Sidebar/BackgroundControls.svelte';
	import CanvasControls from './components/Sidebar/CanvasControls.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	$effect(() => {
		document.documentElement.classList.toggle('dark', theme.current);
	});

	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
			if (event.shiftKey) {
				if (history?.canRedo) {
					event.preventDefault();
					history.redo();
				}
			} else {
				if (history?.canUndo) {
					event.preventDefault();
					history.undo();
				}
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onpointerup={commitHistory} />

<aside
	class={cn(
		'flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 [&_label]:text-sm! [&_label,span]:font-light!',
		className
	)}
>
	<ForegroundControls />
	<BackgroundControls />

	<BorderControls />
	<DropShadowControls />
	<CanvasControls />
</aside>
