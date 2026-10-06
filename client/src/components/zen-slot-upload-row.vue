<template>
  <q-item
    class="slot-row"
    :class="rowClass"
    @dragenter.prevent="$emit('dragenter', $event)"
    @dragover.prevent="$emit('dragover', $event)"
    @dragleave="$emit('dragleave', $event)"
    @drop.prevent="$emit('drop', $event)"
  >
    <q-item-section class="slot-row__meta">
      <q-item-label>{{ item.label }}</q-item-label>
      <q-item-label v-if="item.description" caption class="slot-row__desc">{{ item.description }}</q-item-label>
      <q-item-label caption class="text-grey-6">{{ item.multi ? $t('file.slotMulti') : $t('file.slotSingle') }}</q-item-label>
      <q-item-label v-if="hasExtras" caption class="text-negative">{{ $t('file.slotExtraFiles') }}</q-item-label>
    </q-item-section>
    <q-item-section class="slot-row__files">
      <div class="slot-files">
        <div v-for="(file, idx) in files" :key="file.id" class="slot-file" :class="{ 'slot-file--extra': !item.multi && idx > 0 }">
          <img v-if="file.id && isImageFile(file)" class="slot-thumb slot-thumb--clickable" :src="getDownloadUrl(file.id, true)" @click.stop="$emit('preview', file)">
          <q-btn v-else-if="file.id" flat round dense color="grey-7" :icon="getFileIcon(file.mime_type)" @click.stop="$emit('preview', file)" />
          <q-btn v-if="!disable" class="slot-file__del" flat round dense size="xs" icon="close" @click.stop="$emit('remove', file.id)" />
          <q-tooltip v-if="!item.multi && idx > 0">{{ $t('file.slotExtraFiles') }}</q-tooltip>
        </div>
        <div v-if="showDrop" class="slot-drop" :class="{ 'slot-drop--over': dragOver }">
          <q-spinner v-if="busy" size="20px" color="primary" />
          <template v-else>
            <input
              type="file"
              class="slot-drop__input"
              :multiple="!!item.multi"
              :accept="accept || undefined"
              :aria-label="files.length ? $t('file.slotDropMore') : $t('file.slotDrop')"
              @click.stop
              @change="onPick"
              @drop.stop.prevent="$emit('drop', $event)"
            >
            <q-icon name="add" size="20px" />
            <span class="slot-drop__hint">{{ files.length ? $t('file.slotDropMore') : $t('file.slotDrop') }}</span>
          </template>
        </div>
        <q-spinner v-else-if="busy" size="20px" color="primary" />
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup>
import { computed } from 'vue';
import { getDownloadUrl, getFileIcon, isImageFile } from 'src/utils/crtblFiles';

const props = defineProps({
  item: { type: Object, required: true },
  files: { type: Array, default: () => [] },
  disable: { type: Boolean, default: false },
  dragOver: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  accept: { type: String, default: '' },
});

const emit = defineEmits(['preview', 'remove', 'picked', 'dragenter', 'dragover', 'dragleave', 'drop']);

function onPick(e) {
  const list = Array.from(e.target?.files || []);
  if (e.target)
    e.target.value = '';
  if (list.length)
    emit('picked', list);
}

const hasExtras = computed(() => !props.item.multi && props.files.length > 1);
const showDrop = computed(() => !props.disable && (props.item.multi || props.files.length === 0));
const rowClass = computed(() => ({
  'slot-row--over': props.dragOver,
  'slot-row--missing': props.files.length === 0,
}));
</script>

<style scoped>
.slot-row {
  --slot-thumb: 72px;
  --slot-drop-min: 112px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.slot-row--over {
  outline: 2px dashed var(--q-primary);
  outline-offset: -2px;
  background: rgba(25, 118, 210, 0.06);
}

.slot-row__desc {
  white-space: normal;
  word-break: break-word;
}

.slot-row__meta {
  flex: 1 1 100% !important;
  min-width: 0;
  max-width: 100%;
}

.slot-row__files {
  flex: 1 1 100% !important;
  min-width: 0;
  max-width: 100%;
}

.slot-files {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.slot-file {
  position: relative;
  width: var(--slot-thumb);
  height: var(--slot-thumb);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.03);
  flex: 0 0 var(--slot-thumb);
}

.body--dark .slot-file {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
}

.slot-file--extra {
  outline: 2px solid var(--q-negative);
}

.slot-thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.slot-thumb--clickable {
  cursor: pointer;
}

.slot-file__del {
  position: absolute;
  top: 0;
  inset-inline-end: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}

.slot-drop {
  position: relative;
  min-width: var(--slot-drop-min);
  min-height: var(--slot-thumb);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px dashed rgba(0, 0, 0, 0.28);
  border-radius: 6px;
  color: #616161;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
}

.slot-drop__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  overflow: hidden;
  z-index: 1;
}

.body--dark .slot-drop {
  border-color: rgba(255, 255, 255, 0.28);
  color: #bdbdbd;
}

.slot-drop--over,
.slot-row--over .slot-drop {
  border-color: var(--q-primary);
  color: var(--q-primary);
  background: rgba(25, 118, 210, 0.08);
}

.slot-drop__hint {
  font-size: 11px;
  line-height: 1.2;
  text-align: center;
}

@media (min-width: 600px) {
  .slot-row {
    flex-wrap: nowrap;
  }

  .slot-row__meta {
    flex: 0 1 220px !important;
    max-width: 280px;
  }

  .slot-row__files {
    flex: 1 1 0 !important;
  }
}

@media (min-width: 1024px) {
  .slot-row {
    --slot-thumb: 96px;
    --slot-drop-min: 128px;
  }

  .slot-row__meta {
    flex: 0 1 260px !important;
    max-width: 320px;
  }

  .slot-files {
    gap: 10px;
  }
}

@media (min-width: 1440px) {
  .slot-row {
    --slot-thumb: 112px;
    --slot-drop-min: 140px;
  }

  .slot-row__meta {
    max-width: 360px;
  }
}
</style>
