<template>
  <Teleport to="body">
    <div ref="root" v-show="model" class="flow-workspace" role="dialog" aria-modal="true" :aria-label="title || undefined">
      <header class="flow-workspace__bar" :class="{ 'flow-workspace__bar--compact': compact, 'flow-workspace__bar--narrow': narrow }">
        <slot name="bar-start" />
        <div class="flow-workspace__title">
          <slot name="title">{{ title }}</slot>
        </div>
        <q-space v-if="!compact" />
        <div class="flow-workspace__actions"><slot name="bar-actions" /></div>
        <q-btn v-if="showClose" dense flat round icon="close" size="sm" class="flow-workspace__close" :aria-label="$t('general.close')" @click="requestClose" />
      </header>
      <div class="flow-workspace__body">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onMounted, onBeforeUnmount, useTemplateRef, nextTick } from 'vue'

const model = defineModel({ type: Boolean, default: false })
const compact = defineModel('compact', { type: Boolean, default: false })
const narrow = defineModel('narrow', { type: Boolean, default: false })

defineProps({
  title: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'back'])
const root = useTemplateRef('root')
const STACKED_BAR_MAX_WIDTH = 960
const NARROW_BAR_MAX_WIDTH = 560
let barObserver = null
let viewportBound = false

function syncCompact() {
  const el = root.value
  const w = el?.clientWidth ?? 0
  compact.value = w > 0 && w <= STACKED_BAR_MAX_WIDTH
  narrow.value = w > 0 && w <= NARROW_BAR_MAX_WIDTH
}

/** Pin to the visible screen (URL bar / keyboard), not the larger layout 100vh. */
function syncOverlayFrame() {
  const el = root.value
  if (!el)
    return
  const vv = window.visualViewport
  const visTop = vv?.offsetTop ?? 0
  const visHeight = vv?.height ?? window.innerHeight
  el.style.setProperty('--flow-workspace-top', `${visTop}px`)
  el.style.setProperty('--flow-workspace-height', `${Math.round(visHeight)}px`)
}

function bindViewport(on) {
  if (on === viewportBound)
    return
  viewportBound = on
  const fn = on ? 'addEventListener' : 'removeEventListener'
  window[fn]('resize', syncOverlayFrame)
  window[fn]('orientationchange', syncOverlayFrame)
  const vv = window.visualViewport
  vv?.[fn]('resize', syncOverlayFrame)
  vv?.[fn]('scroll', syncOverlayFrame)
}

function requestClose() {
  emit('close')
}

function onKeydown(e) {
  if (e.key !== 'Escape' || !model.value)
    return
  // Let nested Quasar dialogs (save/forward, etc.) own Esc first.
  if (document.querySelector('.q-dialog'))
    return
  e.preventDefault()
  emit('back')
}

function syncBodyLock(open) {
  const html = document.documentElement
  const body = document.body
  if (open) {
    if (!body.classList.contains('flow-workspace-open')) {
      body.dataset.wsScrollY = String(window.scrollY)
      body.style.top = `-${window.scrollY}px`
    }
    html.classList.add('flow-workspace-open')
    body.classList.add('flow-workspace-open')
    return
  }
  if (!body.classList.contains('flow-workspace-open'))
    return
  html.classList.remove('flow-workspace-open')
  body.classList.remove('flow-workspace-open')
  const y = Number(body.dataset.wsScrollY || 0)
  body.style.top = ''
  delete body.dataset.wsScrollY
  window.scrollTo(0, y)
}

watch(model, async (open) => {
  syncBodyLock(open)
  bindViewport(open)
  if (open) {
    window.addEventListener('keydown', onKeydown, true)
    await nextTick()
    syncOverlayFrame()
    syncCompact()
  } else
    window.removeEventListener('keydown', onKeydown, true)
}, { immediate: true })

onBeforeUnmount(() => {
  syncBodyLock(false)
  bindViewport(false)
  window.removeEventListener('keydown', onKeydown, true)
  barObserver?.disconnect()
})

onMounted(() => {
  const el = root.value
  if (el && typeof ResizeObserver !== 'undefined') {
    barObserver = new ResizeObserver(syncCompact)
    barObserver.observe(el)
  }
  if (model.value) {
    bindViewport(true)
    syncOverlayFrame()
  }
  syncCompact()
})
</script>

<style>
html.flow-workspace-open,
body.flow-workspace-open {
  overflow: hidden;
  overscroll-behavior: none;
}
body.flow-workspace-open {
  position: fixed;
  width: 100%;
  left: 0;
  right: 0;
}
</style>

<style scoped>
.flow-workspace {
  position: fixed;
  top: var(--flow-workspace-top, 0px);
  right: 0;
  left: 0;
  height: var(--flow-workspace-height, 100vh);
  height: var(--flow-workspace-height, 100dvh);
  z-index: 6000;
  display: flex;
  flex-direction: column;
  background: var(--flow-workspace-bg, #f4f7f9);
  color: inherit;
  overscroll-behavior: none;
}

.flow-workspace__bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.35rem 0.65rem 0.35rem 1rem;
  background: var(--dialog-bar-bg);
  color: var(--dialog-bar-fg);
}

.flow-workspace__title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1em;
  font-weight: 600;
  line-height: 1.35;
}

.flow-workspace__actions {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 46%;
}

.flow-workspace__actions:empty,
.flow-workspace__actions:not(:has(*)) {
  display: none;
}

.flow-workspace__bar--compact {
  flex-wrap: wrap;
  row-gap: 0.2rem;
  padding: 0.3rem 0.5rem 0.35rem 0.65rem;
}

.flow-workspace__bar--compact .flow-workspace__title {
  flex: 1 1 0;
}

.flow-workspace__bar--compact .flow-workspace__actions {
  flex: 1 1 100%;
  order: 5;
  max-width: none;
  min-width: 0;
}

.flow-workspace__bar--compact .flow-workspace__close {
  order: 4;
}

.flow-workspace__bar--narrow {
  align-items: flex-start;
}

.flow-workspace__close {
  color: var(--flow-bar-nav-fg) !important;
  background: var(--flow-bar-nav-bg);
  flex-shrink: 0;
}

.flow-workspace__close:hover,
.flow-workspace__close:focus-visible {
  color: var(--dialog-bar-fg) !important;
  background: var(--flow-bar-nav-bg-hover);
}

.flow-workspace__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
