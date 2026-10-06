<template>
  <flow-workspace v-model:compact="compactBar" v-model:narrow="narrowBar" :model-value="open" :title="barTitle" @back="onCloseAll" @close="onCloseAll">
    <template #title>
      <div v-if="flowTitle || followCode || barMeta?.note" class="flow-host__context" :class="{ 'flow-host__context--compact': compactBar, 'flow-host__context--narrow': narrowBar }">
        <span v-if="flowTitle" class="flow-host__flow-title">{{ flowTitle }}</span>
        <span v-if="followCode" class="flow-host__follow-code">
          {{ followCode }}
          <q-tooltip>{{ t('crtbl.follow_code') }}</q-tooltip>
        </span>
        <flow-note nudge :text="barMeta?.note" :user="barMeta?.user_from" />
      </div>
    </template>
    <template #bar-actions>
      <div v-if="barMeta && (barMeta.sent_at || barMeta.user_from || barMeta.user_to)" class="flow-host__meta" :class="{ 'flow-host__meta--compact': compactBar, 'flow-host__meta--narrow': narrowBar }">
        <span v-if="barMeta.sent_at" class="flow-host__meta-item">
          <q-icon name="schedule" size="1em" />
          <span class="flow-host__meta-text">{{ localizedDateTime(barMeta.sent_at) }}</span>
          <q-tooltip>{{ t(barMeta.user_from ? 'crtbl.sent_at' : 'crtbl.created_at') }}: {{ localizedDateTime(barMeta.sent_at) }}</q-tooltip>
        </span>
        <span v-if="barMeta.user_from" class="flow-host__meta-item">
          <q-icon name="person" size="1em" />
          <span class="flow-host__meta-text">{{ localizedTitle(barMeta.user_from) }}</span>
          <q-tooltip>{{ t('crtbl.user_from') }}: {{ localizedTitle(barMeta.user_from) }}</q-tooltip>
        </span>
        <span v-if="barMeta.user_to" class="flow-host__meta-item">
          <q-icon :name="locale.startsWith('fa') ? 'arrow_back' : 'arrow_forward'" size="1em" />
          <span class="flow-host__meta-text">{{ localizedTitle(barMeta.user_to) }}</span>
          <q-tooltip>{{ t(barMeta.user_from ? 'crtbl.user_to' : 'crtbl.by') }}: {{ localizedTitle(barMeta.user_to) }}</q-tooltip>
        </span>
      </div>
    </template>

    <div v-if="open && crtblStore.rings.length" class="flow-host__steps">
      <flow-steps
        :rings="crtblStore.rings"
        :current-order="currentRingOrder"
        :viewing-order="viewingRingOrder"
        :viewing-historical="viewingHistorical"
        :visited-orders="visitedOrders"
        interactive
        @select="selectRing"
      />
    </div>
    <div class="flow-host__layers">
      <div class="flow-host__layer" :class="{ 'flow-host__layer--idle': top !== 'work' }">
        <flow-work ref="fw" :opening-job="openingJob" @open-job="onOpenJobFromWork" />
      </div>
      <!-- Edit job stays mounted under workflow/view so scroll + form state survive. -->
      <div class="flow-host__layer" :class="{ 'flow-host__layer--idle': !showEditJob }">
        <flow-job ref="fjEdit" :opening-job="openingJob" @closed="onEditJobClosed" />
      </div>
      <div class="flow-host__layer" :class="{ 'flow-host__layer--idle': !showViewJob }">
        <flow-job ref="fjView" :opening-job="openingJob" dont_watch_crtbl_flowjob disable @closed="onViewJobClosed" />
      </div>
    </div>
  </flow-workspace>
</template>

<script setup>
import { computed, provide, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useCrtblStore } from 'src/stores/crtblStore'
import { flowNavKey } from 'src/utils/injectionKeys'
import { localizedDateTime, localizedTitle } from 'src/utils/zenUtil'
import flowWorkspace from './flow-workspace.vue'
import flowWork from './flow-work.vue'
import flowJob from './flow-job.vue'
import flowNote from './flow-note.vue'
import flowSteps from './flow-steps.vue'

const { t, locale } = useI18n()
const route = useRoute()
const crtblStore = useCrtblStore()
const fw = useTemplateRef('fw')
const fjEdit = useTemplateRef('fjEdit')
const fjView = useTemplateRef('fjView')
const compactBar = ref(false)
const narrowBar = ref(false)

/** Navigation stack: 'job' (edit) | 'work' | 'view' (read-only job). */
const stack = ref([])
const openingJob = ref(false)
const ignoringEditClosed = ref(false)
const ignoringViewClosed = ref(false)
/** Cached timeline step for cheap reopen of the same view job. */
const workJobStep = ref(null)
/** wrkflw job list for this overlay session only; wiped on close. */
const cachedWorkflowList = ref(null)

const top = computed(() => stack.value.at(-1) ?? null)
const open = computed(() => stack.value.length > 0)

const showEditJob = computed(() => top.value === 'job')
const showViewJob = computed(() => top.value === 'view')

const followCode = computed(() => (
  crtblStore.crtbl_workflow?.stat?.follow_code
  ?? crtblStore.crtbl_flowjob?.data?.follow_code
  ?? crtblStore.crtbl_flowjob?.stat?.follow_code
  ?? null
))

const flowTitle = computed(() => {
  const raw = crtblStore.crtbl_workflow?.stat?.flow_title
    ?? crtblStore.crtbl_flowjob?.data?.init?.flow_title
    ?? crtblStore.crtbl_flowjob?.stat?.flow_title
  return raw ? localizedTitle(raw) : null
})

const barTitle = computed(() => {
  const parts = []
  if (flowTitle.value)
    parts.push(flowTitle.value)
  if (followCode.value)
    parts.push(followCode.value)
  return parts.join(' / ')
})

const currentRingOrder = computed(() => (
  crtblStore.crtbl_workflow?.stat?.current_ring_order
  ?? crtblStore.crtbl_flowjob?.stat?.current_ring_order
  ?? crtblStore.crtbl_flowjob?.data?.init?.ring_order
  ?? null
))

const viewingRingOrder = computed(() => {
  if (top.value === 'work')
    return null
  if (top.value === 'view')
    return workJobStep.value?.ring_order ?? null
  if (top.value === 'job')
    return crtblStore.crtbl_flowjob?.data?.init?.ring_order
      ?? crtblStore.crtbl_flowjob?.stat?.current_ring_order
      ?? null
  return null
})

const visitedOrders = computed(() => {
  const list = cachedWorkflowList.value
  if (!Array.isArray(list) || !list.length)
    return null
  return [...new Set(list.map(j => Number(j.ring_order)))]
})

function latestJobIdForOrder(order) {
  const list = cachedWorkflowList.value
  if (!Array.isArray(list) || !list.length)
    return null
  const step = Number(order)
  let id = null
  for (const row of list) {
    if (Number(row.ring_order) === step)
      id = Number(row.job_id)
  }
  return id != null && !Number.isNaN(id) ? id : null
}

/** Open view job is an older visit of its ring, not the latest. */
const viewingHistorical = computed(() => {
  if (top.value !== 'view')
    return false
  const item = workJobStep.value
  if (!item)
    return false
  const jobId = Number(item.job_id)
  if (Number.isNaN(jobId))
    return false
  const editId = editJobId()
  if (editId != null && jobId === editId)
    return false
  const latest = latestJobIdForOrder(item.ring_order)
  if (latest == null)
    return false
  return jobId !== latest
})

function pickBarMeta(...sources) {
  let sent_at = null
  let user_from = null
  let user_to = null
  let note = null
  for (const src of sources) {
    if (!src)
      continue
    sent_at ??= src.sent_at ?? null
    user_from ??= src.user_from ?? null
    user_to ??= src.user_to ?? null
    if (!note && typeof src.note === 'string' && src.note.trim())
      note = src.note
  }
  if (!sent_at && !user_from && !user_to && !note)
    return null
  return { sent_at, user_from, user_to, note }
}

const barMeta = computed(() => {
  const type = top.value
  if (!type)
    return null
  if (type === 'work') {
    const steps = cachedWorkflowList.value ?? crtblStore.crtbl_workflow?.data
    const lastStep = Array.isArray(steps) ? steps.at(-1) : null
    return pickBarMeta(lastStep, crtblStore.crtbl_workflow?.stat)
  }
  if (type === 'view')
    return pickBarMeta(workJobStep.value)
  return pickBarMeta(crtblStore.crtbl_flowjob?.stat, crtblStore.crtbl_flowjob?.data)
})

function rememberWorkflowList(data) {
  if (Array.isArray(data) && data.length)
    cachedWorkflowList.value = data
}

function currentTaskId() {
  return crtblStore.crtbl_workflow?.stat?.task_id
    ?? crtblStore.crtbl_flowjob?.stat?.task_id
    ?? crtblStore.crtbl_flowjob?.data?.id
    ?? null
}

async function prefetchWorkflowList(taskId) {
  const data = await crtblStore.loadWorkflow(taskId)
  if (Number(currentTaskId()) !== Number(taskId))
    return
  rememberWorkflowList(data)
  if (crtblStore.crtbl_workflow && !crtblStore.crtbl_workflow.data)
    crtblStore.crtbl_workflow.data = data
}

async function ensureWorkflowList() {
  const cached = cachedWorkflowList.value
  if (Array.isArray(cached) && cached.length)
    return cached
  const stored = crtblStore.crtbl_workflow?.data
  if (Array.isArray(stored) && stored.length) {
    rememberWorkflowList(stored)
    return stored
  }
  const taskId = currentTaskId()
  if (taskId == null)
    return []
  const data = await crtblStore.loadWorkflow(taskId)
  if (Number(currentTaskId()) !== Number(taskId))
    return Array.isArray(data) ? data : []
  rememberWorkflowList(data)
  if (crtblStore.crtbl_workflow && !crtblStore.crtbl_workflow.data)
    crtblStore.crtbl_workflow.data = data
  return Array.isArray(data) ? data : []
}

function hasEditJob() {
  return !!(crtblStore.crtbl_flowjob && stack.value.includes('job'))
}

function editJobId() {
  const id = crtblStore.crtbl_flowjob?.stat?.current_job_id
    ?? crtblStore.crtbl_flowjob?.data?.jid
  const n = Number(id)
  return n != null && !Number.isNaN(n) ? n : null
}

function returnToEditJob() {
  stack.value = ['job']
  fjView.value?.conceal()
}

function stackToView() {
  if (hasEditJob()) {
    stack.value = ['job', 'view']
    return
  }
  const i = stack.value.lastIndexOf('view')
  if (i >= 0)
    stack.value = [...stack.value.slice(0, i), 'view']
  else
    stack.value = [...stack.value, 'view']
}

async function openViewJob(item) {
  if (hasEditJob() && editJobId() != null && Number(item.job_id) === editJobId()) {
    returnToEditJob()
    return
  }

  if (
    workJobStep.value?.job_id === item.job_id
    && fjView.value?.hasRing
  ) {
    stackToView()
    fjView.value.reveal()
    return
  }

  const data = await crtblStore.loadJob(item.task_id, item.job_id)
  workJobStep.value = item
  await fjView.value.show({ data })
  openingJob.value = false
  stackToView()
}

async function selectRing(order) {
  const step = Number(order)
  if (Number.isNaN(step))
    return

  const current = currentRingOrder.value
  if (
    hasEditJob()
    && current != null
    && step === Number(current)
    && top.value !== 'job'
  ) {
    returnToEditJob()
    return
  }

  if (
    viewingRingOrder.value != null
    && step === Number(viewingRingOrder.value)
    && !viewingHistorical.value
  )
    return

  if (openingJob.value)
    return
  openingJob.value = true
  try {
    const data = await ensureWorkflowList()
    let item = null
    for (const row of data) {
      if (Number(row.ring_order) === step)
        item = row
    }
    if (!item)
      return
    await openViewJob(item)
  } finally {
    openingJob.value = false
  }
}

function openWorkflow() {
  if (top.value === 'work')
    return

  const stat = crtblStore.crtbl_flowjob?.stat
    ?? crtblStore.crtbl_workflow?.stat
  const taskId = stat?.task_id
  if (taskId == null)
    return

  fjView.value?.conceal()
  const edit = crtblStore.crtbl_flowjob ? ['job'] : []
  stack.value = [...edit, 'work']

  if (fw.value?.hasTask?.(taskId))
    return

  const cached = cachedWorkflowList.value
  crtblStore.crtbl_workflow = Array.isArray(cached) && cached.length
    ? { stat, data: cached }
    : { stat }
}

provide(flowNavKey, {
  workflowActive: computed(() => top.value === 'work'),
  openWorkflow,
  selectRing,
  visitedOrders,
  currentRingOrder
})

watch(() => crtblStore.crtbl_flowjob, (n) => {
  if (!n)
    return
  stack.value = ['job']
  workJobStep.value = null
  fw.value?.requestClose()
  const taskId = n.stat?.task_id ?? n.data?.id ?? null
  const cachedTaskId = cachedWorkflowList.value?.[0]?.task_id
  if (taskId == null || Number(cachedTaskId) !== Number(taskId))
    cachedWorkflowList.value = null
  if (taskId != null)
    prefetchWorkflowList(taskId)
})

watch(() => crtblStore.crtbl_workflow, (n) => {
  if (!n)
    return
  rememberWorkflowList(n.data)
  const edit = crtblStore.crtbl_flowjob && stack.value.includes('job') ? ['job'] : []
  if (top.value === 'view')
    fjView.value?.conceal()
  stack.value = [...edit, 'work']
})

watch(() => crtblStore.crtbl_workflow?.data, (d) => {
  rememberWorkflowList(d)
})

async function onOpenJobFromWork(item) {
  if (openingJob.value)
    return
  openingJob.value = true
  try {
    await openViewJob(item)
  } finally {
    openingJob.value = false
  }
}

async function discardViewJob() {
  workJobStep.value = null
  ignoringViewClosed.value = true
  try {
    await fjView.value?.hide()
  } finally {
    ignoringViewClosed.value = false
  }
}

/** Drop overlay session state. Does not unmount job layers — callers hide those. */
function wipeSession() {
  stack.value = []
  workJobStep.value = null
  cachedWorkflowList.value = null
  openingJob.value = false
  fw.value?.requestClose()
  crtblStore.crtbl_workflow = null
  crtblStore.crtbl_flowjob = null
}

async function onCloseAll() {
  wipeSession()
  ignoringEditClosed.value = true
  ignoringViewClosed.value = true
  try {
    await Promise.all([
      fjEdit.value?.hide(),
      fjView.value?.hide()
    ])
  } finally {
    ignoringEditClosed.value = false
    ignoringViewClosed.value = false
  }
}

function onEditJobClosed() {
  if (ignoringEditClosed.value)
    return
  wipeSession()
  void discardViewJob()
}

function onViewJobClosed() {
  if (ignoringViewClosed.value)
    return
  if (stack.value.at(-1) === 'view')
    stack.value = stack.value.slice(0, -1)
  workJobStep.value = null
}

watch(() => route.fullPath, () => {
  if (open.value)
    void onCloseAll()
})
</script>

<style scoped>
.flow-host__steps {
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  max-width: 100%;
  margin: 0.5rem;
  align-self: stretch;
}

@media (max-width: 599px), (max-height: 500px) {
  .flow-host__steps {
    margin: 0.28rem 0.4rem;
  }
}

.flow-host__layers {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.flow-host__layer {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Keep inactive layers mounted (scroll/form state) without display:none.
   opacity:0 so descendants cannot punch through with visibility:visible. */
.flow-host__layer--idle {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.flow-host__context {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  max-width: 100%;
  color: var(--flow-bar-context-fg);
}

.flow-host__flow-title {
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-host__follow-code {
  flex-shrink: 0;
  padding: 0.12rem 0.5rem;
  border-radius: 4px;
  font-size: 0.92em;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--flow-bar-context-fg);
  background: var(--flow-bar-context-code-bg);
  cursor: default;
}

.flow-host__context--narrow {
  flex-wrap: wrap;
  row-gap: 0.15rem;
}

.flow-host__context--narrow .flow-host__flow-title {
  overflow: visible;
  text-overflow: unset;
  white-space: normal;
}

.flow-host__meta {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: var(--flow-bar-context-fg);
  font-size: 0.95em;
  font-weight: 600;
  line-height: 1.35;
}

.flow-host__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  min-width: 0;
  white-space: nowrap;
  cursor: default;
}

.flow-host__meta-item .q-icon {
  flex-shrink: 0;
  opacity: 1;
  font-size: 1.3em !important;
}

.flow-host__meta-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flow-host__meta--compact {
  flex-wrap: nowrap;
  gap: 0.35rem 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
  font-size: 0.9em;
}

.flow-host__meta--compact::-webkit-scrollbar {
  display: none;
}

.flow-host__meta--compact .flow-host__meta-item {
  flex: 0 0 auto;
}

.flow-host__meta--compact .flow-host__meta-text {
  overflow: visible;
  text-overflow: unset;
}

.flow-host__meta--compact .flow-host__meta-item .q-icon {
  font-size: 1.15em !important;
}

.flow-host__meta--narrow {
  flex-wrap: wrap;
  overflow: visible;
  font-size: 0.86em;
}

.flow-host__meta--narrow .flow-host__meta-item {
  flex: 0 1 auto;
}
</style>
