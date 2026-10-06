<template>
  <flow-ring flow="typeapproval" :ring="4" form-i18n="typeapproval">
    <template #form="{ model, data, disable }">
      <div class="row q-col-gutter-sm">
        <div class="col-12 text-subtitle1">{{ $t('typeapproval.ring4.documents') }}</div>
        <q-markup-table class="col-12" flat bordered>
          <thead>
            <tr>
              <th>{{ $t('typeapproval.ring6.doc') }}</th>
              <th>{{ $t('typeapproval.ring4.received') }}</th>
              <th>{{ $t('typeapproval.ring4.receivedDate') }}</th>
              <th>{{ $t('typeapproval.common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in data.documents" :key="doc.key">
              <td>{{ doc.label }}</td>
              <td><q-checkbox v-model="doc.received" :disable="disable" dense /></td>
              <td><zen-date dense filled calendar="persian" v-model="doc.receivedDate" :disable="disable || !doc.received" /></td>
              <td>
                <q-select dense filled emit-value map-options v-model="doc.status" :options="statusOpts" :disable="disable" />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
        <zen-file-upload class="col-12" sourceForm="typeapproval.4" :entityID="model.id" :disable="disable" />
        <q-input class="col-12" type="textarea" filled v-model="data.notes" :label="$t('typeapproval.common.notes')" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import flowRing from 'src/components/flow-ring.vue';
import zenDate from 'src/components/zen-date.vue';
import zenFileUpload from 'src/components/zen-file-upload.vue';

const { t } = useI18n();
const statusOpts = computed(() => [
  { value: 'pending', label: t('typeapproval.common.pending') },
  { value: 'pass', label: t('typeapproval.common.pass') },
  { value: 'fail', label: t('typeapproval.common.fail') },
]);
</script>
