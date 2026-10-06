import { inject, onMounted, ref, watch } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { registerFileSourceKey } from 'src/utils/injectionKeys';
import { FILES_API, getDownloadUrl, newFileFieldKey } from 'src/utils/crtblFiles';

export function useCrtblFiles(props) {
  const $q = useQuasar();
  const { t } = useI18n();
  const registerFileSource = inject(registerFileSourceKey, null);
  const serverFiles = ref([]);
  const popup = ref({
    visible: false,
    title: '',
    url: '',
    mime_type: '',
  });

  function loadFiles() {
    api.get(`${FILES_API}/${props.sourceForm}/${props.entityID ?? 0}/${props.disable ? 1 : 0}`).then(ret => {
      serverFiles.value = Array.isArray(ret?.data) ? ret.data : [];
    });
  }

  function deleteFile(id) {
    $q.dialog({
      title: t('file.delete'),
      message: t('file.deleteQuestion'),
      ok: { label: t('general.yes'), color: 'negative' },
      cancel: { label: t('general.no'), color: 'primary', autofocus: true },
      persistent: false,
    }).onOk(() => {
      api.delete(`${FILES_API}/${id}`).then(ret => {
        if (ret) loadFiles();
      });
    });
  }

  function openPreview(file) {
    if (!file?.id) return;
    popup.value.visible = true;
    popup.value.url = getDownloadUrl(file.id);
    popup.value.title = file.title || '';
    popup.value.mime_type = file.mime_type || '';
  }

  async function uploadFiles(fileList, metaForFile) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return false;
    const fd = new FormData();
    const metaData = [];
    const parts = [];
    files.forEach(file => {
      const key = newFileFieldKey();
      metaData.push({ key, meta: metaForFile(file) || {} });
      parts.push({ key, file });
    });
    fd.append('metaData', JSON.stringify(metaData));
    fd.append('sourceForm', props.sourceForm);
    parts.forEach(({ key, file }) => fd.append(key, file));
    const ret = await api.post(`${FILES_API}/${props.entityID ?? 0}`, fd);
    if (ret) {
      loadFiles();
      return true;
    }
    return false;
  }

  watch(() => [props.sourceForm, props.entityID, props.disable], loadFiles, { immediate: true });

  onMounted(() => {
    if (!props.disable)
      registerFileSource?.(props.sourceForm);
  });

  return { serverFiles, popup, loadFiles, deleteFile, openPreview, uploadFiles };
}
