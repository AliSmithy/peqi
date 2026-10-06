<template>
  <div class="zen-slot-upload column" :class="{ 'is-disabled': props.disable, 'zen-slot-upload--fill-height': props.fillHeight }">
    <div class="slot-toolbar row items-center q-gutter-sm q-px-sm q-py-xs">
      <div class="col">
        <div class="text-subtitle1">{{ props.title || $t('file.uploadedFiles') }}</div>
        <div class="text-caption text-grey-7">{{ $t('file.slotProgress', { filled: filledCount, total: slotCount }) }}</div>
      </div>
      <div class="col-auto row q-gutter-xs">
        <q-chip v-for="opt in filterOptions" :key="opt.value" clickable dense :selected="filter === opt.value" color="primary" outline @click="filter = opt.value">
          {{ opt.label }}
        </q-chip>
      </div>
    </div>

    <div class="slot-list col">
      <div v-if="!visibleGroups.length && !orphanFiles.length" class="text-center text-grey-7 q-pa-md">
        {{ $t('general.noData') }}
      </div>
      <template v-for="group in visibleGroups" :key="group.id">
        <q-expansion-item
          v-if="group.label"
          class="slot-group"
          :class="{ 'slot-group--complete': group.filled >= group.total && group.total > 0 }"
          header-class="slot-group__header"
          switch-toggle-side
          expand-separator
          default-opened
        >
          <template #header>
            <q-item-section>
              <q-item-label class="slot-group__title">{{ group.label }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge class="slot-group__badge" :color="groupBadgeColor(group)" :outline="group.filled < group.total && !$q.dark.isActive">
                {{ $t('file.slotProgress', { filled: group.filled, total: group.total }) }}
              </q-badge>
            </q-item-section>
          </template>
          <q-list separator class="slot-group__list">
            <zen-slot-upload-row
              v-for="slot in group.slots"
              :key="slot.key"
              :item="slot"
              :files="filesFor(slot.key)"
              :disable="props.disable"
              :drag-over="dragKey === slot.key"
              :busy="!!uploading[slot.key]"
              @preview="openPreview"
              @remove="deleteFile"
              :accept="props.accept"
              @picked="addFiles(slot, $event)"
              @dragenter="onDragEnter(slot, $event)"
              @dragover="onDragOver"
              @dragleave="onDragLeave(slot, $event)"
              @drop="onDrop(slot, $event)"
            />
          </q-list>
        </q-expansion-item>

        <q-list v-else separator class="slot-group slot-group--loose">
          <zen-slot-upload-row
            v-for="slot in group.slots"
            :key="slot.key"
            :item="slot"
            :files="filesFor(slot.key)"
            :disable="props.disable"
            :drag-over="dragKey === slot.key"
            :busy="!!uploading[slot.key]"
            @preview="openPreview"
            @remove="deleteFile"
            :accept="props.accept"
            @picked="addFiles(slot, $event)"
            @dragenter="onDragEnter(slot, $event)"
            @dragover="onDragOver"
            @dragleave="onDragLeave(slot, $event)"
            @drop="onDrop(slot, $event)"
          />
        </q-list>
      </template>

      <q-list v-if="orphanFiles.length" separator class="q-mt-sm">
        <q-item-label header>{{ $t('file.slotUnassigned') }}</q-item-label>
        <q-item v-for="file in orphanFiles" :key="file.id" class="slot-orphan">
          <q-item-section>
            <q-item-label>{{ file.title || fileKindKey(file) || $t('file.slotUnassigned') }}</q-item-label>
            <q-item-label caption>{{ $t('file.size') }}: {{ formatFileSize(file.size) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="slot-orphan__file">
              <img v-if="file.id && isImageFile(file)" class="slot-orphan__thumb" :src="getDownloadUrl(file.id, true)" @click="openPreview(file)">
              <q-btn v-else-if="file.id" flat round dense color="grey-7" :icon="getFileIcon(file.mime_type)" @click="openPreview(file)" />
              <q-btn v-if="!props.disable" flat round dense size="sm" icon="delete" @click="deleteFile(file.id)" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <zen-lightbox v-model="previewOpen" v-model:index="previewIndex" :items="previewItems" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import zenLightbox from 'src/components/zen-lightbox.vue';
import zenSlotUploadRow from 'src/components/zen-slot-upload-row.vue';
import { useCrtblFiles } from 'src/composables/useCrtblFiles';
import { useLoginStore } from 'stores/loginStore';
import {
  fileKindKey,
  fileMatchesAccept,
  flattenSlotGroups,
  formatFileSize,
  getDownloadUrl,
  getFileIcon,
  isImageFile,
  slotKindMeta,
} from 'src/utils/crtblFiles';

const props = defineProps({
  sourceForm: { type: String, required: true },
  entityID: { type: [Number, String], default: null },
  disable: { type: Boolean, default: true },
  title: { type: String, default: '' },
  fields: { type: Object, default: null },
  fillHeight: { type: Boolean, default: false },
  accept: { type: String, default: '' },
  /** Optional stricter cap (bytes). The effective limit is min(this, server/default). */
  maxSize: { type: Number, default: null },
});

const $q = useQuasar();
const { t } = useI18n();
const loginStore = useLoginStore();
const { serverFiles, deleteFile, uploadFiles } = useCrtblFiles(props);

const effectiveMaxSize = computed(() => {
  const cap = loginStore.fileSizeLimit;
  const over = Number(props.maxSize);
  if (Number.isFinite(over) && over > 0)
    return Math.min(over, cap);
  return cap;
});

const filter = ref('all');
const dragKey = ref(null);
const dragDepth = ref(0);
const uploading = ref({});
const previewOpen = ref(false);
const previewIndex = ref(0);

const groups = computed(() => flattenSlotGroups(props.fields));
const slotKeys = computed(() => new Set(groups.value.flatMap(g => g.slots.map(s => s.key))));
const slotCount = computed(() => slotKeys.value.size);
const filledCount = computed(() => [...slotKeys.value].filter(key => filesFor(key).length > 0).length);

const filterOptions = computed(() => [
  { value: 'all', label: t('file.slotFilterAll') },
  { value: 'missing', label: t('file.slotFilterMissing') },
  { value: 'filled', label: t('file.slotFilterFilled') },
]);

const filesByKind = computed(() => {
  const map = Object.create(null);
  for (const file of serverFiles.value) {
    const key = fileKindKey(file);
    if (!key) continue;
    if (!map[key]) map[key] = [];
    map[key].push(file);
  }
  return map;
});

const orphanFiles = computed(() => {
  const keys = slotKeys.value;
  return serverFiles.value.filter(file => {
    const key = fileKindKey(file);
    return !key || !keys.has(key);
  });
});

const visibleGroups = computed(() => {
  return groups.value
    .map(group => ({
      ...group,
      filled: group.slots.filter(slot => filesFor(slot.key).length > 0).length,
      total: group.slots.length,
      slots: visibleSlots(group),
    }))
    .filter(group => group.slots.length);
});

function slotCaption(slot) {
  const parts = [slot.category, slot.label].filter(Boolean);
  return [...new Set(parts)].join(' / ');
}

const previewItems = computed(() => {
  const items = [];
  for (const group of groups.value) {
    for (const slot of group.slots) {
      for (const file of filesFor(slot.key)) {
        if (!file?.id) continue;
        items.push({
          id: file.id,
          mime_type: file.mime_type,
          caption: slotCaption(slot),
          title: file.title || slot.label,
        });
      }
    }
  }
  for (const file of orphanFiles.value) {
    if (!file?.id) continue;
    items.push({
      id: file.id,
      mime_type: file.mime_type,
      caption: file.title || fileKindKey(file) || t('file.slotUnassigned'),
      title: file.title || '',
    });
  }
  return items;
});

watch(previewItems, (list) => {
  if (!previewOpen.value) return;
  if (!list.length) {
    previewOpen.value = false;
    return;
  }
  if (previewIndex.value >= list.length)
    previewIndex.value = list.length - 1;
});

function filesFor(key) {
  return filesByKind.value[key] || [];
}

function visibleSlots(group) {
  if (filter.value === 'missing')
    return group.slots.filter(slot => filesFor(slot.key).length === 0);
  if (filter.value === 'filled')
    return group.slots.filter(slot => filesFor(slot.key).length > 0);
  return group.slots;
}

function groupBadgeColor(group) {
  if (group.total > 0 && group.filled >= group.total)
    return 'positive';
  return 'negative';
}

function openPreview(file) {
  if (!file?.id) return;
  const idx = previewItems.value.findIndex(item => item.id === file.id);
  previewIndex.value = idx >= 0 ? idx : 0;
  previewOpen.value = true;
}

function onDragOver(e) {
  e.preventDefault();
  if (e.dataTransfer)
    e.dataTransfer.dropEffect = 'copy';
}

function onDragEnter(slot, e) {
  e.preventDefault();
  if (props.disable) return;
  if (dragKey.value !== slot.key) {
    dragKey.value = slot.key;
    dragDepth.value = 1;
  }
  else
    dragDepth.value += 1;
}

function onDragLeave(slot, e) {
  if (dragKey.value !== slot.key) return;
  dragDepth.value -= 1;
  if (dragDepth.value <= 0) {
    dragKey.value = null;
    dragDepth.value = 0;
  }
  e.preventDefault();
}

function onDrop(slot, e) {
  e.preventDefault();
  dragKey.value = null;
  dragDepth.value = 0;
  if (props.disable) return;
  const list = Array.from(e.dataTransfer?.files || []);
  if (list.length)
    addFiles(slot, list);
}

function acceptFiles(slot, fileList) {
  let incoming = Array.from(fileList || []).filter(f => f && f.size != null);
  if (!incoming.length) return [];
  if (props.accept) {
    const allowed = incoming.filter(f => fileMatchesAccept(f, props.accept));
    const skipped = incoming.length - allowed.length;
    if (skipped) {
      $q.notify({
        type: allowed.length ? 'warning' : 'negative',
        message: t('file.slotTypeRejected', { count: skipped }),
      });
    }
    incoming = allowed;
    if (!incoming.length) return [];
  }
  if (effectiveMaxSize.value > 0) {
    const allowed = incoming.filter(f => Number(f.size) <= effectiveMaxSize.value);
    const skipped = incoming.length - allowed.length;
    if (skipped) {
      $q.notify({
        type: allowed.length ? 'warning' : 'negative',
        message: t('file.slotSizeRejected', { count: skipped, max: formatFileSize(effectiveMaxSize.value) }),
      });
    }
    incoming = allowed;
    if (!incoming.length) return [];
  }
  if (slot.multi) return incoming;
  if (filesFor(slot.key).length >= 1) {
    $q.notify({ type: 'negative', message: t('file.slotFull') });
    return [];
  }
  if (incoming.length > 1)
    $q.notify({ type: 'warning', message: t('file.slotExtrasIgnored') });
  return incoming.slice(0, 1);
}

async function addFiles(slot, fileList) {
  const files = acceptFiles(slot, fileList);
  if (!files.length) return;
  uploading.value = { ...uploading.value, [slot.key]: true };
  try {
    const kind = slotKindMeta(slot);
    await uploadFiles(files, () => ({ kind }));
  }
  finally {
    const next = { ...uploading.value };
    delete next[slot.key];
    uploading.value = next;
  }
}
</script>

<style scoped>
.zen-slot-upload--fill-height {
  flex: 1 1 auto;
  min-height: 100%;
}

.slot-list {
  min-height: 0;
  padding-inline: 4px;
}

.slot-group {
  margin-block: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.body--dark .slot-group {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.03);
}

.slot-group :deep(.slot-group__header) {
  min-height: 48px;
  background: rgba(198, 40, 40, 0.12);
  border-inline-start: 4px solid var(--q-negative);
}

.body--dark .slot-group :deep(.slot-group__header) {
  background: rgba(244, 67, 54, 0.22);
}

.slot-group--complete :deep(.slot-group__header) {
  background: rgba(46, 125, 50, 0.26);
  border-inline-start-color: var(--q-positive);
}

.body--dark .slot-group--complete :deep(.slot-group__header) {
  background: rgba(76, 175, 80, 0.22);
}

.slot-group__title {
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.35;
  white-space: normal;
}

.slot-group__badge {
  font-size: 12px;
}

.body--dark .slot-group:not(.slot-group--complete) :deep(.slot-group__badge) {
  color: #fff;
  background: #e53935;
}

.slot-group :deep(.q-expansion-item__content) {
  background: rgba(0, 0, 0, 0.02);
}

.body--dark .slot-group :deep(.q-expansion-item__content) {
  background: rgba(0, 0, 0, 0.15);
}

.slot-orphan__file {
  display: flex;
  align-items: center;
  gap: 4px;
}

.slot-orphan__thumb {
  width: 64px;
  height: 64px;
  object-fit: contain;
  cursor: pointer;
}
</style>

<style>
.zen-slot-upload-fill-host {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.zen-slot-upload-fill-host>.col-12 {
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
}
</style>
