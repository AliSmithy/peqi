<template>
  <flow-ring flow="typeapproval" :ring="5" form-i18n="typeapproval">
    <template #form="{ data, disable }">
      <div class="row q-col-gutter-sm">
        <q-checkbox class="col-12" v-model="data.proformaConfirmed" :label="$t('typeapproval.ring5.proformaConfirmed')" :disable="disable" />
        <zen-date class="col-6" filled calendar="persian" v-model="data.processStartDate" :label="$t('typeapproval.ring5.processStartDate')" :disable="disable" />
        <zen-lookup class="col-6" filled lookupName="inspectors" v-model="data.inspectorTeam" multiple :label="$t('typeapproval.ring5.inspectorTeam')" :disable="disable" />
        <q-input class="col-12" type="textarea" filled v-model="data.confirmationNote" :label="$t('typeapproval.ring5.confirmationNote')" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import flowRing from 'src/components/flow-ring.vue';
import zenDate from 'src/components/zen-date.vue';
import zenLookup from 'src/components/zen-lookup.vue';
</script>
