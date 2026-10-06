<template>
  <zen-dialog v-model="popup" no-scroll :title="dialogTitle" :okText="t('general.save')" :enabled="!!editing" :hide-footer="!editing" width="720px" height="560px" @onOK="saveItem" @onCancel="onCancel">
    <template #form>
      <div v-if="!editing" class="column no-wrap lookup-manage lookup-manage--list">
        <div class="row no-wrap items-center lookup-manage__toolbar">
          <q-input class="col" dense outlined v-model="search" :label="t('general.search')" debounce="300" clearable @update:model-value="loadList" />
          <q-btn color="primary" icon="add" :label="t('general.new')" @click="startNew" />
        </div>
        <div class="lookup-manage__list">
          <q-markup-table flat dense bordered wrap-cells separator="cell" class="lookup-manage__table">
            <thead>
              <tr>
                <th>{{ t('lookup.title') }}</th>
                <th v-for="field in fields" :key="field.key">{{ fieldName(field) }}</th>
                <th class="lookup-manage__actions" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id" class="lookup-manage__row" @dblclick="pickItem(item)">
                <td>{{ localizedTitle(item.title) }}</td>
                <td v-for="field in fields" :key="field.key">{{ metaValue(item, field) }}</td>
                <td class="lookup-manage__actions" @dblclick.stop>
                  <q-btn flat round dense icon="edit" color="secondary" @click="startEdit(item)" />
                  <q-btn flat round dense icon="delete" color="negative" @click="confirmDelete(item)" />
                </td>
              </tr>
              <tr v-if="!items.length">
                <td :colspan="fields.length + 2" class="text-grey">{{ t('general.noData') }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </div>
      <div v-else class="column no-wrap lookup-manage lookup-manage--edit q-gutter-y-sm">
        <q-btn flat dense icon="arrow_back" color="primary" :label="t('general.back')" class="self-start" @click="editing = false" />
        <zen-locale-input v-model="form.title" dense outlined lazy-rules :label="`${t('lookup.title')} *`" :rules="[validateTitle]" />
        <template v-for="field in fields" :key="field.key">
          <zen-date v-if="field.type === 'date'" v-model="form.meta[field.key]" dense outlined lazy-rules calendar="persian" :label="fieldLabel(field)" :rules="fieldRules(field)" />
          <q-input v-else v-model="form.meta[field.key]" dense outlined lazy-rules :label="fieldLabel(field)" :rules="fieldRules(field)" />
        </template>
      </div>
    </template>
  </zen-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import zenDialog from 'src/components/zen-dialog.vue';
import zenLocaleInput from 'src/components/zen-locale-input.vue';
import zenDate from 'src/components/zen-date.vue';
import { localizedTitle } from 'src/utils/zenUtil';

const props = defineProps({
  lookupName: { type: String, required: true },
  baseAddr: { type: String, default: 'lookup' },
  parentID: { type: Number },
});
const emit = defineEmits(['saved', 'deleted', 'picked']);
const popup = defineModel({ default: () => ({ visible: false }) });

const { t } = useI18n();
const $q = useQuasar();
const search = ref('');
const items = ref([]);
const fields = ref([]);
const lookupTitle = ref(null);
const editing = ref(false);
const editId = ref(null);
const form = reactive({ title: {}, meta: {} });

const typeTitle = computed(() => {
  const name = localizedTitle(lookupTitle.value);
  if (name && name !== '-')
    return name;
  return props.lookupName || t('lookup.manage');
});

const dialogTitle = computed(() => {
  if (editing.value)
    return t(editId.value ? 'lookup.editNamed' : 'lookup.newNamed', { name: typeTitle.value });
  return t('lookup.manageNamed', { name: typeTitle.value });
});

watch(() => popup.value?.visible, (visible) => {
  if (!visible) {
    editing.value = false;
    return;
  }
  loadFields();
  loadList();
});

function fieldName(field) {
  const fromSchema = localizedTitle(field?.title);
  return (fromSchema && fromSchema !== '-') ? fromSchema : t(`lookup.fields.${field.key}`);
}

function fieldLabel(field) {
  const label = fieldName(field);
  return field.required ? `${label} *` : label;
}

function fieldRules(field) {
  if (!field.required)
    return [];
  return [val => {
    const s = val == null ? '' : String(val).trim();
    return !!s || t('validate.required');
  }];
}

function metaValue(item, field) {
  const val = item?.meta?.[field.key];
  if (val == null || String(val).trim() === '')
    return '';
  return String(val).trim();
}

function itemUrl(id) {
  return `${props.baseAddr}/${props.lookupName}${id != null ? `/${id}` : ''}`;
}

function listParams() {
  const params = { q: search.value || '' };
  if (props.parentID != null)
    params.p = props.parentID;
  return params;
}

async function loadFields() {
  const ret = await api.get(`${props.baseAddr}/${props.lookupName}/fields`);
  if (!ret || ret.status != 200) {
    fields.value = [];
    lookupTitle.value = null;
    return;
  }
  fields.value = Array.isArray(ret.data?.fields) ? ret.data.fields : [];
  lookupTitle.value = ret.data?.title ?? null;
}

async function loadList() {
  const ret = await api.get(`${props.baseAddr}/${props.lookupName}`, { params: listParams() });
  items.value = (ret && ret.status == 200 && Array.isArray(ret.data)) ? ret.data : [];
}

function emptyMeta() {
  const meta = {};
  for (const field of fields.value)
    meta[field.key] = '';
  return meta;
}

function startNew() {
  editId.value = null;
  form.title = {};
  form.meta = emptyMeta();
  editing.value = true;
}

function pickItem(item) {
  if (item?.id == null)
    return;
  emit('picked', { id: item.id, title: item.title, meta: item.meta || {} });
  popup.value.visible = false;
}

async function startEdit(item) {
  const ret = await api.get(itemUrl(item.id));
  if (!ret || ret.status != 200)
    return;
  editId.value = ret.data.id;
  form.title = { ...(ret.data.title || {}) };
  form.meta = { ...emptyMeta(), ...(ret.data.meta || {}) };
  editing.value = true;
}

function titleIsValid() {
  const title = form.title || {};
  return Object.values(title).some(v => typeof v === 'string' && v.trim());
}

function validateTitle() {
  return titleIsValid() || t('lookup.titleRequired');
}

function firstMissingRequiredField() {
  return fields.value.find(field => field.required && !String(form.meta[field.key] ?? '').trim());
}

async function saveItem() {
  const formOk = await popup.value.form?.validate?.();
  if (formOk === false)
    return;
  if (!titleIsValid()) {
    $q.notify({ type: 'negative', message: t('lookup.titleRequired') });
    return;
  }
  const missing = firstMissingRequiredField();
  if (missing) {
    $q.notify({ type: 'negative', message: `${fieldLabel(missing)}: ${t('validate.required')}` });
    return;
  }
  const payload = { title: form.title, meta: { ...form.meta } };
  if (props.parentID != null)
    payload.pid = props.parentID;
  const ret = editId.value
    ? await api.patch(itemUrl(editId.value), payload)
    : await api.post(itemUrl(), payload);
  if (!ret || ret.status != 200)
    return;
  const data = ret.data?.data || {};
  editing.value = false;
  await loadList();
  emit('saved', { id: data.id, title: data.title, meta: data.meta || {} });
}

function confirmDelete(item) {
  $q.dialog({
    title: t('lookup.deleteItem'),
    message: t('lookup.deleteQuestion', { name: localizedTitle(item.title) }),
    cancel: true,
    persistent: false,
  }).onOk(async () => {
    const ret = await api.delete(itemUrl(item.id));
    if (!ret || ret.status != 200)
      return;
    if (editId.value === item.id)
      editing.value = false;
    await loadList();
    emit('deleted', { id: item.id });
  });
}

function onCancel() {
  editing.value = false;
  popup.value.visible = false;
}
</script>

<style scoped>
.lookup-manage {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.lookup-manage--list {
  flex-wrap: nowrap;
  gap: 8px;
  overflow: hidden;
}

.lookup-manage--edit {
  overflow: auto;
}

.lookup-manage__toolbar {
  flex: 0 0 auto;
  gap: 8px;
}

.lookup-manage__list {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
}

.lookup-manage__table {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  user-select: none;
}

.lookup-manage__table :deep(table) {
  width: 100%;
}

.lookup-manage__table :deep(th) {
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
  background: var(--table-header-th, #e8f1f4);
}

.lookup-manage__row {
  cursor: pointer;
}

.lookup-manage__actions {
  width: 5.5rem;
  text-align: center;
  white-space: nowrap;
}
</style>
