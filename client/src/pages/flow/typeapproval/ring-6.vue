<template>
  <flow-ring flow="typeapproval" :ring="6" form-i18n="typeapproval">
    <template #form="{ data, disable }">
      <div class="row q-col-gutter-sm">
        <div class="col-12 text-subtitle1">{{ $t('typeapproval.ring6.reviews') }}</div>
        <q-markup-table class="col-12" flat bordered>
          <thead>
            <tr>
              <th>{{ $t('typeapproval.ring6.doc') }}</th>
              <th>{{ $t('typeapproval.ring6.reviewer') }}</th>
              <th>{{ $t('typeapproval.common.result') }}</th>
              <th>{{ $t('typeapproval.ring6.comment') }}</th>
              <th>{{ $t('typeapproval.ring6.resubmit') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in data.reviews" :key="i">
              <td>{{ row.doc }}</td>
              <td><zen-lookup dense filled lookupName="reviewers" v-model="row.reviewer" :disable="disable" /></td>
              <td><q-select dense filled emit-value map-options v-model="row.result" :options="resultOpts" :disable="disable" /></td>
              <td><q-input dense filled v-model="row.comment" :disable="disable" /></td>
              <td><q-checkbox v-model="row.resubmit" :disable="disable" dense /></td>
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
import zenLookup from 'src/components/zen-lookup.vue';

const { t } = useI18n();
const resultOpts = computed(() => [
  { value: 'pending', label: t('typeapproval.common.pending') },
  { value: 'pass', label: t('typeapproval.common.pass') },
  { value: 'fail', label: t('typeapproval.common.fail') },
]);
</script>
