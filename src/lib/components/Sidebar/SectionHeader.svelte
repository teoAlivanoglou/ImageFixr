<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { ChevronDown } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		title,
		hasSwitch = false,
		enabled = $bindable(false),
		isCollapsed = $bindable(false),
		onEnableChange = () => {},
		children
	}: {
		title: string;
		hasSwitch?: boolean;
		enabled?: boolean;
		isCollapsed?: boolean;
		onEnableChange?: () => void;
		children?: Snippet;
	} = $props();

	function handleLabelClick() {
		if (hasSwitch && !enabled) {
			enabled = true;
			isCollapsed = false;
			onEnableChange();
		} else {
			isCollapsed = !isCollapsed;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleLabelClick();
		}
	}
</script>

<div class="relative mt-1 flex h-7 items-center justify-between gap-2 text-xs transition-colors">
	<!-- Absolute Clickable Area -->
	<button
		type="button"
		class="peer absolute -inset-x-1 inset-y-0 z-0 cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
		onclick={handleLabelClick}
		aria-label={`Toggle ${title} section`}
		tabindex="0"
	></button>

	{#if hasSwitch}
		<div
			class={cn(
				'pointer-events-none relative z-10 flex items-center gap-2 transition-colors',
				enabled ? 'text-muted-foreground peer-hover:text-foreground' : 'text-muted-foreground/45'
			)}
		>
			<div class="pointer-events-auto flex items-center">
				<Switch
					id={`enable-${title.toLowerCase().replace(/\s+/g, '-')}`}
					size="sm"
					bind:checked={enabled}
					onCheckedChange={onEnableChange}
					aria-label={`Toggle ${title}`}
				/>
			</div>
			<span class="select-none text-[11px] font-medium tracking-wider uppercase">
				{title}
			</span>
		</div>
	{:else}
		<span
			class="pointer-events-none relative z-10 select-none text-[11px] font-medium tracking-wider text-muted-foreground uppercase transition-colors peer-hover:text-foreground"
		>
			{title}
		</span>
	{/if}

	<!-- Divider Line -->
	<div
		class="pointer-events-none relative z-10 h-px flex-1 bg-border/40 transition-colors peer-hover:bg-border/80"
	></div>

	<!-- Pill Buttons -->
	{#if (!hasSwitch || enabled) && !isCollapsed}
		<div class="pointer-events-auto relative z-10 flex items-center">
			{@render children?.()}
		</div>
	{/if}

	<!-- Chevron -->
	<div
		class="pointer-events-none relative z-10 ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground/60 transition-colors peer-hover:text-foreground"
	>
		<ChevronDown
			class={cn('h-3.5 w-3.5 transition-transform duration-200', isCollapsed && '-rotate-90')}
		/>
	</div>
</div>
