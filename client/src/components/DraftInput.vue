<script>
import { ref, h, watch, onBeforeUnmount } from 'vue'
import { QInput } from 'quasar'

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'

function toLatinDigits(value) {
  return String(value ?? '').replace(/[۰-۹٠-٩]/g, (d) => {
    const fa = FA_DIGITS.indexOf(d)
    if (fa >= 0) return String(fa)
    const ar = AR_DIGITS.indexOf(d)
    return ar >= 0 ? String(ar) : d
  })
}

function toLatinFloat(value) {
  return toLatinDigits(value)
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1')
}

/** Local draft so keystrokes don't re-render the whole ring template. */
export default {
  name: 'DraftInput',
  inheritAttrs: false,
  props: {
    modelValue: { type: [String, Number], default: '' },
    disable: { type: Boolean, default: false },
    latinDigits: { type: Boolean, default: false },
    limit: { type: Number, default: 0 },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    const draft = ref(props.modelValue ?? '')
    watch(
      () => props.modelValue,
      (v) => {
        if ((v ?? '') !== (draft.value ?? ''))
          draft.value = v ?? ''
      },
    )
    function flush() {
      const next = draft.value ?? ''
      if (next !== (props.modelValue ?? ''))
        emit('update:modelValue', next)
    }
    onBeforeUnmount(flush)
    return () => {
      // Read-only: skip QInput entirely — hundreds of disabled fields are costly.
      if (props.disable) {
        const text = props.modelValue == null || props.modelValue === ''
          ? '\u00a0'
          : String(props.modelValue)
        return h('div', {
          class: ['draft-input--readonly', attrs.class],
          style: attrs.style,
          dir: props.latinDigits ? 'ltr' : attrs.dir,
        }, text)
      }
      return h(QInput, {
        ...attrs,
        ...(props.limit > 0 ? { maxlength: props.limit, counter: true } : {}),
        modelValue: draft.value,
        disable: false,
        lang: props.latinDigits ? 'en' : attrs.lang,
        dir: props.latinDigits ? 'ltr' : attrs.dir,
        'onUpdate:modelValue': (v) => {
          let next = props.latinDigits ? toLatinFloat(v) : v
          if (props.limit > 0 && next != null && String(next).length > props.limit)
            next = String(next).slice(0, props.limit)
          draft.value = next
        },
        onBlur: flush,
      })
    }
  },
}
</script>

<style>
.draft-input--readonly {
  min-height: 28px;
  padding: 4px 6px;
  font-size: 1em;
  line-height: 1.3;
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
