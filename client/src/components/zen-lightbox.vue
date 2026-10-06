<template>
  <q-dialog v-model="visible" maximized transition-show="fade" transition-hide="fade" transition-duration="150">
    <div class="zen-lightbox column no-wrap bg-black text-white">
      <div class="zen-lightbox__bar row items-center no-wrap q-px-sm">
        <div class="col ellipsis q-px-sm">
          <div class="ellipsis text-body1">{{ current?.caption || current?.title || '\u00A0' }}</div>
          <div v-if="items.length > 1" class="text-caption text-grey-5">{{ $t('file.previewCounter', { current: index + 1, total: items.length }) }}</div>
        </div>
        <div v-if="isImage" class="zen-lightbox__zoom row no-wrap items-center">
          <q-btn flat round dense icon="zoom_out" :disable="scale <= 1" @click="zoomBy(1 / 1.25)">
            <q-tooltip>{{ $t('file.previewZoomOut') }}</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="zoom_in" :disable="scale >= 8" @click="zoomBy(1.25)">
            <q-tooltip>{{ $t('file.previewZoomIn') }}</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="fit_screen" :disable="scale <= 1" @click="resetView">
            <q-tooltip>{{ $t('file.previewZoomReset') }}</q-tooltip>
          </q-btn>
        </div>
        <q-btn v-if="current?.id" flat round dense icon="download" :href="fullUrl" :download="current.title || 'file'">
          <q-tooltip>{{ $t('file.download') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="close" v-close-popup>
          <q-tooltip>{{ $t('general.close') }}</q-tooltip>
        </q-btn>
      </div>

      <div class="zen-lightbox__body col row no-wrap items-stretch">
        <q-btn
          v-if="items.length > 1"
          class="zen-lightbox__nav self-center"
          :class="{ 'zen-lightbox__nav--rtl': isRtl }"
          flat
          round
          color="white"
          icon="chevron_left"
          @click="step(-1)"
        />
        <div
          class="zen-lightbox__stage col"
          :class="{ 'zen-lightbox__stage--grab': isImage && scale > 1, 'zen-lightbox__stage--grabbing': panning }"
          @wheel.prevent="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @dblclick.prevent="onDblClick"
        >
          <template v-if="current?.id && isImage">
            <img
              v-if="!fullLoaded"
              class="zen-lightbox__img zen-lightbox__img--thumb"
              :src="thumbUrl"
              alt=""
              draggable="false"
            >
            <img
              class="zen-lightbox__img"
              :class="{ 'zen-lightbox__img--hidden': !fullLoaded }"
              :src="fullUrl"
              :style="imgStyle"
              alt=""
              draggable="false"
              @load="fullLoaded = true"
            >
          </template>
          <iframe v-else-if="current?.id && isPdf" class="zen-lightbox__iframe" :src="fullUrl" />
          <div v-else-if="current" class="column items-center justify-center q-gutter-md zen-lightbox__fallback">
            <q-icon :name="getFileIcon(current.mime_type)" size="120px" color="grey-5" />
            <div>{{ current.caption || current.title || $t('file.download') }}</div>
            <q-btn color="primary" :href="fullUrl" :download="current.title || 'file'" :label="$t('file.download')" />
          </div>
        </div>
        <q-btn
          v-if="items.length > 1"
          class="zen-lightbox__nav self-center"
          :class="{ 'zen-lightbox__nav--rtl': isRtl }"
          flat
          round
          color="white"
          icon="chevron_right"
          @click="step(1)"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { getDownloadUrl, getFileIcon, isImageFile, isPdfFile } from 'src/utils/crtblFiles';

const props = defineProps({
  items: { type: Array, default: () => [] },
});

const visible = defineModel({ type: Boolean, default: false });
const index = defineModel('index', { type: Number, default: 0 });

const $q = useQuasar();
const isRtl = computed(() => $q.lang.rtl === true);
const scale = ref(1);
const tx = ref(0);
const ty = ref(0);
const fullLoaded = ref(false);
const panning = ref(false);
const panOrigin = ref(null);

const current = computed(() => props.items[index.value] || null);
const isImage = computed(() => isImageFile(current.value));
const isPdf = computed(() => isPdfFile(current.value));
const fullUrl = computed(() => current.value?.id ? getDownloadUrl(current.value.id) : '');
const thumbUrl = computed(() => current.value?.id ? getDownloadUrl(current.value.id, true) : '');
const imgStyle = computed(() => ({
  transform: `translate(${tx.value}px, ${ty.value}px) scale(${scale.value})`,
}));

watch([visible, index, () => current.value?.id], () => {
  resetView();
  fullLoaded.value = false;
});

watch(visible, (open) => {
  if (open)
    window.addEventListener('keydown', onKey);
  else
    window.removeEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
});

function resetView() {
  scale.value = 1;
  tx.value = 0;
  ty.value = 0;
  panning.value = false;
  panOrigin.value = null;
}

function clampScale(next) {
  return Math.min(8, Math.max(1, next));
}

function zoomBy(factor) {
  if (!isImage.value) return;
  const next = clampScale(scale.value * factor);
  scale.value = next;
  if (next <= 1) {
    tx.value = 0;
    ty.value = 0;
  }
}

function step(delta) {
  const n = props.items.length;
  if (n < 2) return;
  index.value = (index.value + delta + n) % n;
}

function onKey(e) {
  if (!visible.value) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    step(-1);
  }
  else if (e.key === 'ArrowRight') {
    e.preventDefault();
    step(1);
  }
  else if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    zoomBy(1.25);
  }
  else if (e.key === '-') {
    e.preventDefault();
    zoomBy(1 / 1.25);
  }
  else if (e.key === '0') {
    e.preventDefault();
    resetView();
  }
}

function onWheel(e) {
  if (!isImage.value) return;
  zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
}

function onDblClick() {
  if (!isImage.value) return;
  if (scale.value > 1)
    resetView();
  else
    scale.value = 2.5;
}

function onPointerDown(e) {
  if (!isImage.value || scale.value <= 1 || e.button !== 0) return;
  panning.value = true;
  panOrigin.value = { x: e.clientX - tx.value, y: e.clientY - ty.value };
  e.currentTarget.setPointerCapture?.(e.pointerId);
}

function onPointerMove(e) {
  if (!panning.value || !panOrigin.value) return;
  tx.value = e.clientX - panOrigin.value.x;
  ty.value = e.clientY - panOrigin.value.y;
}

function onPointerUp() {
  panning.value = false;
  panOrigin.value = null;
}
</script>

<style scoped>
.zen-lightbox {
  width: 100%;
  height: 100%;
  background: #111;
}

.zen-lightbox__bar {
  flex: 0 0 auto;
  min-height: 48px;
  background: rgba(0, 0, 0, 0.55);
  z-index: 2;
}

/* rtl:ignore */
.zen-lightbox__zoom {
  flex-direction: row;
}

/* rtl:ignore */
.zen-lightbox__body {
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: row;
}

.zen-lightbox__nav {
  flex: 0 0 auto;
  margin: 8px;
}

.zen-lightbox__nav--rtl :deep(.q-icon) {
  transform: scaleX(-1);
}

.zen-lightbox__stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.zen-lightbox__stage--grab {
  cursor: grab;
}

.zen-lightbox__stage--grabbing {
  cursor: grabbing;
}

.zen-lightbox__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform-origin: center center;
  user-select: none;
  pointer-events: none;
}

.zen-lightbox__img--thumb {
  position: absolute;
  filter: blur(4px);
  opacity: 0.7;
}

.zen-lightbox__img--hidden {
  position: absolute;
  opacity: 0;
}

.zen-lightbox__iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

.zen-lightbox__fallback {
  flex: 1;
}
</style>
