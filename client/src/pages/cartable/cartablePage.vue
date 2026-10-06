<template>
  <q-page class="q-pa-md column no-wrap cartable-page">
    <q-card class="col column no-wrap cartable-card">
      <q-bar class="q-pa-md col-auto">
        <span class="text-h6">{{ $t('crtbl.title') }}</span>
      </q-bar>
      <div class="row col-auto">
        <div class="col">
          <div class="row q-col-gutter-xs q-pa-xs">
            <q-input :class="filterClass" dense filled dir="ltr" :label="$t('crtbl.follow_code')" v-model="model.follow_code" @keyup.enter="acts.search" @change="acts.search" />
            <q-select :class="filterClass" dense filled emit-value map-options :label="$t('crtbl.status')" v-model="model.status" :options="fixOpt.statuses" @update:model-value="acts.search" />
            <q-select :class="filterClass_lg1" dense filled emit-value map-options :label="$t('crtbl.user_from')" v-model="model.user_from" :options="fixOpt.me_others_all" @update:model-value="acts.search" />
            <q-select :class="filterClass_lg1" dense filled emit-value map-options :label="$t('crtbl.user_to')" v-model="model.user_to" :options="fixOpt.me_others_all" @update:model-value="acts.search" />
            <zen-date :class="filterClass" dense filled calendar="persian" no-unset v-model="model.date_from" :label="$t('crtbl.date_from')" />
            <zen-date :class="filterClass" dense filled calendar="persian" no-unset v-model="model.date_to" :label="$t('crtbl.date_to')" />
            <q-input :class="filterClass" dense filled :label="$t('crtbl.details')" v-model="model.details" @keyup.enter="acts.search" @change="acts.search" />
          </div>
        </div>
        <div class="col-auto">
          <div class="row q-gutter-xs q-mr-xs q-mt-sm full-height items-start">
            <q-btn round size="sm" icon="search" color="primary" :disable="loading" @click="acts.search">
              <q-tooltip>{{ $t('general.search') }}</q-tooltip>
            </q-btn>
            <q-btn round size="sm" icon="refresh" color="primary" :disable="loading" @click="acts.reset">
              <q-tooltip>{{ $t('general.reset') }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
      <zen-table-scroll ref="tableScrollRef" class="col q-pt-md zen-table cartable-table" style="border-color:var(--table-header-th)" row-key="id" :rows="rows" :loading="loading" :cols="cols" @onSelect="row => selected = [row]" @loadList="acts.loadList" @dblclick="acts.showPopup">
        <template #body-cell-details="{ row }">
          <div class="crtbl-details">
            <div v-for="key in detailFields" :key="key">
              <span class="crtbl-details__label">{{ $t(`crtbl.${key}`) }}: </span>
              <span>{{ row[key] || '—' }}</span>
            </div>
          </div>
        </template>
      </zen-table-scroll>
    </q-card>
  </q-page>
  <!-- <flow-job ref="wj" @reload-row="acts.reloadRow" /> -->
  <!-- <flow-work ref="wf" /> -->
</template>
<script setup>
/* eslint-disable_ */
import zenTableScroll from 'src/components/zen-table-scroll.vue';
import { computed, ref, watch } from 'vue';
import { api } from 'src/boot/axios';
import { extend } from 'quasar';
import { useCrtblStore } from 'src/stores/crtblStore';
import { useI18n } from 'vue-i18n';
import zenDate from 'src/components/zen-date.vue';
import jalaali from 'jalaali-js';

const { t, locale } = useI18n();

/** آبجکت ستون‌ها فقط با تغییر زبان دوباره ساخته میشود تا جدول بی‌دلیل رندر نشود */
const cols = computed(() => [
  // { field: 'id' },
  // // { field: 'flow_name' },
  // { field: 'own' },
  { label: '#', field: 'rn', align: 'center', style: 'width: 2ch', headerStyle: 'width: 2ch' },
  { label: t('crtbl.follow_code'), field: 'follow_code', align: 'left' },
  { label: t('crtbl.flow'), field: 'flow_title', align: 'left', locale: true },
  { label: t('crtbl.ring'), field: 'ring_title', align: 'left', locale: false, format: (val, row) => `${row.ring_order}/${row.ring_cnt}: ${val[locale.value]}` },
  { label: t('crtbl.details'), name: 'details', field: 'details', align: 'left' },
  { label: t('crtbl.status'), field: 'status', align: 'left', format: val => t(`crtbl.statuses.${val}`) },
  { label: t('crtbl.user_from'), field: 'user_from', align: 'left', locale: true },
  { label: t('crtbl.user_to'), field: 'user_to', align: 'left', locale: true },
  { label: t('crtbl.sent_at'), field: 'sent_at', align: 'left', datetime: true },
  { label: t('crtbl.seen_at'), field: 'seen_at', align: 'left', datetime: true },
]);

const rows = ref([]);
const loading = ref(false);
const selected = ref([]);
const tableScrollRef = ref(null);

const crtblStore = useCrtblStore();
const detailFields = ['vehicleModel', 'customerName', 'manufacturer', 'productType'];
const emptyFilter = () => ({
  follow_code: null,
  user_to: null,
  user_from: null,
  date_from: null,
  date_to: null,
  status: null,
  details: null
});
const model = ref(emptyFilter());

const filterClass = 'col-6 col-sm-6 col-md-4 col-lg-2';
const filterClass_lg1 = 'col-6 col-sm-6 col-md-4 col-lg-1';
/** بی‌اثر کردن پاسخ‌های در حال پرواز بعد از refresh */
let listGen = 0;
/** شرایط جستجوی اعمال شده؛ با دکمه جستجو از مدل عکسبرداری میشود
 * تا هنگام صفحه‌بندی با تغییرات اعمال نشده‌ی فرم مخلوط نشود */
let appliedFilter = {};

/** تبدیل تاریخ شمسی (yyyy/mm/dd) به میلادی (yyyy-mm-dd) برای فرستادن به سرور */
const persianToISO = str => {
  if (!str) return null;
  const [y, m, d] = String(str).split('/').map(Number);
  if (!y || !m || !d) return null;
  const { gy, gm, gd } = jalaali.toGregorian(y, m, d);
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
};

watch(() => crtblStore.reloadTask, n => {
  // console.log("reload Task", n);
  if (n == null) return;
  acts.reloadRow(n);
  crtblStore.reloadTask = null;
});
const fixOpt = computed(() => {
  return {
    me_others_all: [
      { value: 'me', label: t('crtbl.me_others_all.me') },
      { value: 'others', label: t('crtbl.me_others_all.others') },
      { value: null, label: t('crtbl.me_others_all.all') }
    ],
    statuses: [
      { value: 'n', label: t('crtbl.statuses.n') },
      { value: 't', label: t('crtbl.statuses.t') },
      { value: 'a', label: t('crtbl.statuses.a') },
      { value: 'f', label: t('crtbl.statuses.f') },
      { value: 'c', label: t('crtbl.statuses.c') },
      { value: null, label: t('crtbl.me_others_all.all') }
    ]
  }
});
class acts {
  /** بررسی کن ببین آیا میشه بارگذاری به استور منتقل بشه */
  static loadList({ nextPage, done }) {
    const gen = listGen;
    const replacing = nextPage?.value === 1;
    if (!replacing && loading.value == true) return;
    if (replacing)
      loading.value = true;
    const timeout = replacing ? null : setTimeout(() => { if (gen === listGen) loading.value = true; }, 300);
    api.get(`/crtbl/list/${nextPage?.value}`, { params: appliedFilter }).then(ret => {
      if (gen !== listGen) {
        clearTimeout(timeout);
        return;
      }
      const incoming = ret.data?.rows ?? [];
      if (replacing)
        rows.value = incoming;
      else if (incoming.length)
        rows.value.push(...incoming);
      done?.(ret.data);
      loading.value = false;
      clearTimeout(timeout);
    }).catch(() => {
      if (gen !== listGen) return;
      clearTimeout(timeout);
      loading.value = false;
      done?.({});
    });
  }
  static refresh() {
    listGen++;
    loading.value = true;
    selected.value = [];
    tableScrollRef.value?.refresh();
  }
  /** عکسبرداری از شرایط جستجو و بارگذاری مجدد فهرست */
  static search() {
    const m = model.value;
    const f = {};
    for (const key of ['follow_code', 'details']) {
      const v = m[key]?.trim();
      v && (f[key] = v);
    }
    m.user_to && (f.user_to = m.user_to);
    m.user_from && (f.user_from = m.user_from);
    m.status && (f.status = m.status);
    const _from = persianToISO(m.date_from);
    _from && (f.date_from = _from);
    const _to = persianToISO(m.date_to);
    _to && (f.date_to = _to);
    appliedFilter = f;
    acts.refresh();
  }
  /** پاک کردن شرایط جستجو و بارگذاری مجدد فهرست بدون فیلتر */
  static reset() {
    model.value = emptyFilter();
    appliedFilter = {};
    acts.refresh();
  }
  static showPopup() {
    crtblStore.loadJobOrFlow(selected.value[0].id);
  }
  static reloadRow(rowData) {
    const _row = rows.value.find(r => r.id == rowData.id);
    _row && extend(true, _row, rowData);
  }
}
</script>

<style scoped>
.cartable-page {
  height: calc(100vh - 50px) !important;
  height: calc(100dvh - 50px) !important;
  max-height: calc(100vh - 50px);
  max-height: calc(100dvh - 50px);
  min-height: 0 !important;
  overflow: hidden;
}

.cartable-card {
  min-height: 0;
  overflow: hidden;
}

.cartable-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.cartable-table :deep(.q-table__middle) {
  max-height: 100%;
}

.cartable-table :deep(td) {
  vertical-align: top;
}

.crtbl-details {
  line-height: 1.45;
  white-space: normal;
}

.crtbl-details::before {
  content: '';
  display: block;
  width: 18em;
  height: 0;
}

.crtbl-details__label {
  opacity: 0.7;
}
</style>
