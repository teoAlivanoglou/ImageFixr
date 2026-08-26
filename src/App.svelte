<script lang="ts">
  import "./app.css";

  import { Moon, Sun, Trash } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Slider } from "$lib/components/ui/slider";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import {
    PixiWorkspace,
    type UploadTarget,
  } from "$lib/features/pixi-workspace";
  import {
    DARK_MODE_STORAGE_KEY,
    SETTINGS_CHANNEL_NAME,
    SETTINGS_STORAGE_KEY,
    getStoredDarkMode,
    getStoredSettings,
    normalizeSharedSettings,
    type StoredSettings,
  } from "$lib/features/settings";

  const storedSettings = getStoredSettings();

  // Svelte reactive state
  let pixiContainer = $state<HTMLElement>();
  let pixiWorkspace = $state<PixiWorkspace>();

  let blurValue = $state(storedSettings.blurValue);
  let scaleValue = $state(storedSettings.scaleValue);
  let filteringMode = $state(storedSettings.filteringMode);
  let aspectRatio = $state(storedSettings.aspectRatio);
  let darkMode = $state(getStoredDarkMode());
  let blurAmount = $derived(blurValue);
  let spriteScale = $derived(scaleValue);
  let actualBlur = $derived(blurAmount / 5);
  let actualScale = $derived(spriteScale * spriteScale);
  let aspectWidth = $derived(Number(aspectRatio.split(":")[0]));
  let aspectHeight = $derived(Number(aspectRatio.split(":")[1]));

  function toggleDarkMode() {
    darkMode = !darkMode;
    document.documentElement.classList.toggle("dark", darkMode);
  }

  function handleThemeKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleDarkMode();
    }
  }

  $effect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(darkMode));
  });

  $effect(() => {
    const settings: StoredSettings = {
      blurValue,
      scaleValue,
      filteringMode,
      aspectRatio,
    };
    sessionStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    if (!applyingSharedSettings) settingsChannel?.postMessage(settings);
    applyingSharedSettings = false;
  });

  $effect(() => {
    const handleDarkModeStorage = (event: StorageEvent) => {
      if (event.key === DARK_MODE_STORAGE_KEY && event.newValue !== null) {
        darkMode = event.newValue === "true";
      }
    };

    window.addEventListener("storage", handleDarkModeStorage);

    if (typeof BroadcastChannel === "undefined") {
      return () => window.removeEventListener("storage", handleDarkModeStorage);
    }

    settingsChannel = new BroadcastChannel(SETTINGS_CHANNEL_NAME);
    settingsChannel.onmessage = (
      event: MessageEvent<StoredSettings | "request">,
    ) => {
      if (event.data === "request") {
        settingsChannel?.postMessage({
          blurValue,
          scaleValue,
          filteringMode,
          aspectRatio,
        });
        return;
      }

      const nextSettings = normalizeSharedSettings(event.data, {
        blurValue,
        scaleValue,
        filteringMode,
        aspectRatio,
      });

      applyingSharedSettings = true;
      blurValue = nextSettings.blurValue;
      scaleValue = nextSettings.scaleValue;
      filteringMode = nextSettings.filteringMode;
      aspectRatio = nextSettings.aspectRatio;
    };

    settingsChannel.postMessage("request");
    return () => {
      window.removeEventListener("storage", handleDarkModeStorage);
      settingsChannel?.close();
      settingsChannel = undefined;
    };
  });

  let foregroundName = $state("");
  let backgroundName = $state("");
  let draggingTarget = $state<UploadTarget | null>(null);
  let displayedForegroundName = $derived(ellipsizeMiddle(foregroundName));
  let displayedBackgroundName = $derived(ellipsizeMiddle(backgroundName));
  let settingsChannel: BroadcastChannel | undefined;
  let applyingSharedSettings = false;

  function ellipsizeMiddle(value: string, maxLength = 30) {
    if (value.length <= maxLength) return value;

    const visibleLength = maxLength - 3;
    const startLength = Math.ceil(visibleLength / 2);
    const endLength = Math.floor(visibleLength / 2);

    return `${value.slice(0, startLength)}...${value.slice(-endLength)}`;
  }

  // 1. Setup and Cleanup Effect
  $effect(() => {
    if (!pixiContainer) return;

    let isDestroyed = false; // Guard flag to prevent async race conditions

    const workspace = new PixiWorkspace(pixiContainer);
    pixiWorkspace = workspace;

    (async () => {
      await workspace.init();

      if (isDestroyed) {
        workspace.destroy();

        return;
      }

      workspace.setAspectRatio(aspectRatio);
      workspace.setBlurStrength(actualBlur);
      workspace.setScale(actualScale);
      workspace.setFilteringMode(
        filteringMode === "linear" ? "linear" : "nearest",
      );
    })();

    return () => {
      isDestroyed = true;

      workspace.destroy();
      pixiWorkspace = undefined;
    };
  });

  // 2. State Synchronization Effects
  $effect(() => {
    pixiWorkspace?.setBlurStrength(actualBlur);
  });

  $effect(() => {
    pixiWorkspace?.setScale(actualScale);
  });

  $effect(() => {
    pixiWorkspace?.setAspectRatio(aspectRatio);
  });

  async function loadImage(file: File, target: UploadTarget) {
    try {
      const names = await pixiWorkspace?.loadImage(file, target);

      if (!names) return;

      foregroundName = names.foregroundName;
      backgroundName = names.backgroundName;
    } catch (error) {
      console.error("Unable to load image:", error);
    }
  }

  function handleFileInput(event: Event, target: UploadTarget) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (file?.type.startsWith("image/")) void loadImage(file, target);

    input.value = "";
  }

  function handleDrop(event: DragEvent, target: UploadTarget) {
    event.preventDefault();
    draggingTarget = null;

    const file = event.dataTransfer?.files[0];

    if (file?.type.startsWith("image/")) void loadImage(file, target);
  }

  function removeImage(target: UploadTarget) {
    const names = pixiWorkspace?.removeImage(target);

    if (!names) return;

    foregroundName = names.foregroundName;
    backgroundName = names.backgroundName;
  }

  $effect(() => {
    pixiWorkspace?.setFilteringMode(
      filteringMode === "linear" ? "linear" : "nearest",
    );
  });

  async function renderAndSave() {
    try {
      await pixiWorkspace?.renderAndSave();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      console.error("Unable to save rendered image:", error);
    }
  }
</script>

<div class="grid h-dvh w-screen grid-cols-[320px_minmax(0,1fr)]">
  <!-- Left Sidebar for UI Controls -->

  <aside
    class="bg-sidebar border-sidebar-border flex min-h-0 flex-col border-r shadow-xl"
  >
    <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-8">
      <div>
        <h1
          class="flex items-center gap-2 text-2xl leading-8 font-medium tracking-tight"
        >
          Image Manipulator
          <span
            class="inline-flex cursor-pointer text-2xl text-muted-foreground hover:text-foreground"
            role="button"
            tabindex="0"
            aria-label={darkMode ? "Use light mode" : "Use dark mode"}
            title={darkMode ? "Use light mode" : "Use dark mode"}
            onclick={toggleDarkMode}
            onkeydown={handleThemeKeydown}
          >
            {#if darkMode}
              <Sun size={22} />
            {:else}
              <Moon size={22} />
            {/if}
          </span>
        </h1>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <Label for="blur">Blur Strength</Label>
          <span class="text-muted-foreground text-xs">{blurAmount}</span>
        </div>
        <Slider
          id="blur"
          type="single"
          bind:value={blurValue}
          min={0}
          max={100}
          step={1}
        />
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <Label for="scale">Scale</Label>
          <span class="text-muted-foreground text-xs"
            >{actualScale.toFixed(1)}x</span
          >
        </div>
        <Slider
          id="scale"
          type="single"
          bind:value={scaleValue}
          min={0.1}
          max={5}
          step={0.01}
        />
      </div>

      <div class="flex flex-col gap-2">
        <Label for="filtering">Filtering</Label>
        <Select type="single" bind:value={filteringMode}>
          <SelectTrigger id="filtering" class="w-full">
            {filteringMode === "linear" ? "Linear" : "Nearest"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="nearest">Nearest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <Label for="aspect-ratio">Canvas Aspect Ratio</Label>
        <Select type="single" bind:value={aspectRatio}>
          <SelectTrigger id="aspect-ratio" class="w-full">
            {aspectRatio}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">1:1</SelectItem>
            <SelectItem value="4:3">4:3</SelectItem>
            <SelectItem value="16:9">16:9</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div
      class="border-sidebar-border flex flex-none flex-col gap-4 border-t p-8 pt-6"
    >
      <div class="grid gap-3">
        <label
          class:dragging={draggingTarget === "foreground"}
          class={`relative flex min-h-18 cursor-pointer flex-col justify-center gap-1 rounded-md border border-dashed border-sidebar-border p-3 transition-colors hover:border-ring hover:bg-muted ${draggingTarget === "foreground" ? "border-ring bg-muted" : ""}`}
          ondragover={(event) => {
            event.preventDefault();
            draggingTarget = "foreground";
          }}
          ondragleave={() => (draggingTarget = null)}
          ondrop={(event) => handleDrop(event, "foreground")}
        >
          <div class="flex items-center justify-between gap-2">
            <strong class="text-xs font-medium">Foreground</strong>

            <Button
              variant="ghost"
              size="icon-sm"
              class={foregroundName
                ? "shrink-0"
                : "shrink-0 invisible pointer-events-none"}
              aria-label="Remove foreground image"
              title="Remove foreground image"
              disabled={!foregroundName}
              onclick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                removeImage("foreground");
              }}><Trash size={16} strokeWidth={2} aria-hidden="true" /></Button
            >
          </div>

          <span
            class="text-muted-foreground truncate text-xs"
            title={foregroundName || "Drop or choose an image"}
          >
            {displayedForegroundName || "Drop or choose an image"}
          </span>

          <Input
            type="file"
            accept="image/*"
            class="sr-only"
            onchange={(event) => handleFileInput(event, "foreground")}
          />
        </label>

        <label
          class:dragging={draggingTarget === "background"}
          class={`relative flex min-h-18 cursor-pointer flex-col justify-center gap-1 rounded-md border border-dashed border-sidebar-border p-3 transition-colors hover:border-ring hover:bg-muted ${draggingTarget === "background" ? "border-ring bg-muted" : ""}`}
          ondragover={(event) => {
            event.preventDefault();
            draggingTarget = "background";
          }}
          ondragleave={() => (draggingTarget = null)}
          ondrop={(event) => handleDrop(event, "background")}
        >
          <div class="flex items-center justify-between gap-2">
            <strong class="text-xs font-medium">Background</strong>

            <Button
              variant="ghost"
              size="icon-sm"
              class={backgroundName && backgroundName !== "Using foreground"
                ? "shrink-0"
                : "shrink-0 invisible pointer-events-none"}
              aria-label="Remove background image"
              title="Remove background image"
              disabled={!backgroundName ||
                backgroundName === "Using foreground"}
              onclick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                removeImage("background");
              }}><Trash size={16} strokeWidth={2} aria-hidden="true" /></Button
            >
          </div>

          <span
            class="text-muted-foreground truncate text-xs"
            title={backgroundName || "Uses foreground if empty"}
          >
            {displayedBackgroundName || "Uses foreground if empty"}
          </span>

          <Input
            type="file"
            accept="image/*"
            class="sr-only"
            onchange={(event) => handleFileInput(event, "background")}
          />
        </label>
      </div>

      <Button class="w-full" size="lg" onclick={renderAndSave}
        >Render & Save PNG</Button
      >
    </div>
  </aside>

  <!-- Right Canvas Area -->

  <main
    class="min-h-0 min-w-0 justify-self-center self-center overflow-hidden bg-muted"
    style={`--aspect-width: ${aspectWidth}; --aspect-height: ${aspectHeight}; width: min(100%, calc(100dvh * var(--aspect-width) / var(--aspect-height))); aspect-ratio: var(--aspect-width) / var(--aspect-height);`}
    bind:this={pixiContainer}
  ></main>
</div>

<style></style>
