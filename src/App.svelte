<script lang="ts">
	import Sidebar from '$lib/Sidebar.svelte';
	import Viewport from '$lib/Viewport.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import MobileDock from '$lib/components/MobileDock.svelte';
	import { cn } from '$lib/utils';
	import { PersistedState } from 'runed';
	import { layoutMode } from '$lib/viewport/layout-mode.svelte';
	import { theme, history } from '$lib/state.svelte';

	let { class: className }: { class?: string } = $props();

	let viewportRef = $state<Viewport>();

	const MIN_SIDEBAR_REM = 17;
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

	let isDesktopLayout = $derived(
		layoutMode.current === 'desktop' || layoutMode.current === 'mobile-landscape'
	);

	function getRootFontSize(): number {
		if (typeof window === 'undefined') return 16;
		return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
	}

	function startResize(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		isResizing = true;
		remSize = getRootFontSize();
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	let resizeRafId: number | null = null;

	function onMouseMove(e: MouseEvent | TouchEvent) {
		if (!isResizing) return;
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const targetRem = clientX / remSize;
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

	// Mobile continuous arbitrary height resizing
	const MIN_MOBILE_CANVAS_DVH = 15;
	const MAX_MOBILE_CANVAS_DVH = 80;
	const DEFAULT_MOBILE_CANVAS_DVH = 42;

	let mobileCanvasDvhStore = new PersistedState(
		'image-fixr-mobile-canvas-dvh',
		DEFAULT_MOBILE_CANVAS_DVH
	);
	let currentMobileCanvasDvh = $state(
		Math.max(
			MIN_MOBILE_CANVAS_DVH,
			Math.min(mobileCanvasDvhStore.current ?? DEFAULT_MOBILE_CANVAS_DVH, MAX_MOBILE_CANVAS_DVH)
		)
	);
	let isMobileResizing = $state(false);
	let mobileStartTouchY = 0;
	let mobileStartDvh = 0;
	let mobileResizeRafId: number | null = null;

	function startMobileResize(e: MouseEvent | TouchEvent) {
		isMobileResizing = true;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		mobileStartTouchY = clientY;
		mobileStartDvh = currentMobileCanvasDvh;
		document.body.style.userSelect = 'none';
	}

	function onMobilePointerMove(e: MouseEvent | TouchEvent) {
		if (!isMobileResizing) return;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		if (mobileResizeRafId !== null) return;
		mobileResizeRafId = requestAnimationFrame(() => {
			mobileResizeRafId = null;
			const deltaPx = clientY - mobileStartTouchY;
			const totalHeight = window.innerHeight;
			const deltaDvh = (deltaPx / totalHeight) * 100;
			currentMobileCanvasDvh = Math.max(
				MIN_MOBILE_CANVAS_DVH,
				Math.min(MAX_MOBILE_CANVAS_DVH, mobileStartDvh + deltaDvh)
			);
		});
	}

	function onMobilePointerUp() {
		if (isMobileResizing) {
			if (mobileResizeRafId !== null) {
				cancelAnimationFrame(mobileResizeRafId);
				mobileResizeRafId = null;
			}
			isMobileResizing = false;
			document.body.style.userSelect = '';
			mobileCanvasDvhStore.current = Math.round(currentMobileCanvasDvh * 10) / 10;
		}
	}

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

<svelte:window
	onkeydown={handleKeydown}
	onmousemove={(e) => {
		if (isResizing) onMouseMove(e);
		if (isMobileResizing) onMobilePointerMove(e);
	}}
	ontouchmove={(e) => {
		if (isResizing) onMouseMove(e);
		if (isMobileResizing) onMobilePointerMove(e);
	}}
	onmouseup={() => {
		if (isResizing) onMouseUp();
		if (isMobileResizing) onMobilePointerUp();
	}}
	ontouchend={() => {
		if (isResizing) onMouseUp();
		if (isMobileResizing) onMobilePointerUp();
	}}
/>

<div
	class={cn(
		'flex h-full w-full flex-col overflow-hidden',
		isDesktopLayout &&
			'grid [grid-template-columns:var(--desktop-sidebar-width)_minmax(0,1fr)] grid-rows-[auto_1fr]',
		className
	)}
	style="--desktop-sidebar-width: {currentWidthRem}rem; --mobile-canvas-height: {currentMobileCanvasDvh}dvh;"
>
	<Navbar class="col-span-full shrink-0" onExport={() => viewportRef?.renderAndSave()} />

	{#if isDesktopLayout}
		<div class="relative col-span-1 row-span-1 row-start-2 h-full min-h-0 min-w-0">
			<Sidebar class="h-full w-full" />

			<!-- Desktop & Mobile-Landscape Resizer handle -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class={cn(
					'group absolute top-0 right-0 z-50 flex h-full items-center justify-center translate-x-1/2 cursor-col-resize select-none',
					layoutMode.current === 'mobile-landscape' ? 'w-5' : 'w-3'
				)}
				role="separator"
				tabindex="0"
				onmousedown={startResize}
				ontouchstart={startResize}
				ondblclick={() => (currentWidthRem = DEFAULT_SIDEBAR_REM)}
				title="Drag to resize sidebar / double-click to reset"
			>
				<!-- Visual indicator -->
				{#if layoutMode.current === 'mobile-landscape'}
					<div
						class={cn(
							'h-10 w-1 rounded-full transition-colors',
							isResizing ? 'bg-primary' : 'bg-muted-foreground/30 group-hover:bg-primary/60'
						)}
					></div>
				{:else}
					<div
						class={cn(
							'absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 transition-colors',
							isResizing ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/50'
						)}
					></div>
				{/if}
			</div>
		</div>

		<!-- Canvas Viewport (Desktop & Mobile-Landscape) -->
		<Viewport
			class={cn(
				'col-span-1 col-start-2 row-span-1 row-start-2 h-full w-full',
				layoutMode.current === 'mobile-landscape' ? 'p-2' : 'p-4'
			)}
			bind:this={viewportRef}
		/>
	{:else}
		<!-- Canvas Viewport (Mobile & Desktop-Portrait) -->
		<Viewport
			class="h-[var(--mobile-canvas-height)] w-full flex-none p-2"
			bind:this={viewportRef}
		/>

		<!-- Mobile Horizontal Resizer Handle -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="group relative z-30 flex h-3.5 w-full shrink-0 cursor-row-resize items-center justify-center bg-background select-none"
			role="separator"
			tabindex="0"
			onmousedown={startMobileResize}
			ontouchstart={startMobileResize}
			ondblclick={() => (currentMobileCanvasDvh = DEFAULT_MOBILE_CANVAS_DVH)}
			title="Drag to resize canvas / double-click to reset"
		>
			<div
				class={cn(
					'h-1 w-10 rounded-full transition-colors',
					isMobileResizing ? 'bg-primary' : 'bg-muted-foreground/30 group-hover:bg-primary/60'
				)}
			></div>
		</div>

		<MobileDock class="flex min-h-0 flex-1" />
	{/if}
</div>
