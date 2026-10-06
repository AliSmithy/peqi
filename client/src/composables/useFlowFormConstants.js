import { unref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

export const TEST_LOCATION = 'شرکت تاپکو'
export const TEST_OBJECTIVE = 'بررسی تطابق محصول با الزامات استانداردی'

function isEmpty(value) {
  return value == null || value === ''
}

/**
 * Seed flow-constant fields into form data once (if empty).
 * Always forces testLocation + testObjective.
 * Seeds testMethod + referenceStandard from `${flow}.2.*` when empty.
 */
export function useFlowFormConstants(flow, data, { ready } = {}) {
  const { t, te } = useI18n()

  watchEffect(() => {
    const form = unref(data)
    if (!form)
      return
    if (ready && !unref(ready))
      return

    form.testLocation = TEST_LOCATION
    form.testObjective = TEST_OBJECTIVE

    const flowName = unref(flow)
    if (!flowName)
      return

    for (const key of ['testMethod', 'referenceStandard']) {
      if (!isEmpty(form[key]))
        continue
      const path = `${flowName}.2.${key}`
      if (!te(path))
        continue
      const value = t(path)
      if (!isEmpty(value))
        form[key] = value
    }
  })
}
