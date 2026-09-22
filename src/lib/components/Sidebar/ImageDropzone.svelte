<script lang="ts">
	import { Trash } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
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
	let pillWidth = $state(0);
	const hasImage = $derived(Boolean(fileName));

	let measureCanvas: HTMLCanvasElement | null = null;

	function getTextWidth(text: string): number {
		if (typeof document === 'undefined') return text.length * 7;
		if (!measureCanvas) {
			measureCanvas = document.createElement('canvas');
		}
		const ctx = measureCanvas.getContext('2d');
		if (!ctx) return text.length * 7;
		ctx.font = '12px "Inter Variable", Inter, sans-serif';
		return ctx.measureText(text).width;
	}

	function snapDelimiter(str: string, index: number, direction: 'left' | 'right', maxSnap = 7): number {
		const delimiters = ['-', '_', ' ', '.'];
		if (direction === 'left') {
			for (let i = index - 1; i >= Math.max(1, index - maxSnap); i--) {
				if (delimiters.includes(str[i])) return i;
			}
		} else {
			for (let i = index; i <= Math.min(str.length - 1, index + maxSnap); i++) {
				if (delimiters.includes(str[i])) return i + 1;
			}
		}
		return index;
	}

	function fitSmartMiddleElided(name: string, maxWidth: number): string {
		if (!name) return '';
		if (maxWidth <= 0 || getTextWidth(name) <= maxWidth) return name;

		const lastDot = name.lastIndexOf('.');
		const hasExt = lastDot > 0 && lastDot > name.length - 8;
		const ext = hasExt ? name.slice(lastDot) : '';
		const base = hasExt ? name.slice(0, lastDot) : name;

		let low = 2;
		let high = base.length;
		let best = name;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const rawStart = Math.ceil(mid * 0.6);
			const rawEnd = mid - rawStart;

			const startLen = snapDelimiter(base, rawStart, 'left', 7);
			const endLen = base.length - snapDelimiter(base, base.length - rawEnd, 'right', 7);

			const prefix = base.slice(0, Math.max(1, startLen)).replace(/[-_.\s]+$/, '');
			const suffix = base.slice(-Math.max(1, endLen)).replace(/^[-_.\s]+/, '');
			const candidate = `${prefix}…${suffix}${ext}`;

			if (getTextWidth(candidate) <= maxWidth) {
				best = candidate;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}

		return best;
	}

	const displayFileName = $derived.by(() => {
		if (!fileName) return '';
		if (pillWidth <= 0) return fileName;
		const availableWidth = Math.max(20, pillWidth - 54);
		return fitSmartMiddleElided(fileName, availableWidth);
	});

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
	<div class={cn('flex items-center gap-4', className)}>
		{#if label}
			<Label class="shrink-0 font-light text-foreground">{label}</Label>
		{/if}

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:clientWidth={pillWidth}
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
				{displayFileName}
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
