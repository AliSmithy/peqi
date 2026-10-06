import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useWSStore = defineStore('ws', () => {
  const connected = ref(false);
  return { connected };
});
