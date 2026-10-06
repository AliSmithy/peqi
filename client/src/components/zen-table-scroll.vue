<template>
  <zen-table ref="tableRef" v-bind="$attrs" :pagination="pagination" :rows-per-page-options="[0]" :rows="rows" :loading="loading">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </zen-table>
</template>

<script setup>
import zenTable from 'src/components/zen-table.vue'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const rows = defineModel('rows', { required: true, default: () => [] });
const loading = defineModel('loading');
const nextPage = ref(1);
const lastPage = ref(1000);
const emit = defineEmits(["loadList"]);

/** ثابت نگه داشتنش مانع رندر دوباره‌ی کل جدول در هر تغییر state میشود */
const pagination = { rowsPerPage: 0 };

const tableRef = ref(null);
let scrollEl = null;
/** جلوگیری از درخواست تکراری همان صفحه هنگام اسکرول سریع */
let pending = false;
/** بی‌اثر کردن پاسخ‌های در حال پرواز بعد از refresh */
let loadId = 0;

function loadData() {
  if (pending || nextPage.value > lastPage.value) return;
  pending = true;
  const id = ++loadId;
  emit("loadList", {
    nextPage: nextPage, lastPage: lastPage, done: retData => {
      if (id !== loadId) return;
      const gotRows = retData.rows?.length > 0;
      if (gotRows) {
        lastPage.value = retData.lastPage;
        nextPage.value++;
      }
      pending = false;
      // اگر هنوز اسکرول ظاهر نشده (صفحه پر نشده) صفحه‌ی بعد را هم بگیر
      if (gotRows)
        nextTick(() => {
          if (id === loadId && scrollEl && scrollEl.scrollHeight <= scrollEl.clientHeight + 1)
            loadData();
        });
    }
  });
}
function onScroll() {
  const remaining = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
  if (remaining <= 200)
    loadData();
}
/** صفحه‌بندی را صفر کرده و لیست را از اول بارگذاری می‌کند */
function refresh() {
  loadId++;
  nextPage.value = 1;
  lastPage.value = 1000;
  pending = false;
  if (scrollEl) scrollEl.scrollTop = 0;
  nextTick(() => loadData());
}

onMounted(() => {
  scrollEl = tableRef.value?.qtable?.$el?.querySelector('.q-table__middle') ?? null;
  scrollEl?.addEventListener('scroll', onScroll, { passive: true });
  loadData();
});
onBeforeUnmount(() => {
  scrollEl?.removeEventListener('scroll', onScroll);
});

defineExpose({ refresh });
</script>
