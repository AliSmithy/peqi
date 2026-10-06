<template>
  <div>
    <img :src="`${_baseURL}/captcha?c=${cValue}&path=${props.path}`" class="captcha" />
    <q-input v-model="model" :label="$t('general.captcha')" lazy-rules class="full-width">
      <template v-slot:append>
        <q-icon name="refresh" class="cursor-pointer" @click="refreshCaptcha">
          <q-tooltip>{{ $t('general.refresh') }}</q-tooltip>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>
<script setup>
import { _baseURL } from 'src/boot/axios';
import { ref } from 'vue';

const cValue = ref(Date.now());
const model = defineModel({ required: true });
const props = defineProps(["path"]);

function refreshCaptcha() {
  cValue.value = Date.now();
}
defineExpose({ refreshCaptcha });

</script>
<style scoped>
.captcha {
  /* width: 100%; */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>