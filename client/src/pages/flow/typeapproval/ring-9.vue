<template>
  <flow-ring flow="typeapproval" :ring="9" form-i18n="typeapproval">
    <template #form="{ data, disable }">
      <div class="row q-col-gutter-sm">
        <div class="col-12 text-subtitle1">{{ $t('typeapproval.ring9.technicalReports') }}</div>
        <q-markup-table class="col-12" flat bordered>
          <thead>
            <tr>
              <th>{{ $t('typeapproval.ring9.reportTitle') }}</th>
              <th>{{ $t('typeapproval.ring9.author') }}</th>
              <th>{{ $t('typeapproval.common.date') }}</th>
              <th>{{ $t('typeapproval.common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in data.technicalReports" :key="i">
              <td><q-input dense filled v-model="r.title" :disable="disable" borderless /></td>
              <td><q-input dense filled v-model="r.author" :disable="disable" borderless /></td>
              <td><zen-date dense filled calendar="persian" v-model="r.date" :disable="disable" /></td>
              <td><q-select dense filled emit-value map-options v-model="r.status" :options="statusOpts" :disable="disable" /></td>
            </tr>
          </tbody>
        </q-markup-table>
        <q-input class="col-12" type="textarea" filled v-model="data.overallConclusion" :label="$t('typeapproval.ring9.overallConclusion')" :disable="disable" />
        <div class="col-12 text-subtitle2">{{ $t('typeapproval.ring9.nonConformities') }}</div>
        <q-markup-table class="col-12" flat bordered>
          <thead>
            <tr>
              <th>#</th>
              <th>{{ $t('typeapproval.ring3.desc') }}</th>
              <th>{{ $t('typeapproval.ring9.severity') }}</th>
              <th>{{ $t('typeapproval.common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nc in data.nonConformities" :key="nc.id">
              <td>{{ nc.id }}</td>
              <td><q-input dense filled v-model="nc.desc" :disable="disable" borderless /></td>
              <td><q-select dense filled emit-value map-options v-model="nc.severity" :options="severityOpts" :disable="disable" /></td>
              <td><q-select dense filled emit-value map-options v-model="nc.status" :options="ncStatusOpts" :disable="disable" /></td>
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
import zenDate from 'src/components/zen-date.vue';

const { t } = useI18n();
const statusOpts = computed(() => [
  { value: 'draft', label: t('typeapproval.common.pending') },
  { value: 'approved', label: t('typeapproval.common.pass') },
]);
const severityOpts = computed(() => [
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'critical', label: 'Critical' },
]);
const ncStatusOpts = computed(() => [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
]);
</script>
