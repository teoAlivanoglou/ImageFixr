<script lang="ts">
	import Sidebar from '$lib/Sidebar.svelte';
	import Viewport from '$lib/Viewport.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import MobileDock from '$lib/components/MobileDock.svelte';
	import { cn } from '$lib/utils';
	import { PersistedState } from 'runed';

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
	let remSize = 16;

	function getRootFontSize(): number {
		if (typeof window === 'undefined') return 16;
		return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
	}

	function startResize(e: MouseEvent) {
		e.preventDefault();
		isResizing = true;
		remSize = getRootFontSize();
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	let resizeRafId: number | null = null;

	function onMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		const targetRem = e.clientX / remSize;
		if (resizeRafId !== null) return;
		resizeRafId = requestAnimationFrame(() => {
			resizeRafId = null;
			currentWidthRem = Math.max(MIN_SIDEBAR_REM, Math.min(targetRem, MAX_SIDEBAR_REM));
		});
	}

	function onMouseUp() {
		if (isResizing) {
			if (resizeRafId !== null) {
				cancelAnimationFrame(resizeRafId);
				resizeRafId = null;
			}
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
	class={cn(
		'flex flex-col h-dvh w-screen overflow-hidden md:grid md:grid-rows-[auto_1fr] md:[grid-template-columns:var(--desktop-sidebar-width)_minmax(0,1fr)]',
		className
	)}
	style="--desktop-sidebar-width: {currentWidthRem}rem;"
>
	<Navbar class="col-span-full shrink-0" onExport={() => viewportRef?.renderAndSave()} />

	<div class="relative col-span-1 row-span-1 row-start-2 h-full min-h-0 min-w-0 hidden md:block">
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

	<Viewport
		class="flex-none h-[42dvh] max-h-[45dvh] w-full p-2 md:col-span-1 md:col-start-2 md:row-span-1 md:row-start-2 md:h-full md:p-4"
		bind:this={viewportRef}
	/>

	<MobileDock class="flex md:hidden flex-1 min-h-0" />
</div>
