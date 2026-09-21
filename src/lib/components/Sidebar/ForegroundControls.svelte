<script lang="ts">
	import SliderControl from './SliderControl.svelte';
	import ImageDropzone from './ImageDropzone.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import { settings, appState, media } from '$lib/state.svelte';
	import { saveImageStorage, deleteImageStorage } from '$lib/image-db';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let hasForeground = $derived(Boolean(media.current.fgName));

	async function handleFileSelect(file: File) {
		if (!file.type.startsWith('image/')) return;
		await saveImageStorage('foreground', file);
		media.current = {
			...media.current,
			fgName: file.name,
			fgVersion: Date.now()
		};
	}

	function removeImage() {
		void deleteImageStorage('foreground');
		media.current = {
			...media.current,
			fgName: '',
			fgVersion: Date.now()
		};
	}
</script>

<div class={cn('flex flex-col', className)}>
	<!-- Foreground Section Header -->
	<SectionHeader title="Foreground" bind:isCollapsed={settings.current.fgCollapsed} />

	<!-- Collapsible Section Body -->
	<div
		class={cn(
			'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
			!settings.current.fgCollapsed ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'
		)}
	>
		<div class="-mx-2.5 overflow-hidden px-2.5">
			<div class="mt-2.5 flex flex-col gap-3 pl-2.5">
				<!-- Foreground Image Dropzone (Always visible) -->
				<ImageDropzone
					label="Image"
					fileName={media.current.fgName}
					placeholder="Drop or choose an image"
					onSelect={handleFileSelect}
					onRemove={removeImage}
				/>

				<!-- Scale & Blur Controls -->
				<div
					class={cn(
						'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
						hasForeground
							? 'grid-rows-[1fr] opacity-100'
							: 'pointer-events-none grid-rows-[0fr] opacity-0'
					)}
				>
					<div class="-mx-2.5 overflow-hidden px-2.5">
						<div class="flex flex-col gap-3">
							<div class="grid w-full grid-cols-2 items-center gap-3">
								<SliderControl
									id="fg-scale"
									label="Scale"
									bind:value={settings.current.fgScale}
									min={0}
									max={2}
									step={0.01}
									defaultValue={1}
									formatValue={() => `${appState.fgActualScale.toFixed(2)}x`}
								/>

								<SliderControl
									id="fg-blur"
									label="Blur"
									bind:value={settings.current.fgBlur}
									min={0}
									max={100}
									step={1}
									defaultValue={0}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
