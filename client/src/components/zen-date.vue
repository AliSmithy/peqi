<template>
  <q-input v-bind="$attrs" v-model="model" mask="####/##/##">
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="model" v-bind="$attrs" calendar="persian" :range="props.range" today-btn>
            <div class="row items-center justify-start">
              <q-btn v-close-popup :label="$t('general.close')" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
<script setup>

const model = defineModel({ required: true, default: null });

// const date = computed({
//   get() {
//     // return toJalaali(model.value ?? new Date());
//     return zenUtil.gregorianToPersian(model.value);
//   },
//   set(v) {
//     model.value = zenUtil.persianToGregorian(v);
//   }
// });
// const display = computed(() => {
//   let ret = '';
//   // (model.value?.from) && (ret += `${t('general.from')} ${model.value.from} `);
//   // (model.value?.to) && (ret += `${t('general.until')} ${model.value.to}`);
//   (ret == '') && (ret = model.value);
//   return ret;
// });
const props = defineProps({
  calendar: { type: String, default: 'persian' },
  range: { type: Boolean, default: false }
});
</script>