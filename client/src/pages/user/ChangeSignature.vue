<template>
  <q-form ref="form" class="q-pa-md" style="width: 100%">
    <div v-if="previewSrc" class="row justify-center q-mb-md">
      <img :src="previewSrc" class="signature-preview" alt="" />
    </div>
    <div v-else class="text-center text-grey-7 q-mb-md">
      {{ $t('profile.signatureEmpty') }}
    </div>
    <q-file v-model="file" accept="image/png,.png" clearable outlined dense lazy-rules :rules="[validateFile]" :label="$t('profile.signatureFile')">
      <template v-slot:prepend><q-icon name="draw" /></template>
    </q-file>
    <div class="text-caption text-grey-7 q-mt-sm">{{ $t('profile.signatureHint') }}</div>
  </q-form>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';

const { t } = useI18n();
const form = ref();
const file = ref(null);
const previewSrc = ref(null);
const currentSrc = ref(null);

const MAX_BYTES = 100 * 1024;

function validateFile(val) {
  if (!val)
    return t('profile.signatureRequired');
  const f = Array.isArray(val) ? val[0] : val;
  if (!f)
    return t('profile.signatureRequired');
  const type = String(f.type || '').toLowerCase();
  const name = String(f.name || '').toLowerCase();
  if (type !== 'image/png' && !name.endsWith('.png'))
    return t('profile.signaturePngOnly');
  if (f.size > MAX_BYTES)
    return t('profile.signatureMaxSize');
  return true;
}

watch(file, (val) => {
  const f = Array.isArray(val) ? val[0] : val;
  if (!f) {
    previewSrc.value = currentSrc.value;
    return;
  }
  const url = URL.createObjectURL(f);
  previewSrc.value = url;
});

async function loadCurrent() {
  const ret = await api.get('/user/signature', { noNotify: true });
  if (ret?.status == 200 && ret.data?.src) {
    currentSrc.value = ret.data.src;
    if (!file.value)
      previewSrc.value = ret.data.src;
  }
}

async function submit() {
  const valid = await form.value.validate();
  if (!valid)
    return;
  const f = Array.isArray(file.value) ? file.value[0] : file.value;
  if (!f)
    return;
  const fd = new FormData();
  fd.append('file', f);
  return api.post('/user/signature', fd).then(ret => {
    if (ret?.status == 200) {
      currentSrc.value = previewSrc.value;
      file.value = null;
    }
    return ret;
  });
}

onMounted(loadCurrent);

defineExpose({ submit });
</script>

<style scoped>
.signature-preview {
  max-width: 100%;
  max-height: 140px;
  object-fit: contain;
}
</style>
