/** eslint-disable */
import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { useLoginStore } from 'stores/loginStore';
import { ref } from 'vue';
import { LocalStorage, throttle } from 'quasar';
import { getRouter } from 'src/router';

/** Authenticated routes that stay reachable even when they are not part of the role menu. */
const ALLOWED_PATHS = ['/', '/login', '/user/pass', '/changelog', '/flow/typeapproval'];

function pathInList(path, list) {
  return (list ?? []).some(
    i => i.url && (path === i.url || path.startsWith(`${i.url}/`))
  );
}

export const useMenuStore = defineStore('menu', () => {

  const loginStore = useLoginStore();

  const items = ref([]);
  const loaded = ref(false);
  let inflight = null;

  function isPathAccessible(path) {
    if (ALLOWED_PATHS.includes(path))
      return true;
    return pathInList(path, items.value);
  }

  function enforceMenuAccess() {
    const router = getRouter();
    if (!router || !loginStore.hasToken || !loaded.value)
      return;
    if (!isPathAccessible(router.currentRoute.value.path))
      router.push('/');
  }

  async function fetch(run_immediate = false) {
    const rawFn = () => {
      if (inflight)
        return inflight;
      inflight = api.get("/user/menu").then(ret => {
        items.value = ret?.data ?? [];
        loaded.value = true;
        enforceMenuAccess();
      }).finally(() => { inflight = null; });
      return inflight;
    };

    if (run_immediate)
      return rawFn();

    if (!!LocalStorage.getItem("hasRefreshCookie") && loginStore.hasToken) {
      if (!fetch._throttled)
        fetch._throttled = throttle(rawFn, 3000);
      return fetch._throttled();
    }
    else {
      items.value = [];
      loaded.value = false;
    }
  }

  function ensureLoaded() {
    if (loaded.value)
      return Promise.resolve();
    return inflight ?? fetch(true);
  }

  return { items, loaded, fetch, ensureLoaded, isPathAccessible, enforceMenuAccess };
});
