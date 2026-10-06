<template>
  <flow-ring flow="typeapproval" :ring="11" form-i18n="typeapproval">
    <template #form="{ data, disable }">
      <div class="row q-col-gutter-sm">
        <div class="col-12 text-subtitle1">{{ $t('typeapproval.ring11.openItems') }}</div>
        <q-markup-table class="col-12" flat bordered>
          <thead>
            <tr>
              <th>#</th>
              <th>{{ $t('typeapproval.ring3.desc') }}</th>
              <th>{{ $t('typeapproval.ring11.dueDate') }}</th>
              <th>{{ $t('typeapproval.common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data.openItems" :key="item.id">
              <td>{{ item.id }}</td>
              <td><q-input dense filled v-model="item.desc" :disable="disable" borderless /></td>
              <td><zen-date dense filled calendar="persian" v-model="item.dueDate" :disable="disable" /></td>
              <td><q-select dense filled emit-value map-options v-model="item.status" :options="statusOpts" :disable="disable" /></td>
            </tr>
          </tbody>
        </q-markup-table>
        <q-separator class="col-12 q-my-md" />
        <q-checkbox class="col-12" v-model="data.managerApproved" :label="$t('typeapproval.ring11.managerApproved')" :disable="disable" />
        <zen-date class="col-6" filled calendar="persian" v-model="data.approvalDate" :label="$t('typeapproval.ring11.approvalDate')" :disable="disable" />
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
  { value: 'open', label: t('typeapproval.common.pending') },
  { value: 'done', label: t('typeapproval.common.pass') },
]);
</script>
