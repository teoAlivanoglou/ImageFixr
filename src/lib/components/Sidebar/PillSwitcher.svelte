<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Component } from 'svelte';
	import { useHeaderPillGroup } from './header-pill-group.svelte';

	export type PillOption = {
		value: string;
		label?: string;
		icon?: Component;
		title?: string;
	};

	let {
		options,
		value = $bindable(),
		onChange,
		buttonClass,
		iconSize = 11,
		iconClass,
		fullWidth = false,
		class: className
	}: {
		options: PillOption[];
		value: string;
		onChange?: (value: string) => void;
		buttonClass?: string;
		iconSize?: number;
		iconClass?: string;
		fullWidth?: boolean;
		class?: string;
	} = $props();

	const group = useHeaderPillGroup();
	const activeIndex = $derived(options.findIndex((o) => o.value === value));

	const widthClass = $derived(
		group
			? fullWidth
				? group.shouldWrap
					? 'w-full'
					: 'w-auto'
				: 'w-fit'
			: fullWidth
				? 'w-full @[480px]:w-auto'
				: 'w-fit'
	);
</script>

<div
	data-pill-switcher
	class={cn(
		'relative inline-grid h-6 shrink-0 items-center rounded-md border border-input bg-muted/40 p-0.5 text-xs',
		widthClass,
		className
	)}
	style={`grid-template-columns: repeat(${options.length}, 1fr);`}
>
	<!-- Animated sliding indicator -->
	<div
		class="absolute inset-y-0.5 left-0.5 rounded bg-background shadow-xs transition-transform duration-200 ease-out"
		style={`width: calc((100% - 4px) / ${options.length}); transform: translateX(${activeIndex * 100}%);`}
	></div>

	{#each options as option}
		{@const Icon = option.icon}
		<button
			type="button"
			class={cn(
				'relative z-10 flex h-5 min-w-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded px-1.5 sm:px-2 text-center text-[11px] leading-none font-medium transition-colors duration-150 select-none',
				value === option.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
				buttonClass
			)}
			title={option.title || option.label}
			onclick={() => {
				value = option.value;
				onChange?.(option.value);
			}}
		>
			{#if Icon}
				<Icon size={iconSize} class={cn('size-2.5 shrink-0', iconClass)} />
			{/if}
			{#if option.label}
				<span class="truncate">{option.label}</span>
			{/if}
		</button>
	{/each}
</div>
