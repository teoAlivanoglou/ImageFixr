<script lang="ts">
	import { Trash, Pin, PinOff } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import * as m from '$paraglide/messages.js';

	let {
		label,
		fileName = '',
		placeholder,
		persist = false,
		onTogglePersist,
		onSelect,
		onRemove,
		class: className
	}: {
		label?: string;
		fileName?: string;
		placeholder?: string;
		persist?: boolean;
		onTogglePersist?: () => void;
		onSelect: (file: File, handle?: FileSystemFileHandle) => void;
		onRemove: () => void;
		class?: string;
	} = $props();

	let resolvedLabel = $derived(label ?? m.control_image());
	let resolvedPlaceholder = $derived(placeholder ?? m.dropzone_placeholder());

	let fileInputRef = $state<HTMLInputElement | null>(null);
	let isDragging = $state(false);
	let pillWidth = $state(0);
	let buttonsWidth = $state(0);
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

	function splitFileName(name: string): { base: string; ext: string } {
		const lastDot = name.lastIndexOf('.');
		const hasExt = lastDot > 0 && lastDot > name.length - 8;
		return {
			base: hasExt ? name.slice(0, lastDot) : name,
			ext: hasExt ? name.slice(lastDot) : ''
		};
	}

	function getSmartPrefix(str: string, targetLen: number, maxSnap = 5): string {
		const endIdx = Math.min(str.length - 1, Math.max(1, targetLen));
		const delimiters = ['-', '_', ' ', '.'];
		let bestIdx = endIdx;

		for (let i = endIdx; i >= Math.max(1, endIdx - maxSnap); i--) {
			if (delimiters.includes(str[i])) {
				bestIdx = i;
				break;
			}
		}

		const slice = str.slice(0, bestIdx).replace(/[-_.\s]+$/, '');
		return slice || str.slice(0, Math.max(1, targetLen));
	}

	function getSmartSuffix(str: string, targetLen: number, maxSnap = 5): string {
		const startIdx = Math.max(1, str.length - Math.max(1, targetLen));
		const delimiters = ['-', '_', ' ', '.'];
		let bestIdx = startIdx;

		for (let i = startIdx; i <= Math.min(str.length - 2, startIdx + maxSnap); i++) {
			if (delimiters.includes(str[i])) {
				bestIdx = i + 1;
				break;
			}
		}

		const slice = str.slice(bestIdx).replace(/^[-_.\s]+/, '');
		return slice || str.slice(-Math.max(1, targetLen));
	}

	function fitSmartMiddleElided(base: string, maxWidth: number): string {
		if (!base) return '';
		if (maxWidth <= 0) return base.slice(0, 1) + '…';
		if (getTextWidth(base) <= maxWidth) return base;

		const ellipsis = '…';
		const ellipsisWidth = getTextWidth(ellipsis);
		const availableForChars = maxWidth - ellipsisWidth;
		if (availableForChars <= 0) return ellipsis;

		let low = 2;
		let high = base.length - 1;
		let best = base.slice(0, 1) + '…';

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const rawStart = Math.ceil(mid * 0.55);
			const rawEnd = mid - rawStart;

			const prefix = getSmartPrefix(base, rawStart, 5);
			const suffix = getSmartSuffix(base, rawEnd, 5);
			const candidate = `${prefix}…${suffix}`;

			if (getTextWidth(candidate) <= maxWidth) {
				best = candidate;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}

		return best;
	}

	let fileParts = $derived(splitFileName(fileName));

	let availableBaseWidth = $derived.by(() => {
		if (!fileName) return 0;
		if (pillWidth <= 0) return 9999;
		const extWidth = fileParts.ext ? getTextWidth(fileParts.ext) : 0;
		const totalAvailable = Math.max(20, pillWidth - (buttonsWidth || 48) - 34);
		return Math.max(10, totalAvailable - extWidth);
	});

	let displayBase = $derived.by(() => {
		if (!fileParts.base) return '';
		return fitSmartMiddleElided(fileParts.base, availableBaseWidth);
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
		{#if resolvedLabel}
			<Label class="shrink-0 font-light text-foreground">{resolvedLabel}</Label>
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
				class="flex min-w-0 max-w-full items-center text-xs text-muted-foreground transition-colors group-hover:text-foreground overflow-hidden"
				title={fileName}
			>
				<span class="overflow-hidden whitespace-nowrap">{displayBase}</span>
				{#if fileParts.ext}
					<span class="shrink-0">{fileParts.ext}</span>
				{/if}
			</span>

			<div bind:clientWidth={buttonsWidth} class="flex shrink-0 items-center gap-1">
				<button
					type="button"
					aria-label={persist ? m.dropzone_pin_pinned() : m.dropzone_pin_unpinned()}
					title={persist ? m.dropzone_pin_pinned() : m.dropzone_pin_unpinned()}
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onTogglePersist?.();
					}}
					class={cn(
						'flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 transition-colors',
						persist
							? 'text-primary hover:text-primary/80'
							: 'text-muted-foreground/50 hover:text-foreground'
					)}
				>
					{#if persist}
						<Pin size={13} class="fill-current" />
					{:else}
						<PinOff size={13} />
					{/if}
				</button>

				<button
					type="button"
					aria-label={m.dropzone_remove()}
					title={m.dropzone_remove()}
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
		<button
			type="button"
			aria-label={persist ? m.dropzone_pin_pinned() : m.dropzone_pin_unpinned()}
			title={persist ? m.dropzone_pin_pinned() : m.dropzone_pin_unpinned()}
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onTogglePersist?.();
			}}
			class={cn(
				'absolute top-2 right-2 flex shrink-0 cursor-pointer items-center justify-center rounded p-1 transition-colors',
				persist
					? 'text-primary hover:text-primary/80'
					: 'text-muted-foreground/40 hover:text-foreground'
			)}
		>
			{#if persist}
				<Pin size={13} class="fill-current" />
			{:else}
				<PinOff size={13} />
			{/if}
		</button>
		<span class="text-xs font-medium text-foreground transition-colors group-hover:text-foreground">
			{resolvedPlaceholder}
		</span>
		<span class="text-[11px] text-muted-foreground transition-colors">
			{m.dropzone_subtext()}
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
