<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { ChevronDown } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { getContext, type Snippet } from 'svelte';
	import { useHeaderPillGroup } from './header-pill-group.svelte';

	const contextCollapsible = getContext<boolean | undefined>('collapsible');
	const headerPillGroup = useHeaderPillGroup();
	const sectionId = Math.random().toString(36).substring(2, 9);
	let probeEl = $state<HTMLElement | null>(null);

	$effect(() => {
		if (headerPillGroup && probeEl && children) {
			const reg = headerPillGroup.register(sectionId, probeEl);
			return () => reg.destroy();
		}
	});

	let isGrouped = $derived(Boolean(headerPillGroup));
	let shouldWrap = $derived(headerPillGroup ? headerPillGroup.shouldWrap : false);

	let {
		title,
		hasSwitch = false,
		enabled = $bindable(false),
		isCollapsed = $bindable(false),
		collapsible = contextCollapsible ?? true,
		onEnableChange = () => {},
		children
	}: {
		title: string;
		hasSwitch?: boolean;
		enabled?: boolean;
		isCollapsed?: boolean;
		collapsible?: boolean;
		onEnableChange?: () => void;
		children?: Snippet;
	} = $props();

	function handleLabelClick() {
		if (!collapsible) {
			if (hasSwitch) {
				enabled = !enabled;
				onEnableChange();
			}
			return;
		}

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

<div class="relative mt-1 flex flex-col text-xs transition-colors">
	<!-- Row 1: Header Bar -->
	<div class="relative flex h-7 flex-nowrap items-center justify-between gap-2 overflow-hidden">
		<!-- Absolute Clickable Area -->
		<button
			type="button"
			class="peer absolute -inset-x-1 inset-y-0 z-0 cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
			onclick={handleLabelClick}
			onkeydown={handleKeydown}
			aria-label={`Toggle ${title} section`}
			tabindex="0"
		></button>

		{#if hasSwitch}
			<div
				class={cn(
					'pointer-events-none relative z-10 flex min-w-0 shrink items-center gap-2 transition-colors',
					enabled ? 'text-muted-foreground peer-hover:text-foreground' : 'text-muted-foreground/45'
				)}
			>
				<div class="pointer-events-auto flex shrink-0 items-center">
					<Switch
						id={`enable-${title.toLowerCase().replace(/\s+/g, '-')}`}
						size="sm"
						bind:checked={enabled}
						onCheckedChange={onEnableChange}
						aria-label={`Toggle ${title}`}
					/>
				</div>
				<span class="truncate text-[11px] font-medium tracking-wider uppercase select-none whitespace-nowrap">
					{title}
				</span>
			</div>
		{:else}
			<span
				class="pointer-events-none relative z-10 truncate text-[11px] font-medium tracking-wider text-muted-foreground uppercase transition-colors select-none peer-hover:text-foreground whitespace-nowrap"
			>
				{title}
			</span>
		{/if}

		<!-- Divider Line -->
		<div
			class="pointer-events-none relative z-10 h-px min-w-2 flex-1 bg-border/40 transition-colors peer-hover:bg-border/80"
		></div>

		<!-- Pill Buttons (Desktop/Wide: inline) -->
		{#if (!hasSwitch || enabled) && (!collapsible || !isCollapsed) && children}
			<div
				class={cn(
					'pointer-events-auto relative z-10 shrink-0 items-center',
					isGrouped ? (shouldWrap ? 'hidden' : 'flex') : 'hidden @[480px]:flex'
				)}
			>
				{@render children()}
			</div>
		{/if}

		<!-- Chevron -->
		{#if collapsible}
			<div
				class="pointer-events-none relative z-10 ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground/60 transition-colors peer-hover:text-foreground"
			>
				<ChevronDown
					class={cn('h-3.5 w-3.5 transition-transform duration-200', isCollapsed && '-rotate-90')}
				/>
			</div>
		{/if}
	</div>

	<!-- Pill Buttons (Narrow/Standard: dedicated full-width row) -->
	{#if (!hasSwitch || enabled) && (!collapsible || !isCollapsed) && children}
		<div
			class={cn(
				'pointer-events-auto relative z-10 mt-1.5 w-full items-center',
				isGrouped ? (shouldWrap ? 'flex' : 'hidden') : 'flex @[480px]:hidden'
			)}
		>
			{@render children()}
		</div>
	{/if}
</div>

{#if children}
	<!-- Off-screen measurement probe: measures the unconstrained single-line width of this section's header + pills in current locale -->
	<div
		bind:this={probeEl}
		aria-hidden="true"
		inert
		class="pointer-events-none fixed -left-[9999px] top-0 -z-50 flex h-7 flex-nowrap items-center gap-2 whitespace-nowrap text-xs opacity-0 select-none"
	>
		{#if hasSwitch}
			<div class="flex items-center gap-2">
				<div class="h-4 w-7 shrink-0"></div>
				<span class="text-[11px] font-medium tracking-wider uppercase whitespace-nowrap">{title}</span>
			</div>
		{:else}
			<span class="text-[11px] font-medium tracking-wider uppercase whitespace-nowrap">{title}</span>
		{/if}

		<div class="w-4 shrink-0"></div>

		<div class="flex shrink-0 items-center [&_[data-pill-switcher]]:w-auto!">
			{@render children()}
		</div>

		{#if collapsible}
			<div class="ml-1 h-5 w-5 shrink-0"></div>
		{/if}
	</div>
{/if}
