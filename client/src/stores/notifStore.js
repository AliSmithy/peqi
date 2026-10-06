// /* eslint-disable */
import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { ref } from 'vue';
import { useLoginStore } from 'stores/loginStore';
import { i18n } from 'src/boot/i18n'
import { Notify } from 'quasar'
import { localizedDateTime, localizedTitle } from 'src/utils/zenUtil';
import { useCrtblStore } from './crtblStore';

export const useNotifStore = defineStore('notification', () => {
  const items = ref([]);
  const count = ref(0);
  const loginStore = useLoginStore();

  if (items.value.length == 0)
    fetch();

  async function fetch() {
    if (!loginStore.hasToken)
      return;
    try {
      const ret = await api.get("/notif");
      if (ret && ret.status == 200) {
        items.value = ret.data.rows || [];
        count.value = ret.data.count || 0;
      }
    } catch (err) {
      console.log("notifStore fetch err", err);
    }
  }
  function show() {
    /** حذف نمایش نوتیفای های پوپاپ شده قبلی به دلیل اینکه ممکن است آپدیت شده باشند */
    document.querySelectorAll('.q-notification, .q-notify').forEach(el => el.remove());
    for (const i of items.value.filter(x => !x.shown)) {
      const own = i.payload.data.uidt == loginStore.userInfo.uid;
      i.shown = true;
      i.payload.data.ut = localizedTitle(i.payload.data.ut);
      i.payload.data.t = localizedDateTime(i.payload.data.t);
      Notify.create({
        timeout: 0, multiLine: false, color: "accent", position: "bottom-right", classes: "notif", group: false,
        actions: [
          {
            icon: "close", color: "white", size: "xs", round: true, class: "q-pa-xs q-mr-xs bg-pink-9", noDismiss: false,
            handler: () => seen(i.id)
          },
          {
            icon: own ? "arrow_back" : "swap_horiz", color: "white", size: "xs", round: true, iconColor: "red", class: ["q-pa-xs", own ? "bg-teal-9" : "bg-orange-10"], noDismiss: false,
            handler: () => useCrtblStore().loadJobOrFlow(i.payload?.data?.tid).then(() => seen(i.id))
          }
        ],
        message: i18n.global.t(`notif.${i.payload.key}.message`, i.payload.data, i.payload.message),
        caption: i18n.global.t(`notif.${i.payload.key}.caption`, i.payload.data),
      });
      count.value--;
      (count.value < 0) && (count.value = 0);
    }
  }
  function seen(id) {
    // console.log("seen id", id);
    // return;
    if (!loginStore.hasToken)
      return;
    api.post("/notif", { id }).then(ret => {
      if (ret && ret.status == 200) {
        items.value = ret.data.rows;
        count.value = ret.data.count;
      }
    }).catch(err => console.log("notifStore seen err", err));
  }

  async function add(obj) {
    if (!loginStore.hasToken)
      return;
    items.value = items.value.filter(x => {
      if (x.payload?.data?.tid && (x.payload?.data?.tid == obj.payload?.data?.tid)) {
        count.value--;
        return false;
      } else
        return true;
    });
    items.value.push(obj);
    count.value++;
  }

  function clear() {
    items.value = [];
    count.value = 0;
  }

  return { count, fetch, show, add, clear };
});
