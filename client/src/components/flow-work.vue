<template>
  <div v-show="popupWf.visible" class="flow-work">
    <div class="flow-work-form">
      <div class="flow-work-form__body">
        <div class="flow-work-timeline">
          <template v-for="(i, idx) in popupWf.data" :key="i.rn">
            <div
              class="flow-work-step"
              :class="`flow-work-step--${stepTone(i)}`"
              @click="requestOpenJob(i)"
            >
              <div class="flow-work-step__rail">
                <div class="flow-work-step__node flex flex-center">
                  {{ i.ring_order }}
                </div>
                <div v-if="idx < popupWf.data.length - 1" class="flow-work-step__connector" :class="`flow-work-step__connector--${stepTone(popupWf.data[idx + 1])}`">
                  <span class="flow-work-step__arrow" />
                </div>
              </div>
              <div class="flow-work-step__card">
                <div class="flow-work-step__header">
                  <div class="flow-work-step__title">
                    {{ i.title[$i18n.locale] }}
                  </div>
                  <flow-note v-if="i.note && i.rn != 1" :text="i.note" :user="i.user_from" class="flow-work-step__note" />
                </div>
                <div class="flow-work-step__meta">
                  <div class="flow-work-step__meta-row">
                    <q-icon name="schedule" size="1em" />
                    <span>
                      <span v-if="i.rn == 1">{{ $t('crtbl.created_at') }}: </span>
                      <span v-else>{{ $t('crtbl.sent_at') }}: </span>
                      {{ localizedDateTime(i.sent_at) }}
                    </span>
                  </div>
                  <div class="flow-work-step__meta-row">
                    <q-icon name="person" size="1em" />
                    <span>
                      <span v-if="i.rn == 1">{{ $t('crtbl.by') }}: {{ i.user_to?.[$i18n.locale] }}</span>
                      <span v-else>{{ $t('crtbl.from') }}: {{ i.user_from?.[$i18n.locale] }}</span>
                    </span>
                  </div>
                  <div v-if="i.rn != 1 && i.user_to" class="flow-work-step__meta-row">
                    <q-icon name="arrow_forward" size="1em" />
                    <span>{{ $t('crtbl.to') }}: {{ i.user_to[$i18n.locale] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <q-inner-loading :showing="isLoadingWF || openingJob" color="primary" class="loading-background" style="min-height: 400px;">
            <zen-spinner size="200px" color="accent" />
          </q-inner-loading>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCrtblStore } from 'src/stores/crtblStore';
import flowNote from './flow-note.vue';
import zenSpinner from './zen-spinner.vue';
import { localizedDateTime } from 'src/utils/zenUtil';

defineProps({
  /** Host is loading a job opened from this timeline. */
  openingJob: { type: Boolean, default: false }
});

const emit = defineEmits(['open-job']);

const { t, locale } = useI18n();

const popupWf = ref({
  visible: false,
  data: []
});

const isLoadingWF = ref(true);
const crtblStore = useCrtblStore();
const task = ref(null);

const workspaceTitle = computed(() => {
  if (!task.value?.stat)
    return t('crtbl.workflow');
  const flowTitle = task.value.stat.flow_title?.[locale.value] ?? '';
  const code = task.value.stat.follow_code ?? '';
  return `${t('crtbl.workflow')} - ${flowTitle} (${code})`;
});

watch(() => crtblStore.crtbl_workflow, n => n && show(n));

function stepTone(item) {
  if (!item?.way?.color) return 'primary';
  if (item.way.color === 'positive') return 'positive';
  if (item.way.color === 'negative') return 'negative';
  return 'primary';
}

function hasTask(taskId) {
  const id = Number(taskId);
  return !Number.isNaN(id)
    && Number(task.value?.stat?.task_id) === id
    && popupWf.value.data.length > 0;
}

function requestClose() {
  popupWf.value.visible = false;
  popupWf.value.data = [];
  task.value = null;
  isLoadingWF.value = false;
  crtblStore.crtbl_workflow = null;
  return true;
}

function show(taskObj) {
  const taskId = taskObj?.stat?.task_id;
  if (taskId != null && hasTask(taskId)) {
    task.value = taskObj;
    popupWf.value.visible = true;
    isLoadingWF.value = false;
    return;
  }

  task.value = taskObj;
  popupWf.value.visible = true;
  popupWf.value.data = [];
  isLoadingWF.value = true;
  const process = d => {
    for (let i = 0; i < d.length; i++) {
      if (i > 0) {
        if (d[i].ring_order > d[i - 1].ring_order)
          d[i].way = { icon: "arrow_downward", color: "positive" };
        else
          d[i].way = { icon: "arrow_upward", color: "negative" };

        if (i == d.length - 1 && !d[i].user_to)
          d[i].way = { icon: "task_alt", color: "positive" };
      }
      else
        d[i].way = { icon: "add_circle_outline", color: "primary" };
    }
    popupWf.value.data = d;
    isLoadingWF.value = false;
    if (crtblStore.crtbl_workflow && crtblStore.crtbl_workflow.data !== d)
      crtblStore.crtbl_workflow.data = d;
  }
  if (taskObj.data)
    process(taskObj.data);
  else
    crtblStore.loadWorkflow(taskObj.stat.task_id).then(data => data && process(data));
}

function requestOpenJob(item) {
  emit('open-job', item);
}

defineExpose({
  requestClose,
  hasTask,
  isOpen: computed(() => popupWf.value.visible),
  workspaceTitle
});

</script>
<style scoped>
.flow-work {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
}

.flow-work-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.flow-work-form__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem 0.5rem 1rem;
}

.flow-work-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 44rem;
  margin: 0 auto;
  min-height: 12rem;
}

.flow-work-step {
  display: flex;
  gap: 0.85rem;
  cursor: pointer;
}

.flow-work-step__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 2rem;
  min-height: 100%;
}

.flow-work-step__node {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  flex-shrink: 0;
  border: none;
  background: var(--flow-steps-muted-bg);
  color: var(--flow-steps-muted);
  font-size: 0.75rem;
  font-weight: 700;
  padding-top: 0.3rem;
}

.flow-work-step--primary .flow-work-step__node {
  background: var(--q-primary);
  color: var(--q-primary-text);
}

.flow-work-step--positive .flow-work-step__node {
  background: var(--q-positive);
  color: var(--q-primary-text);
}

.flow-work-step--negative .flow-work-step__node {
  background: var(--q-negative);
  color: var(--q-primary-text);
}

.flow-work-step__connector {
  flex: 1;
  width: 3px;
  min-height: 2.25rem;
  margin: 0.15rem 0 0;
  padding-bottom: 12px;
  border-radius: 999px;
  background-color: var(--flow-steps-track);
  background-clip: content-box;
  position: relative;
}

.flow-work-step__connector--positive {
  background-color: color-mix(in srgb, var(--q-positive) 70%, var(--flow-steps-track) 30%);
}

.flow-work-step__connector--negative {
  background-color: color-mix(in srgb, var(--q-negative) 70%, var(--flow-steps-track) 30%);
}

.flow-work-step__connector--primary {
  background-color: color-mix(in srgb, var(--q-primary) 55%, var(--flow-steps-track) 45%);
}

.flow-work-step__arrow {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 16px solid var(--flow-steps-track);
}

.flow-work-step__connector--positive .flow-work-step__arrow {
  border-top-color: color-mix(in srgb, var(--q-positive) 70%, var(--flow-steps-track) 30%);
}

.flow-work-step__connector--negative .flow-work-step__arrow {
  border-top-color: color-mix(in srgb, var(--q-negative) 70%, var(--flow-steps-track) 30%);
}

.flow-work-step__connector--primary .flow-work-step__arrow {
  border-top-color: color-mix(in srgb, var(--q-primary) 55%, var(--flow-steps-track) 45%);
}

.flow-work-step__card {
  flex: 1;
  min-width: 0;
  margin-bottom: 0.85rem;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--flow-steps-border);
  background: var(--flow-steps-bg);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.flow-work-step:hover .flow-work-step__card {
  border-color: color-mix(in srgb, var(--q-primary) 45%, var(--flow-steps-border) 55%);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--q-primary) 14%, transparent 86%);
}

.flow-work-step--positive:hover .flow-work-step__card {
  border-color: color-mix(in srgb, var(--q-positive) 50%, var(--flow-steps-border) 50%);
}

.flow-work-step--negative:hover .flow-work-step__card {
  border-color: color-mix(in srgb, var(--q-negative) 50%, var(--flow-steps-border) 50%);
}

.flow-work-step:last-child .flow-work-step__card {
  margin-bottom: 0;
}

.flow-work-step__header {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-bottom: 0.45rem;
}

.flow-work-step__title {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  line-height: 1.35;
  color: var(--flow-steps-muted);
}

.flow-work-step__note {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.flow-work-step__meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.86em;
  line-height: 1.35;
  opacity: 0.92;
}

.flow-work-step__meta-row {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
}

.flow-work-step__meta-row .q-icon {
  margin-top: 0.12rem;
  opacity: 0.7;
}
</style>
