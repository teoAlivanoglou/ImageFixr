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
		onSelect: (file: File, handle?: FileSystemFileHandle) => void;
		onRemove: () => void;
		class?: string;
	} = $props();

	let fileInputRef = $state<HTMLInputElement | null>(null);
	let isDragging = $state(false);
	const hasImage = $derived(Boolean(fileName));

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		let handle: FileSystemFileHandle | undefined;
		const item = e.dataTransfer?.items?.[0];
		if (item && 'getAsFileSystemHandle' in item) {
			try {
				const droppedHandle = await (
					item as unknown as { getAsFileSystemHandle: () => Promise<FileSystemHandle | null> }
				).getAsFileSystemHandle();
				if (droppedHandle && droppedHandle.kind === 'file') {
					handle = droppedHandle as FileSystemFileHandle;
				}
			} catch {
				// Fallback to standard File
			}
		}

		const file = handle ? await handle.getFile() : e.dataTransfer?.files?.[0];
		if (file) void onSelect(file, handle);
	}

	async function openFilePicker() {
		const showOpenFilePicker = (
			window as unknown as {
				showOpenFilePicker?: (options: {
					types: Array<{
						description: string;
						accept: Record<string, string[]>;
					}>;
					multiple?: boolean;
				}) => Promise<FileSystemFileHandle[]>;
			}
		).showOpenFilePicker;

		if (showOpenFilePicker) {
			try {
				const handles = await showOpenFilePicker({
					types: [
						{
							description: 'Images',
							accept: {
								'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif', '.bmp']
							}
						}
					],
					multiple: false
				});
				const handle = handles?.[0];
				if (!handle) return;
				const file = await handle.getFile();
				void onSelect(file, handle);
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') return;
				// Fall through to native input click if open file picker fails
			}
		}

		fileInputRef?.click();
	}

	function handleClick() {
		void openFilePicker();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			void openFilePicker();
		}
	}

	function handleFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) void onSelect(file);
		input.value = '';
	}
</script>

{#if hasImage}
	<div class={cn('flex items-center gap-2', className)}>
		{#if label}
			<Label class="shrink-0 font-light text-foreground">{label}</Label>
		{/if}

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			role="button"
			tabindex="0"
			class={cn(
				'group relative flex h-8 flex-1 min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background/50 px-2.5 py-1 text-xs transition-colors hover:border-ring hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden',
				isDragging && 'border-ring bg-muted ring-1 ring-ring'
			)}
			onclick={handleClick}
			onkeydown={handleKeydown}
			ondragover={handleDragOver}
			ondragleave={() => (isDragging = false)}
			ondrop={handleDrop}
		>
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
	</div>
{:else}
	<!-- Empty State: Centered Dashed Dropzone -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="button"
		tabindex="0"
		class={cn(
			'group relative flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-sidebar-border/80 bg-muted/20 p-4 text-center transition-colors hover:border-ring/80 hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden',
			isDragging && 'border-ring bg-muted/60 ring-1 ring-ring/40',
			className
		)}
		onclick={handleClick}
		onkeydown={handleKeydown}
		ondragover={handleDragOver}
		ondragleave={() => (isDragging = false)}
		ondrop={handleDrop}
	>
		<span class="text-xs font-medium text-foreground transition-colors group-hover:text-foreground">
			{placeholder}
		</span>
		<span class="text-[11px] text-muted-foreground transition-colors">
			Drag & drop or click to browse
		</span>
	</div>
{/if}

<Input
	bind:ref={fileInputRef}
	type="file"
	accept="image/*"
	class="sr-only"
	onchange={handleFileChange}
/>
