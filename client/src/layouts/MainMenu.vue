<template>
  <q-drawer v-model="model" side="left" bordered :width="300">
    <q-scroll-area class="fit">
      <q-list padding>
        <template v-for="i in menuStore.items" :key="i.key">
          <q-separator v-if="i.key == '-'" inset class="q-my-sm" />
          <q-item v-else clickable v-ripple :to="i.url" @click="i.click">
            <q-item-section avatar>
              <q-icon v-if="i.icon" :name="i.icon" />
            </q-item-section>
            <!-- <q-item-section>{{ $t(`menu.${i.key}`) }}</q-item-section> -->
            <q-item-section>{{ localizedTitle(i.title) }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>
<script setup>
import { useMenuStore } from 'stores/menuStore';
import { onMounted } from 'vue';
import { localizedTitle } from 'src/utils/zenUtil';

const menuStore = useMenuStore();

const model = defineModel({ required: true, default: () => true });

onMounted(() => {
  menuStore.ensureLoaded();
});
</script>