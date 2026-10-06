import { defineStore } from 'pinia';
import { LocalStorage, throttle } from 'quasar';
import { computed, ref } from 'vue';
import { axios } from 'src/boot/axios';
import { api } from 'boot/axios';
import { localizedTitle } from 'src/utils/zenUtil';
import { DEFAULT_MAX_FILE_SIZE } from 'src/utils/crtblFiles';
import { useMenuStore } from './menuStore';
import { useNotifStore } from './notifStore';
import { useChangelogStore } from './changelogStore';

export const useLoginStore = defineStore('user', () => {
  const token = ref(null);
  const userInfo = ref({});
  const limits = ref({});

  // const userInfo = computed({
  //   get() {
  //     console.log('========== Getting userInfo:', _userInfo.value);
  //     return _userInfo.value;
  //   },
  //   set(val) {
  //     _userInfo.value = val;
  //   }
  // });

  const hasToken = computed(() => token.value != null);
  const fileSizeLimit = computed(() => {
    const n = Number(limits.value?.fileSize);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_FILE_SIZE;
  });
  const userTitle = computed(() => localizedTitle(userInfo.value?.utitle));
  const roles = computed(() => userInfo.value?.roles ?? []);
  const roleOptions = computed(() =>
    roles.value.map(r => ({
      label: localizedTitle(r.title),
      value: r.id,
    }))
  );
  const selectedRoleTitle = computed(() => {
    const role = roles.value.find(r => r.id === userInfo.value?.rid);
    return role ? localizedTitle(role.title) : '';
  });
  const menuStore = useMenuStore();
  const notifStore = useNotifStore();
  const changelogStore = useChangelogStore();

  if (LocalStorage.has("token"))
    setToken(LocalStorage.getItem("token"));
  if (LocalStorage.has("userInfo")) {
    const info = LocalStorage.getItem("userInfo");
    userInfo.value = info;
  }
  if (LocalStorage.has("appLimits")) {
    const stored = LocalStorage.getItem("appLimits");
    if (stored && typeof stored === 'object')
      limits.value = stored;
  }
  async function refreshToken() {
    if (!refreshToken._throttled)
      refreshToken._throttled = throttle(async () => {
        const token = await axios.refreshToken();
        setToken(token);
      }, 3000);
    refreshToken._throttled();
    // const token = await axios.refreshToken();
    // setToken(token);
  }
  function setToken(val) {
    const hasPrev = token.value != null;
    token.value = val;
    if (val) {
      LocalStorage.set("token", val);
      if (!hasPrev) {
        menuStore.fetch();
      }
    } else {
      LocalStorage.remove("token");
      menuStore.fetch();
    }
  }
  function setUserName(username) {
    userInfo.value.username = username;
    LocalStorage.set("userInfo", userInfo.value);
  }
  function login(router, data) {
    return api.post("/user/login", {
      username: data.username,
      password: data.password,
      captcha: data.captcha,
      path: "/user/login"
    }, { noToken: true, throwError: true }).then(ret => {
      if (ret.data && ret.status == 200) {
        const d = ret.data.data;
        // userInfo.value = d.userInfo ?? {};
        // LocalStorage.set("userInfo", userInfo?.value);
        // setToken(d.token);
        LocalStorage.set("hasRefreshCookie", true);
        setUserInfo(d);
        notifStore.fetch();
        changelogStore.fetch();
        router.push("/");
      } else {
        // if (profile.value.showCaptcha)
        //   captchaRef.value?.refreshCaptcha();
        // else
        //   profile.value.showCaptcha = true;
      }
    });
  }
  function setUserInfo(data) {
    userInfo.value = data.userInfo ?? {};
    LocalStorage.set("userInfo", userInfo.value);
    if (data.limits && typeof data.limits === 'object') {
      limits.value = data.limits;
      LocalStorage.set("appLimits", data.limits);
    }
    setToken(data.token);
  }
  function logout(router) {
    return api.get("/user/logout", { noToken: true }).then(() => {
      userInfo.value.name = null;
      userInfo.value.role = null;
      userInfo.value.username = null;
      LocalStorage.set("hasRefreshCookie", false)
      LocalStorage.remove("userInfo");
      LocalStorage.remove("appLimits");
      limits.value = {};
      LocalStorage.remove("mainMenu");
      LocalStorage.remove("chatMenu");
      LocalStorage.remove("profileMenu");
      setToken(null);
      notifStore.clear();
      changelogStore.clear();
      router.push("/");
    });
  }
  async function changeRole(rid) {
    // console.log("changeRole", rid);
    if (!Number.isInteger(rid))
      return;

    const ret = await api.post(`/user/chngrole/${rid}`, {}, { throwError: true });
    await menuStore.fetch(true);
    const updatedInfo = { ...userInfo.value, rid };
    userInfo.value = updatedInfo;
    LocalStorage.set("userInfo", updatedInfo);
    return ret;
  }
  return { token, hasToken, fileSizeLimit, userTitle, roleOptions, selectedRoleTitle, refreshToken, setToken, login, logout, setUserName, changeRole, userInfo, setUserInfo, limits };
});
