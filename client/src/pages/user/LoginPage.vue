<template>
  <q-page class="column flex justify-center items-center">
    <div class="row">
      <q-card class="auth-card">
        <q-card-section class="text-center">
          <div class="text-h5 text-weight-bold">{{ $t('login.title') }}</div>
        </q-card-section>
        <q-card-section>
          <q-form ref="form" class="q-pa-md" style="width: 400px; max-width: 80vw;">
            <q-input ref="username" clearable v-model="model.username" type="text" lazy-rules :rules="[validate.required]" :label="$t('login.username')">
              <template v-slot:prepend><q-icon name="person" /></template>
            </q-input>
            <q-input ref="password" clearable v-model="model.password" :type="model.passwordFieldType" lazy-rules :rules="[validate.required]" :label="$t('login.password')">
              <template v-slot:prepend><q-icon name="lock" /></template>
              <template v-slot:append>
                <q-icon :name="model.visibilityIcon" class="cursor-pointer" @mousedown="passMouseDNUP(true)" @mouseup="passMouseDNUP(false)" @mouseleave="passMouseDNUP(false)" />
              </template>
            </q-input>
            <zen-captcha v-if="model.showCaptcha" ref="captchaRef" v-model="model.captcha" path="/user/login" />
          </q-form>
        </q-card-section>
        <q-card-actions class="q-px-lg">
          <q-btn unelevated size="lg" color="primary" @click="submit" class="full-width text-white q-ma-md" :label="$t('login.title')" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
/* eslint-disable */
import { useLoginStore } from 'stores/loginStore';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { validate } from 'src/utils/zenUtil';
import { LocalStorage } from 'quasar';
import zenCaptcha from 'src/components/zen-captcha.vue';

const router = useRouter();
const form = ref();
const captchaRef = ref();
const model = ref({
  username: '',
  password: '',
  captcha: '',
  visibility: false,
  passwordFieldType: "password",
  visibilityIcon: "visibility",
  showCaptcha: false
});
model.value.username = LocalStorage.getItem("username");

async function submit() {
  console.log("model", model.value);
  // return;
  const valid = await form.value.validate();
  // LocalStorage.removeItem("username");
  if (valid) {
    try {
      await useLoginStore().login(router, model.value);
    } catch (err) {
      if (model.value.showCaptcha)
        captchaRef.value?.refreshCaptcha();
      else
        model.value.showCaptcha = true;
    }
  }
}

function passMouseDNUP(status) {
  model.value.visibility = status;
  model.value.passwordFieldType = model.value.visibility ? 'text' : 'password';
  model.value.visibilityIcon = model.value.visibility ? 'visibility_off' : 'visibility'
}
</script>
