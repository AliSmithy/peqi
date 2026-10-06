<template>
  <q-btn
    v-if="text"
    :key="nudge ? shake : undefined"
    v-bind="$attrs"
    dense
    flat
    round
    icon="message"
    color="orange-5"
    class="flow-note" :class="{ 'flow-note--nudge': nudge && shake }" :aria-label="t('crtbl.note')" @click.stop="visible = true">
    <q-tooltip>{{ t('crtbl.note') }}</q-tooltip>
  </q-btn>
  <q-dialog v-model="visible">
    <div class="flow-note-popup" role="document">
      <header class="flow-note-popup__bar">
        <span class="flow-note-popup__title">{{ t('crtbl.note') }}</span>
        <q-space />
        <q-btn dense flat round icon="close" size="sm" color="brown-8" :aria-label="t('general.close')" v-close-popup />
      </header>
      <div class="flow-note-popup__body">{{ text }}</div>
      <footer v-if="userLabel" class="flow-note-popup__from">{{ userLabel }}</footer>
    </div>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { localizedTitle } from 'src/utils/zenUtil'

const props = defineProps({
  text: { type: String, default: '' },
  user: { type: [Object, String], default: null },
  /** Shake the icon when text first appears or changes. */
  nudge: { type: Boolean, default: false }
})

defineOptions({ inheritAttrs: false })

const { t } = useI18n()
const visible = ref(false)
const shake = ref(0)
if (props.nudge)
  watch(() => props.text, n => { if (n) shake.value++ }, { immediate: true })

const userLabel = computed(() => {
  if (!props.user)
    return ''
  const label = localizedTitle(props.user)
  return label && label !== '-' ? label : ''
})
</script>

<style scoped>
.flow-note {
  flex-shrink: 0;
  font-size: 0.95em;
}

.flow-note--nudge {
  animation: flow-note-nudge 0.5s alternate;
}

@keyframes flow-note-nudge {
  25% { transform: rotate(-30deg); }
  50% { transform: rotate(30deg); }
  75% { transform: rotate(-10deg); }
  90% { transform: rotate(20deg); }
}

@media (prefers-reduced-motion: reduce) {
  .flow-note--nudge { animation: none; }
}

.flow-note-popup {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 22rem;
  max-width: calc(100vw - 2rem);
  min-height: 14rem;
  max-height: min(22rem, 80vh);
  padding: 0.65rem 0.85rem 1rem;
  color: #4a3b12;
  background: #ffe56d;
  box-shadow:
    0 10px 24px rgba(80, 55, 0, 0.28),
    0 2px 4px rgba(80, 55, 0, 0.12);
  border-radius: 2px;
}

.flow-note-popup::before {
  content: '';
  position: absolute;
  z-index: 1;
  top: -0.5rem;
  left: 50%;
  width: 6.25rem;
  height: 2rem;
  transform: translateX(-50%) rotate(-4deg);
  background:
    linear-gradient(180deg, #f7ebc0 0%, #e4cc7a 100%);
  border: 1px solid color-mix(in srgb, #c4a84a 45%, transparent);
  border-radius: 1px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent),
    0 2px 5px rgba(80, 55, 0, 0.22);
  pointer-events: none;
}

.flow-note-popup__bar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 1.75rem;
  margin-bottom: 0.35rem;
}

.flow-note-popup__title {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.flow-note-popup__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 0.15rem 0.15rem 0.4rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 1.02em;
  line-height: 1.55;
}

.flow-note-popup__from {
  flex-shrink: 0;
  margin-top: 0.45rem;
  text-align: end;
  font-size: 0.92em;
  font-weight: 600;
  font-style: italic;
  opacity: 0.82;
}
</style>
