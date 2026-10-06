<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <div class="row items-center q-gutter-sm">
          <q-btn color="primary" icon="add" :label="t('user.new')" @click="userAct.addNewUser" />
          <q-btn color="secondary" icon="edit" :label="t('user.edit')" :disable="!selectedUser" @click="userAct.editUser" />
          <q-btn color="negative" icon="delete" :label="t('user.delete')" :disable="!selectedUser" @click="userAct.deleteUser" />
        </div>
      </q-card-section>

      <q-card-section>
        <q-table :rows="users" :columns="columns" row-key="id" flat bordered :loading="loading" selection="single" v-model:selected="selectedRows" :rows-per-page-options="[0]" hide-pagination>
          <template #body-cell-title="props">
            <q-td :props="props">
              {{ localizedTitle(props.row.title) }}
            </q-td>
          </template>

          <template #body-cell-roles="props">
            <q-td :props="props">
              {{ formatRoles(props.row.roles) }}
            </q-td>
          </template>

          <template #body-cell-selected_role="props">
            <q-td :props="props">
              {{ localizedTitle(props.row.role?.title) }}
            </q-td>
          </template>

          <template #body-cell-locked_at="props">
            <q-td :props="props">
              <q-icon v-if="props.row.locked_at" name="lock" color="red" class="q-mr-xs" size="xs" />
              <q-icon v-else name="verified_user" color="positive" class="q-mr-xs" size="xs" />
              {{ localizedDateTime(props.row.locked_at) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <zen-dialog v-model="userPopup" no-scroll :title="isEditingUser ? t('user.edit') : t('user.new')" :okText="t('general.save')" style="width: 520px; max-width: 100vw" height="400px" :enabled="true" @onOK="userAct.saveUser" @onCancel="userAct.closeUserDialog">
      <template #form>
        <div class="q-gutter-md">
          <q-input v-model="userForm.username" :label="t('login.username')" dense outlined lazy-rules :rules="newUserFieldRules" />
          <q-input v-model="userForm.password" :label="isEditingUser ? t('user.passwordKeep') : t('login.password')" type="password" dense outlined lazy-rules :rules="newUserPasswordRules" />
          <zen-locale-input v-model="userForm.title" :label="t('file.title')" dense outlined lazy-rules :rules="newUserTitleRules" />
          <q-select v-model="userForm.role_ids" :options="roles" option-value="id" option-label="label" emit-value map-options multiple use-chips :label="t('profile.rolename')" dense outlined lazy-rules :rules="[validate.requiredArray]">
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-checkbox v-model="userForm.locked" :label="t('user.locked')" />
        </div>
      </template>
    </zen-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, toRaw } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useI18n } from 'vue-i18n'
import zenLocaleInput from 'src/components/zen-locale-input.vue'
import zenDialog from 'src/components/zen-dialog.vue'
import { localizedDateTime, localizedTitle, validate } from 'src/utils/zenUtil'

const $q = useQuasar()
const { t } = useI18n()

const users = ref([])
const roles = ref([])
const loading = ref(false)
const userPopup = ref({ visible: false })
const isEditingUser = ref(false)
const selectedRows = ref([])
const userForm = ref({
  id: null,
  username: '',
  password: '',
  title: {},
  role_ids: [],
  locked: false,
})

const columns = computed(() => [
  { name: 'username', label: t('login.username'), field: 'username', align: 'left', sortable: true },
  { name: 'title', label: t('file.title'), field: 'title', align: 'left', sortable: true },
  { name: 'roles', label: t('profile.roles'), field: 'roles', align: 'left', sortable: false },
  { name: 'selected_role', label: t('user.selectedRole'), field: 'role', align: 'left', sortable: false },
  { name: 'locked_at', label: t('user.active'), field: 'locked_at', align: 'left', sortable: true },
])

const selectedUser = computed(() => selectedRows.value?.[0] || null)

const newUserFieldRules = computed(() => isEditingUser.value ? [] : [validate.required])
const newUserPasswordRules = computed(() => isEditingUser.value ? [] : [validate.required])
const newUserTitleRules = computed(() => isEditingUser.value ? [] : [() => {
  const title = userForm.value.title
  if (!title || !Object.values(title).some(v => v && String(v).trim()))
    return t('validate.required')
  return true
}])

function formatRoles(userRoles) {
  if (!Array.isArray(userRoles) || userRoles.length === 0)
    return ''
  return userRoles.map(role => localizedTitle(role.title)).join(', ')
}

class userAct {
  static mergeRoleOptions(sourceRoles = []) {
    const merged = new Map(roles.value.map(r => [r.id, r]))
    for (const role of sourceRoles) {
      merged.set(role.id, {
        id: role.id,
        label: localizedTitle(role.title),
        title: role.title,
      })
    }
    roles.value = [...merged.values()]
  }

  static async addNewUser() {
    isEditingUser.value = false
    userForm.value = {
      id: null,
      username: '',
      password: '',
      title: {},
      role_ids: [],
      locked: false,
    }
    await userAct.loadRoles()
    userPopup.value.visible = true
  }

  static async editUser() {
    const user = selectedUser.value
    if (!user)
      return
    isEditingUser.value = true
    userAct.mergeRoleOptions(user.roles)
    userForm.value = {
      id: user.id,
      username: user.username || '',
      password: '',
      title: { ...(toRaw(user.title) ?? {}) },
      role_ids: (user.roles || []).map(role => role.id),
      locked: !!user.locked_at,
    }
    userPopup.value.visible = true
    await userAct.loadRoles()
  }

  static deleteUser() {
    const user = selectedUser.value
    if (!user)
      return
    $q.dialog({
      title: t('user.delete'),
      message: t('user.deleteQuestion', { u: user.username || user.id }),
      cancel: true,
      persistent: false,
    }).onOk(async () => {
      await api.delete(`/admin/users/${user.id}`)
      selectedRows.value = []
      userAct.loadUsers()
    })
  }

  static async saveUser() {
    const valid = await userPopup.value.form?.validate()
    if (!valid)
      return
    api.post('/admin/users', userForm.value).then(ret => {
      if (ret.status != 200)
        return
      userAct.closeUserDialog()
      userAct.loadUsers()
    })
  }

  static closeUserDialog() {
    userPopup.value.visible = false
    isEditingUser.value = false
    userForm.value = {
      id: null,
      username: '',
      password: '',
      title: {},
      role_ids: [],
      locked: false,
    }
  }

  static loadRoles() {
    return api.get('/admin/roles/list').then(ret => {
      if (ret.data && ret.data.data) {
        userAct.mergeRoleOptions(ret.data.data.map(role => ({
          id: role.id,
          title: role.title,
        })))
      }
    })
  }

  static loadUsers() {
    loading.value = true
    api.get('/admin/users/list').then(ret => {
      if (ret?.data?.data) {
        users.value = ret.data.data
        const selected = selectedRows.value[0]
        if (selected?.id) {
          const fresh = users.value.find(u => u.id === selected.id)
          if (fresh)
            selectedRows.value = [fresh]
        }
      }
    }).finally(() => {
      loading.value = false
    })
  }
}

onMounted(() => {
  userAct.loadUsers()
  userAct.loadRoles()
})
</script>
