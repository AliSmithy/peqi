<template>
  <q-dialog v-model="model.visible" @hide="emit('onCancel')" :maximized="maximizedToggle" transition-duration="0" transition-show="none" transition-hide="none">
    <q-card class="q-pa-none flex column no-wrap popup-dialog" :class="{ 'popup-dialog-maximized': maximizedToggle }" :style="{ ...cardStyle, ...$attrs.style }">
      <slot v-if="$slots.header" name="header"></slot>
      <q-bar v-else ref="header" class="q-py-md dialog-bar">
        <div style="font-size: 1em;">{{ $attrs.title }}</div>
        <q-space />
        <q-btn v-if="showMaximize" flat icon="crop_square" @click="toggleMaximized" />
        <q-btn dense flat round icon="close" size="sm" v-close-popup @click="emit('onCancel')" />
      </q-bar>
      <q-scroll-area v-if="$slots.form && !noScroll" class="q-px-sm col" :delay="1200" ref="mainArea">
        <!-- <q-inner-loading color="transparent" showing class="disabled-form" /> -->
        <q-form ref="popupForm" class="column q-ma-sm">
          <slot name="form"></slot>
        </q-form>
      </q-scroll-area>
      <div v-else-if="$slots.form" class="q-ma-sm q-px-sm col dialog-form-area" ref="mainArea">
        <q-form ref="popupForm" class="column no-wrap dialog-form">
          <slot name="form"></slot>
        </q-form>
      </div>
      <slot name="altform"></slot>
      <slot v-if="$slots.footer" name="footer"></slot>
      <q-card-actions v-else-if="!hideFooter" ref="footer" class="q-px-md dialog-bar">
        <q-btn v-if="$attrs.enabled" size="md" unelevated color="primary" :label="$attrs.okText || $t('general.ok')" class="text-white" @click="emit('onOK')" />
        <q-btn v-else size="md" unelevated color="primary" :label="$t('general.close')" class="text-white" @click="emit('onCancel')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, useTemplateRef, computed } from 'vue';

const { hideFooter, showMaximize, noScroll, width, height } = defineProps({ hideFooter: Boolean, showMaximize: Boolean, noScroll: Boolean, width: String, height: String });
const mainArea = useTemplateRef("mainArea");
const clientHeight = () => mainArea.value?.$el.clientHeight;
const clientWidth = () => mainArea.value?.$el.clientWidth;
const emit = defineEmits(["onOK", "onCancel", "maximize-change"]);
const maximizedToggle = ref(false);
const model = defineModel({
  required: true,
  default: { visible: false, data: {}, form: {} }
});
model.value.form = useTemplateRef("popupForm");
defineOptions({ inheritAttrs: false });
defineExpose({ clientHeight, clientWidth });

function toggleMaximized() {
  maximizedToggle.value = !maximizedToggle.value;
  emit('maximize-change', maximizedToggle.value);
}

const cardStyle = computed(() => {
  const style = {};
  if (!maximizedToggle.value) {
    if (width) style.width = width;
    if (height) style.height = height;
  }
  return style;
});

</script>
<style>
.popup-dialog {
  min-width: 80vw;
  max-width: 100vw !important;
  height: 90vh;
  max-height: 100vh !important;
  min-width: auto;
}

.popup-dialog-maximized {
  height: 100vh !important;
  max-height: 100vh !important;
}

.dialog-form-area {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dialog-form {
  flex: 1;
  min-height: 0;
}
</style>