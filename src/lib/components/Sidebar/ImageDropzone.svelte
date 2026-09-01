<script lang="ts">
    import { Trash } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { ellipsizeMiddle } from "$lib/state.svelte";

    let {
        label,
        fileName = "",
        placeholder = "Drop or choose an image",
        onSelect,
        onRemove,
    }: {
        label: string;
        fileName?: string;
        placeholder?: string;
        onSelect: (file: File) => void;
        onRemove: () => void;
    } = $props();

    let isDragging = $state(false);
    const hasImage = $derived(Boolean(fileName));
</script>

<label
    class:dragging={isDragging}
    class={`relative flex min-h-18 cursor-pointer flex-col justify-center gap-1 rounded-md border border-dashed border-sidebar-border p-3 transition-colors hover:border-ring hover:bg-muted ${isDragging ? "border-ring bg-muted" : ""}`}
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
        <Button
            variant="ghost"
            size="icon-sm"
            class={hasImage
                ? "shrink-0"
                : "shrink-0 invisible pointer-events-none"}
            onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
            }}
        >
            <Trash size={16} />
        </Button>
    </div>

    <span
        class="text-muted-foreground truncate text-xs"
        title={hasImage ? fileName : placeholder}
    >
        {hasImage ? ellipsizeMiddle(fileName) : placeholder}
    </span>

    <Input
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
</label>
