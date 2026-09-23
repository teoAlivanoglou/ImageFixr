<script lang="ts">
	import type { Component } from 'svelte';
	import ForegroundControls from './Sidebar/ForegroundControls.svelte';
	import BackgroundControls from './Sidebar/BackgroundControls.svelte';
	import MarginControls from './Sidebar/MarginControls.svelte';
	import BorderControls from './Sidebar/BorderControls.svelte';
	import DropShadowControls from './Sidebar/DropShadowControls.svelte';
	import FormatControls from './Sidebar/FormatControls.svelte';
	import {
		Image as ImageIcon,
		Palette,
		Move,
		Square,
		Layers,
		SlidersHorizontal
	} from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	type TabId = 'image' | 'backdrop' | 'margins' | 'border' | 'shadow' | 'format';

	let activeTab = $state<TabId>('image');

	const TABS: Array<{ id: TabId; label: string; icon: Component<any> }> = [
		{ id: 'image', label: 'Image', icon: ImageIcon },
		{ id: 'backdrop', label: 'Backdrop', icon: Palette },
		{ id: 'margins', label: 'Margins', icon: Move },
		{ id: 'border', label: 'Border', icon: Square },
		{ id: 'shadow', label: 'Shadow', icon: Layers },
		{ id: 'format', label: 'Format', icon: SlidersHorizontal }
	];
</script>

<div
	class={cn(
		'flex flex-col overflow-hidden border-t border-border bg-sidebar pb-[max(0.75rem,env(safe-area-inset-bottom))]',
		className
	)}
>
	<!-- Sticky Category Tab Bar -->
	<div
		class="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-sidebar px-3 py-2 scrollbar-none"
		role="tablist"
		aria-label="Mobile controls tabs"
	>
		{#each TABS as tab (tab.id)}
			{@const Icon = tab.icon}
			<button
				type="button"
				role="tab"
				class={cn(
					'flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors select-none',
					activeTab === tab.id
						? 'bg-primary text-primary-foreground shadow-xs'
						: 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
				)}
				onclick={() => (activeTab = tab.id)}
				aria-selected={activeTab === tab.id}
			>
				<Icon class="size-3.5" />
				<span>{tab.label}</span>
			</button>
		{/each}
	</div>

	<!-- Scrollable Active Panel -->
	<div class="touch-pan-y flex-1 min-h-0 overflow-y-auto px-4 py-3">
		{#if activeTab === 'image'}
			<ForegroundControls />
		{:else if activeTab === 'backdrop'}
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
