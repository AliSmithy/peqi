<template>
  <tr v-for="(q, qi) in group.questions" :key="q.key">
    <td v-if="q.fullRow" class="qa-table__band text-weight-medium" colspan="3" :class="rowCellClass(q, answers)">
      <div
        v-for="(line, li) in titleLines(q)"
        :key="li"
        class="text-body1 qa-table__q-line"
        :dir="line.dir"
      >
        {{ line.text }}
      </div>
    </td>
    <template v-else>
      <td v-if="qi === 0" class="qa-table__code text-weight-medium" :rowspan="group.questions.length" :class="codeCellClass(group, answers)">
        <div v-for="(c, ci) in codeList(group.code)" :key="ci" class="qa-table__code-line">{{ c }}</div>
      </td>
      <td class="qa-table__text" :class="rowCellClass(q, answers)" :colspan="mergeNoAnswer && q.noAnswer ? 2 : 1">
        <slot :name="`q-${q.key}`" :q="q" :data="data" :disable="disable">
          <template v-if="bilingual || q.greyBg">
            <div
              v-for="(line, li) in titleLines(q)"
              :key="li"
              class="text-body1 qa-table__q-line"
              :dir="line.dir"
            >
              {{ line.text }}
            </div>
          </template>
          <template v-else>
            <div class="text-body1">{{ titleBody(q) }}</div>
            <div v-for="(note, ni) in titleNotes(q)" :key="ni" class="text-caption qa-table__note">
              {{ note }}
            </div>
          </template>
        </slot>
      </td>
      <td v-if="!(mergeNoAnswer && q.noAnswer)" class="qa-table__answer" :class="rowCellClass(q, answers)">
        <template v-if="!q.noAnswer">
          <!-- Read-only: no child component — just the label. -->
          <span
            v-if="disable"
            class="qa-answer-value text-weight-medium"
            :class="answerValueClass(answers[q.key])"
          >{{ answerLabel(answerOptions, answers[q.key]) }}</span>
          <QaAnswerControl
            v-else
            :model-value="answers[q.key]"
            :options="answerOptions"
            @update:model-value="emit('update:answer', q.key, $event)"
          />
        </template>
      </td>
    </template>
  </tr>
</template>

<script setup>
import {
  codeList,
  rowCellClass,
  codeCellClass,
  answerLabel,
  answerValueClass,
} from 'src/composables/useQaResults'
import QaAnswerControl from 'src/components/QaAnswerControl.vue'

const props = defineProps({
  group: { type: Object, required: true },
  /** Only set when this group has a custom #q-* slot. */
  data: { type: Object, default: null },
  answers: { type: Object, required: true },
  /** Precomputed copy from QaResultsTable — avoids $t in the row loop. */
  titles: { type: Object, required: true },
  answerOptions: { type: Array, required: true },
  bilingual: { type: Boolean, default: false },
  mergeNoAnswer: { type: Boolean, default: false },
  disable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:answer'])

function titleEntry(q) {
  return props.titles[q.key] || { lines: [{ text: q.key, dir: 'ltr' }], body: q.key, notes: [] }
}

function titleLines(q) {
  return titleEntry(q).lines
}

function titleBody(q) {
  return titleEntry(q).body
}

function titleNotes(q) {
  return titleEntry(q).notes
}
</script>
