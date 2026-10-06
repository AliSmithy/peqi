import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { computed, ref } from 'vue'
import { LocalStorage } from 'quasar'
import { useLoginStore } from 'stores/loginStore'

const SEEN_KEY = 'changelogSeenDate'

export const useChangelogStore = defineStore('changelog', () => {
  const loginStore = useLoginStore()
  const days = ref([])
  const loading = ref(false)
  const seenDate = ref(LocalStorage.getItem(SEEN_KEY) || '')

  const latestDate = computed(() => days.value[0]?.date ?? '')

  const unseenCount = computed(() => {
    const seen = seenDate.value
    return days.value.reduce((n, day) => {
      if (!seen || day.date > seen)
        return n + (day.items?.length ?? 0)
      return n
    }, 0)
  })

  async function fetch() {
    if (!loginStore.hasToken)
      return
    loading.value = true
    try {
      const ret = await api.get('/changelog')
      if (ret?.status == 200)
        days.value = ret.data?.days ?? []
    } catch (err) {
      console.log('changelogStore fetch err', err)
    } finally {
      loading.value = false
    }
  }

  function markSeen() {
    if (!latestDate.value)
      return
    seenDate.value = latestDate.value
    LocalStorage.set(SEEN_KEY, latestDate.value)
  }

  function clear() {
    days.value = []
  }

  return { days, loading, unseenCount, fetch, markSeen, clear }
})
