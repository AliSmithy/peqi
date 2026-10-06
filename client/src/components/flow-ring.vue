<template>
  <q-card ref="cardRef" class="q-pa-none flex column flow-ring" :class="props.isPopup ? 'flow-ring--popup' : props.colClass" :style="$attrs.style || cardStyle">
    <q-bar v-if="!props.isPopup" class="flow-ring__bar" :class="{ 'flow-ring__bar--compact': compactActions }">
      <div class="flow-ring__title">
        {{ title }}
        <q-tooltip>{{ title }}</q-tooltip>
      </div>
    </q-bar>
    <div v-if="!props.isPopup" class="flow-ring__steps q-ma-sm">
      <flow-steps
        :rings="crtblStore.rings"
        :current-order="taskCurrentOrder"
        :viewing-order="props.ring"
        :visited-orders="flowNav?.visitedOrders?.value"
        :interactive="stepsInteractive"
        :saved="!!(_model.id || _model.follow_code)"
        :task-id="_model.id"
        :follow-code="_model.follow_code || undefined"
        @select="onSelectStep"
      />
    </div>
    <div v-if="$slots.sticky && init && formI18nReady" class="flow-ring__sticky q-mx-sm q-px-sm">
      <slot name="sticky" :disable="props.disable" :model="_model" :data="_model.data" :colClass="props.colClass"></slot>
    </div>
    <q-scroll-area class="q-ma-sm q-px-sm grow" :delay="1200" ref="mainArea" style="flex: 1 1 auto;">
      <div v-if="props.underConstruction" class="q-mb-sm text-red bg-yellow-7 row items-center text-body1">
        <q-icon name="warning_amber" color="red" size="2em" class="q-mx-sm" />
        {{ $t('general.underConstruction') }}
      </div>
      <slot v-if="init && formI18nReady" name="form" :disable="props.disable" :model="_model" :data="_model.data" :colClass="props.colClass" :registerValidate="registerFormValidator"></slot>
    </q-scroll-area>
    <q-inner-loading :showing="isLoading" color="primary" class="loading-background">
      <zen-spinner size="100px" color="accent" />
    </q-inner-loading>
    <q-card-actions v-if="!props.disable && init" class="q-px-md dialog-bar flow-ring__actions" :class="{ 'flow-ring__actions--compact': compactActions }">
      <q-btn v-if="!props.isPopup && _model.follow_code" unelevated icon="add" color="accent" :stretch="compactActions" :label="$t('general.new')" @click="loadInit" />
      <template v-if="_model.status != 'f' && _model.own">
        <q-btn unelevated icon="save" color="secondary" :stretch="compactActions" :label="$t('crtbl.save')" @click="acts.popup('save')" />
        <q-btn v-if="init.policy?.forward == true" unelevated icon="send" color="primary" :class="{ 'flow-ring__icon--rtl': isRtlLocale }" :stretch="compactActions" :label="$t('crtbl.forward')" @click="acts.popup('forward')" />
        <q-btn v-else-if="init.policy?.forward == false" unelevated icon="done" color="primary" :stretch="compactActions" :label="$t('crtbl.finish')" @click="acts.popup('finish')" />
        <q-btn v-if="init.policy?.backward" unelevated icon="u_turn_left" color="primary" :class="{ 'flow-ring__icon--rtl': isRtlLocale }" :stretch="compactActions" :label="$t('crtbl.backward')" @click="acts.popup('backward')" />
        <q-btn v-if="init.policy?.cancel" unelevated icon="delete" color="negative" :stretch="compactActions" :label="$t('crtbl.cancel')" @click="acts.popup('cancel')" />
      </template>
      <template v-else>
        <span v-if="_model.status == 'f'" class="q-px-md">{{ $t('crtbl.finished_by') }}: {{ localizedTitle(_model.user_from) }}</span>
        <span v-else class="q-px-md">{{ $t('crtbl.user_to') }}: {{ localizedTitle(_model.user_to) }}</span>
      </template>
    </q-card-actions>
    <zen-dialog v-model="popup" :okText="popup.saveBtn" title="" style="width: 520px; height:400px; max-width: 100vw; max-height: 100vh" @onOK="acts.save" @onCancel="popup.visible = false;" :enabled="true">
      <template #form>
        <div class="q-gutter-y-sm">
          <div :class="['q-pa-sm rounded-borders', popup.type == 'cancel' ? 'bg-negative' : 'bg-info']">
            <span class="text-warning text-weight-bold text-h6">{{ $t(`crtbl.${popup.type}`) }}:</span>
            <span class="q-pl-sm text-white text-body1">{{ $t(`crtbl.${popup.type}MSG`, { rt: localizedTitle(targetRing?.title) }) }}</span>
          </div>
          <template v-if="!['save', 'cancel'].includes(popup.type)">
            <zen-lookup v-if="popup.type == 'forward'" class="col-12" filled baseAddr="crtbl" :lookupName="`tousers/${_model.init.flow_name}.${_model.init.ring_order}`" v-model="_model.to" :label="$t('crtbl.to')" />
            <q-input class="col-12" filled v-model="_model.note" type="textarea" :label="$t('crtbl.note')"></q-input>
          </template>
        </div>
      </template>
    </zen-dialog>
  </q-card>
</template>
<script setup>
/* eslint-disable_ */
import { api } from 'src/boot/axios';
import { computed, ref, watch, onMounted, onBeforeUnmount, provide, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import zenDialog from 'src/components/zen-dialog.vue';
import zenLookup from 'src/components/zen-lookup.vue';
import flowSteps from 'src/components/flow-steps.vue';
import zenSpinner from 'src/components/zen-spinner.vue';
import { extend } from 'quasar';
import { useCrtblStore } from 'src/stores/crtblStore';
import { useFormI18n } from 'src/i18n/loadForm';
import { registerFileSourceKey, flowNavKey, crtblValidateKey } from 'src/utils/injectionKeys';
import { localizedTitle } from 'src/utils/zenUtil';

const { t, locale } = useI18n();
const isRtlLocale = computed(() => locale.value.startsWith('fa'));
const crtblStore = useCrtblStore();
const flowNav = inject(flowNavKey, null);
const props = defineProps(
  {
    flow: { type: String },
    ring: { type: Number },
    isPopup: { type: Boolean, default: false },
    colClass: {
      type: String,
      default: "col-12 col-sm-6 col-md-4 col-lg-4"
    },
    noInit: { type: Boolean, default: false },
    disable: { type: Boolean, default: false },
    underConstruction: { type: Boolean, default: false },
    formI18n: { type: String, default: null },
    validate: { type: Function, default: null },
  },
);
const taskCurrentOrder = computed(() => (
  flowNav?.currentRingOrder?.value ?? props.ring
));
const stepsInteractive = computed(() => {
  if (!props.isPopup || !flowNav?.selectRing)
    return false;
  return !!(
    _model.value?.id
    || crtblStore.crtbl_flowjob?.stat?.task_id
    || crtblStore.crtbl_workflow?.stat?.task_id
  );
});
const model = defineModel({ required: true, default: () => ({}) });
const emit = defineEmits(['done']);

const formPath = props.formI18n || (props.flow && props.ring ? `${props.flow}.${props.ring}` : null);
const formI18nLoader = formPath ? useFormI18n(formPath) : null;
const formI18nReady = computed(() => formI18nLoader ? formI18nLoader.ready.value : true);

const isLoading = ref(true);
const cardRef = ref(null);
const compactActions = ref(false);
let cardObserver = null;
const init = computed(() => _model.value.init);
const cardStyle = ref(
  props.isPopup
    ? { height: '100%', maxHeight: '100%', width: '100%', maxWidth: '100%' }
    : { height: '100vh', maxHeight: '100vh' },
);
const title = computed(() => init.value ? `${localizedTitle(init.value.flow_title)} - ${localizedTitle(init.value.ring_title)} (${_model.value.follow_code ?? t('general.new')})` : t('general.loading'));
const targetRing = computed(() => {
  const ringOrder = init.value?.ring_order;
  if (ringOrder == null) return null;
  if (popup.value.type === 'forward') return crtblStore.nextRing(ringOrder);
  if (popup.value.type === 'backward') return crtblStore.previousRing(ringOrder);
  return null;
});
const _model = ref({});
const popup = ref({
  type: '',
  visible: false,
  data: {},
  saveBtn: computed(() => t(`crtbl.${popup.value.type}`))
});

watch(model, (val) => {
  _model.value = val ?? {};
  isLoading.value = !Object.keys(_model.value).length;
}, { immediate: true });

provide(registerFileSourceKey, (sourceForm) => {
  const m = _model.value;
  if (!m)
    return;
  if (!Array.isArray(m.file_sources))
    m.file_sources = [];
  if (!m.file_sources.includes(sourceForm))
    m.file_sources.push(sourceForm);
});

const formValidators = new Set();
function registerFormValidator(fn) {
  formValidators.add(fn);
  return () => formValidators.delete(fn);
}
provide(crtblValidateKey, registerFormValidator);

async function loadInit() {
  if (props.noInit || !props.flow || props.ring == null)
    return;
  isLoading.value = true;
  try {
    const data = await crtblStore.loadFlowInit(props.flow, props.ring);
    _model.value = data;
  } finally {
    isLoading.value = false;
  }
}

if (!props.noInit)
  watch(() => [props.flow, props.ring], loadInit, { immediate: true });

function onSelectStep(order) {
  if (!props.isPopup || !flowNav?.selectRing)
    return;
  flowNav.selectRing(order);
}

class acts {
  static async popup(type) {
    if (type !== 'cancel') {
      if (props.validate && await props.validate(type, _model.value) === false)
        return;
      for (const fn of formValidators) {
        if (await fn(type) === false)
          return;
      }
    }
    popup.value.type = type;
    popup.value.visible = true;
  }
  static async save() {
    const _data = extend(true, {}, _model.value);
    delete _data.init;
    delete _data.own;
    delete _data.user_to;
    delete _data.status;
    const ret = await api.post(`/crtbl/${popup.value.type}/${props.flow}/${props.ring}`, _data);
    if (ret.status == 200) {
      popup.value.visible = false;
      extend(true, _model.value, ret.data.data);
      emit('done', { type: 'save', ret: ret.data });
    }
  }
}

function viewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function updateCardHeight() {
  // Popup / workspace shell already owns the viewport — fill the parent.
  if (props.isPopup)
    return
  const header = document.querySelector('.q-header, header, .app-header');
  const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  cardStyle.value = { height: `${Math.max(0, Math.round(viewportHeight() - headerHeight))}px` };
}

const COMPACT_ACTIONS_MAX_WIDTH = 680;

function cardEl() {
  return cardRef.value?.$el ?? cardRef.value ?? null;
}

function syncCompactActions() {
  const el = cardEl();
  compactActions.value = !!(el && el.clientWidth <= COMPACT_ACTIONS_MAX_WIDTH);
}

onMounted(() => {
  updateCardHeight();
  if (!props.isPopup) {
    window.addEventListener('resize', updateCardHeight);
    window.visualViewport?.addEventListener('resize', updateCardHeight);
  }
  const el = cardEl();
  if (el && typeof ResizeObserver !== 'undefined') {
    cardObserver = new ResizeObserver(syncCompactActions);
    cardObserver.observe(el);
  }
  syncCompactActions();
});

onBeforeUnmount(() => {
  if (!props.isPopup) {
    window.removeEventListener('resize', updateCardHeight);
    window.visualViewport?.removeEventListener('resize', updateCardHeight);
  }
  cardObserver?.disconnect();
});
</script>

<style scoped>
.flow-ring {
  min-width: 0;
  max-width: 100%;
}

.flow-ring__bar {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  padding: 24px;
}

.flow-ring__title {
  display: block;
  font-size: 1em;
  min-width: 0;
  max-width: 100%;
  flex: 1 1 0%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-ring__bar--compact {
  padding: 8px 12px;
  min-height: 0;
}

.flow-ring__bar--compact .flow-ring__title {
  font-size: 0.8em;
}

@media (max-width: 599px) {
  .flow-ring__bar {
    padding: 8px 12px;
    min-height: 0;
  }

  .flow-ring__title {
    font-size: 0.8em;
  }
}

@media (max-width: 599px), (max-height: 500px) {
  .flow-ring__steps {
    margin: 4px 8px;
  }
}

.flow-ring--popup {
  width: 100%;
  max-width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: transparent;
  box-shadow: none;
}

.flow-ring__actions {
  flex: 0 0 auto;
  gap: 1px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
}

.flow-ring--popup :deep(.q-scroll-area) {
  min-height: 0;
}

.flow-ring__actions :deep(.q-btn) {
  min-width: 0;
}

.flow-ring__icon--rtl :deep(.q-icon) {
  transform: scaleX(-1);
}

.flow-ring__actions--compact {
  flex-wrap: nowrap;
  align-items: stretch;
}

.flow-ring__actions--compact :deep(.q-btn) {
  padding-inline: 4px;
  font-size: 0.9em;
}

.flow-ring__actions--compact :deep(.q-btn .q-icon) {
  font-size: 1.45em;
}

.flow-ring__actions--compact :deep(.q-btn .on-left),
.flow-ring__actions--compact :deep(.q-btn .on-right) {
  margin: 0 2px;
}

.flow-ring__steps {
  width: auto;
  min-width: 0;
  max-width: 100%;
  align-self: stretch;
}

.flow-ring__sticky {
  flex: 0 0 auto;
  align-self: stretch;
}
</style>

<style>
.q-scrollarea__content:has(.flow-ring-form-center) {
  height: 100%;
  width: 100%;
}

.flow-ring-form-center {
  box-sizing: border-box;
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
  padding: 1.5rem 1rem;
}

.flow-ring-form-center > p {
  max-width: 40rem;
  margin: 0;
}
</style>
