<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-md">
      <!-- بخش بالا - نقش -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row q-gutter-sm q-mb-md">
              <q-btn color="primary" icon="add" :label="t('role.new')" @click="roleAct.addNewRole" :disable="isEditingPerms" />
              <q-btn color="secondary" icon="edit" :label="t('role.edit')" @click="roleAct.editRole" :disable="!selectedRole || isEditingPerms" />
              <q-btn color="negative" icon="delete" :label="t('role.delete')" @click="roleAct.deleteRole" :disable="!selectedRole || isEditingPerms" />
              <q-btn color="primary" icon="edit" :label="t('role.editPerms')" @click="permAct.startEditPerms" :disable="!selectedRole || isEditingPerms" v-if="!isEditingPerms" />
              <q-btn v-if="isEditingPerms" color="positive" icon="save" :label="t('general.save')" @click="permAct.savePermissions" />
              <q-btn v-if="isEditingPerms" color="grey" icon="cancel" :label="t('general.cancel')" @click="permAct.cancelEdit" />
            </div>

            <div class="row q-gutter-sm">
              <div class="col-12 col-md-6">
                <q-select v-model="selectedRole" :options="roles" option-value="id" option-label="name" emit-value map-options outlined clearable :label="t('role.roleName')" @update:model-value="roleAct.onRoleSelect" @focus="roleAct.loadRoles" :disable="isEditingPerms" :loading="loading">
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.name[locale] }}</q-item-label>
                        <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:selected-item="scope">
                    <div v-if="scope.opt">
                      <div class="text-weight-medium">{{ scope.opt.name[locale] }}</div>
                      <div class="text-caption text-grey-6">{{ scope.opt.description }}</div>
                    </div>
                  </template>
                </q-select>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- جدول سطح دسترسی -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div v-if="roleAct.getSelectedRole()" class="permission-grid">
              <q-table :rows="treeRoles" :columns="[
                { name: 'title', label: t('role.menuItemTitle'), field: 'title', align: 'left', sortable: true, style: 'width:50%' },
                { name: 'R', label: t('general.R'), field: 'R', align: 'center', sortable: false },
                { name: 'C', label: t('general.C'), field: 'C', align: 'center', sortable: false },
                { name: 'U', label: t('general.U'), field: 'U', align: 'center', sortable: false },
                { name: 'D', label: t('general.D'), field: 'D', align: 'center', sortable: false }
              ]" flat bordered :loading="loading" :rows-per-page-options="[0]" hide-pagination>
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td key="title" :props="props">
                      <div :style="{ paddingLeft: (props.row.level * 20) + 'px' }" class="row items-center">
                        <q-btn v-if="props.row.isParent && props.row.canExpand" flat dense round :icon="props.row.expanded ? 'expand_less' : 'expand_more'" size="sm" @click="permAct.toggleExpanded(props.row.id)" class="q-mr-sm" />

                        <span :class="{ 'text-weight-bold': props.row.isParent, 'q-px-xl': !props.row.isParent }">{{
                          props.row.title[locale] }}</span>
                      </div>
                    </q-td>
                    <q-td key="R" :props="props" class="text-center">
                      <q-checkbox v-model="props.row.R" color="info" :disable="!isEditingPerms" :indeterminate-value="props.row.R === 'indeterminate'" :size="props.row.isParent ? 'md' : 'xs'" @update:model-value="permAct.onPermissionChange(props.row, 'R')" />
                    </q-td>
                    <q-td key="C" :props="props" class="text-center">
                      <q-checkbox v-model="props.row.C" color="positive" :disable="!isEditingPerms" :indeterminate-value="props.row.C === 'indeterminate'" :size="props.row.isParent ? 'md' : 'xs'" @update:model-value="permAct.onPermissionChange(props.row, 'C')" />
                    </q-td>
                    <q-td key="U" :props="props" class="text-center">
                      <q-checkbox v-model="props.row.U" color="warning" :disable="!isEditingPerms" :indeterminate-value="props.row.U === 'indeterminate'" :size="props.row.isParent ? 'md' : 'xs'" @update:model-value="permAct.onPermissionChange(props.row, 'U')" />
                    </q-td>
                    <q-td key="D" :props="props" class="text-center">
                      <q-checkbox v-model="props.row.D" color="negative" :disable="!isEditingPerms" :indeterminate-value="props.row.D === 'indeterminate'" :size="props.row.isParent ? 'md' : 'xs'" @update:model-value="permAct.onPermissionChange(props.row, 'D')" />
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </div>
            <div v-else class="text-center text-grey-6 q-pa-lg">
              <q-icon name="info" size="48px" class="q-mb-md" />
              <div>{{ $t('role.noRoleSelected') }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- پوپاپ ویرایش نقش -->
    <q-dialog v-model="roleDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ isEditingRole ? t('role.edit') : t('role.new') }}</div>
        </q-card-section>

        <q-card-section>
          <zen-locale-input outlined v-model="roleForm.name" type="text" :label="t('role.roleName')" :rules="[val => !!val || 'Role name is required']" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('general.cancel')" @click="roleAct.closeRoleDialog" />
          <q-btn color="primary" :label="isEditingRole ? t('general.U') : t('general.C')" @click="roleAct.saveRole" :disable_="!roleForm.name" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useI18n } from 'vue-i18n'
import zenLocaleInput from 'src/components/zen-locale-input.vue';

const $q = useQuasar();
const { t, locale } = useI18n();

// Reactive data
const roles = ref([]);
const selectedRole = ref(null);
const isEditingPerms = ref(false);
const isEditingRole = ref(false);
const roleDialog = ref(false);
const loading = ref(false);
const originalPermissions = ref({}); /** برای نگهداری تغییر و بازگرداندن پس از کنسل*/
const permissions = ref([]); /** دیتای جدول سطوح دسترسی */
const expandedRows = ref([]);
const roleForm = ref({ name: '', description: '' });

const syncExpandedRows = (data = permissions.value) => {
  expandedRows.value = (data || [])
    .filter(role => Array.isArray(role.forms) && role.forms.length > 1)
    .map(role => `role-${role.id}`);
};

/** دیتای لازم برای نمایش در جدول سطح دسترسی */
const treeRoles = computed(() => {
  const result = [];
  permissions.value.forEach(role => {
    const permissionsKeys = ['C', 'R', 'U', 'D'];
    const parentPermissions = {};
    const childForms = Array.isArray(role.forms) ? role.forms : [];
    const parentId = `role-${role.id}`;
    const canExpand = childForms.length > 1;

    /** محاسبه وضعیت رکورد پرنت بر اساس چایلدهایش */
    permissionsKeys.forEach(permission => {
      if (childForms.length > 0) {
        const allChecked = childForms.every(form => form[permission] === true);
        const someChecked = childForms.some(form => form[permission] === true);
        if (allChecked)
          parentPermissions[permission] = true;
        else if (someChecked)
          parentPermissions[permission] = 'indeterminate'; /** بعضی چایلدها انتخاب شده و بغضی نشده‌اند */
        else
          parentPermissions[permission] = false;
      } else
        parentPermissions[permission] = role[permission] || false;
    });
    const parentRole = {
      id: parentId,
      title: role.title,
      isParent: true,
      level: 0,
      canExpand,
      C: parentPermissions.C,
      R: parentPermissions.R,
      U: parentPermissions.U,
      D: parentPermissions.D,
      expanded: canExpand && expandedRows.value.includes(parentId)
    };
    result.push(parentRole);
    if (parentRole.expanded && childForms.length > 1) {
      childForms.forEach(form => {
        result.push({
          id: `form-${form.id}`, parentId,
          isParent: false, title: form.title, level: 1,
          C: form.C || false, R: form.R || false, U: form.U || false, D: form.D || false
        });
      });
    }
  });
  return result;
});

class roleAct {
  /** نمایش پوپاپ برای افزودن نقش جدید */
  static addNewRole() {
    isEditingRole.value = false
    roleForm.value = { name: '', description: '' }
    roleDialog.value = true
  }
  /** نمایش پوپاپ برای ویرایش نقش */
  static editRole() {
    if (!selectedRole.value)
      return;
    const role = roles.value.find(r => r.id === selectedRole.value);
    if (!role)
      return;
    isEditingRole.value = true;
    roleForm.value = { name: role.name, description: role.description };
    roleDialog.value = true;
  }
  /** حذف نقش کاربری - باید پیاده سازی شود */
  static deleteRole() {
    if (!selectedRole.value)
      return;
    const role = roles.value.find(r => r.id === selectedRole.value);
    if (!role)
      return;
    $q.dialog({
      title: t('role.delete'),
      message: t('role.deleteQuestion', { r: role.name[locale.value] }),
      cancel: true, persistent: false
    }).onOk(() => {

    })
  }
  /** ذخیره نقش */
  static saveRole() {
    console.log("heeeeeeeeeeeeeey")
    // if (!selectedRole.value)
    //   return;
    let role;
    if (isEditingRole.value) {
      role = roles.value.find(r => r.id === selectedRole.value);
      (role) && (role.name = roleForm.value.name);
    } else
      role = { name: roleForm.value.name };
    api.post('/admin/roles', role).finally(() => {
      roleAct.closeRoleDialog();
    });
  }
  /** کنسل کردن ویرایش نقش */
  static closeRoleDialog() {
    roleDialog.value = false;
    roleForm.value = { name: '', description: '' }
    isEditingRole.value = false;
  }
  /** انتخاب نقش از کامبو و بارگزاری فهرست سطوح دسترسی آن از سرور */
  static onRoleSelect(roleId) {
    if (!roleId) {
      selectedRole.value = null;
      return;
    }
    const role = roles.value.find(r => r.id === roleId)
    if (role) {
      selectedRole.value = role.id;
      api.get(`/admin/roles/perms/${role.id}`).then(ret => {
        if (ret.data && ret.data.data) {
          permissions.value = ret.data.data;
          syncExpandedRows(permissions.value);
        }
      });
    }
  }
  /** برگرداندن نقش کاربری منتخب */
  static getSelectedRole() {
    if (!selectedRole.value)
      return null;
    return roles.value.find(r => r.id === selectedRole.value);
  }
  /** بارگزاری فهرست نقش‌ها */
  static loadRoles() {
    loading.value = true
    api.get('/admin/roles/list').then(ret => {
      if (ret.data && ret.data.data) {
        roles.value = ret.data.data.map(role => ({
          id: role.id,
          name: role.title,
          description: role.is_trustee ? t('role.trusteeRole') : t('role.standardRole'),
          pid: role.pid,
          permissions: {}
        }));
      }
    }).finally(() => {
      loading.value = false
    });
  }
}

class permAct {
  /** شروع ویرایش نقش */
  static startEditPerms() {
    if (!selectedRole.value)
      return;
    const role = roles.value.find(r => r.id === selectedRole.value)
    if (!role) return
    isEditingPerms.value = true;
    originalPermissions.value = JSON.parse(JSON.stringify(permissions.value))
  }
  /** ذخیره سطوح دسترسی */
  static savePermissions() {
    if (!selectedRole.value) return
    api.post(`/admin/roles/perms/${selectedRole.value}`, permissions.value).then(ret => {
      if (ret.status != 200)
        return;
      isEditingPerms.value = false;
      originalPermissions.value = {};
    });
  }
  /** کنسل کردن ویرایش سطوح دسترسی */
  static cancelEdit() {
    if (!selectedRole.value)
      return;
    if (originalPermissions.value && Object.keys(originalPermissions.value).length > 0)
      permissions.value = JSON.parse(JSON.stringify(originalPermissions.value));
    isEditingPerms.value = false;
    originalPermissions.value = {};
  }
  /** رویداد کلیک روی چکباکس‌های جدول سطوح دسترسی */
  static onPermissionChange(row, permission) {
    if (!selectedRole.value || !isEditingPerms.value)
      return;
    if (row.isParent) {
      const roleId = row.id.replace('role-', '');
      const role = permissions.value.find(r => r.id == roleId);
      if (role) {
        /** اگر پرنت کلیک شده همه چایلدها مقدار دهی شوند */
        const newValue = row[permission] === 'indeterminate' ? true : row[permission];
        role[permission] = newValue;
        if (role.forms && Array.isArray(role.forms))
          role.forms.forEach(form => form[permission] = newValue);
      }
    } else {
      const formId = row.id.replace('form-', '');
      const parentRoleId = row.parentId.replace('role-', '');
      const role = permissions.value.find(r => r.id == parentRoleId);
      if (role && role.forms) {
        const form = role.forms.find(f => f.id == formId);
        if (form) {
          form[permission] = row[permission];
          const allFormsHaveSameValue = role.forms.every(f => f[permission] === row[permission]);
          const someFormsChecked = role.forms.some(f => f[permission] === true);
          if (allFormsHaveSameValue)
            role[permission] = row[permission];
          else if (someFormsChecked)
            role[permission] = 'indeterminate';
          else
            role[permission] = false;
        }
      }
    }
  }
  /** باز و بسته کردن چایلدها */
  static toggleExpanded(rowId) {
    const index = expandedRows.value.indexOf(rowId);
    if (index > -1)
      expandedRows.value.splice(index, 1);
    else if (permissions.value.some(role => `role-${role.id}` === rowId && Array.isArray(role.forms) && role.forms.length > 1))
      expandedRows.value.push(rowId);
  }
}

onMounted(() => {
  console.log('Component mounted - roles will be loaded when dropdown is opened')
})
</script>
