import { boot } from 'quasar/wrappers'
import { debounce, Notify } from 'quasar';
import { useLoginStore } from 'stores/loginStore';
import { useWSStore } from 'src/stores/wsStore';
import { isTokenValid } from './axios';
// import { useNotificationStore } from 'src/stores/notificationStore';
import { i18n } from 'src/boot/i18n'
import wsT from './wsTypesClient';

const _socketURL = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${process.env.baseURL}/ws?token=`;

class WebSocketService {
  constructor() {
    // this.router = router;
    // this.urlPath = urlPath;
    this.socket = null;
    this.reconnectDelay = 3000;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 1200;
    this.loginStore = useLoginStore();
    this.isRefreshingToken = false;
    this.dataCache = [];
    if (this.loginStore.hasToken)
      this.connect();
  }
  connect() {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.socket = new WebSocket(_socketURL + this.loginStore.token);
      // console.log("................. trying to connect ..................");
      this.socket.addEventListener("open", () => {
        // console.log("========== onopen");
        useWSStore().connected = true;
        this.reconnectAttempts = 0;
      });
      this.socket.addEventListener("message", e => {
        // console.log("===== ws =====", e.data);
        const msg = JSON.parse(e.data);
        // console.log("========== onmessage", msg);
        if (msg.type && wsT[msg.type])
          wsT[msg.type](msg);
        // else
        //   console.log('Unhandled message type:', msg.type);
      });
      this.socket.addEventListener("close", async (e) => {
        // console.log("========== onclose", e.code);
        useWSStore().connected = false;
        if (e.code == 4000)
          Notify.create({ message: i18n.global.t("error.socket.4000"), color: 'negative', html: true });
        else
          this.reConnect();
      });
      this.socket.addEventListener("error", err => {
        // console.log("========== onerror");
        console.log("socket error", err);
        this.socket?.close();
      });
    }
    return this.socket;
  }
  disconnect() {
    // console.log("ws: disconnect",)
    this.socket?.close();
  }

  async reConnect() {
    const delayConnect = debounce(async () => {
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectDelay);
    if (!this.loginStore.hasToken)
      return;
    else if (!isTokenValid(this.loginStore.token))
      this.refreshToken(() => delayConnect());
    else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Giving up.');
      return;
    } else if (this.reconnectAttempts == 0)
      delayConnect();
    else
      delayConnect();
  }

  refreshToken(cb) {
    if (this.isRefreshingToken) {
      if (cb)
        this.dataCache.push(cb);
      return;
    }
    else {
      this.isRefreshingToken = true;
      if (cb)
        this.dataCache.push(cb);
      this.loginStore.refreshToken().then(() => {
        this.isRefreshingToken = false;
        for (const i of this.dataCache) {
          i(this.loginStore.token);
        }
        this.dataCache = [];
      }).catch(() => {
        this.isRefreshingToken = false;
        this.dataCache = [];
        this.reConnect();
      });
    }
  }
  send(type, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      if (!this.loginStore.hasToken) {
        Notify.create({ message: i18n.global.t("error.401"), color: 'negative', html: true });
        return;
      }
      if (!isTokenValid(this.loginStore.token)) {
        this.refreshToken((newToken) => {
          this.socket.send(JSON.stringify({ token: newToken, type: type, payload: { ...data } }));
        });
      } else {
        this.socket.send(JSON.stringify({ token: this.loginStore.token, type: type, payload: { ...data } }));
      }
    } else {
      console.error('WebSocket is not connected.');
      this.reConnect();
    }
  }
}
const ws = new WebSocketService();
export default boot(({ app }) => {
  app.config.globalProperties.$websocket = ws;
})

export { ws }