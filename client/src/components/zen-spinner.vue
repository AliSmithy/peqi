<template>
  <div class="zen-spinner" :class="color ? `text-${color}` : ''" :style="style" />
</template>
<script setup>
import { computed } from 'vue';

/**
 * Quasar's SVG spinners animate through SMIL, which the browser ticks on the
 * main thread — they freeze whenever a heavy ring is mounting. This one is a
 * plain element animated with a CSS transform, so the compositor keeps it
 * turning even while JS blocks.
 */
const props = defineProps({
  size: { type: [String, Number], default: '1em' },
  color: { type: String, default: '' },
  thickness: { type: Number, default: 0.1 }
});

const style = computed(() => ({
  '--zen-spinner-size': typeof props.size === 'number' ? `${props.size}px` : props.size,
  '--zen-spinner-thickness': `calc(var(--zen-spinner-size) * ${props.thickness})`
}));
</script>
<style scoped>
.zen-spinner {
  width: var(--zen-spinner-size);
  height: var(--zen-spinner-size);
  border-radius: 50%;
  border: var(--zen-spinner-thickness) solid currentColor;
  border-top-color: transparent;
  border-left-color: transparent;
  animation: zen-spinner-rotate 0.9s linear infinite;
  will-change: transform;
}

@keyframes zen-spinner-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .zen-spinner {
    animation-duration: 2.4s;
  }
}
</style>
