<script lang="ts">
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { theme, history, commitHistory, media } from '$lib/state.svelte';
	import { saveImageStorage, deleteImageStorage } from '$lib/image-db';
	import BackgroundControls from './components/Sidebar/BackgroundControls.svelte';
	import ForegroundControls from './components/Sidebar/ForegroundControls.svelte';
	import ImageDropzone from './components/Sidebar/ImageDropzone.svelte';
	import CanvasControls from './components/Sidebar/CanvasControls.svelte';

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
	class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-r border-sidebar-border bg-sidebar p-6 [&_label]:text-sm! [&_label,span]:font-light!"
>
	<BackgroundControls />
	<Separator />
	<ForegroundControls />
	<Separator />
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

	<!-- Background Dropzone -->
	<ImageDropzone
		label="Background"
		fileName={media.current.bgName}
		placeholder={media.current.fgName ? 'Using foreground' : 'Uses foreground if empty'}
		onSelect={(file) => handleFileSelect(file, 'background')}
		onRemove={() => removeImage('background')}
	/>
	<!-- </div> -->
</aside>
