import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ensureFormLocale } from 'src/i18n/loadForm'

export const REPORT_NOTES_LIMIT = 600

export function codeList(code) {
  if (Array.isArray(code))
    return code
  if (code == null || code === '')
    return []
  return [code]
}

export function groupKey(group) {
  if (group.embed)
    return `embed_${group.embed}`
  const list = codeList(group.code)
  return list.length ? list.join('_') : 'blank'
}

export function answerKeysFromGroups(groups) {
  return groups.flatMap(g =>
    g.embed ? [] : g.questions.filter(q => !q.noAnswer && !q.fullRow).map(q => q.key),
  )
}

export function groupAllNa(group, answers) {
  const answerable = group.questions.filter(q => !q.noAnswer && !q.fullRow)
  if (!answerable.length)
    return false
  return answerable.every(q => answers[q.key] === 'na')
}

/** @param {object} answers - data.answers map (not the whole form data) */
export function rowCellClass(q, answers) {
  if (q.fullRow)
    return 'is-band'
  if (q.greyBg)
    return 'is-grey'
  if (q.noAnswer || q.noBg)
    return ''
  if (answers[q.key] === 'na')
    return 'is-na'
  return ''
}

export function codeCellClass(group, answers) {
  if (group.questions.every(q => q.greyBg || q.fullRow))
    return 'is-grey'
  if (group.questions.every(q => q.noAnswer || q.noBg || q.fullRow))
    return ''
  if (groupAllNa(group, answers))
    return 'is-na'
  return ''
}

export function answerToggleColor(value) {
  if (value === 'yes') return 'positive'
  if (value === 'no') return 'negative'
  return 'grey-7'
}

export function answerValueClass(value) {
  if (value == null || value === '')
    return 'text-grey-5'
  return `text-${answerToggleColor(value)}`
}

export function answerLabel(options, value) {
  if (value == null || value === '')
    return '—'
  const opt = options.find(o => o.value === value)
  return opt?.label ?? String(value)
}

export function brief(value) {
  if (value == null || String(value).trim() === '')
    return '—'
  return value
}

export function makeAnswerOptions(t, i18nPrefix) {
  return [
    { label: t(`${i18nPrefix}.answerNA`), value: 'na' },
    { label: t(`${i18nPrefix}.answerYes`), value: 'yes' },
    { label: t(`${i18nPrefix}.answerNo`), value: 'no' },
  ]
}

/**
 * Resolve question copy once so the table render path avoids $t/$te per row.
 * @returns {Record<string, { lines: { text: string, dir: string }[], body: string, notes: string[] }>}
 */
export function buildQuestionTitles(groups, i18nPrefix, { t, te, bilingual }) {
  const out = Object.create(null)
  for (const group of groups) {
    if (group.embed || !group.questions)
      continue
    for (const q of group.questions) {
      if (out[q.key])
        continue
      if (bilingual) {
        const lines = []
        for (let i = 1; i <= 20; i++) {
          const base = i === 1 ? q.key : `${q.key}_${i}`
          const keys = [base, `${base}_fa`].filter(key => te(`${i18nPrefix}.${key}`))
          if (!keys.length)
            break
          for (const key of keys) {
            lines.push({
              text: t(`${i18nPrefix}.${key}`),
              dir: key.endsWith('_fa') ? 'rtl' : 'ltr',
            })
          }
        }
        out[q.key] = { lines, body: lines[0]?.text ?? q.key, notes: [] }
      }
      else {
        out[q.key] = {
          lines: [{ text: t(`${i18nPrefix}.${q.key}`, {}, { locale: 'en-US' }), dir: 'ltr' }],
          body: t(`${i18nPrefix}.${q.key}`),
          notes: (q.notes || []).map(note => t(`${i18nPrefix}.${note}`)),
        }
      }
    }
  }
  return out
}

export function useQaResults({ i18nPrefix, answerKeys }) {
  const { t, locale } = useI18n()
  const prepared = new WeakSet()

  // Stable until form messages are ready / locale changes. Built before the
  // lazy form chunk loads, vue-i18n returns the key path as the label — so we
  // must rebuild after ensureFormLocale (subtables use this ref directly).
  const answerOptions = ref(makeAnswerOptions(t, i18nPrefix))

  async function refreshAnswerOptions() {
    await ensureFormLocale(locale.value, i18nPrefix).catch(() => {})
    answerOptions.value = makeAnswerOptions(t, i18nPrefix)
  }

  refreshAnswerOptions()
  watch(locale, refreshAnswerOptions)

  function ensureAnswers(data) {
    if (!data.answers || typeof data.answers !== 'object')
      data.answers = {}
    for (const key of answerKeys) {
      if (data.answers[key] == null || data.answers[key] === '')
        data.answers[key] = 'na'
    }
    if (data.notes == null) data.notes = ''
  }

  function prep(data, extraEnsure) {
    if (!data || typeof data !== 'object')
      return false
    if (!prepared.has(data)) {
      ensureAnswers(data)
      extraEnsure?.(data)
      prepared.add(data)
    }
    return true
  }

  return {
    prep,
    ensureAnswers,
    answerOptions,
    t,
  }
}
