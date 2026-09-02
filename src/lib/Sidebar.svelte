<script lang="ts">
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { theme, history, commitHistory, media } from '$lib/state.svelte';
	import { saveImageStorage, deleteImageStorage } from '$lib/image-db';
	import BackgroundControls from './components/Sidebar/BackgroundControls.svelte';
	import ForegroundControls from './components/Sidebar/ForegroundControls.svelte';
	import ImageDropzone from './components/Sidebar/ImageDropzone.svelte';
	import CanvasControls from './components/Sidebar/CanvasControls.svelte';
	import { cn } from '$lib/utils';
	import Button from './components/ui/button/button.svelte';
	import { Link2, Link2Off } from '@lucide/svelte';

	let { class: className }: { class?: string } = $props();

	let hasForeground = $derived(Boolean(media.current.fgName));
	let hasBackground = $derived(
		media.current.link ? Boolean(media.current.fgName) : Boolean(media.current.bgName)
	);

	$effect(() => {
		document.documentElement.classList.toggle('dark', theme.current);
	});

	async function handleFileSelect(file: File, target: 'foreground' | 'background') {
		if (!file.type.startsWith('image/')) return;

		await saveImageStorage(target, file);

		if (target === 'foreground') {
			media.current = {
				...media.current,
				fgName: file.name,
				fgVersion: Date.now()
			};
		} else {
			media.current = {
				...media.current,
				bgName: file.name,
				bgVersion: Date.now()
			};
		}
	}

	function removeImage(target: 'foreground' | 'background') {
		void deleteImageStorage(target);

		if (target === 'foreground') {
			media.current = {
				...media.current,
				fgName: '',
				fgVersion: Date.now()
			};
		} else {
			media.current = {
				...media.current,
				bgName: '',
				bgVersion: Date.now()
			};
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
			if (event.shiftKey) {
				if (history?.canRedo) {
					event.preventDefault();
					history.redo();
				}
			} else {
				if (history?.canUndo) {
					event.preventDefault();
					history.undo();
				}
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onpointerup={commitHistory} />

<aside
	class={cn(
		'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-r border-sidebar-border bg-sidebar p-6 [&_label]:text-sm! [&_label,span]:font-light!',
		className
	)}
>
	{#if hasBackground}
		<BackgroundControls />
		<Separator />
	{/if}
	{#if hasForeground}
		<ForegroundControls />
		<Separator />
	{/if}
	<CanvasControls />
	<Separator class="mt-auto" />

	<!-- <div class="grid gap-3 px-8 pt-6 pb-4"> -->
	<!-- Foreground Dropzone -->
	<ImageDropzone
		label="Foreground"
		fileName={media.current.fgName}
		placeholder="Drop or choose an image"
		onSelect={(file) => handleFileSelect(file, 'foreground')}
		onRemove={() => removeImage('foreground')}
	/>

	<Button
		variant="ghost"
		size="default"
		class="-my-3! self-center"
		onclick={() => (media.current.link = !media.current.link)}
	>
		{#if media.current.link}
			<Link2 class="rotate-90" />
		{:else}
			<Link2Off class="rotate-90" />
		{/if}
	</Button>
	<!-- Background Dropzone -->
	<ImageDropzone
		label="Background"
		fileName={media.current.link ? '' : media.current.bgName}
		placeholder={media.current.link ? 'Using foreground image' : 'Drop or choose an image'}
		onSelect={(file) => {
			media.current.link = false;
			handleFileSelect(file, 'background');
		}}
		onRemove={() => removeImage('background')}
	/>
	<!-- </div> -->
</aside>
