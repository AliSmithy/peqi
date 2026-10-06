<template>
  <flow-ring flow="typeapproval" :ring="14" form-i18n="typeapproval">
    <template #form="{ model, data, disable }">
      <div class="row q-col-gutter-sm">
        <q-input class="col-6" filled v-model="data.reportNo" :label="$t('typeapproval.ring14.reportNo')" :disable="disable" />
        <zen-date class="col-6" filled calendar="persian" v-model="data.issuedDate" :label="$t('typeapproval.ring14.issuedDate')" :disable="disable" />
        <zen-date class="col-6" filled calendar="persian" v-model="data.validityFrom" :label="$t('typeapproval.ring14.validityFrom')" :disable="disable" />
        <zen-date class="col-6" filled calendar="persian" v-model="data.validityTo" :label="$t('typeapproval.ring14.validityTo')" :disable="disable" />
        <q-card class="col-12" flat bordered>
          <q-card-section>
            <div class="text-subtitle2">{{ $t('typeapproval.ring14.preview') }}</div>
            <div class="q-pa-md bg-grey-2 rounded-borders q-mt-sm">
              <div class="text-h6">گزارش تأیید نوع</div>
              <div>{{ data.reportNo || '—' }}</div>
              <div class="text-caption q-mt-sm">PEQI — پایش کیفیت آزما پارت</div>
            </div>
          </q-card-section>
          <q-card-actions>
            <q-btn color="primary" icon="print" :label="$t('general.print')" :disable="disable" />
          </q-card-actions>
        </q-card>
        <zen-file-upload class="col-12" sourceForm="typeapproval.14" :entityID="model.id" :disable="disable" />
        <q-input class="col-12" type="textarea" filled v-model="data.archiveNote" :label="$t('typeapproval.ring14.archiveNote')" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import flowRing from 'src/components/flow-ring.vue';
import zenDate from 'src/components/zen-date.vue';
import zenFileUpload from 'src/components/zen-file-upload.vue';
</script>
