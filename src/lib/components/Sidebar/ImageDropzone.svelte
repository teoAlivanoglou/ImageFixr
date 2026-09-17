<script lang="ts">
	import { Trash } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { ellipsizeMiddle } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let {
		label = 'Image',
		fileName = '',
		placeholder = 'Drop or choose an image',
		onSelect,
		onRemove,
		class: className
	}: {
		label?: string;
		fileName?: string;
		placeholder?: string;
		onSelect: (file: File) => void;
		onRemove: () => void;
		class?: string;
	} = $props();

	let fileInputRef = $state<HTMLInputElement | null>(null);
	let isDragging = $state(false);
	const hasImage = $derived(Boolean(fileName));
</script>

{#if hasImage}
	<!-- Compact single-line row when an image is loaded -->
	<div
		role="button"
		tabindex="0"
		class:dragging={isDragging}
		class={cn(
			'group relative -mx-2.5 flex h-8 w-[calc(100%+1.25rem)] cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background/50 px-2.5 py-1 text-xs transition-colors hover:border-ring hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden',
			isDragging && 'border-ring bg-muted ring-1 ring-ring',
			className
		)}
		onclick={() => fileInputRef?.click()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				fileInputRef?.click();
			}
		}}
		ondragover={(e) => {
			e.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => (isDragging = false)}
		ondrop={(e) => {
			e.preventDefault();
			isDragging = false;
			const file = e.dataTransfer?.files[0];
			if (file) void onSelect(file);
		}}
	>
		{#if label}
			<Label class="pointer-events-none shrink-0 font-light text-foreground">{label}</Label>
		{/if}

		<div class="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-hidden">
			<span
				class="truncate text-xs text-muted-foreground transition-colors group-hover:text-foreground"
				title={fileName}
			>
				{ellipsizeMiddle(fileName, 24)}
			</span>

			<button
				type="button"
				aria-label="Remove image"
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onRemove();
				}}
				class="flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
			>
				<Trash size={13} />
			</button>
		</div>

		<Input
			bind:ref={fileInputRef}
			type="file"
			accept="image/*"
			class="sr-only"
			onchange={(e) => {
				const input = e.currentTarget as HTMLInputElement;
				const file = input.files?.[0];
				if (file) void onSelect(file);
				input.value = '';
			}}
		/>
	</div>
{:else}
	<!-- Taller dropzone text when empty (no icon) -->
	<div
		role="button"
		tabindex="0"
		class:dragging={isDragging}
		class={cn(
			'group relative flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-sidebar-border/80 bg-muted/20 p-4 text-center transition-colors hover:border-ring/80 hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden',
			isDragging && 'border-ring bg-muted/60 ring-1 ring-ring/40',
			className
		)}
		onclick={() => fileInputRef?.click()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				fileInputRef?.click();
			}
		}}
		ondragover={(e) => {
			e.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => (isDragging = false)}
		ondrop={(e) => {
			e.preventDefault();
			isDragging = false;
			const file = e.dataTransfer?.files[0];
			if (file) void onSelect(file);
		}}
	>
		<span class="text-xs font-medium text-foreground transition-colors group-hover:text-foreground">
			{placeholder}
		</span>
		<span class="text-[11px] text-muted-foreground transition-colors">
			Drag & drop or click to browse
		</span>

		<Input
			bind:ref={fileInputRef}
			type="file"
			accept="image/*"
			class="sr-only"
			onchange={(e) => {
				const input = e.currentTarget as HTMLInputElement;
				const file = input.files?.[0];
				if (file) void onSelect(file);
				input.value = '';
			}}
		/>
	</div>
{/if}
