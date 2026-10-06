<template>
  <div class="row q-col-gutter-xs" :class="{ 'is-disabled': props.disable, 'zen-file-upload--fill-height': props.fillHeight }">
    <div v-if="!props.disable" class="col-12 col-md-5">
      <q-uploader class="full-width" ref="uploader" :url="uploadUrl" :factory="uploadFactory" :label="props.title ? `${$t('file.uploadList')} - ${props.title}` : $t('file.uploadList')" multiple batch @added="onAdded" @removed="onRemoved" @failed="onFailed" @uploaded="onUploaded" @start="onUploadStart">
        <template v-slot:list="scope">
          <q-list separator>
            <q-item v-for="file in scope.files" :key="file.__key">
              <q-item-section style="min-width:0;">
                <!-- <q-item-label class="full-width ellipsis">{{ file.name }}</q-item-label> -->
                <q-item-label caption>{{ $t('file.uploadedVol') }} {{ file.__uploaded }}</q-item-label>
                <q-item-label caption>{{ $t('file.status') }}: {{ $t(`file.statuses.${file.__status}`) }}</q-item-label>
                <q-item-label caption>{{ file.__sizeLabel }} / {{ file.__progressLabel }}</q-item-label>

                <!-- per-file custom title & dynamic fields -->
                <q-input v-if="!props.hideTitle" dense outlined lazy-rules :ref="el => setTitleInputRef(file.__key, el)" :model-value="getFileTitle(file)" @update:model-value="val => setFileTitle(file, val)" :label="$t('file.title')" :rules="[titleRequired]" style="max-width:360px; margin-top:6px" />
                <template v-for="(field, fieldKey) in props.fields" :key="fieldKey">
                  <q-select v-if="field.type === 'dropdown'" class="file-upload-select" dense outlined options-dense lazy-rules :ref="el => setFieldInputRef(file.__key, fieldKey, el)" :model-value="getFileField(file, fieldKey)" @update:model-value="val => setFileField(file, fieldKey, val)" :options="fieldDropdownOptions(fieldKey)" option-value="key" option-label="label" option-disable="disable" :label="fieldLabel(fieldKey, field)" :rules="fieldRulesCached(fieldKey, field)" :virtual-scroll-item-size="fieldVirtualScrollItemSize(fieldKey)" popup-content-class="file-upload-dropdown">
                    <template v-slot:selected-item="scope">
                      <span class="file-upload-select__value">{{ dropdownOptionLabel(scope.opt) }}</span>
                    </template>
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps" :class="scope.opt.menuClass" :title="scope.opt.menuTitle">
                        <q-item-section>
                          <q-item-label class="file-upload-dropdown__label" :class="{ 'text-weight-bold': scope.opt.isGroup }">{{ scope.opt.label }}</q-item-label>
                          <q-item-label v-if="scope.opt.description" caption class="file-upload-dropdown__label">{{ scope.opt.description }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                  <q-input v-else-if="field.type === 'textarea'" dense outlined lazy-rules type="textarea" :rows="3" :ref="el => setFieldInputRef(file.__key, fieldKey, el)" :model-value="getFileField(file, fieldKey)" @update:model-value="val => setFileField(file, fieldKey, val)" :label="fieldLabel(fieldKey, field)" :rules="fieldRules(field)" style="max-width:360px; margin-top:6px" />
                  <q-input v-else-if="field.type === 'text'" dense outlined lazy-rules :ref="el => setFieldInputRef(file.__key, fieldKey, el)" :model-value="getFileField(file, fieldKey)" @update:model-value="val => setFileField(file, fieldKey, val)" :label="fieldLabel(fieldKey, field)" :rules="fieldRules(field)" style="max-width:360px; margin-top:6px" />
                </template>
              </q-item-section>
              <q-item-section v-if="file.__img" side>
                <img class="file-thumbnail" :src="file.__img.src">
              </q-item-section>
              <q-item-section v-else side class="file-icon-section">
                <q-btn flat round dense size="40px" color="grey-7" :icon="getFileIcon(file.type || file.name)" />
              </q-item-section>
              <q-item-section top side>
                <q-btn v-if="file.__status != 'uploaded'" class="gt-xs" size="12px" flat dense round icon="delete" @click="scope.removeFile(file)" />
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-uploader>
    </div>
    <div class="col-12" :class="{ 'col-md-7': !props.disable }">
      <div class="q-uploader column no-wrap full-width" :class="{ 'q-uploader--dark q-dark': $q.dark.isActive }">
        <div class="q-uploader__header">
          <div class="q-uploader__header-content column">
            <div class="flex flex-center no-wrap q-gutter-xs">
              <div class="col column justify-center">
                <div class="q-uploader__title">{{ $t('file.uploadedFiles') }}</div>
                <div class="q-uploader__subtitle">{{ props.title || '\u00A0' }}</div>
              </div>
              <q-btn flat dense icon="add" class="invisible" tabindex="-1" disable />
            </div>
          </div>
        </div>
        <div class="q-uploader__list scroll">
          <div v-if="!serverFiles.length" class="text-center text-grey-7">
            {{ $t('file.noUploadedFiles') }}
          </div>
          <q-list v-else separator>
            <q-item v-for="file in serverFiles" :key="file.id" :class="!file.used ? 'bg-warning q-pa-xs' : 'q-pa-xs'">
              <q-item-section class="q-ml-md">
                <q-item-label v-if="!props.hideTitle && file.title" style="width: 30;" caption>{{ $t('file.title') }}: {{ file.title }}</q-item-label>
                <template v-for="entry in metaEntries(file.meta)" :key="entry.key">
                  <q-item-label caption>{{ entry.label }}: {{ entry.value }}</q-item-label>
                  <q-item-label v-if="entry.description" caption class="text-grey-6" style="white-space: normal; word-break: break-word;">{{ entry.description }}</q-item-label>
                </template>
                <q-item-label caption>{{ $t('file.size') }}: {{ formatFileSize(file.size) }}</q-item-label>
                <q-item-label v-if="!file.used" caption class="text-negative">{{ $t('file.notSaved') }}</q-item-label>
              </q-item-section>
              <q-item-section v-if="file.id && isImageFile(file)" side>
                <img class="file-thumbnail file-thumbnail--clickable" :src="getDownloadUrl(file.id, true)" @click="openPreview(file)">
              </q-item-section>
              <q-item-section v-else-if="file.id" side>
                <q-btn flat round dense size="30px" color="grey-7" :icon="getFileIcon(file.mime_type)" @click="openPreview(file)" />
              </q-item-section>
              <q-item-section v-if="!props.disable" top side>
                <q-btn style="width: 10%;" class="gt-xs" size="12px" flat dense round icon="delete" @click="deleteFile(file.id)" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>
    <zen-dialog v-model="popup" show-maximize hide-footer no-scroll width="70vw" height="80vh" :title="popup.title" @onCancel="popup.visible = false;">
      <template #form>
        <div class="preview-container">
          <img v-if="isImageFile(popup)" class="preview-image" :src="popup.url" @click="popup.visible = true;">
          <iframe v-else-if="isPdfFile(popup)" class="preview-iframe" :src="popup.url" />
          <div v-else class="column items-center q-gutter-sm preview-fallback">
            <q-icon :name="getFileIcon(popup.mime_type)" size="150px" color="grey-7" />
            <div>{{ popup.title || 'File preview' }}</div>
            <q-btn color="primary" :href="popup.url" :download="popup.title || 'file'" :label="$t('file.download')" />
          </div>
        </div>
      </template>
    </zen-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef, useTemplateRef, inject, watch } from 'vue';
import { _baseURL, api } from 'src/boot/axios';
import { useLoginStore } from 'stores/loginStore';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import zenDialog from 'src/components/zen-dialog.vue';
import { validate } from 'src/utils/zenUtil';
import { registerFileSourceKey } from 'src/utils/injectionKeys';
import { formatFileSize, getDownloadUrl, getFileIcon, isImageFile, isPdfFile } from 'src/utils/crtblFiles';

const $q = useQuasar();
const { t } = useI18n();
const props = defineProps({
  sourceForm: { type: String, required: true },
  entityID: { type: Number, default: null },
  disable: { type: Boolean, default: true },
  title: { type: String, default: '' },
  fields: { type: Object, default: null },
  hideTitle: { type: Boolean, default: false },
  fillHeight: { type: Boolean, default: false },
});
const registerFileSource = inject(registerFileSourceKey, null);

const popup = ref({
  visible: false,
  title: '',
  url: '',
  mime_type: ''
});

const uploadUrl = _baseURL + '/crtbl/files';
const fileTitles = ref({});
const fileMetas = ref({});
const titleInputRefs = {};
const fieldInputRefs = {};
const loginStore = useLoginStore();
const uploader = useTemplateRef("uploader");
const serverFiles = ref([]);

onMounted(() => {
  loadFiles();
  if (props.disable)
    return;
  registerFileSource?.(props.sourceForm);
});

function loadFiles() {
  api.get(uploadUrl + `/${props.sourceForm}/${props.entityID ?? 0}/${props.disable ? 1 : 0}`).then(ret => {
    serverFiles.value = Array.isArray(ret?.data) ? ret.data : [];
  });
}
function fieldLabel(fieldKey, field) {
  return field?.title || fieldKey;
}
function isTreeItems(items) {
  return Array.isArray(items) && items.some(item => Array.isArray(item?.children));
}
function optionMenuTitle(opt) {
  if (!opt) return '';
  const label = opt.label || opt.key || '';
  const description = String(opt.description ?? '').trim();
  return description ? `${label}\n${description}` : label;
}
function flattenDropdownOptions(field) {
  const items = field?.items || [];
  if (!isTreeItems(items)) {
    return items.map(opt => ({
      ...opt,
      menuClass: '',
      menuTitle: optionMenuTitle(opt),
    }));
  }
  const options = [];
  items.forEach((group, groupIndex) => {
    const children = group?.children;
    if (!Array.isArray(children)) {
      if (group?.key != null) {
        options.push({
          ...group,
          menuClass: '',
          menuTitle: optionMenuTitle(group),
        });
      }
      return;
    }
    options.push({
      label: group.label,
      isGroup: true,
      disable: true,
      key: `__group_${groupIndex}`,
      menuClass: 'file-upload-dropdown__group',
      menuTitle: group.label || '',
    });
    children.forEach(child => {
      options.push({
        ...child,
        category: group.label,
        menuClass: 'file-upload-dropdown__child',
        menuTitle: optionMenuTitle(child),
      });
    });
  });
  return options;
}
const EMPTY_OPTIONS = Object.freeze([]);
const EMPTY_RULES = Object.freeze([]);

function buildDropdownCache(fields) {
  const optionsByField = Object.create(null);
  const itemSizeByField = Object.create(null);
  const rulesByField = Object.create(null);
  for (const [key, field] of Object.entries(fields || {})) {
    if (field?.type === 'dropdown') {
      const options = flattenDropdownOptions(field);
      optionsByField[key] = options;
      itemSizeByField[key] = options.some(opt => !!opt?.description) ? 40 : 24;
    }
    if (!field?.required) {
      rulesByField[key] = EMPTY_RULES;
      continue;
    }
    rulesByField[key] = [(val) => {
      if (field.type === 'dropdown')
        return val != null || t('validate.required');
      return validate.required(String(val ?? '').trim());
    }];
  }
  return { optionsByField, itemSizeByField, rulesByField };
}

// Build once; only rebuild if the fields prop reference changes.
const dropdownCache = shallowRef(buildDropdownCache(props.fields));
watch(() => props.fields, (fields) => {
  dropdownCache.value = buildDropdownCache(fields);
});

function fieldDropdownOptions(fieldKey) {
  return dropdownCache.value.optionsByField[fieldKey] || EMPTY_OPTIONS;
}
function fieldVirtualScrollItemSize(fieldKey) {
  return dropdownCache.value.itemSizeByField[fieldKey] || 24;
}
function fieldRulesCached(fieldKey, field) {
  return dropdownCache.value.rulesByField[fieldKey] ?? fieldRules(field);
}
function dropdownOptionLabel(opt) {
  if (!opt) return '';
  if (opt.isGroup) return opt.label || '';
  if (opt.category)
    return `${opt.category} - ${opt.label || ''}`;
  return opt.label || opt.key || '';
}
function metaEntries(meta) {
  if (!meta || typeof meta !== 'object') return [];
  return Object.entries(meta).flatMap(([key, value]) => {
    if (value == null) return [];
    const field = props.fields?.[key];
    let display = value;
    let description = '';
    if (typeof value === 'object') {
      display = dropdownOptionLabel(value) || value.key || '';
      description = String(value.description ?? '').trim();
    }
    display = String(display ?? '').trim();
    if (!display && !description) return [];
    if (!display) {
      display = description;
      description = '';
    }
    return [{ key, label: fieldLabel(key, field), value: display, description }];
  });
}
function openPreview(file) {
  if (!file?.id) return;
  popup.value.visible = true;
  popup.value.url = getDownloadUrl(file.id);
  popup.value.title = file.title || '';
  popup.value.mime_type = file.mime_type || '';
}
function deleteFile(id) {
  $q.dialog({
    title: t('file.delete'),
    message: t('file.deleteQuestion'),
    ok: { label: t('general.yes'), color: 'negative' },
    cancel: { label: t('general.no'), color: 'primary', autofocus: true },
    persistent: false,
  }).onOk(() => {
    api.delete(`/crtbl/files/${id}`).then(() => {
      loadFiles();
    });
  });
}
function setFileTitle(file, val) {
  if (!file?.__key) return;
  fileTitles.value[file.__key] = val;
  file.__title = val;
}
function setFileField(file, fieldKey, val) {
  if (!file?.__key) return;
  if (!fileMetas.value[file.__key])
    fileMetas.value[file.__key] = {};
  fileMetas.value[file.__key][fieldKey] = val;
}
function setTitleInputRef(key, el) {
  if (el) titleInputRefs[key] = el;
  else delete titleInputRefs[key];
}
function setFieldInputRef(fileKey, fieldKey, el) {
  const key = `${fileKey}:${fieldKey}`;
  if (el) fieldInputRefs[key] = el;
  else delete fieldInputRefs[key];
}
function getFileTitle(file) {
  return fileTitles.value[file?.__key] || file?.__title || '';
}
function getFileField(file, fieldKey) {
  return fileMetas.value[file?.__key]?.[fieldKey] ?? null;
}
function emptyFieldValue(field) {
  if (field?.type === 'dropdown') return null;
  return '';
}
function isFieldEmpty(field, val) {
  if (field?.type === 'dropdown') return val == null;
  return !String(val ?? '').trim();
}
function titleRequired(val) {
  return validate.required(String(val || '').trim());
}
function fieldRules(field) {
  if (!field?.required) return [];
  return [(val) => {
    if (field.type === 'dropdown')
      return val != null || t('validate.required');
    return validate.required(String(val ?? '').trim());
  }];
}
function validateAllMeta(files) {
  const list = files || uploader.value?.files || [];
  if (!props.hideTitle)
    Object.values(titleInputRefs).forEach(input => input?.validate?.());
  Object.values(fieldInputRefs).forEach(input => input?.validate?.());
  if (!props.hideTitle) {
    const missingTitle = list.some(file => !String(getFileTitle(file)).trim());
    if (missingTitle) {
      $q.notify({ type: 'negative', message: t('file.titleRequired') });
      return false;
    }
  }
  if (props.fields) {
    for (const file of list) {
      for (const [key, field] of Object.entries(props.fields)) {
        if (!field?.required) continue;
        if (isFieldEmpty(field, getFileField(file, key))) {
          $q.notify({ type: 'negative', message: `${fieldLabel(key, field)}: ${t('validate.required')}` });
          return false;
        }
      }
    }
  }
  return true;
}
function onUploadStart() {
  if (!validateAllMeta()) {
    uploader.value?.abort();
  }
}

function stripExtension(filename) {
  const name = String(filename || '');
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.slice(0, lastDot) : name;
}

function onAdded(files) {
  (files || []).forEach(file => {
    if (!file?.__key) return;
    if (!props.hideTitle && fileTitles.value[file.__key] === undefined) {
      const title = file.__title ?? stripExtension(file.name);
      fileTitles.value[file.__key] = title;
      file.__title = title;
    }
    if (fileMetas.value[file.__key] === undefined) {
      const meta = {};
      if (props.fields) {
        Object.entries(props.fields).forEach(([key, field]) => {
          meta[key] = emptyFieldValue(field);
        });
      }
      fileMetas.value[file.__key] = meta;
    }
  });
}

function onRemoved(file) {
  if (file && file.__key) {
    delete fileTitles.value[file.__key];
    delete fileMetas.value[file.__key];
    delete titleInputRefs[file.__key];
    Object.keys(fieldInputRefs).forEach(key => {
      if (key.startsWith(`${file.__key}:`))
        delete fieldInputRefs[key];
    });
  }
}
function onFailed(info) {
  if (!info?.xhr) return;
  if (info.xhr.status == 409) {
    const resOBJ = JSON.parse(info.xhr.responseText);
    $q.notify({ type: 'negative', message: t(`error.409.${resOBJ.key}`, resOBJ.data || {}, resOBJ.message) });
  }
  else if (info.xhr.status == 401)
    loginStore.refreshToken().then(() => {
      $q.notify({ type: 'positive', message: t('file.retryUpload') });
      setTimeout(() => uploader.value.upload(), 500);
    });
  else
    $q.notify({ type: 'negative', message: t(`error.${info.xhr.status}`, t('error.unknownError')) });
}
function onUploaded() {
  setTimeout(() => {
    uploader.value.reset();
  }, 5000);
  loadFiles();
}
function sanitizeDropdownValue(val) {
  if (val == null || typeof val !== 'object') return val ?? null;
  const out = {
    key: val.key,
    label: val.label,
  };
  if (val.category)
    out.category = val.category;
  const description = String(val.description ?? '').trim();
  if (description)
    out.description = description;
  return out;
}
function buildMetaPayload(fileKey) {
  const values = fileMetas.value[fileKey] || {};
  if (!props.fields) return {};
  const meta = {};
  Object.entries(props.fields).forEach(([key, field]) => {
    const val = values[key];
    if (field.type === 'dropdown')
      meta[key] = sanitizeDropdownValue(val);
    else
      meta[key] = val ?? '';
  });
  return meta;
}
function uploadFactory(files) {
  if (!validateAllMeta(files)) {
    return Promise.reject(new Error('validation failed'));
  }
  return {
    url: uploadUrl + `/${props.entityID ?? 0}`,
    method: 'POST',
    fieldName: file => file.__key,
    formFields: fileArr => {
      const meta = fileArr.map(file => {
        const entry = {
          key: file.__key,
          meta: buildMetaPayload(file.__key)
        };
        if (!props.hideTitle)
          entry.title = fileTitles.value[file.__key];
        return entry;
      });
      return [
        { name: 'metaData', value: JSON.stringify(meta) },
        { name: 'sourceForm', value: props.sourceForm }
      ];
    },
    headers: [{ name: 'Authorization', value: `Bearer ${loginStore.token}` }]
  }
}

</script>

<style scoped>
.is-disabled:not(.zen-file-upload--fill-height) .q-uploader {
  max-height: none;
  box-shadow: none;
}

.is-disabled:not(.zen-file-upload--fill-height) .q-uploader__list {
  min-height: calc(100vh - 220px);
}

.zen-file-upload--fill-height {
  flex: 1 1 auto;
  min-height: 100%;
  max-height: 100%;
  overflow: hidden;
  align-items: stretch;
}

.zen-file-upload--fill-height>[class*="col-"] {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.zen-file-upload--fill-height .q-uploader {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow: hidden;
}

.zen-file-upload--fill-height.is-disabled .q-uploader {
  box-shadow: none;
}

.zen-file-upload--fill-height .q-uploader__header {
  flex: 0 0 auto;
}

.zen-file-upload--fill-height .q-uploader__list {
  flex: 1 1 auto;
  min-height: 0;
}

.zen-file-upload--fill-height :deep(.q-uploader__list) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.file-thumbnail {
  display: block;
  width: 100px;
  height: 100px;
  object-fit: contain;
  object-position: center;
}

.file-thumbnail--clickable {
  cursor: pointer;
}

.file-icon-section {
  width: 100px;
  min-width: 100px;
  justify-content: center;
  align-items: center;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  cursor: pointer;
  object-fit: contain;
}

.preview-iframe {
  width: 100%;
  flex: 1;
  min-height: 0;
  border: 0;
  align-self: stretch;
}

.preview-fallback {
  flex: 1;
}
</style>

<style>
.file-upload-select {
  width: 100%;
  max-width: 360px;
  margin-top: 6px;
  min-width: 0;
}

.file-upload-select .q-field__control,
.file-upload-select .q-field__native {
  min-width: 0;
}

.file-upload-select .q-field__native {
  overflow: hidden;
}

.file-upload-select__value {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-upload-dropdown {
  max-width: 400px !important;
  width: 400px !important;
}

.file-upload-dropdown .file-upload-dropdown__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-upload-dropdown__group {
  opacity: 1 !important;
  cursor: default;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.04);
}

.body--dark .file-upload-dropdown__group {
  background: rgba(255, 255, 255, 0.08);
}

.file-upload-dropdown .file-upload-dropdown__child {
  padding-inline-start: 2rem !important;
}

.zen-file-upload-fill-host {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.zen-file-upload-fill-host>.col-12 {
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
}
</style>
