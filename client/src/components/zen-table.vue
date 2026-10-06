<template>
  <q-table ref="qtable" v-bind="$attrs" flat dense bordered hide-bottom :rows="_rows" row-key="id" :class="['q-pt-none', 'zen-table', $attrs.class]" :no-data-label="$t('general.noData')" separator="cell" :title="$attrs.title" :columns="namedColumns" card-container-class="bg-orange" :loading="loading">
    <template #top-right v-if="props.enabled">
      <div class="q-gutter-xs">
        <q-badge v-if="hasChange" align="middle" color="warning" class="q-mr-sm q-pa-xs">{{ $t('general.hasChange') }}</q-badge>
        <q-btn dense size="sm" class="btn-new" icon="add" @click="act.onNew"><q-tooltip>{{ $t('general.C') }}</q-tooltip></q-btn>
        <q-btn dense size="sm" class="btn-edit" icon="edit" @click="act.onEdit" :disable="!selected.length"><q-tooltip>{{ $t('general.U') }}</q-tooltip></q-btn>
        <q-btn dense size="sm" class="btn-delete" icon="delete" @click="act.onDelete" :disable="!selected.length"><q-tooltip>{{ $t('general.D') }}</q-tooltip></q-btn>
      </div>
    </template>
    <template v-slot:header="slotProps">
      <q-tr :props="slotProps">
        <q-th v-for="col in slotProps.cols" :key="col.name" :props="slotProps">{{ col.label }}</q-th>
      </q-tr>
    </template>
    <template v-slot:body="slotProps">
      <zen-table-row :key="slotProps.key" :row="slotProps.row" :cols="namedColumns" :selected="slotProps.key === selectedKey" :locale="locale" :cell-slots="slots" @select="act.onSelectRow" @dblclick="act.onDblClick" />
    </template>
    <template v-slot:loading>
      <q-inner-loading :showing="true" color="primary" class="loading-background">
        <q-spinner-gears size="100px" color="accent" />
      </q-inner-loading>
    </template>
  </q-table>
  <zen-dialog v-model="_popup" :okText="$t('general.save')" :title="$attrs.title" :enabled="props.enabled" :style="[{
    maxWidth: '100vw', maxHeight: '100vh'
  }, ...props.popup.style ?? []]" @onOK="act.onPopupOkClick" @onCancel="isEditing = false; _popup.visible = false;">
    <template v-slot:form>
      <slot name="form" :data="_popup.data"></slot>
    </template>
  </zen-dialog>
</template>

<script setup>
import { ref, watch, computed, getCurrentInstance, toRef, useSlots } from 'vue';
import zenDialog from 'src/components/zen-dialog.vue';
import zenTableRow from 'src/components/zen-table-row.vue';
import { extend } from 'quasar';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const slots = useSlots();

// const rows = defineModel('rows', { required: true, default: () => [] });
const cols = defineModel('cols', { required: true, default: () => [] });
const loading = defineModel('loading');
// const model = defineModel({ required: true, default: () => [] });
let modelCopy = [];
// const model = toRef(rows.value);
const emit = defineEmits(["onNew", "new", "onEdit", "edit", 'onBeforeSave', "beforeSave", "onPopupOkClick", "popupOkClick", "onSelect"]);

const props = defineProps({
  enabled: { type: Boolean, default: false },
  popup: { type: Object, default: () => ({}) },
  rows: { type: Array, default: () => [] }
});
const _rows = toRef(props, 'rows');

const namedColumns = computed(() => {
  return cols.value.map((col, index) => ({
    ...col, name: col.name || col.field || `col_${index}`
  }));
});

// const emit = defineEmits(['update:selected', 'onDblClick']);
const selected = ref([]);
const selectedKey = computed(() => selected.value[0]?.id);
const isEditing = ref(false);
const hasChange = ref(false);
const _popup = ref({
  visible: false,
  data: {},//computed(() => selected.value[0])
  form: {}
});
const qtable = ref(null);
const instance = getCurrentInstance();
const hasNewListener = computed(() => {
  const vnodeProps = instance?.vnode?.props || {};
  return !!(vnodeProps.onNew || vnodeProps['on-new']);
});
const hasEditListener = computed(() => {
  const vnodeProps = instance?.vnode?.props || {};
  return !!(vnodeProps.onEdit || vnodeProps['on-edit']);
});
const hasBeforeSaveListener = computed(() => {
  const vnodeProps = instance?.vnode?.props || {};
  return !!(vnodeProps.onBeforeSave || vnodeProps['on-before-save']);
});
const hasPopupOkListener = computed(() => {
  const vnodeProps = instance?.vnode?.props || {};
  return !!(vnodeProps.onPopupOkClick || vnodeProps['on-popup-ok-click']);
});
watch(() => props.enabled, n => {
  if (hasChange.value) {
    _rows.value.splice(0, _rows.value.length, ...modelCopy);
    _rows.value.forEach(row => (row.flag !== undefined) && (row.flag = 0));
  }
  if (!n) {
    selected.value = [];
    _rows.value.forEach(row => delete row.flag);
  }
  isEditing.value = false;
  hasChange.value = false;
  modelCopy = extend(true, [], _rows.value);
});
class act {
  static async onPopupOkClick() {
    let allow = true;
    if (hasBeforeSaveListener.value) {
      await emit('beforeSave', {
        form: _popup.value.form,
        data: _popup.value.data,
        cancel: () => { allow = false; }
      });
      if (!allow) return;
    }
    if (hasPopupOkListener.value) {
      await emit('popupOkClick', {
        data: _popup.value.data,
        form: _popup.value.form,
        close: () => { _popup.value.visible = false; },
        preventClose: () => { _popup.value.visible = true; },
      });
      return;
    }
    else {
      if (selected.value && selected.value.length && _popup.value.data) {
        Object.assign(selected.value[0], _popup.value.data);
        if (selected.value[0].flag != 0b10)
          selected.value[0].flag = 0b100;
      } else if ((!selected.value || !selected.value.length) && _popup.value.data)
        _rows.value.push({ ..._popup.value.data, flag: 0b10 });
      isEditing.value = false;
      _popup.value.visible = false;
      _popup.value.data = null;
      hasChange.value = true;
    }
  }
  static async onPopupOkClick_() {
    let allow = true;
    if (hasBeforeSaveListener.value) {
      // console.log("_popup.value=", _popup.value);
      await emit('beforeSave', {
        form: _popup.value.form,
        data: _popup.value.data,
        cancel: () => { allow = false; }
      });
      if (!allow) return;
    }
    if (selected.value && selected.value.length && _popup.value.data) {
      Object.assign(selected.value[0], _popup.value.data);
      if (selected.value[0].flag != 0b10)
        selected.value[0].flag = 0b100;
    } else if ((!selected.value || !selected.value.length) && _popup.value.data)
      _rows.value.push({ ..._popup.value.data, flag: 0b10 });

    isEditing.value = false;
    _popup.value.visible = false;
    _popup.value.data = null;
    hasChange.value = true;
  }
  static onNew() {
    isEditing.value = true;
    if (hasNewListener.value) {
      /** اگر ایونت تعریف شده پوپاپ با دیتای اولیه بارگزاری میشود*/
      emit('new', {
        done: ret => {
          _popup.value.visible = true;
          _popup.value.data = { ...ret };
        }
      });
    } else {
      _popup.value.visible = true;
      _popup.value.data = {};
    }
    selected.value = [];
  }
  static onEdit() {
    if (!selected.value.length) return;
    isEditing.value = true;
    if (hasEditListener.value) {
      /** اگر ایونت تعریف شده پوپاپ با استفاده از دیتای ایونت نشان داده میشود*/
      emit('edit', {
        data: selected.value[0],
        done: ret => {
          // console.log("emit is called");
          _popup.value.visible = true;
          _popup.value.data = { ...ret };
        }
      });
    } else {
      /** در صورت عدم تعریف ایونت دیتای لوکال جدول برای پوپاپ استفاده میشود */
      // console.log("not emit");
      _popup.value.visible = true;
      _popup.value.data = { ...selected.value[0] };
    }
  }
  static onDelete() {
    // console.log("onDelete -> selected.value", selected.value);
    if (!selected.value.length) return;
    const _f = selected.value[0]?.flag ?? 0;
    if (_f && 0b10 & _f) {
      const _idx = _rows.value.findIndex(r => r.id === selected.value[0].id);
      if (_idx > -1) _rows.value.splice(_idx, 1);
      selected.value = [];
    } else
      selected.value[0].flag = (_f & 0b1) ? _f & ~0b1 : _f | 0b1;
    // console.log("selected.value[0]", selected.value[0].flag, selected.value[0]);
    hasChange.value = true;
    // const _row = _rows.value.find(x => x.id == selected.value[0].id);
    // console.log("onDelete rows", _row.flag, _row);
  }
  static onSelectRow(row) {
    selected.value = [row];
    emit('onSelect', row);
  }
  static onDblClick() {
    if (Object.keys(props.popup).length === 0) return;
    act.onEdit();
  }
  static update(data) {
    modelCopy = [];
    (data) && _rows.value?.splice(0, _rows.value.length, ...data);
    hasChange.value = false;
  }
}
defineExpose({ update: act.update, qtable });
</script>