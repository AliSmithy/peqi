<template>
  <flow-ring flow="typeapproval" :ring="12" form-i18n="typeapproval">
    <template #form="{ data, disable }">
      <div class="row q-col-gutter-sm">
        <q-select class="col-6" filled emit-value map-options v-model="data.financialStatus" :options="finOpts" :label="$t('typeapproval.ring12.financialStatus')" :disable="disable" />
        <q-input class="col-6" filled v-model="data.finalInvoiceNo" :label="$t('typeapproval.ring12.finalInvoiceNo')" :disable="disable" />
        <q-input class="col-6" filled type="number" v-model.number="data.finalAmount" :label="$t('typeapproval.ring12.finalAmount')" :disable="disable" />
        <q-input class="col-6" filled type="number" v-model.number="data.paidAmount" :label="$t('typeapproval.ring12.paidAmount')" :disable="disable" />
        <q-linear-progress class="col-12" :value="paymentRatio(data)" color="positive" />
        <div class="col-12 text-caption">{{ Math.round(paymentRatio(data) * 100) }}% paid</div>
        <q-input class="col-12" type="textarea" filled v-model="data.billingNote" :label="$t('typeapproval.ring12.billingNote')" :disable="disable" />
        <q-checkbox class="col-12" v-model="data.paymentConfirmed" :label="$t('typeapproval.ring12.paymentConfirmed')" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import flowRing from 'src/components/flow-ring.vue';

const { t } = useI18n();
const finOpts = computed(() => [
  { value: 'unpaid', label: t('typeapproval.common.pending') },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: t('typeapproval.common.pass') },
]);

function paymentRatio(data) {
  const total = Number(data.finalAmount) || 0;
  const paid = Number(data.paidAmount) || 0;
  return total > 0 ? Math.min(paid / total, 1) : 0;
}
</script>
