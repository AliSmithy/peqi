<template>
  <flow-ring flow="typeapproval" :ring="7" form-i18n="typeapproval">
    <template #form="{ model, data, disable }">
      <div class="row q-col-gutter-sm">
        <div class="col-12 text-subtitle1">{{ $t('typeapproval.ring7.checklist') }}</div>
        <q-markup-table class="col-12" flat bordered>
          <thead>
            <tr>
              <th>{{ $t('typeapproval.ring7.item') }}</th>
              <th>{{ $t('typeapproval.common.result') }}</th>
              <th>{{ $t('typeapproval.ring6.comment') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in data.checklist" :key="i">
              <td>{{ row.item }}</td>
              <td><q-select dense filled emit-value map-options v-model="row.result" :options="resultOpts" :disable="disable" /></td>
              <td><q-input dense filled v-model="row.note" :disable="disable" /></td>
            </tr>
          </tbody>
        </q-markup-table>
        <div class="col-12 text-subtitle2">{{ $t('typeapproval.ring7.photos') }}</div>
        <zen-file-upload class="col-12" sourceForm="typeapproval.7" :entityID="model.id" :disable="disable" />
        <q-input class="col-12" type="textarea" filled v-model="data.inspectorNotes" :label="$t('typeapproval.ring7.inspectorNotes')" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import flowRing from 'src/components/flow-ring.vue';
import zenFileUpload from 'src/components/zen-file-upload.vue';

const { t } = useI18n();
const resultOpts = computed(() => [
  { value: 'pending', label: t('typeapproval.common.pending') },
  { value: 'pass', label: t('typeapproval.common.pass') },
  { value: 'fail', label: t('typeapproval.common.fail') },
]);
</script>
