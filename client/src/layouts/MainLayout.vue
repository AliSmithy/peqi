<template>
  <q-layout view="hHh lpr fFf">

    <q-header elevated class="bg-primary text-white">
      <q-toolbar class="main-bar">
        <q-btn v-if="loginStore.hasToken" dense flat round icon="menu" @click="toggleMenu('mainMenu')" />
        <q-btn dense flat round icon="home" @click="$router.push('/')" />
        <q-space />
        <q-btn dense flat round icon="language">
          <q-tooltip>{{ $t('menu.lang') }}</q-tooltip>
          <q-menu>
            <q-list>
              <q-item clickable v-close-popup @click="setLocale('en-US')">
                <q-item-section>English</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setLocale('fa-IR')">
                <q-item-section>فارسی</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn round dense flat :icon="isDark ? 'light_mode' : 'dark_mode'" @click="toggleDarkMode">
          <q-tooltip>{{ isDark ? $t('menu.light') : $t('menu.dark') }}</q-tooltip>
        </q-btn>
        <q-btn v-if="loginStore.hasToken" dense flat round icon="new_releases" to="/changelog">
          <q-tooltip>{{ $t('changelog.title') }}</q-tooltip>
          <q-badge v-if="changelogStore.unseenCount" color="red" floating>{{ changelogStore.unseenCount }}</q-badge>
        </q-btn>
        <q-btn v-if="!loginStore.hasToken" round dense flat icon="login" to="/login">
          <q-tooltip>{{ $t('menu.login') }}</q-tooltip>
        </q-btn>
        <q-btn v-if="loginStore.hasToken" dense flat no-caps padding="xs sm" @click="toggleMenu('profileMenu')">
          <div class="row items-center no-wrap q-gutter-x-sm">
            <div class="column items-end">
              <span class="text-body2">{{ loginStore.userTitle }}</span>
              <span v-if="loginStore.selectedRoleTitle" class="text-caption" style="opacity: 0.85; line-height: 1.1">{{ loginStore.selectedRoleTitle }}</span>
            </div>
            <q-icon name="account_circle" size="sm" />
          </div>
        </q-btn>
      </q-toolbar>
    </q-header>

    <main-menu v-model="showMainMenu"></main-menu>
    <profile-menu v-model="showProfileMenu"></profile-menu>
    <q-page-sticky position="bottom-right" :offset="[10, 10]" style="z-index: 1000;">
      <q-btn dense color="accent" round icon="notifications" size="md" class="q-pa-lg" @click="notifStore.show">
        <q-badge v-if="notifStore.count" color="red" floating>{{ notifStore.count }}</q-badge>
      </q-btn>
    </q-page-sticky>
    <q-page-container class="main-layout__page-container">
      <div class="main-layout__content">
        <router-view />
        <flow-host />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useLoginStore } from 'stores/loginStore'
import { useNotifStore } from 'stores/notifStore';
import { useChangelogStore } from 'stores/changelogStore';
import { Quasar, Dark, LocalStorage, Lang, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import MainMenu from './MainMenu.vue';
import ProfileMenu from './ProfileMenu.vue';
import flowHost from 'src/components/flow-host.vue';
import faIR from 'quasar/lang/fa-IR'
import enUS from 'quasar/lang/en-US'

const loginStore = useLoginStore();
const notifStore = useNotifStore();
const changelogStore = useChangelogStore();
const $q = useQuasar()

const { locale } = useI18n();

const showMainMenu = ref(false)
const showProfileMenu = ref(false)
const isDark = computed(() => Dark.isActive)

onMounted(() => {
  if (!$q.screen.lt.md) {
    showMainMenu.value = LocalStorage.getItem("mainMenu") || false
  }
  showProfileMenu.value = false
  Dark.set(LocalStorage.getItem("darkMode") || false);
  setLocale(LocalStorage.getItem('lang'));
  notifStore.fetch();
  changelogStore.fetch();
});

function toggleMenu(menu) {
  const menus = {
    mainMenu: showMainMenu,
    profileMenu: showProfileMenu
  };
  menus[menu].value = !menus[menu].value;
  if (menu != 'profileMenu') {
    LocalStorage.setItem(menu, menus[menu].value);
    Object.keys(menus).forEach((key) => {
      if (key != menu) {
        menus[key].value = false;
        LocalStorage.setItem(key, false);
      }
    });
  }
}

function toggleDarkMode() {
  Dark.set(!Dark.isActive);
  LocalStorage.set('darkMode', Dark.isActive);
}

function setLocale(lang) {
  lang = lang || 'fa-IR';
  if (lang === 'fa') lang = 'fa-IR';
  if (lang === 'en') lang = 'en-US';
  Lang.set(lang);
  locale.value = lang;
  LocalStorage.set('lang', lang);
  Quasar.lang.set(lang == 'fa-IR' ? faIR : enUS);
  document.documentElement.dir = lang == 'fa-IR' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}
</script>

<style scoped>
.main-layout__page-container {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-layout__content {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
