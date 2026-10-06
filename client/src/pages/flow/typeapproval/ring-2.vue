<template>
  <flow-ring flow="typeapproval" :ring="2" form-i18n="typeapproval">
    <template #form="{ model, data, disable }">
      <div class="row q-col-gutter-sm">
        <q-input class="col-6" filled v-model="data.manufacturer" :label="$t('typeapproval.ring2.manufacturer')" :disable="disable" />
        <q-input class="col-6" filled v-model="data.model" :label="$t('typeapproval.ring2.model')" :disable="disable" />
        <q-input class="col-6" filled dir="ltr" v-model="data.vinFrom" :label="$t('typeapproval.ring2.vinFrom')" :disable="disable" />
        <q-input class="col-6" filled dir="ltr" v-model="data.vinTo" :label="$t('typeapproval.ring2.vinTo')" :disable="disable" />
        <q-input class="col-6" filled v-model="data.contactName" :label="$t('typeapproval.ring2.contactName')" :disable="disable" />
        <q-input class="col-6" filled dir="ltr" v-model="data.contactPhone" :label="$t('typeapproval.ring2.contactPhone')" :disable="disable" />
        <div class="col-12 text-subtitle2 q-mt-sm">{{ $t('typeapproval.ring2.components') }}</div>
        <q-markup-table class="col-12" flat bordered>
          <thead><tr><th>{{ $t('typeapproval.ring2.componentName') }}</th><th>{{ $t('typeapproval.ring2.standard') }}</th></tr></thead>
          <tbody>
            <tr v-for="(c, i) in data.components" :key="i">
              <td><q-input dense filled v-model="c.name" :disable="disable" borderless /></td>
              <td><q-input dense filled v-model="c.standard" :disable="disable" borderless /></td>
            </tr>
          </tbody>
        </q-markup-table>
        <q-checkbox class="col-12" v-model="data.declarationAccepted" :label="$t('typeapproval.ring2.declaration')" :disable="disable" />
        <zen-file-upload class="col-12" sourceForm="typeapproval.2" :entityID="model.id" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import flowRing from 'src/components/flow-ring.vue';
import zenFileUpload from 'src/components/zen-file-upload.vue';
</script>
