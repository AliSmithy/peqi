<template>
  <div v-show="visible" class="flow-job flow-job--hosted relative-position">
    <component v-if="dynamicRing" :is="dynamicRing" :key="ringKey" v-model="data" noInit :disable="disable || dont_watch_crtbl_flowjob" isPopup="true" class="flow-job__ring" @done="done" />
    <q-inner-loading :showing="isLoading || openingJob" color="primary" class="loading-background">
      <zen-spinner size="100px" color="accent" />
    </q-inner-loading>
  </div>
</template>
<script setup>
/* eslint-disable */
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { extend } from 'quasar';
import { useCrtblStore } from 'src/stores/crtblStore';
import { localizedTitle } from 'src/utils/zenUtil';
import zenSpinner from './zen-spinner.vue';

const { t } = useI18n();
const data = ref(null);
const visible = ref(false);
const isLoading = ref(false);
const dynamicRing = ref(null);
const ringKey = ref(0);
const task = ref(null);
const crtblStore = useCrtblStore();
const emit = defineEmits(['closed']);
const props = defineProps({
  dont_watch_crtbl_flowjob: { type: Boolean, default: false },
  /** View-only ring (e.g. opened from workflow timeline). */
  disable: { type: Boolean, default: false },
  /** Host is fetching another job while this layer is still showing. */
  openingJob: { type: Boolean, default: false },
});

const workspaceTitle = computed(() => {
  const init = data.value?.init;
  if (!init)
    return t('general.loading');
  return `${localizedTitle(init.flow_title)} - ${localizedTitle(init.ring_title)} (${t('crtbl.follow_code')}: ${data.value.follow_code ?? t('general.new')})`;
});

if (!props.dont_watch_crtbl_flowjob)
  watch(() => crtblStore.crtbl_flowjob, n => n && show(n));

/** Yield one full frame so the spinner is on screen before the ring mounts. */
function paint() {
  return nextTick().then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function clearRing() {
  dynamicRing.value = null;
  await nextTick();
  data.value = null;
  task.value = null;
}

async function show(taskObj) {
  await clearRing();
  task.value = taskObj;
  isLoading.value = true;
  ringKey.value += 1;
  visible.value = true;

  try {
    const { flow_name, ring_order } = taskObj.data.init;
    const module = await import(`src/pages/flow/${flow_name}/ring-${ring_order}.vue`);
    data.value = { ...taskObj.data };
    if (!props.dont_watch_crtbl_flowjob && !props.disable)
      crtblStore.reloadTask = data.value;

    await paint();

    dynamicRing.value = module.default;
    await nextTick();
  } finally {
    isLoading.value = false;
  }
}

/** Step away from the ring but keep it mounted, so coming back costs nothing. */
function conceal() {
  visible.value = false;
}

function reveal() {
  visible.value = true;
}

async function hide() {
  isLoading.value = false;
  visible.value = false;
  await clearRing();
  emit('closed');
}

function done({ ret, type }) {
  if (type == 'close') {
    hide();
  } else if (type == 'save') {
    crtblStore.reloadTask = ret.data;
    if (ret.key == 'saveOK') {
      hide();
    }
  }
}

/** Deep snapshot for host stack restore (job → work → other job → back). */
function snapshot() {
  if (!data.value?.init)
    return null;
  return {
    stat: task.value?.stat ?? crtblStore.crtbl_flowjob?.stat,
    data: extend(true, {}, data.value)
  };
}

defineExpose({
  show,
  hide,
  conceal,
  reveal,
  snapshot,
  isShown: computed(() => visible.value),
  hasRing: computed(() => dynamicRing.value != null),
  workspaceTitle,
});
</script>

<style scoped>
.flow-job--hosted {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.flow-job__ring {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  height: 100%;
  max-width: none !important;
}
</style>
