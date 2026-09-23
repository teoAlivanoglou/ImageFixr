<script lang="ts">
	import { setContext } from 'svelte';
	import ForegroundControls from './Sidebar/ForegroundControls.svelte';
	import BackgroundControls from './Sidebar/BackgroundControls.svelte';
	import MarginControls from './Sidebar/MarginControls.svelte';
	import BorderControls from './Sidebar/BorderControls.svelte';
	import DropShadowControls from './Sidebar/DropShadowControls.svelte';
	import FormatControls from './Sidebar/FormatControls.svelte';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	setContext('collapsible', false);

	let { class: className }: { class?: string } = $props();

	import { layoutMode } from '$lib/viewport/layout-mode.svelte';

	type TabId = 'foreground' | 'background' | 'margins' | 'border' | 'shadow' | 'format';

	let activeTab = $state<TabId>('foreground');

	const ALL_TABS: Array<{ id: TabId; label: string }> = [
		{ id: 'foreground', label: 'Foreground' },
		{ id: 'background', label: 'Background' },
		{ id: 'margins', label: 'Margins' },
		{ id: 'border', label: 'Border' },
		{ id: 'shadow', label: 'Drop Shadow' },
		{ id: 'format', label: 'Format' }
	];

	let TABS = $derived(
		layoutMode.current === 'desktop-portrait'
			? ALL_TABS.filter((t) => t.id !== 'format')
			: ALL_TABS
	);

	$effect(() => {
		if (layoutMode.current === 'desktop-portrait' && activeTab === 'format') {
			activeTab = 'foreground';
		}
	});

	let tabBarEl = $state<HTMLElement | null>(null);
	let carouselEl = $state<HTMLElement | null>(null);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	let isProgrammaticScroll = false;
	let scrollTimeoutId: ReturnType<typeof setTimeout> | null = null;

	function updateScrollIndicators() {
		if (!tabBarEl) return;
		canScrollLeft = tabBarEl.scrollLeft > 2;
		canScrollRight = tabBarEl.scrollLeft + tabBarEl.clientWidth < tabBarEl.scrollWidth - 2;
	}

	function scrollTabIntoView(id: TabId) {
		if (!tabBarEl) return;
		const btn = tabBarEl.querySelector(`[data-tab-id="${id}"]`) as HTMLElement | null;
		if (!btn) return;
		const containerWidth = tabBarEl.clientWidth;
		const btnLeft = btn.offsetLeft;
		const btnWidth = btn.offsetWidth;
		const targetScrollLeft = btnLeft - (containerWidth - btnWidth) / 2;
		tabBarEl.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
		updateScrollIndicators();
	}

	function handleCarouselScroll() {
		if (isProgrammaticScroll || !carouselEl) return;
		const width = carouselEl.clientWidth;
		if (width === 0) return;
		const index = Math.round(carouselEl.scrollLeft / width);
		if (index >= 0 && index < TABS.length && TABS[index].id !== activeTab) {
			activeTab = TABS[index].id;
			scrollTabIntoView(activeTab);
		}
	}

	function selectTab(id: TabId) {
		activeTab = id;
		scrollTabIntoView(id);
		const index = TABS.findIndex((t) => t.id === id);
		if (index !== -1 && carouselEl) {
			isProgrammaticScroll = true;
			if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
			carouselEl.scrollTo({ left: index * carouselEl.clientWidth, behavior: 'smooth' });
			scrollTimeoutId = setTimeout(() => {
				isProgrammaticScroll = false;
			}, 400);
		}
	}

	$effect(() => {
		updateScrollIndicators();
		const rafId = requestAnimationFrame(() => {
			updateScrollIndicators();
		});
		const handleResize = () => {
			updateScrollIndicators();
			if (carouselEl) {
				const index = TABS.findIndex((t) => t.id === activeTab);
				if (index !== -1) {
					carouselEl.scrollLeft = index * carouselEl.clientWidth;
				}
			}
		};
		window.addEventListener('resize', handleResize);
		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('resize', handleResize);
			if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
		};
	});
</script>

<div
	class={cn(
		'flex flex-col overflow-hidden border-t border-border bg-sidebar pb-[max(0.75rem,env(safe-area-inset-bottom))]',
		className
	)}
>
	<!-- Sticky Category Tab Bar with Scroll Indicators -->
	<div class="relative flex w-full min-w-0 shrink-0 items-center overflow-hidden border-b border-border bg-sidebar">
		{#if canScrollLeft}
			<div
				class="pointer-events-none absolute left-0 z-10 flex h-full items-center bg-gradient-to-r from-sidebar via-sidebar/90 to-transparent pr-3 pl-1 text-muted-foreground"
			>
				<ChevronLeft class="size-4" />
			</div>
		{/if}

		<div
			bind:this={tabBarEl}
			onscroll={updateScrollIndicators}
			class="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto px-3 py-2 scrollbar-none"
			role="tablist"
			aria-label="Mobile controls tabs"
		>
			{#each TABS as tab (tab.id)}
				<button
					type="button"
					role="tab"
					data-tab-id={tab.id}
					class={cn(
						'flex min-h-[44px] shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-xs font-medium transition-colors select-none',
						activeTab === tab.id
							? 'bg-primary text-primary-foreground shadow-xs'
							: 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
					)}
					onclick={() => selectTab(tab.id)}
					aria-selected={activeTab === tab.id}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		{#if canScrollRight}
			<div
				class="pointer-events-none absolute right-0 z-10 flex h-full items-center bg-gradient-to-l from-sidebar via-sidebar/90 to-transparent pr-1 pl-3 text-muted-foreground"
			>
				<ChevronRight class="size-4" />
			</div>
		{/if}
	</div>

	<!-- Native CSS Scroll-Snap Carousel Container -->
	<div
		bind:this={carouselEl}
		onscroll={handleCarouselScroll}
		class="flex h-full w-full min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth scrollbar-none"
	>
		{#each TABS as tab, index (tab.id)}
			<div
				class="h-full w-full shrink-0 snap-start snap-always overflow-y-auto px-4 py-3"
				data-slide-index={index}
			>
				{#if tab.id === 'foreground'}
					<ForegroundControls />
				{:else if tab.id === 'background'}
					<BackgroundControls />
				{:else if tab.id === 'margins'}
					<MarginControls />
				{:else if tab.id === 'border'}
					<BorderControls />
				{:else if tab.id === 'shadow'}
					<DropShadowControls />
				{:else if tab.id === 'format'}
					<FormatControls />
				{/if}
			</div>
		{/each}
	</div>
</div>
