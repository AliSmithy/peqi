import { ref } from 'vue'

export function useFlowRingTabs() {
  return { tab: ref('results') }
}
