<script lang="ts">
	import './app.css';
	import Sidebar from '$lib/Sidebar.svelte';
	import Viewport from '$lib/Viewport.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	let viewportRef = $state<Viewport>();
</script>

<div class="grid h-dvh w-screen grid-cols-[320px_minmax(0,1fr)] grid-rows-[auto_1fr]">
	<Navbar onExport={() => viewportRef?.renderAndSave()} />
	<Sidebar />
	<Viewport bind:this={viewportRef} />
</div>
