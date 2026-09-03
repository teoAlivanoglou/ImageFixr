<script lang="ts">
    import { Trash } from "@lucide/svelte";
    import { Input } from "$lib/components/ui/input";
    import { ellipsizeMiddle } from "$lib/state.svelte";
    import { cn } from "$lib/utils";

    let {
        label,
        fileName = "",
        placeholder = "Drop or choose an image",
        onSelect,
        onRemove,
        class: className,
    }: {
        label: string;
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

<div
    role="button"
    tabindex="0"
    class:dragging={isDragging}
    class={cn(
        "relative flex min-h-18 cursor-pointer flex-col justify-center gap-1 rounded-md border border-dashed border-sidebar-border p-3 transition-colors hover:border-ring hover:bg-muted focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
        isDragging && "border-ring bg-muted",
        className
    )}
    onclick={() => fileInputRef?.click()}
    onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
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
    <div class="flex items-center justify-between gap-2">
        <strong class="text-xs font-medium">{label}</strong>
        {#if hasImage}
            <button
                aria-label="Remove image"
                onclick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove();
                }}
                class="flex cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
                <Trash size={14} />
            </button>
        {/if}
    </div>

    <span
        class="text-muted-foreground truncate text-xs"
        title={hasImage ? fileName : placeholder}
    >
        {hasImage ? ellipsizeMiddle(fileName) : placeholder}
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
            input.value = "";
        }}
    />
</div>
