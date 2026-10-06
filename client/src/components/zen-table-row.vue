<template>
  <q-tr :class="['cursor-pointer', { 'willdel-row': willDel, selected: selected }]" @click="emit('select', row)" @dblclick="emit('dblclick')">
    <q-td v-for="col in cols" :key="col.name" :class="'text-' + (col.align || 'right')" :style="col.style" :width="col.width">
      <q-btn v-if="col.type == 'btn' && col.visible(row)" dense flat :icon="col.icon" size="md" v-close-popup @click="col.onClick(row)" />
      <render-slot v-else-if="cellSlots['body-cell-' + col.name]" :render="() => cellSlots['body-cell-' + col.name]({ value: cellValue(col), row })" />
      <span v-else>
        <template v-if="col.lookup">
          {{ lookupLabel(col) }}
        </template>
        <template v-else-if="col.treelookup">
          {{ treelookupLabel(cellValue(col)?.selected, cellValue(col)?.options) }}
        </template>
        <template v-else-if="col.datetime">
          {{ localizedDateTime(cellValue(col)) }}
        </template>
        <span v-else>{{ col.locale ? cellValue(col)?.[locale] : cellValue(col) }}</span>
      </span>
    </q-td>
  </q-tr>
</template>

<script setup>
import { computed } from 'vue';
import { localizedDateTime } from 'src/utils/zenUtil';

const props = defineProps({
  row: { type: Object, required: true },
  cols: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false },
  locale: { type: String, default: 'fa' },
  cellSlots: { type: Object, default: () => ({}) }
});
const emit = defineEmits(['select', 'dblclick']);

const willDel = computed(() => (props.row.flag & 0b1) === 0b1);

/** رندر اسلات سلول سفارشی که از zen-table پاس داده شده */
const RenderSlot = p => p.render();
RenderSlot.props = ['render'];

/** همان محاسبه‌ی مقدار سلول در q-table: مقدار فیلد + اعمال format */
function cellValue(col) {
  const raw = typeof col.field === 'function' ? col.field(props.row) : props.row[col.field];
  return col.format ? col.format(raw, props.row) : raw;
}
function lookupLabel(col) {
  const { selected, options } = cellValue(col) ?? {};
  if (!options) return '';
  if (Array.isArray(selected)) {
    return options
      .filter(o => selected.includes(o.value))
      .map(o => col.locale ? o.label?.[props.locale] : o.label)
      .join('، ');
  }
  const x = options.find(o => o.value === selected);
  return col.locale ? x?.label?.[props.locale] : x?.label;
}
function treelookupLabel(selected, options = []) {
  if (!options) return '';
  for (const n of options) {
    if (n.value === selected)
      return (n.label?.[props.locale] ?? '');
    if (n.children) {
      const r = treelookupLabel(selected, n.children);
      if (r) return r;
    }
  }
  return '';
}
</script>
