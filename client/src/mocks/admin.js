import { CARIO_USERS } from './fixtures/users';

let users = [
  { id: 1, username: 'admin', title: CARIO_USERS.ali.title, role_ids: [1], locked: false },
  { id: 2, username: 'inspector', title: CARIO_USERS.farshid.title, role_ids: [2], locked: false },
  { id: 3, username: 'manager', title: CARIO_USERS.esfandiar.title, role_ids: [3], locked: false },
  { id: 4, username: CARIO_USERS.sohail.username, title: CARIO_USERS.sohail.title, role_ids: [2], locked: false },
  { id: 5, username: CARIO_USERS.shadab.username, title: CARIO_USERS.shadab.title, role_ids: [2], locked: true },
];

let roles = [
  { id: 1, title: { 'fa-IR': 'مدیر سیستم', 'en-US': 'Administrator' }, pid: null, is_trustee: true },
  { id: 2, title: { 'fa-IR': 'بازرس', 'en-US': 'Inspector' }, pid: null, is_trustee: false },
  { id: 3, title: { 'fa-IR': 'مدیر فنی', 'en-US': 'Technical Manager' }, pid: null, is_trustee: false },
];

const permissions = [
  {
    id: 1,
    title: { 'fa-IR': 'کارپوشه', 'en-US': 'Cartable' },
    forms: [
      { id: 11, title: { 'fa-IR': 'مشاهده', 'en-US': 'View' }, C: true, R: true, U: false, D: false },
      { id: 12, title: { 'fa-IR': 'ویرایش', 'en-US': 'Edit' }, C: true, R: true, U: true, D: false },
    ],
  },
  {
    id: 2,
    title: { 'fa-IR': 'مدیریت', 'en-US': 'Administration' },
    forms: [
      { id: 21, title: { 'fa-IR': 'کاربران', 'en-US': 'Users' }, C: true, R: true, U: true, D: true },
      { id: 22, title: { 'fa-IR': 'نقش‌ها', 'en-US': 'Roles' }, C: true, R: true, U: true, D: false },
      { id: 23, title: { 'fa-IR': 'پشتیبان‌گیری', 'en-US': 'Backups' }, C: true, R: true, U: false, D: false },
    ],
  },
];

let backups = [
  { name: 'peqi-backup-2025-10-01.sql.gz', size: 15728640, lastModified: '2025-10-01T08:00:00Z' },
  { name: 'peqi-backup-2025-09-28.sql.gz', size: 14680064, lastModified: '2025-09-28T08:00:00Z' },
];

let backupRunning = false;

export function handleAdmin(method, url, body) {
  if (method === 'GET' && url === '/admin/users/list')
    return { status: 200, data: { data: users } };

  if (method === 'POST' && url === '/admin/users') {
    if (body.id) {
      const idx = users.findIndex(u => u.id === body.id);
      if (idx >= 0)
        users[idx] = { ...users[idx], ...body, password: undefined };
    } else {
      const id = Math.max(...users.map(u => u.id), 0) + 1;
      users.push({ ...body, id, password: undefined });
    }
    return { status: 200, data: { key: 'userSaved' } };
  }

  const deleteUserMatch = url.match(/^\/admin\/users\/(\d+)$/);
  if (method === 'DELETE' && deleteUserMatch) {
    users = users.filter(u => u.id !== Number(deleteUserMatch[1]));
    return { status: 200, data: { key: 'userDeleted' } };
  }

  if (method === 'GET' && url === '/admin/roles/list')
    return { status: 200, data: { data: roles } };

  if (method === 'POST' && url === '/admin/roles') {
    if (body.id) {
      const idx = roles.findIndex(r => r.id === body.id);
      if (idx >= 0)
        roles[idx] = { ...roles[idx], ...body };
    } else {
      const id = Math.max(...roles.map(r => r.id), 0) + 1;
      roles.push({ ...body, id });
    }
    return { status: 200, data: { key: 'roleSaved' } };
  }

  const permsMatch = url.match(/^\/admin\/roles\/perms\/(\d+)$/);
  if (method === 'GET' && permsMatch)
    return { status: 200, data: { data: JSON.parse(JSON.stringify(permissions)) } };

  if (method === 'POST' && permsMatch)
    return { status: 200, data: { key: 'permsSaved' } };

  if (method === 'GET' && url === '/admin/backups/list')
    return { status: 200, data: { data: backups } };

  if (method === 'GET' && url === '/admin/backups/status')
    return { status: 200, data: { running: backupRunning, exitCode: 0 } };

  if (method === 'POST' && url === '/admin/backups/run') {
    backupRunning = true;
    setTimeout(() => {
      backupRunning = false;
      backups.unshift({
        name: `peqi-backup-${new Date().toISOString().slice(0, 10)}.sql.gz`,
        size: 16000000,
        lastModified: new Date().toISOString(),
      });
    }, 3000);
    return { status: 202, data: { running: true } };
  }

  if (method === 'POST' && url === '/admin/backups/ticket')
    return { status: 200, data: { ticket: `mock-ticket-${body?.name}` } };

  return null;
}
