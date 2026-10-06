<template>
  <q-drawer v-model="model" side="right" bordered class="profile_drawer" :width="350" overlay>
    <q-scroll-area class="fit">
      <q-list padding>
        <q-item>
          <q-item-section avatar>
            <q-icon name="account_circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('profile.title') }}: {{ loginStore.userTitle }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar>
            <q-icon name="badge" />
          </q-item-section>
          <q-item-section>
            <q-select v-model="selectedRoleId" :options="loginStore.roleOptions" option-label="label" option-value="value" emit-value map-options :label1="$t('profile.rolename')" borderless dense stack-label dark popup-content-class="profile_role_popup" />
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="passPopup.visible = true">
          <q-item-section avatar>
            <q-icon name="lock" />
          </q-item-section>
          <q-item-section>{{ $t('profile.changePass') }}</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="sigPopup.visible = true">
          <q-item-section avatar>
            <q-icon name="draw" />
          </q-item-section>
          <q-item-section>{{ $t('profile.changeSignature') }}</q-item-section>
        </q-item>

        <q-separator inset class="q-my-sm" />

        <q-item clickable v-ripple @click="onLogout">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>{{ $t('menu.logout') }}</q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>

    <zen-dialog v-model="passPopup" :okText="$t('general.save')" :title="$t('profile.changePass')" style="width: 400px; height:480px; max-width: 100vw; max-height: 100vh" @onOK="onPassSave" @onCancel="passPopup.visible = false" :enabled="true">
      <template #form>
        <div class="full-width row justify-center q-gutter-sm q-py-sm">
          <change-pass ref="changePassRef" />
        </div>
      </template>
    </zen-dialog>

    <zen-dialog v-model="sigPopup" :okText="$t('general.save')" :title="$t('profile.changeSignature')" style="width: 400px; height:480px; max-width: 100vw; max-height: 100vh" @onOK="onSigSave" @onCancel="sigPopup.visible = false" :enabled="true">
      <template #form>
        <div class="full-width row justify-center q-gutter-sm q-py-sm">
          <change-signature ref="changeSigRef" />
        </div>
      </template>
    </zen-dialog>
  </q-drawer>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useLoginStore } from 'stores/loginStore';
import { useRouter } from 'vue-router';
import ZenDialog from 'src/components/zen-dialog.vue';
import ChangePass from 'src/pages/user/ChangePass.vue';
import ChangeSignature from 'src/pages/user/ChangeSignature.vue';

const model = defineModel({ required: true, default: () => true });
const loginStore = useLoginStore();
const router = useRouter();

const selectedRoleId = computed({
  get: () => loginStore.userInfo?.rid ?? null,
  set: rid => loginStore.changeRole(rid),
});

const passPopup = ref({
  visible: false,
  data: {},
});
const sigPopup = ref({
  visible: false,
  data: {},
});
const changePassRef = ref(null);
const changeSigRef = ref(null);

async function onPassSave() {
  const ret = await changePassRef.value?.submit?.();
  console.log("ret", ret);
  if (ret?.status == 200)
    passPopup.value.visible = false;
}

async function onSigSave() {
  const ret = await changeSigRef.value?.submit?.();
  if (ret?.status == 200)
    sigPopup.value.visible = false;
}

async function onLogout() {
  passPopup.value.visible = false;
  sigPopup.value.visible = false;
  model.value = false;
  await loginStore.logout(router);
}
</script>

<style>
.profile_drawer {
  direction: rtl;
}

.profile_drawer .q-router-link--active {
  border-radius: 50px 0px 0px 10px;
}

.profile_role_popup.q-menu {
  background-color: var(--q-drawer-bg);
}
</style>
