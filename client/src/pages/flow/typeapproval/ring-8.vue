<template>
  <flow-ring flow="typeapproval" :ring="8" form-i18n="typeapproval">
    <template #form="{ model, data, disable }">
      <div class="row q-col-gutter-sm">
        <q-input class="col-6" filled v-model="data.facilityName" :label="$t('typeapproval.ring8.facilityName')" :disable="disable" />
        <zen-date class="col-6" filled calendar="persian" v-model="data.visitDate" :label="$t('typeapproval.ring8.visitDate')" :disable="disable" />
        <q-input class="col-12" filled v-model="data.facilityAddress" :label="$t('typeapproval.ring8.facilityAddress')" :disable="disable" />
        <div class="col-12 text-subtitle1">{{ $t('typeapproval.ring8.qmsSections') }}</div>
        <q-markup-table class="col-12" flat bordered>
          <thead>
            <tr>
              <th>{{ $t('typeapproval.ring8.section') }}</th>
              <th>{{ $t('typeapproval.ring3.desc') }}</th>
              <th>{{ $t('typeapproval.ring8.score') }}</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in data.qmsSections" :key="i">
              <td>{{ row.section }}</td>
              <td>{{ row.title }}</td>
              <td><q-input dense filled type="number" :min="0" :max="row.max" v-model.number="row.score" :disable="disable" /></td>
              <td>{{ row.max }}</td>
            </tr>
          </tbody>
        </q-markup-table>
        <zen-file-upload class="col-12" sourceForm="typeapproval.8" :entityID="model.id" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import flowRing from 'src/components/flow-ring.vue';
import zenDate from 'src/components/zen-date.vue';
import zenFileUpload from 'src/components/zen-file-upload.vue';
</script>
