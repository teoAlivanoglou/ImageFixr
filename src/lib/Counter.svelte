<script lang="ts">
  import { cn } from '$lib/utils';

  let { class: className }: { class?: string } = $props();
  let count: number = $state(0);
  const increment = () => {
    count += 1;
  };
</script>

<button type="button" class={cn("counter", className)} onclick={increment}>
  Count is {count}
</button>
