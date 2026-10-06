import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { LocalStorage, Notify } from 'quasar';
import { useLoginStore } from 'stores/loginStore';
import { useMenuStore } from 'stores/menuStore';
import { i18n } from 'src/boot/i18n'
import { createMockAdapter } from 'src/mocks';

const _baseURL = process.env.baseURL;
const useMocks = process.env.useMocks === true || process.env.useMocks === 'true';
axios.defaults.baseURL = _baseURL;
axios.defaults.withCredentials = true;
const api = axios.create({ baseURL: _baseURL, withCredentials: true });

if (useMocks) {
  const mockAdapter = createMockAdapter();
  api.defaults.adapter = mockAdapter;
  axios.defaults.adapter = mockAdapter;
}

function decodeJwtPayload(token) {
  const base64Url = token.split('.')[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Seconds before `exp` to treat the token as stale (clock skew + in-flight latency). */
const TOKEN_EXPIRY_SKEW_SEC = 60;

function isTokenValid(token) {
  if (!token) return false;
  let payload = null;
  try {
    payload = decodeJwtPayload(token);
  } catch {
    return false; /** fail-safe: an undecodable token is treated as invalid so a refresh is triggered */
  }
  if (!payload) return false;
  if (!payload.exp) return true; /** no expiry claim: assume long-lived */
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp > currentTime + TOKEN_EXPIRY_SKEW_SEC;
}

function setAuthHeader(config, token) {
  if (!token) return;
  config.headers.Authorization = `Bearer ${token}`;
}

export default boot(({ app, router }) => {
  let isRefreshing = false;
  let refreshSubscribers = [];

  async function refreshToken() {
    const loginStore = useLoginStore();
    if (!LocalStorage.getItem("hasRefreshCookie")) {
      loginStore.logout(router);
      throw new Error("No refresh cookie");
    }
    try {
      const { data } = await axios.post("/user/refresh", {}, { withCredentials: true, noNotify: false, timeout: 4000 } // timeout in milliseconds
      );
      if (!data?.token)
        throw new Error("Refresh returned no token");
      loginStore.setUserInfo(data);
      useMenuStore().fetch();
      return data.token;
    } catch (err) {
      (err.response?.status == 401) && loginStore.logout(router); /** must force logout in case of 401 for refreshToken */
      throw err;
    }
  }
  function onRefreshed(newToken) {
    refreshSubscribers.forEach((callback) => callback(newToken));
    refreshSubscribers = [];
  }
  function onRefreshFailed(err) {
    refreshSubscribers.forEach((callback) => callback(null, err));
    refreshSubscribers = [];
  }

  async function ensureAuthHeader(config) {
    const loginStore = useLoginStore();
    let token = loginStore.token;

    if (config.noToken)
      return config;

    const needsRefresh = token ? !isTokenValid(token) : !!LocalStorage.getItem("hasRefreshCookie");
    if (!needsRefresh) {
      setAuthHeader(config, token);
      return config;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        token = await refreshToken();
        setAuthHeader(config, token);
        onRefreshed(token); /** flush every request queued while the refresh was in-flight */
        return config;
      } catch (error) {
        onRefreshFailed(error); /** unblock queued requests so they reject instead of hanging forever */
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    return new Promise((resolve, reject) => {
      refreshSubscribers.push((newToken, err) => {
        if (err || !newToken) return reject(err || new Error("Token refresh failed"));
        setAuthHeader(config, newToken);
        resolve(config);
      });
    });
  }

  api.interceptors.request.use(
    config => ensureAuthHeader(config),
    error => Promise.reject(error)
  );

  /** When responseType is blob/arraybuffer, error bodies arrive as Blob — parse JSON so 409 keys work for GET downloads too. */
  async function resolveErrorPayload(error) {
    const data = error.response?.data;
    if (data == null || (typeof data === 'object' && !(data instanceof Blob) && !(data instanceof ArrayBuffer)))
      return data;
    try {
      const text = data instanceof Blob ? await data.text() : new TextDecoder().decode(data);
      const parsed = JSON.parse(text);
      error.response.data = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  /** کنترل خطاها شامل خطای ویژه برنامه */
  api.interceptors.response.use(response => {
    if (response.status < 300)
      (response.data?.key) && Notify.create({ message: i18n.global.t(`success.${response.data?.key}`, response.data.data || {}, response.data.message), color: 'positive' });
    return Promise.resolve(response);
  }, async error => {
    const status = error.response?.status;
    const payload = await resolveErrorPayload(error);
    if (!error.config?.noNotify) {
      if (status == 409) {
        Notify.create({ message: i18n.global.t(`error.409.${payload?.key}`, payload?.data || {}, payload?.message), color: 'negative' });
      } else if (status == 401)
        Notify.create({ message: i18n.global.t("error.401"), color: 'negative', html: true });
      else if (status == 403)
        Notify.create({ message: i18n.global.t(`error.409.${payload?.key || 'backupNoPermission'}`), color: 'negative' });
      else if (status == 413)
        Notify.create({ message: i18n.global.t("error.413"), color: 'negative' });
      else if (status == 500)
        Notify.create({ message: i18n.global.t("error.500"), color: 'negative' });
      else if (status == 404)
        Notify.create({ message: i18n.global.t("error.404"), color: 'negative' });
      else {
        console.error("------------- error ----------", error);
        Notify.create({ message: i18n.global.t(`error.${error.code}`, i18n.global.t("error.unknownError")), color: 'negative' });
      }
    }
    if (error.config?.throwError)
      return Promise.reject(error);
    else
      return Promise.resolve(false);
  });

  useLoginStore(); /** hydrate after interceptors so startup fetches include Bearer */

  axios.refreshToken = refreshToken;
  api.refreshToken = refreshToken; /** expose on the instance the app actually uses */
  app.config.globalProperties.$axios = axios /** to use this.$axios */
  app.config.globalProperties.$api = api /** same as above */
})

export { axios, api, isTokenValid, _baseURL }
