<script lang="ts">
	import Sidebar from '$lib/Sidebar.svelte';
	import Viewport from '$lib/Viewport.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { cn } from '$lib/utils';
	import { PersistedState } from 'runed';
	import { flushSync } from 'svelte';

	let { class: className }: { class?: string } = $props();

	let viewportRef = $state<Viewport>();

	const MIN_SIDEBAR_REM = 19;
	const MAX_SIDEBAR_REM = 38;
	const DEFAULT_SIDEBAR_REM = 21;

	let sidebarWidthStore = new PersistedState('image-fixr-sidebar-width-rem', DEFAULT_SIDEBAR_REM);
	let currentWidthRem = $state(
		Math.max(
			MIN_SIDEBAR_REM,
			Math.min(sidebarWidthStore.current ?? DEFAULT_SIDEBAR_REM, MAX_SIDEBAR_REM)
		)
	);
	let isResizing = $state(false);

	function getRootFontSize(): number {
		if (typeof window === 'undefined') return 16;
		return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
	}

	function startResize(e: MouseEvent) {
		e.preventDefault();
		isResizing = true;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	function onMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		const remSize = getRootFontSize();
		const targetRem = e.clientX / remSize;
		flushSync(() => {
			currentWidthRem = Math.max(MIN_SIDEBAR_REM, Math.min(targetRem, MAX_SIDEBAR_REM));
		});
		viewportRef?.forceResize();
	}

	function onMouseUp() {
		if (isResizing) {
			isResizing = false;
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
			sidebarWidthStore.current = Math.round(currentWidthRem * 100) / 100;
		}
	}
</script>

<svelte:window
	onmousemove={isResizing ? onMouseMove : undefined}
	onmouseup={isResizing ? onMouseUp : undefined}
/>

<div
	class={cn('grid h-dvh w-screen grid-rows-[auto_1fr]', className)}
	style="grid-template-columns: {currentWidthRem}rem minmax(0,1fr);"
>
	<Navbar class="col-span-full" onExport={() => viewportRef?.renderAndSave()} />

	<div class="relative col-span-1 row-span-1 row-start-2 h-full min-h-0 min-w-0">
		<Sidebar class="h-full w-full" />

		<!-- Resizer handle -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="group absolute top-0 right-0 z-50 h-full w-3 translate-x-1/2 cursor-col-resize select-none"
			role="separator"
			tabindex="0"
			onmousedown={startResize}
		>
			<!-- Visual indicator -->
			<div
				class={cn(
					'absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 transition-colors',
					isResizing ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/50'
				)}
			></div>
		</div>
	</div>

	<Viewport class="col-span-1 col-start-2 row-span-1 row-start-2 p-4" bind:this={viewportRef} />
</div>
