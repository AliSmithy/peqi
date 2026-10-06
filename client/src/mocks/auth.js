import { CARIO_USERS } from './fixtures/users';

const DEMO_USERS = {
  admin: {
    id: 1,
    username: 'admin',
    password: 'peqi',
    utitle: CARIO_USERS.ali.title,
    uid: CARIO_USERS.ali.id,
    rid: 1,
    roles: [
      { id: 1, title: { 'fa-IR': 'مدیر سیستم', 'en-US': 'Administrator' } },
      { id: 2, title: { 'fa-IR': 'بازرس', 'en-US': 'Inspector' } },
      { id: 3, title: { 'fa-IR': 'مدیر فنی', 'en-US': 'Technical Manager' } },
    ],
    role: 'admin',
  },
  inspector: {
    id: 2,
    username: 'inspector',
    password: 'peqi',
    utitle: CARIO_USERS.farshid.title,
    uid: CARIO_USERS.farshid.id,
    rid: 2,
    roles: [{ id: 2, title: { 'fa-IR': 'بازرس', 'en-US': 'Inspector' } }],
    role: 'inspector',
  },
  manager: {
    id: 3,
    username: 'manager',
    password: 'peqi',
    utitle: CARIO_USERS.esfandiar.title,
    uid: CARIO_USERS.esfandiar.id,
    rid: 3,
    roles: [{ id: 3, title: { 'fa-IR': 'مدیر فنی', 'en-US': 'Technical Manager' } }],
    role: 'manager',
  },
};

const MENUS = {
  admin: [
    { key: 'cartable', url: '/cartable', icon: 'inbox', title: { 'fa-IR': 'کارپوشه', 'en-US': 'Cartable' } },
    { key: '-', url: null },
    { key: 'users', url: '/admin/users', icon: 'people', title: { 'fa-IR': 'مدیریت کاربران', 'en-US': 'User Management' } },
    { key: 'roles', url: '/admin/roles', icon: 'security', title: { 'fa-IR': 'نقش‌ها', 'en-US': 'Roles' } },
    { key: 'backups', url: '/admin/backups', icon: 'backup', title: { 'fa-IR': 'پشتیبان‌گیری', 'en-US': 'Backups' } },
  ],
  inspector: [
    { key: 'cartable', url: '/cartable', icon: 'inbox', title: { 'fa-IR': 'کارپوشه', 'en-US': 'Cartable' } },
  ],
  manager: [
    { key: 'cartable', url: '/cartable', icon: 'inbox', title: { 'fa-IR': 'کارپوشه', 'en-US': 'Cartable' } },
    { key: 'typeapproval', url: '/flow/typeapproval', icon: 'add_circle', title: { 'fa-IR': 'ثبت درخواست تأیید نوع', 'en-US': 'New type-approval request' } },
  ],
};

let currentUser = null;

function makeToken(user) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  }));
  return `${header}.${payload}.mock`;
}

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user;
}

export function handleAuth(method, url, body) {
  if (method === 'POST' && url === '/user/login') {
    const user = DEMO_USERS[body?.username];
    if (!user || user.password !== body?.password)
      return { status: 401, data: { key: 'invalidCredentials' } };
    setCurrentUser(user);
    return {
      status: 200,
      data: {
        data: {
          token: makeToken(user),
          userInfo: {
            utitle: user.utitle,
            username: user.username,
            uid: user.uid,
            rid: user.rid,
            roles: user.roles,
          },
          limits: { fileSize: 10485760 },
        },
      },
    };
  }
  if (method === 'POST' && url === '/user/refresh') {
    if (!currentUser)
      return { status: 401 };
    return {
      status: 200,
      data: {
        token: makeToken(currentUser),
        userInfo: {
          utitle: currentUser.utitle,
          username: currentUser.username,
          uid: currentUser.uid,
          rid: currentUser.rid,
          roles: currentUser.roles,
        },
      },
    };
  }
  if (method === 'GET' && url === '/user/logout') {
    setCurrentUser(null);
    return { status: 200, data: {} };
  }
  if (method === 'GET' && url === '/user/menu') {
    const role = currentUser?.role ?? 'inspector';
    return { status: 200, data: MENUS[role] ?? MENUS.inspector };
  }
  if (method === 'POST' && url.startsWith('/user/chngrole/')) {
    const rid = Number(url.split('/').pop());
    const role = currentUser?.roles?.find(r => r.id === rid);
    if (role && currentUser) {
      currentUser.rid = rid;
      return { status: 200, data: { key: 'roleChanged' } };
    }
    return { status: 400 };
  }
  if (method === 'POST' && url === '/user/pass')
    return { status: 200, data: { key: 'passwordChanged' } };
  if (method === 'GET' && url === '/user/signature')
    return { status: 200, data: { hasSignature: false } };
  if (method === 'POST' && url === '/user/signature')
    return { status: 200, data: { key: 'signatureSaved' } };
  return null;
}
