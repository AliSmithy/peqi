<template>
  <div class="qa-table-wrap">
    <table class="qa-table" dir="ltr">
      <colgroup>
        <col class="qa-table__col-code" />
        <col class="qa-table__col-text" />
        <col class="qa-table__col-answer" />
      </colgroup>
      <tbody>
        <template v-for="(group, gi) in visibleGroups" :key="groupKey(group) + '-' + gi">
          <tr v-if="group.embed">
            <td colspan="3" class="qa-table__embed">
              <slot :name="group.embed" />
            </td>
          </tr>
          <QaResultGroup
            v-else
            :group="group"
            :data="groupNeedsData(group) ? data : null"
            :answers="data.answers"
            :titles="titles"
            :answer-options="answerOptions"
            :bilingual="bilingual"
            :merge-no-answer="mergeNoAnswer"
            :disable="disable"
            @update:answer="onAnswer"
          >
            <template v-for="name in slotNamesForGroup(group)" :key="name" #[name]="slotProps">
              <slot :name="name" v-bind="slotProps || {}" />
            </template>
          </QaResultGroup>
        </template>
      </tbody>
    </table>
    <div v-if="!complete" class="qa-table-wrap__more">
      <zen-spinner size="26px" color="primary" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, useSlots, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ensureFormLocale } from 'src/i18n/loadForm'
import zenSpinner from 'src/components/zen-spinner.vue'
import QaResultGroup from 'src/components/QaResultGroup.vue'
import {
  groupKey,
  makeAnswerOptions,
  buildQuestionTitles,
} from 'src/composables/useQaResults'

const props = defineProps({
  groups: { type: Array, required: true },
  data: { type: Object, required: true },
  disable: { type: Boolean, default: false },
  i18nPrefix: { type: String, required: true },
  bilingual: { type: Boolean, default: false },
  mergeNoAnswer: { type: Boolean, default: false },
  chunkSize: { type: Number, default: 48 },
})

const emit = defineEmits(['update:answer'])

function onAnswer(key, value) {
  emit('update:answer', key, value)
}

const { t, te, locale } = useI18n()
const slots = useSlots()

const qSlotKeys = computed(() => {
  const set = new Set()
  for (const name of Object.keys(slots)) {
    if (name.startsWith('q-'))
      set.add(name.slice(2))
  }
  return set
})

function slotNamesForGroup(group) {
  if (!qSlotKeys.value.size || !group.questions)
    return []
  const names = []
  for (const q of group.questions) {
    const name = `q-${q.key}`
    if (slots[name])
      names.push(name)
  }
  return names
}

function groupNeedsData(group) {
  return slotNamesForGroup(group).length > 0
}

// Stable until we explicitly rebuild (locale / form messages ready / groups change).
const answerOptions = ref(makeAnswerOptions(t, props.i18nPrefix))
const titles = ref(Object.create(null))

function refreshStatic() {
  answerOptions.value = makeAnswerOptions(t, props.i18nPrefix)
  titles.value = buildQuestionTitles(props.groups, props.i18nPrefix, {
    t,
    te,
    bilingual: props.bilingual,
  })
}

const renderedCount = ref(0)
const localeReady = ref(false)
const complete = ref(false)
const SETTLE_FRAMES = 2
let settle = SETTLE_FRAMES
let frame = null

const visibleGroups = computed(() => props.groups.slice(0, renderedCount.value))

Promise.all([
  ensureFormLocale('en-US', props.i18nPrefix),
  ensureFormLocale(locale.value, props.i18nPrefix),
])
  .catch(() => {})
  .then(() => { localeReady.value = true })

function batchEnd(from) {
  if (props.groups[from]?.embed)
    return from + 1
  let end = from
  while (end < props.groups.length && end - from < props.chunkSize && !props.groups[end].embed)
    end++
  return end
}

function scheduleBatch() {
  if (frame !== null || complete.value)
    return
  frame = requestAnimationFrame(() => {
    frame = null
    if (renderedCount.value < props.groups.length)
      renderedCount.value = batchEnd(renderedCount.value)
    else if (settle > 0)
      settle--
    else
      complete.value = true
    scheduleBatch()
  })
}

function resetStream() {
  renderedCount.value = 0
  complete.value = false
  settle = SETTLE_FRAMES
  if (localeReady.value)
    scheduleBatch()
}

watch(localeReady, (ready) => {
  if (!ready)
    return
  refreshStatic()
  scheduleBatch()
})

watch(locale, async () => {
  if (!localeReady.value)
    return
  await ensureFormLocale(locale.value, props.i18nPrefix).catch(() => {})
  refreshStatic()
})

watch(() => props.groups, () => {
  if (localeReady.value)
    refreshStatic()
  resetStream()
})

onBeforeUnmount(() => {
  if (frame !== null)
    cancelAnimationFrame(frame)
})
</script>

<style scoped>
.qa-table-wrap__more {
  display: flex;
  justify-content: center;
  padding: 0.9rem 0;
}

.qa-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.qa-table__col-code {
  width: 5.5rem;
}

.qa-table__col-answer {
  width: 11.5rem;
}

.qa-table :deep(td) {
  border: 1px solid var(--qa-table-border);
  vertical-align: middle;
  padding: 10px 12px;
}

.qa-table :deep(.qa-table__code) {
  text-align: center;
  font-size: 0.85em;
  line-height: 1.35;
  word-break: break-word;
  white-space: normal;
}

.qa-table :deep(.qa-table__code-line + .qa-table__code-line) {
  margin-top: 2px;
}

.qa-table :deep(.qa-table__text) {
  min-width: 0;
}

.qa-table :deep(.qa-table__q-line) {
  white-space: pre-wrap;
}

.qa-table :deep(.qa-table__q-line + .qa-table__q-line) {
  margin-top: 6px;
}

.qa-table :deep(.qa-table__note) {
  color: var(--qa-table-muted);
}

.qa-table :deep(.qa-table__answer) {
  white-space: nowrap;
  text-align: center;
}

.qa-table :deep(.qa-answer-value) {
  display: inline-block;
  padding: 2px 6px;
  white-space: nowrap;
}

.qa-table :deep(.is-na) {
  background: var(--qa-table-na-bg);
  color: var(--qa-table-na-fg);
}

.qa-table :deep(.is-grey),
.qa-table :deep(.is-band) {
  background: var(--qa-table-band-bg);
}

.qa-table :deep(.is-band) {
  text-align: center;
}

.qa-table :deep(.qa-table__band) {
  min-width: 0;
}

.qa-table__embed {
  border: 1px solid var(--qa-table-border);
  vertical-align: middle;
  padding: 0;
}
</style>
