import { Notify } from 'quasar'
import { useI18n } from 'vue-i18n'

export function useSupervisorConfirm() {
  const { t } = useI18n()

  function validate(type, model) {
    if (type !== 'forward' && type !== 'finish')
      return true
    if (model?.data?.confirmed)
      return true
    Notify.create({
      message: t('supervisorconfirm.required'),
      color: 'negative',
    })
    return false
  }

  return { validate }
}
