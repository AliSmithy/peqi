import { useLoginStore } from 'src/stores/loginStore';
import { useNotifStore } from 'stores/notifStore';

export default {
  refreshToken() {
    useLoginStore().refreshToken();
  },
  notification(msg) {
    delete msg.type;
    useNotifStore().add(msg);
  },
};