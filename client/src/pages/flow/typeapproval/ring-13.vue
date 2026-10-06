<template>
  <flow-ring flow="typeapproval" :ring="13" form-i18n="typeapproval">
    <template #form="{ data, disable }">
      <div class="row q-col-gutter-sm">
        <q-input class="col-6" filled v-model="data.naciRegistrationNo" :label="$t('typeapproval.ring13.naciRegistrationNo')" :disable="disable" />
        <q-input class="col-6" filled v-model="data.certificateNo" :label="$t('typeapproval.ring13.certificateNo')" :disable="disable" />
        <q-checkbox class="col-12" v-model="data.naciSubmitted" :label="$t('typeapproval.ring13.naciSubmitted')" :disable="disable" />
        <q-checkbox class="col-12" v-model="data.finalApproval" :label="$t('typeapproval.ring13.finalApproval')" :disable="disable" />
        <q-banner class="col-12 bg-info text-white rounded-borders" v-if="data.finalApproval">
          {{ $t('typeapproval.ring13.finalApproval') }} — NACI
        </q-banner>
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import flowRing from 'src/components/flow-ring.vue';
</script>
