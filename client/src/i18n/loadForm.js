import { ref, unref, watch } from 'vue'
import { i18n } from 'src/boot/i18n'
import enUSFormUi from './en-US/formUi'
import faIRFormUi from './fa-IR/formUi'

// Locale-specific forms (testdefinition, etc.) plus shared bilingual catalogs.
const localeFormModules = import.meta.glob('./*/forms/*.js')
const sharedFormModules = import.meta.glob('./forms/*.js')
const formUiByLocale = {
  'en-US': enUSFormUi,
  'fa-IR': faIRFormUi,
}
const loaded = new Set()

function nestByPath(path, value) {
  return path.split('.').reduceRight((acc, key) => ({ [key]: acc }), value)
}

function formLoaders(locale, formPath) {
  return {
    shared: sharedFormModules[`./forms/${formPath}.js`],
    local: localeFormModules[`./${locale}/forms/${formPath}.js`],
  }
}

async function loadLocaleForm(locale, formPath) {
  const cacheKey = `${locale}/${formPath}`
  if (loaded.has(cacheKey))
    return
  const { shared, local } = formLoaders(locale, formPath)
  if (!shared && !local)
    return
  const messages = {}
  if (shared)
    Object.assign(messages, (await shared()).default, formUiByLocale[locale])
  if (local)
    Object.assign(messages, (await local()).default)
  i18n.global.mergeLocaleMessage(locale, nestByPath(formPath, messages))
  loaded.add(cacheKey)
}

/** Opt-in: load a specific locale's form messages (e.g. en-US for Q/A titles). */
export function ensureFormLocale(locale, formPath) {
  return loadLocaleForm(locale, formPath)
}

// Returns a reactive `ready` flag so callers can defer rendering the keys
// until the messages are merged, avoiding the "Not found key" warning flood.
// `formPath` may be a string or a ref/computed (e.g. when route :flow changes).
export function useFormI18n(formPath) {
  const ready = ref(false)

  async function load() {
    const pathValue = unref(formPath)
    if (!pathValue) {
      ready.value = true
      return
    }
    const locale = i18n.global.locale.value
    const cacheKey = `${locale}/${pathValue}`
    const { shared, local } = formLoaders(locale, pathValue)
    if (loaded.has(cacheKey) || (!shared && !local)) {
      ready.value = true
      return
    }
    ready.value = false
    await loadLocaleForm(locale, pathValue)
    ready.value = true
  }

  load()
  watch(() => [i18n.global.locale.value, unref(formPath)], load)

  return { ready }
}
