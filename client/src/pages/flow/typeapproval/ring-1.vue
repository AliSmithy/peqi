<template>
  <flow-ring flow="typeapproval" :ring="1" form-i18n="typeapproval">
    <template #form="{ model, data, disable }">
      <div class="row q-col-gutter-sm">
        <q-input class="col-6" filled v-model="data.letterNo" :label="$t('typeapproval.ring1.letterNo')" :disable="disable" />
        <zen-date class="col-6" filled calendar="persian" v-model="data.letterDate" :label="$t('typeapproval.ring1.letterDate')" :disable="disable" />
        <zen-lookup class="col-6" filled lookupName="applicants" v-model="data.applicant" :label="$t('typeapproval.ring1.applicant')" :disable="disable" />
        <zen-lookup class="col-6" filled lookupName="referralTargets" v-model="data.referralTarget" :label="$t('typeapproval.ring1.referralTarget')" :disable="disable" />
        <q-input class="col-4" filled v-model="data.vehicleModel" :label="$t('typeapproval.ring1.vehicleModel')" :disable="disable" />
        <q-input class="col-4" filled v-model="data.productType" :label="$t('typeapproval.ring1.productType')" :disable="disable" />
        <q-input class="col-4" filled v-model="data.manufacturer" :label="$t('typeapproval.ring1.manufacturer')" :disable="disable" />
        <zen-file-upload class="col-12" sourceForm="typeapproval.1" :entityID="model.id" :disable="disable" />
        <q-input class="col-12" type="textarea" filled v-model="data.notes" :label="$t('typeapproval.common.notes')" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import flowRing from 'src/components/flow-ring.vue';
import zenDate from 'src/components/zen-date.vue';
import zenLookup from 'src/components/zen-lookup.vue';
import zenFileUpload from 'src/components/zen-file-upload.vue';
</script>
