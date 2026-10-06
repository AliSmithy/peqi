<template>
  <div ref="rootEl" class="flow-steps">
    <div ref="scrollEl" class="flow-steps__scroll">
      <div class="flow-steps__track row items-stretch no-wrap">
        <template v-for="(ring, idx) in sortedRings" :key="ring.id">
          <div
            :ref="el => setStepRef(ring.order, el)"
            class="flow-steps__item"
            :class="itemClass(ring.order)"
            :role="canSelect(ring.order) ? 'button' : undefined"
            :tabindex="canSelect(ring.order) ? 0 : undefined"
            :aria-current="isCurrent(ring.order) ? 'step' : undefined"
            @click="onSelect(ring.order)"
            @keydown.enter.prevent="onSelect(ring.order)"
            @keydown.space.prevent="onSelect(ring.order)"
          >
            <div class="flow-steps__marker">
              <div class="flow-steps__circle flex flex-center">
                <q-icon v-if="isSuperseded(ring.order)" class="flow-steps__backward" :class="{ 'flow-steps__backward--rtl': isRtlLocale }" name="u_turn_left" />
                <q-icon v-else-if="showHistory(ring.order)" name="history" />
                <q-icon v-else-if="showCheck(ring.order)" name="check" />
                <span v-else>{{ ring.order }}</span>
              </div>
            </div>
            <div class="flow-steps__title" :title="localizedTitle(ring.title)">
              {{ localizedTitle(ring.title) }}
            </div>
          </div>
          <div v-if="idx < sortedRings.length - 1" class="flow-steps__connector" :class="{ 'flow-steps__connector--done': isConnectorDone(ring.order) }" />
        </template>
      </div>
    </div>
    <button
      v-if="showWorkflowBtn"
      type="button"
      class="flow-steps__workflow"
      :class="{ 'flow-steps__workflow--active': workflowActive }"
      :aria-label="workflowLabel"
      :aria-pressed="workflowActive ? 'true' : 'false'"
      :title="workflowLabel"
      @click="onWorkflow"
    >
      <div class="flow-steps__marker">
        <div class="flow-steps__circle flow-steps__workflow-icon flex flex-center">
          <q-icon name="swap_horiz" />
        </div>
      </div>
      <div class="flow-steps__workflow-label">{{ workflowLabel }}</div>
    </button>
  </div>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCrtblStore } from 'src/stores/crtblStore';
import { flowNavKey } from 'src/utils/injectionKeys';
import { localizedTitle } from 'src/utils/zenUtil';

const props = defineProps({
  rings: { type: Array, default: () => [] },
  /** Where the task currently is. */
  currentOrder: { type: Number, default: null },
  /** Ring of the open job, when it differs from currentOrder. */
  viewingOrder: { type: Number, default: null },
  /** Open job is an older visit of viewingOrder, not the latest. */
  viewingHistorical: { type: Boolean, default: false },
  /** Rings that have at least one job. null = unknown (use currentOrder fallback). */
  visitedOrders: { type: Array, default: null },
  interactive: { type: Boolean, default: false },
  /** Standalone ring: task already has a follow code / id. */
  saved: { type: Boolean, default: false },
  taskId: { type: [Number, String], default: null },
  followCode: { type: String, default: undefined },
});

const emit = defineEmits(['select']);

const { t, locale } = useI18n();
const isRtlLocale = computed(() => locale.value.startsWith('fa'));
const crtblStore = useCrtblStore();
const flowNav = inject(flowNavKey, null);

const workflowLabel = computed(() => t('crtbl.workflow'));
const workflowActive = computed(() => flowNav?.workflowActive?.value === true);

const hasSavedTask = computed(() => !!(
  props.saved
  || props.taskId
  || crtblStore.crtbl_flowjob?.stat?.task_id
  || crtblStore.crtbl_flowjob?.data?.id
  || crtblStore.crtbl_flowjob?.data?.follow_code
  || crtblStore.crtbl_workflow?.stat?.task_id
));

const showWorkflowBtn = computed(() => hasSavedTask.value);

function onWorkflow() {
  if (flowNav?.openWorkflow) {
    flowNav.openWorkflow();
    return;
  }
  const stat = crtblStore.crtbl_flowjob?.stat;
  if (stat?.task_id) {
    crtblStore.crtbl_workflow = { stat };
    return;
  }
  const taskId = props.taskId != null && props.taskId !== '' ? Number(props.taskId) : null;
  if (taskId == null || Number.isNaN(taskId))
    return;
  crtblStore.crtbl_workflow = {
    stat: { task_id: taskId, follow_code: props.followCode }
  };
}

const rootEl = ref(null);
const scrollEl = ref(null);
const stepEls = {};

let userHasScrolled = false;
let autoScrolledForOrder = null;
let targetScrollLeft = 0;
let wheelRafId = null;
let wheelFromUser = false;
let applyingAutoScroll = false;

const sortedRings = computed(() =>
  [...props.rings].sort((a, b) => a.order - b.order)
);

const focusOrder = computed(() => {
  const viewing = props.viewingOrder == null ? null : Number(props.viewingOrder);
  if (viewing != null && !Number.isNaN(viewing))
    return viewing;
  const current = props.currentOrder == null ? null : Number(props.currentOrder);
  return current != null && !Number.isNaN(current) ? current : null;
});

function setStepRef(order, el) {
  if (el) stepEls[order] = el;
  else delete stepEls[order];
}

function isCurrent(order) {
  const current = props.currentOrder == null ? null : Number(props.currentOrder);
  const step = Number(order);
  return current != null && !Number.isNaN(current) && step === current;
}

function isViewing(order) {
  const viewing = props.viewingOrder == null ? null : Number(props.viewingOrder);
  const step = Number(order);
  return viewing != null && !Number.isNaN(viewing) && step === viewing && !isCurrent(order);
}

function hasJob(order) {
  const step = Number(order);
  if (props.visitedOrders != null)
    return props.visitedOrders.some(o => Number(o) === step);
  const current = props.currentOrder == null ? null : Number(props.currentOrder);
  return current != null && !Number.isNaN(current) && step <= current;
}

function stepState(order) {
  if (isViewingArchive(order))
    return 'archive';
  if (isViewing(order))
    return 'viewing';
  if (isCurrent(order))
    return 'current';
  if (isSuperseded(order))
    return 'superseded';
  if (hasJob(order))
    return 'done';
  return 'pending';
}

function isSuperseded(order) {
  const current = props.currentOrder == null ? null : Number(props.currentOrder);
  if (current == null || Number.isNaN(current))
    return false;
  return hasJob(order) && Number(order) > current;
}

function isViewingHistorical(order) {
  if (!props.viewingHistorical)
    return false;
  const viewing = props.viewingOrder == null ? null : Number(props.viewingOrder);
  return viewing != null && !Number.isNaN(viewing) && Number(order) === viewing;
}

function isViewingArchive(order) {
  if (isViewingHistorical(order))
    return true;
  return isViewing(order) && isSuperseded(order);
}

function showHistory(order) {
  return isViewingArchive(order) && !isSuperseded(order);
}

function showCheck(order) {
  if (isSuperseded(order) || showHistory(order))
    return false;
  const state = stepState(order);
  return state === 'done' || state === 'viewing';
}

function canSelect(order) {
  if (!props.interactive)
    return false;
  if (isViewingHistorical(order))
    return true;
  const viewing = props.viewingOrder == null ? null : Number(props.viewingOrder);
  if (viewing != null && !Number.isNaN(viewing) && Number(order) === viewing)
    return false;
  return hasJob(order);
}

function itemClass(order) {
  const state = stepState(order);
  return {
    [`flow-steps__item--${state}`]: true,
    'flow-steps__item--current-unfocused': state === 'current' && !isCurrentFocused(),
    'flow-steps__item--clickable': canSelect(order)
  };
}

function isCurrentFocused() {
  if (workflowActive.value)
    return false;
  if (props.viewingHistorical)
    return false;
  const viewing = props.viewingOrder == null ? null : Number(props.viewingOrder);
  if (viewing == null || Number.isNaN(viewing))
    return true;
  return isCurrent(viewing);
}

function isConnectorDone(order) {
  const current = props.currentOrder == null ? null : Number(props.currentOrder);
  return current != null && Number(order) < current;
}

function onSelect(order) {
  if (!canSelect(order))
    return;
  emit('select', Number(order));
}

function isRtl(el) {
  return getComputedStyle(el).direction === 'rtl';
}

function scrollBounds(el) {
  const distance = el.scrollWidth - el.clientWidth;
  // Modern browsers use a negative scrollLeft range in RTL: [-distance, 0].
  return isRtl(el) ? { min: -distance, max: 0 } : { min: 0, max: distance };
}

function clampScrollLeft(el, value) {
  const { min, max } = scrollBounds(el);
  return Math.max(min, Math.min(value, max));
}

function markUserScrolled() {
  userHasScrolled = true;
  autoScrolledForOrder = null;
}

function centerScrollLeft(order) {
  const el = scrollEl.value;
  const item = stepEls[order];
  if (!el || !item) return null;
  if (el.scrollWidth - el.clientWidth <= 0) return el.scrollLeft;

  // Measure the item's current visual offset relative to the viewport. Using a
  // difference of bounding rects keeps this correct regardless of the writing
  // direction and immune to any translate from the dialog's enter transition.
  // Note: in the modern (negative) RTL scrollLeft model, raising scrollLeft moves
  // the content left just like LTR, so the same formula works for both.
  const elRect = el.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const shift = (itemRect.left - elRect.left) - (el.clientWidth - itemRect.width) / 2;

  return clampScrollLeft(el, el.scrollLeft + shift);
}

// The dialog enters with a CSS scale transform, during which getBoundingClientRect
// is shrunk relative to the (transform-immune) offsetWidth. Wait until they match,
// i.e. the scale has reached 1, so the measured positions are accurate.
function whenScaleSettled(el, cb, attempts = 90) {
  const visualWidth = el.getBoundingClientRect().width;
  if (attempts <= 0 || (el.offsetWidth > 0 && visualWidth >= el.offsetWidth - 0.5)) {
    cb();
    return;
  }
  requestAnimationFrame(() => whenScaleSettled(el, cb, attempts - 1));
}

function scrollToFocus() {
  if (userHasScrolled) return;

  const order = focusOrder.value;
  if (order == null || Number.isNaN(order)) return;
  if (autoScrolledForOrder === order) return;

  nextTick(() => {
    const el = scrollEl.value;
    if (!el || userHasScrolled) return;

    whenScaleSettled(el, () => {
      if (userHasScrolled) return;

      const left = centerScrollLeft(order);
      if (left == null) return;

      autoScrolledForOrder = order;
      applyingAutoScroll = true;
      el.scrollLeft = left;
      targetScrollLeft = el.scrollLeft;
      // The resulting scroll event fires asynchronously (before the next frame),
      // so keep the guard up until then to avoid flagging this as a user scroll.
      requestAnimationFrame(() => { applyingAutoScroll = false; });
    });
  });
}

function normalizeWheelDelta(e, el) {
  let delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (!delta) return 0;
  if (e.deltaMode === 1) delta *= 16;
  else if (e.deltaMode === 2) delta *= el.clientWidth;
  return delta;
}

function animateWheelScroll() {
  const el = scrollEl.value;
  if (!el) {
    wheelRafId = null;
    wheelFromUser = false;
    return;
  }

  const diff = targetScrollLeft - el.scrollLeft;
  if (Math.abs(diff) < 0.5) {
    el.scrollLeft = targetScrollLeft;
    wheelRafId = null;
    wheelFromUser = false;
    return;
  }

  wheelFromUser = true;
  el.scrollLeft += diff * 0.18;
  wheelRafId = requestAnimationFrame(animateWheelScroll);
}

function onWheel(e) {
  const el = scrollEl.value;
  if (!el || el.scrollWidth <= el.clientWidth) return;

  const delta = normalizeWheelDelta(e, el);
  if (!delta) return;

  e.preventDefault();
  e.stopPropagation();
  markUserScrolled();

  if (wheelRafId == null) targetScrollLeft = el.scrollLeft;
  // Wheel forward advances toward later steps; in RTL later steps sit to the left.
  targetScrollLeft = clampScrollLeft(el, targetScrollLeft + (isRtl(el) ? -delta : delta));
  if (!wheelRafId) wheelRafId = requestAnimationFrame(animateWheelScroll);
}

function onUserGesture() {
  markUserScrolled();
}

function onScroll() {
  if (applyingAutoScroll || wheelFromUser) return;
  markUserScrolled();
}

function bindEvents() {
  const root = rootEl.value;
  const scroll = scrollEl.value;
  if (!root || !scroll) return;

  root.addEventListener('wheel', onWheel, { passive: false, capture: true });
  scroll.addEventListener('scroll', onScroll, { passive: true });
  scroll.addEventListener('pointerdown', onUserGesture);
  scroll.addEventListener('touchstart', onUserGesture, { passive: true });
}

function unbindEvents() {
  rootEl.value?.removeEventListener('wheel', onWheel, { capture: true });
  scrollEl.value?.removeEventListener('scroll', onScroll);
  scrollEl.value?.removeEventListener('pointerdown', onUserGesture);
  scrollEl.value?.removeEventListener('touchstart', onUserGesture);
}

watch(() => (props.rings ?? []).map(r => r.id).join(','), (key, prev) => {
  if (key === prev) return;
  userHasScrolled = false;
  autoScrolledForOrder = null;
  scrollToFocus();
});

onMounted(() => {
  nextTick(() => {
    bindEvents();
    scrollToFocus();
  });
});

onBeforeUnmount(() => {
  unbindEvents();
  if (wheelRafId) cancelAnimationFrame(wheelRafId);
});
</script>

<style scoped>
.flow-steps {
  --fs-circle: 2.25em;
  --fs-line: 2px;
  --fs-item-pt: 0.5rem;
  --fs-glow: 3px;
  --fs-glow-active: 4px;
  --fs-glow-soft: 8px;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 0.2rem 0.35rem 0.05rem;
  border-radius: 14px;
  background: var(--flow-steps-bg);
  border: 1px solid var(--flow-steps-border);
}

.flow-steps__scroll {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scroll-behavior: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  padding: 0;
  /* Firefox: thin scrollbar, hidden until the strip is hovered. */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.2s ease;
}

.flow-steps__scroll:hover {
  scrollbar-color: var(--flow-steps-track) transparent;
}

/* Chromium/WebKit: mimic Firefox's hover-reveal scrollbar. */
.flow-steps__scroll::-webkit-scrollbar {
  height: 6px;
}

.flow-steps__scroll::-webkit-scrollbar-track {
  background: transparent;
}

.flow-steps__scroll::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.flow-steps__scroll:hover::-webkit-scrollbar-thumb {
  background: var(--flow-steps-track);
}

.flow-steps__track {
  display: inline-flex;
  align-items: stretch;
  width: max-content;
  padding-bottom: 0.2rem;
}

.flow-steps__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  align-self: stretch;
  width: 9em;
  padding: var(--fs-item-pt) 0.4rem 0.3rem;
  border-radius: 12px;
  user-select: none;
  transition: background-color 0.18s ease;
}

.flow-steps__marker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--fs-circle);
  height: var(--fs-circle);
  flex: 0 0 auto;
}

.flow-steps__circle {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  border: 2px solid color-mix(in srgb, var(--flow-steps-border) 80%, var(--flow-steps-muted) 20%);
  background: color-mix(in srgb, var(--flow-steps-muted-bg) 70%, transparent);
  color: var(--flow-steps-muted);
  transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

.flow-steps__circle :deep(.q-icon) {
  font-size: 1.3em;
}

.flow-steps__backward--rtl {
  transform: scaleX(-1);
}

.flow-steps__item--done .flow-steps__circle {
  border-color: var(--q-positive);
  background: color-mix(in srgb, var(--q-positive) 14%, var(--flow-steps-muted-bg) 86%);
  color: var(--q-positive);
  box-shadow: 0 0 0 var(--fs-glow) color-mix(in srgb, var(--q-positive) 20%, transparent);
}

.flow-steps__item--current {
  background: color-mix(in srgb, var(--q-warning) 12%, transparent);
}

.flow-steps__item--current .flow-steps__circle {
  border-color: var(--q-warning);
  background: var(--q-warning);
  color: var(--drawer-selected-fg);
  box-shadow:
    0 0 0 var(--fs-glow-active) color-mix(in srgb, var(--q-warning) 26%, transparent),
    0 1px var(--fs-glow-soft) color-mix(in srgb, var(--q-warning) 30%, transparent);
}

.flow-steps__item--current .flow-steps__title {
  color: var(--q-warning);
  font-weight: 700;
}

.flow-steps__item--current-unfocused {
  background: transparent;
}

.flow-steps__item--current-unfocused .flow-steps__circle {
  background: color-mix(in srgb, var(--q-warning) 14%, var(--flow-steps-muted-bg) 86%);
  color: var(--q-warning);
  box-shadow: 0 0 0 var(--fs-glow) color-mix(in srgb, var(--q-warning) 20%, transparent);
}

.flow-steps__item--viewing {
  background: color-mix(in srgb, var(--q-positive) 12%, transparent);
}

.flow-steps__item--viewing .flow-steps__circle {
  border-color: var(--q-positive);
  background: var(--q-positive);
  color: var(--q-primary-text);
  box-shadow: 0 0 0 var(--fs-glow-active) color-mix(in srgb, var(--q-positive) 26%, transparent);
}

.flow-steps__item--viewing .flow-steps__title {
  color: var(--q-positive);
  font-weight: 700;
}

.flow-steps__item--archive {
  background: color-mix(in srgb, var(--flow-steps-archive) 16%, transparent);
}

.flow-steps__item--archive .flow-steps__circle {
  border-color: var(--flow-steps-archive);
  background: var(--flow-steps-archive);
  color: var(--flow-steps-archive-on);
  box-shadow: 0 0 0 var(--fs-glow-active) color-mix(in srgb, var(--flow-steps-archive) 26%, transparent);
}

.flow-steps__item--archive .flow-steps__title {
  color: var(--flow-steps-archive);
  font-weight: 700;
}

.flow-steps__item--clickable {
  cursor: pointer;
}

.flow-steps__item--clickable:hover {
  background: color-mix(in srgb, var(--flow-steps-selected) 10%, transparent);
}

.flow-steps__item--clickable:hover .flow-steps__circle,
.flow-steps__item--clickable:focus-visible .flow-steps__circle {
  transform: scale(1.07);
}

.flow-steps__item--clickable:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--flow-steps-selected) 70%, transparent);
  outline-offset: 2px;
}

.flow-steps__item--current.flow-steps__item--clickable:hover {
  background: color-mix(in srgb, var(--q-warning) 18%, transparent);
}

.flow-steps__item--viewing.flow-steps__item--clickable:hover {
  background: color-mix(in srgb, var(--q-positive) 18%, transparent);
}

.flow-steps__item--archive.flow-steps__item--clickable:hover {
  background: color-mix(in srgb, var(--flow-steps-archive) 22%, transparent);
}

.flow-steps__item--superseded.flow-steps__item--clickable:hover {
  background: color-mix(in srgb, var(--flow-steps-track) 40%, transparent);
}

.flow-steps__title {
  flex: 1 1 auto;
  margin-top: 0.4rem;
  font-size: 0.74em;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: 0.01em;
  text-align: center;
  word-break: break-word;
  color: var(--flow-steps-muted);
  transition: color 0.18s ease;
}

.flow-steps__item--done .flow-steps__title {
  color: var(--q-positive);
}

.flow-steps__connector {
  flex: 0 0 2.25em;
  align-self: flex-start;
  width: 2.25em;
  height: var(--fs-line);
  margin-top: calc(var(--fs-item-pt) + (var(--fs-circle) / 2) - (var(--fs-line) / 2));
  border-radius: 999px;
  background: var(--flow-steps-track);
  transition: background-color 0.18s ease;
}

.flow-steps__connector--done {
  background: color-mix(in srgb, var(--q-positive) 82%, var(--flow-steps-track) 18%);
}

.flow-steps__workflow {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  width: 5.25em;
  margin-inline-start: 0.2rem;
  padding: var(--fs-item-pt) 0.3rem 0.3rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  user-select: none;
  appearance: none;
  -webkit-appearance: none;
}

.flow-steps__workflow::before {
  content: "";
  position: absolute;
  top: var(--fs-item-pt);
  inset-inline-start: -0.1rem;
  width: 1px;
  height: var(--fs-circle);
  background: var(--flow-steps-border);
  pointer-events: none;
}

.flow-steps__workflow-icon {
  border-color: var(--q-accent);
  background: color-mix(in srgb, var(--q-accent) 14%, var(--flow-steps-muted-bg) 86%);
  color: var(--q-accent);
  box-shadow: 0 0 0 var(--fs-glow) color-mix(in srgb, var(--q-accent) 20%, transparent);
}

.flow-steps__workflow:hover {
  background: color-mix(in srgb, var(--q-accent) 25%, transparent);
}

.flow-steps__workflow:hover .flow-steps__workflow-icon,
.flow-steps__workflow:focus-visible .flow-steps__workflow-icon {
  transform: scale(1.07);
}

.flow-steps__workflow:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--q-accent) 70%, transparent);
  outline-offset: 2px;
}

.flow-steps__workflow-label {
  flex: 1 1 auto;
  margin-top: 0.4rem;
  font-size: 0.7em;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.01em;
  text-align: center;
  color: var(--q-accent);
}

:global(.body--dark) .flow-steps__workflow-icon {
  border-color: color-mix(in srgb, var(--q-accent) 45%, white 55%);
  background: color-mix(in srgb, var(--q-accent) 22%, var(--flow-steps-muted-bg) 78%);
  color: color-mix(in srgb, var(--q-accent) 45%, white 55%);
  box-shadow: 0 0 0 var(--fs-glow) color-mix(in srgb, var(--q-accent) 28%, transparent);
}

:global(.body--dark) .flow-steps__workflow-label {
  color: color-mix(in srgb, var(--q-accent) 45%, white 55%);
}

.flow-steps__workflow--active {
  background: color-mix(in srgb, var(--q-accent) 20%, transparent);
}

.flow-steps__workflow--active .flow-steps__workflow-icon {
  border-color: var(--q-accent);
  background: var(--q-accent);
  color: var(--q-primary-text);
  box-shadow: 0 0 0 var(--fs-glow-active) color-mix(in srgb, var(--q-accent) 26%, transparent);
}

.flow-steps__workflow--active .flow-steps__workflow-label {
  font-weight: 700;
}

:global(.body--dark) .flow-steps__workflow--active .flow-steps__workflow-icon {
  border-color: color-mix(in srgb, var(--q-accent) 50%, white 50%);
  background: color-mix(in srgb, var(--q-accent) 50%, white 50%);
  color: var(--q-primary-text);
}

@media (max-width: 599px), (max-height: 500px) {
  .flow-steps {
    --fs-circle: 1.75em;
    --fs-item-pt: 0.2rem;
    --fs-glow: 2px;
    --fs-glow-active: 2px;
    --fs-glow-soft: 4px;
    padding: 0.08rem 0.18rem;
    border-radius: 10px;
  }

  .flow-steps__scroll {
    scrollbar-width: none;
  }

  .flow-steps__scroll::-webkit-scrollbar {
    height: 0;
  }

  .flow-steps__track {
    padding-bottom: 0;
  }

  .flow-steps__item {
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.35rem;
    width: auto;
    max-width: 12em;
    padding-block: 0.18rem;
    padding-inline-start: 0.28rem;
    padding-inline-end: 0.42rem;
    border-radius: 9px;
  }

  .flow-steps__circle {
    font-size: 1em;
    border-width: 1.5px;
  }

  .flow-steps__circle :deep(.q-icon) {
    font-size: 1.2em;
  }

  .flow-steps__title {
    flex: 1 1 auto;
    min-width: 0;
    margin-top: 0;
    font-size: 0.8em;
    line-height: 1.25;
    text-align: center;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    /* autoprefixer: ignore next */
    -webkit-box-orient: vertical;
  }

  .flow-steps__connector {
    flex-basis: 1.1em;
    width: 1.1em;
    margin-top: 0;
    align-self: center;
  }

  .flow-steps__workflow {
    justify-content: center;
    width: auto;
    max-width: none;
    margin-inline-start: 0.08rem;
    padding-block: 0.18rem;
    padding-inline: 0.32rem;
    border-radius: 9px;
  }

  .flow-steps__workflow::before {
    top: 50%;
    transform: translateY(-50%);
    inset-inline-start: 0;
  }

  .flow-steps__workflow-label {
    display: none;
  }

  .flow-steps__item--clickable:hover .flow-steps__circle,
  .flow-steps__item--clickable:focus-visible .flow-steps__circle,
  .flow-steps__workflow:hover .flow-steps__workflow-icon,
  .flow-steps__workflow:focus-visible .flow-steps__workflow-icon {
    transform: scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-steps__circle,
  .flow-steps__item,
  .flow-steps__title,
  .flow-steps__connector {
    transition: none;
  }

  .flow-steps__item--clickable:hover .flow-steps__circle,
  .flow-steps__item--clickable:focus-visible .flow-steps__circle,
  .flow-steps__workflow:hover .flow-steps__workflow-icon,
  .flow-steps__workflow:focus-visible .flow-steps__workflow-icon {
    transform: none;
  }
}
</style>
