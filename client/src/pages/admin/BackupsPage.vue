<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <div class="row items-center q-gutter-sm">
          <q-btn color="primary" icon="refresh" :label="t('general.refresh')" :loading="loading" :disable="jobRunning" @click="loadBackups" />
          <q-btn color="secondary" icon="backup" :label="t('backup.create')" :loading="jobRunning" :disable="jobRunning" @click="confirmCreate" />
        </div>
        <div v-if="jobRunning" class="q-mt-sm text-primary">{{ t('backup.running') }}</div>
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="backups"
          :columns="columns"
          row-key="name"
          flat
          bordered
          :loading="loading"
          :rows-per-page-options="[0]"
          hide-pagination
          :no-data-label="t('backup.empty')"
        >
          <template #body-cell-size="props">
            <q-td :props="props">
              {{ formatSize(props.row.size) }}
            </q-td>
          </template>
          <template #body-cell-lastModified="props">
            <q-td :props="props">
              {{ localizedDateTime(props.row.lastModified) }}
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                dense
                color="primary"
                icon="download"
                :label="t('backup.download')"
                :loading="downloading === props.row.name"
                :disable="!!downloading"
                @click="downloadBackup(props.row.name)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, _baseURL } from 'boot/axios'
import { useI18n } from 'vue-i18n'
import { localizedDateTime } from 'src/utils/zenUtil'

const $q = useQuasar()
const { t } = useI18n()

const backups = ref([])
const loading = ref(false)
const downloading = ref('')
const jobRunning = ref(false)
let pollTimer = null

const columns = computed(() => [
  { name: 'name', label: t('backup.file'), field: 'name', align: 'left', sortable: true },
  { name: 'size', label: t('backup.size'), field: 'size', align: 'left', sortable: true },
  { name: 'lastModified', label: t('backup.modified'), field: 'lastModified', align: 'left', sortable: true },
  { name: 'actions', label: t('backup.download'), field: 'name', align: 'left', sortable: false },
])

function formatSize(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024)
    return `${n} B`
  if (n < 1024 * 1024)
    return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024)
    return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function applyStatus(data) {
  const wasRunning = jobRunning.value
  jobRunning.value = !!data?.running
  if (wasRunning && !jobRunning.value) {
    stopPoll()
    loadBackups()
    if (data?.exitCode)
      $q.notify({ message: t('backup.failed'), color: 'negative' })
  }
}

function loadStatus() {
  return api.get('/admin/backups/status').then(ret => {
    if (ret?.data)
      applyStatus(ret.data)
    return ret?.data
  })
}

function startPoll() {
  stopPoll()
  pollTimer = setInterval(loadStatus, 2000)
}

function confirmCreate() {
  $q.dialog({
    title: t('backup.create'),
    message: t('backup.createConfirm'),
    cancel: true,
    persistent: false,
  }).onOk(startBackup)
}

async function startBackup() {
  const ret = await api.post('/admin/backups/run')
  if (!ret || (ret.status !== 200 && ret.status !== 202))
    return
  applyStatus(ret.data)
  if (jobRunning.value)
    startPoll()
}

function loadBackups() {
  loading.value = true
  api.get('/admin/backups/list').then(ret => {
    if (ret?.data?.data)
      backups.value = ret.data.data
  }).finally(() => {
    loading.value = false
  })
}

async function downloadBackup(name) {
  downloading.value = name
  try {
    const ret = await api.post('/admin/backups/ticket', { name })
    const ticket = ret?.data?.ticket
    if (!ticket)
      return
    const a = document.createElement('a')
    a.href = `${_baseURL}/admin/backups/file/${encodeURIComponent(ticket)}`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    downloading.value = ''
  }
}

onMounted(() => {
  loadBackups()
  loadStatus().then(data => {
    if (data?.running)
      startPoll()
  })
})

onUnmounted(stopPoll)
</script>
