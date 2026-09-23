<script lang="ts">
	import { setContext, tick } from 'svelte';
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

	type TabId = 'foreground' | 'background' | 'margins' | 'border' | 'shadow' | 'format';

	let activeTab = $state<TabId>('foreground');

	const TABS: Array<{ id: TabId; label: string }> = [
		{ id: 'foreground', label: 'Foreground' },
		{ id: 'background', label: 'Background' },
		{ id: 'margins', label: 'Margins' },
		{ id: 'border', label: 'Border' },
		{ id: 'shadow', label: 'Drop Shadow' },
		{ id: 'format', label: 'Format' }
	];

	let tabBarEl = $state<HTMLElement | null>(null);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	function updateScrollIndicators() {
		if (!tabBarEl) return;
		canScrollLeft = tabBarEl.scrollLeft > 2;
		canScrollRight = tabBarEl.scrollLeft + tabBarEl.clientWidth < tabBarEl.scrollWidth - 2;
	}

	function selectTab(id: TabId) {
		activeTab = id;
		void tick().then(() => {
			const activeBtn = tabBarEl?.querySelector(`[data-tab-id="${id}"]`);
			activeBtn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
			updateScrollIndicators();
		});
	}

	$effect(() => {
		updateScrollIndicators();
		const handleResize = () => updateScrollIndicators();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	let touchStartX = 0;
	let touchStartY = 0;
	let touchStartTime = 0;
	let touchStartedOnInteractive = false;

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		const target = e.target as HTMLElement | null;
		touchStartedOnInteractive = Boolean(
			target?.closest(
				'input, button, select, [role="slider"], [role="tab"], .slider-composite-input'
			)
		);
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		touchStartTime = Date.now();
	}

	function handleTouchEnd(e: TouchEvent) {
		if (touchStartedOnInteractive || e.changedTouches.length !== 1) return;
		const deltaX = e.changedTouches[0].clientX - touchStartX;
		const deltaY = e.changedTouches[0].clientY - touchStartY;
		const duration = Date.now() - touchStartTime;

		if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && duration < 500) {
			const currentIndex = TABS.findIndex((t) => t.id === activeTab);
			if (deltaX < 0 && currentIndex < TABS.length - 1) {
				selectTab(TABS[currentIndex + 1].id);
			} else if (deltaX > 0 && currentIndex > 0) {
				selectTab(TABS[currentIndex - 1].id);
			}
		}
	}
</script>

<div
	class={cn(
		'flex flex-col overflow-hidden border-t border-border bg-sidebar pb-[max(0.75rem,env(safe-area-inset-bottom))]',
		className
	)}
>
	<!-- Sticky Category Tab Bar with Scroll Indicators -->
	<div class="relative flex shrink-0 items-center border-b border-border bg-sidebar">
		{#if canScrollLeft}
			<div
				class="pointer-events-none absolute left-0 z-10 flex h-full items-center bg-gradient-to-r from-sidebar via-sidebar/80 to-transparent pr-3 pl-1 text-muted-foreground"
			>
				<ChevronLeft class="size-3.5" />
			</div>
		{/if}

		<div
			bind:this={tabBarEl}
			onscroll={updateScrollIndicators}
			class="flex shrink-0 scrollbar-none items-center gap-1.5 overflow-x-auto px-3 py-2"
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
				class="pointer-events-none absolute right-0 z-10 flex h-full items-center bg-gradient-to-l from-sidebar via-sidebar/80 to-transparent pr-1 pl-3 text-muted-foreground"
			>
				<ChevronRight class="size-3.5" />
			</div>
		{/if}
	</div>

	<!-- Scrollable Active Panel with Empty Space Swipe Navigation -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="min-h-0 flex-1 touch-pan-y overflow-y-auto px-4 py-3"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
	>
		{#if activeTab === 'foreground'}
			<ForegroundControls />
		{:else if activeTab === 'background'}
			<BackgroundControls />
		{:else if activeTab === 'margins'}
			<MarginControls />
		{:else if activeTab === 'border'}
			<BorderControls />
		{:else if activeTab === 'shadow'}
			<DropShadowControls />
		{:else if activeTab === 'format'}
			<FormatControls />
		{/if}
	</div>
</div>
