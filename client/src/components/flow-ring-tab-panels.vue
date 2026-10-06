<template>
  <div class="flow-ring-tab-panels">
    <q-scroll-area
      class="flow-ring-tab-panels__pane"
      :class="{ 'is-on': tab === 'results' }"
      :delay="1200"
      :inert="tab !== 'results'"
    >
      <slot name="results" />
    </q-scroll-area>
    <q-scroll-area
      v-if="photosReady || tab === 'photos'"
      class="flow-ring-tab-panels__pane"
      :class="{ 'is-on': tab === 'photos' }"
      :delay="1200"
      :inert="tab !== 'photos'"
    >
      <slot v-if="photosReady" name="photos" />
      <div v-else class="flow-ring-tab-panels__pending">
        <zen-spinner size="72px" color="accent" />
      </div>
    </q-scroll-area>
  </div>
</template>
<script setup>
import { nextTick, ref, watch } from 'vue'
import zenSpinner from './zen-spinner.vue'

const props = defineProps({
  tab: { type: String, required: true },
})

const photosReady = ref(false)

function paint() {
  return nextTick().then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
}

watch(() => props.tab, async (name) => {
  if (name !== 'photos' || photosReady.value)
    return
  await paint()
  photosReady.value = true
})
</script>
<style>
.q-scrollarea__content:has(.flow-ring-tab-panels) {
  height: 100%;
  width: 100%;
}
</style>
<style scoped>
.flow-ring-tab-panels {
  position: relative;
  height: 100%;
}

.flow-ring-tab-panels__pane {
  position: absolute;
  inset: 0;
  visibility: hidden;
  pointer-events: none;
}

.flow-ring-tab-panels__pane.is-on {
  /* inherit — `visible` would punch through a hidden ancestor (idle flow layer). */
  visibility: inherit;
  pointer-events: auto;
}

.flow-ring-tab-panels__pending {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
