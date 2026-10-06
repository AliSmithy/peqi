const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/cartable', component: () => import('pages/cartable/cartablePage.vue'), meta: { requiresAuth: true } },
      { path: '/login', component: () => import('pages/user/LoginPage.vue') },
      { path: '/admin/roles', component: () => import('pages/admin/RolesPage.vue'), meta: { requiresAuth: true } },
      { path: '/admin/users', component: () => import('pages/admin/UsersPage.vue'), meta: { requiresAuth: true } },
      { path: '/admin/backups', component: () => import('pages/admin/BackupsPage.vue'), meta: { requiresAuth: true } },
      { path: '/user/pass', component: () => import('pages/user/ChangePass.vue'), meta: { requiresAuth: true } },
      { path: '/changelog', component: () => import('pages/changelog/ChangelogPage.vue'), meta: { requiresAuth: true } },
      { path: '/flow/typeapproval', component: () => import('pages/flow/typeapproval/ring-1.vue'), meta: { requiresAuth: true } },
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
