<template>
  <!-- Read-only: no QBtnToggle — just the label. -->
  <span
    v-if="disable"
    class="qa-answer-value text-weight-medium"
    :class="answerValueClass(modelValue)"
  >{{ answerLabel(options, modelValue) }}</span>
  <q-btn-toggle
    v-else
    dense
    unelevated
    no-caps
    :clearable="clearable"
    :model-value="modelValue"
    :options="options"
    :toggle-color="answerToggleColor(modelValue)"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup>
import {
  answerToggleColor,
  answerLabel,
  answerValueClass,
} from 'src/composables/useQaResults'

defineProps({
  modelValue: { type: [String, Number, Boolean], default: null },
  options: { type: Array, required: true },
  clearable: { type: Boolean, default: false },
  disable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>
