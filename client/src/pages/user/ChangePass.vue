<template>
  <q-form ref="form" class="q-pa-md" style="width: 100%">
    <q-input clearable v-model="model.password_current" type="password" lazy-rules :rules="[validate.required]" :label="$t('profile.passwordCurrent')">
      <template v-slot:prepend><q-icon name="lock" /></template>
    </q-input>
    <q-input clearable v-model="model.password_new1" type="password" lazy-rules :rules="[validate.required]" :label="$t('profile.passwordNew1')">
      <template v-slot:prepend><q-icon name="lock" /></template>
    </q-input>
    <q-input clearable v-model="model.password_new2" type="password" lazy-rules :rules="[validate.required, () => validate.same(model.password_new1, model.password_new2)]" :label="$t('profile.passwordNew2')">
      <template v-slot:prepend><q-icon name="lock" /></template>
    </q-input>
    <zen-captcha ref="captchaRef" v-model="model.captcha" path="/user/pass" />
  </q-form>
</template>

<script setup>
import { ref } from 'vue';
import { validate } from 'src/utils/zenUtil';
import { api } from 'src/boot/axios';
import zenCaptcha from 'src/components/zen-captcha.vue';

const model = ref({
  password_current: null,
  password_new1: null,
  password_new2: null,
  captcha: null,
  path: "/user/pass"
});
const form = ref();
const captchaRef = ref();

async function submit() {
  const valid = await form.value.validate();
  if (!valid)
    return;
  return api.post('/user/pass', model.value).then(ret=>
    {
      console.log("inside", ret);
      captchaRef.value?.refreshCaptcha();
      return ret;
    }
  );
}

defineExpose({ submit });

</script>