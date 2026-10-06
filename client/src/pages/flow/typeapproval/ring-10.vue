<template>
  <flow-ring flow="typeapproval" :ring="10" form-i18n="typeapproval">
    <template #form="{ data, disable }">
      <div class="row q-col-gutter-sm">
        <q-input class="col-12" filled v-model="data.filterText" :label="$t('typeapproval.ring10.filter')" clearable :disable="disable">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-markup-table class="col-12 standards-table" flat bordered>
          <thead>
            <tr>
              <th>#</th>
              <th>{{ $t('typeapproval.ring10.code') }}</th>
              <th>{{ $t('typeapproval.ring10.title') }}</th>
              <th>{{ $t('typeapproval.common.result') }}</th>
              <th>{{ $t('typeapproval.ring10.evidence') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredStandards(data)" :key="row.no">
              <td>{{ row.no }}</td>
              <td dir="ltr">{{ row.code }}</td>
              <td>{{ row.title[$i18n.locale] || row.title['fa-IR'] }}</td>
              <td>
                <q-select dense filled emit-value map-options v-model="row.result" :options="resultOpts" :disable="disable" />
              </td>
              <td><q-input dense filled v-model="row.evidence" :disable="disable" /></td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import flowRing from 'src/components/flow-ring.vue';

const { t, locale } = useI18n();
const resultOpts = computed(() => [
  { value: 'pending', label: t('typeapproval.common.pending') },
  { value: 'pass', label: t('typeapproval.common.pass') },
  { value: 'fail', label: t('typeapproval.common.fail') },
]);

function filteredStandards(data) {
  const q = (data.filterText || '').trim().toLowerCase();
  const loc = locale.value;
  if (!q)
    return data.standards ?? [];
  return (data.standards ?? []).filter(s =>
    String(s.no).includes(q)
    || s.code.toLowerCase().includes(q)
    || (s.title[loc] || s.title['fa-IR'] || '').toLowerCase().includes(q)
  );
}
</script>

<style scoped>
.standards-table {
  max-height: 60vh;
  overflow: auto;
  display: block;
}
</style>
