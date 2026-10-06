<template>
  <q-input v-bind="inputAttrs" :label="computedLabel" v-model="_model">
    <template v-slot:prepend>
      <q-icon class="cursor-pointer text-primary" name="language">
        <q-menu v-model="drop">
          <q-list style="min-width: 100px">
            <q-item class="q-px-none" dense="" v-for="i in langs" v-bind:key="i.key" clickable v-close-popup @click="selected = i.key">
              <q-icon v-if="i.hasData" color="primary" name="check" class="q-mt-sm q-px-xs" />
              <q-icon v-else class="q-mt-sm q-px-xs" />
              <q-item-section>{{ i.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-icon>
    </template>
  </q-input>
</template>
<script setup>
import { computed, ref, useAttrs } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ label: { type: String, default: undefined } });

const attrs = useAttrs();
const { locale, tm } = useI18n();
const selected = ref(locale.value);
const drop = ref(false);
const _langs = [];
for (const i in tm('langs'))
  _langs.push(i);
const model = defineModel({ required: true, default: {} });
const _model = computed({
  get() { return model.value?.[selected.value] },
  set(v) {
    // if (model.value == null)
    if (model.value == null || !model.value || !Object.keys(model.value).length)
      model.value = { [selected.value]: v };
    else
      model.value[selected.value] = v;
  }
});
const langs = computed(() => tm('langs').map(i => ({ key: i.key, label: i.label, hasData: !!model.value?.[i.key] })));

const computedLabel = computed(() => {
  const labelValue = props.label || attrs.label;
  return `${labelValue} (${tm('langs').find(x => x.key == selected.value).label})`;
});

const inputAttrs = computed(() => {
  const modifiedAttrs = { ...attrs };
  delete modifiedAttrs.label;
  return modifiedAttrs;
});
</script>