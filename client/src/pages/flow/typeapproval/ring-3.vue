<template>
  <flow-ring flow="typeapproval" :ring="3" form-i18n="typeapproval">
    <template #form="{ data, disable }">
      <div class="row q-col-gutter-sm">
        <q-input class="col-6" filled v-model="data.invoiceNo" :label="$t('typeapproval.ring3.invoiceNo')" :disable="disable" />
        <zen-date class="col-6" filled calendar="persian" v-model="data.invoiceDate" :label="$t('typeapproval.ring3.invoiceDate')" :disable="disable" />
        <q-markup-table class="col-12" flat bordered>
          <thead>
            <tr>
              <th>{{ $t('typeapproval.ring3.desc') }}</th>
              <th>{{ $t('typeapproval.ring3.qty') }}</th>
              <th>{{ $t('typeapproval.ring3.unitPrice') }}</th>
              <th>{{ $t('typeapproval.common.amount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in data.lineItems" :key="i">
              <td><q-input dense filled v-model="row.desc" :disable="disable" borderless /></td>
              <td><q-input dense filled type="number" v-model.number="row.qty" :disable="disable" borderless /></td>
              <td><q-input dense filled type="number" v-model.number="row.unitPrice" :disable="disable" borderless /></td>
              <td class="text-left" dir="ltr">{{ formatNum((row.qty || 0) * (row.unitPrice || 0)) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="3" class="text-right">{{ $t('typeapproval.ring3.subtotal') }}</td><td dir="ltr">{{ formatNum(calcSubtotal(data)) }}</td></tr>
            <tr><td colspan="3" class="text-right">{{ $t('typeapproval.ring3.vat') }} ({{ data.vatPercent }}%)</td><td dir="ltr">{{ formatNum(calcVat(data)) }}</td></tr>
            <tr><td colspan="3" class="text-right text-weight-bold">{{ $t('typeapproval.ring3.total') }}</td><td dir="ltr" class="text-weight-bold">{{ formatNum(calcTotal(data)) }}</td></tr>
          </tfoot>
        </q-markup-table>
        <q-input class="col-4" filled type="number" v-model.number="data.vatPercent" :label="$t('typeapproval.ring3.vat')" :disable="disable" />
        <q-input class="col-8" filled v-model="data.paymentTerms" :label="$t('typeapproval.ring3.paymentTerms')" :disable="disable" />
      </div>
    </template>
  </flow-ring>
</template>
<script setup>
import flowRing from 'src/components/flow-ring.vue';
import zenDate from 'src/components/zen-date.vue';

function formatNum(n) {
  return (Number(n) || 0).toLocaleString('fa-IR');
}
function calcSubtotal(data) {
  return (data.lineItems ?? []).reduce((s, r) => s + (r.qty || 0) * (r.unitPrice || 0), 0);
}
function calcVat(data) {
  return calcSubtotal(data) * ((data.vatPercent || 0) / 100);
}
function calcTotal(data) {
  return calcSubtotal(data) + calcVat(data);
}
</script>
