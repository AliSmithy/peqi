<template>
  <q-select ref="selectRef" v-bind="$attrs" v-model="_model.selected" :options="_model.options" @filter="getLookup" map-options emit-value use-input behavior="menu" input-debounce="300" @update:model-value="updateModel" @popup-show="onPopupShow">
    <template v-if="canManage" v-slot:prepend>
      <q-btn flat dense round size="sm" icon="add" color="primary" tabindex="-1" @click.stop="openManage">
        <q-tooltip>{{ $t('lookup.manage') }}</q-tooltip>
      </q-btn>
    </template>
    <template v-if="$attrs.multiple != undefined" v-slot:option="scope">
      <q-item @click="scope.toggleOption(scope.opt)" clickable>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-checkbox v-model="scope.selected" @update:model-value="(val) => scope.toggleOption(scope.opt)" />
        </q-item-section>
      </q-item>
    </template>
    <template v-else-if="optionMeta" v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}<template v-if="scope.opt.extra"> — {{ scope.opt.extra }}</template></q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
  <zen-lookup-manage v-if="canManage && lookupName" v-model="managePopup" :lookup-name="lookupName" :base-addr="baseAddr" :parentID="parentID" @saved="onManagedSave" @picked="onManagedSave" @deleted="onManagedDelete" />
</template>

<script setup>
import { api } from 'src/boot/axios';
import { computed, getCurrentInstance, ref, useAttrs, watch } from 'vue';
import zenLookupManage from 'src/components/zen-lookup-manage.vue';
import { localizedTitle } from 'src/utils/zenUtil';

const instance = getCurrentInstance();
const attrs = useAttrs();
const emit = defineEmits(['autofill']);
defineOptions({ inheritAttrs: false });

const props = defineProps({
  baseAddr: { type: String, default: 'lookup' },
  lookupName: { type: String },
  parentID: { type: Number },
  loadMeta: { type: Boolean, default: false },
  optionMeta: { type: String, default: '' },
});
const model = defineModel({ default: () => ({ selected: null, options: [] }) });
const managePopup = ref({ visible: false });
const selectRef = ref(null);
let abortFilter = null;

const canManage = computed(() => {
  if (attrs.disable || attrs.readonly)
    return false;
  return props.baseAddr === 'lookup' && !!props.lookupName;
});

const _model = computed(() => {
  return {
    selected: model.value?.selected,
    options: model.value?.options?.map(i => {
      const extra = props.optionMeta ? (i.meta?.[props.optionMeta] ?? '') : '';
      return { value: i.value, label: localizedTitle(i.label), extra };
    }) || []
  }
});

/** ریست کردن در صورت تغییر پرنت و عدم تغییر خودش */
watch([model, () => props.parentID], ([nM, nP], [oM, oP]) => {
  (oM?.selected == nM?.selected && oP != nP) && (model.value = { selected: null, options: [] });
});

function hideSelectPopup() {
  abortFilter?.();
  abortFilter = null;
  selectRef.value?.hidePopup?.();
  selectRef.value?.blur?.();
}

function openManage() {
  hideSelectPopup();
  if (!managePopup.value)
    managePopup.value = { visible: true };
  else
    managePopup.value.visible = true;
}

function onPopupShow() {
  if (managePopup.value?.visible)
    hideSelectPopup();
}

function upsertOption(id, title, meta) {
  if (!model.value)
    model.value = { selected: null, options: [] };
  const options = [...(model.value.options || [])];
  const idx = options.findIndex(o => o.value == id);
  const opt = { value: id, label: title, meta: meta || null };
  if (idx >= 0)
    options[idx] = opt;
  else
    options.unshift(opt);
  model.value = { selected: id, options };
}

async function loadItemMeta(id) {
  if (id == null || id === '')
    return;
  const ret = await api.get(`${props.baseAddr}/${props.lookupName}/${id}`);
  if (ret && ret.status == 200)
    emit('autofill', { id: ret.data.id, title: ret.data.title, meta: ret.data.meta || {} });
}

function updateModel(val) {
  if (!model.value)
    model.value = { selected: null, options: [] };
  model.value.selected = val;
  if (!props.loadMeta)
    return;
  if (val == null || val === '')
    emit('autofill', { id: null, title: null, meta: {} });
  else
    loadItemMeta(val);
}

function onManagedSave(payload) {
  if (payload?.id == null)
    return;
  upsertOption(payload.id, payload.title, payload.meta);
  if (props.loadMeta)
    emit('autofill', { id: payload.id, title: payload.title, meta: payload.meta || {} });
}

function onManagedDelete({ id }) {
  if (!model.value)
    return;
  const cleared = model.value.selected == id;
  const options = (model.value.options || []).filter(o => o.value != id);
  model.value = { selected: cleared ? null : model.value.selected, options };
  if (cleared && props.loadMeta)
    emit('autofill', { id: null, title: null, meta: {} });
}

/** بارگزاری محتوای لوکاپ به همراه جستجو */
async function getLookup(str, update, abort) {
  abortFilter = abort;
  if (managePopup.value?.visible) {
    abort();
    return;
  }
  const _params = { q: str };
  const hasParentID = Object.hasOwn(instance.vnode.props, "parentID");
  if (hasParentID)
    _params.p = props.parentID ?? 0;
  const ret = await api.get(`${props.baseAddr}/${props.lookupName}`, { params: _params });
  if (managePopup.value?.visible) {
    abort();
    return;
  }
  if (ret && ret.status == 200) {
    update(() => {
      model.value = {
        selected: model.value?.selected,
        options: ret?.data.map(x => { return { label: x.title, value: x.id, meta: x.meta || null } }) ?? []
      };
    });
  }
  else
    abort();
}
</script>
