import { CARIO_USERS } from './fixtures/users';
import { CARIO_COMPANIES } from './fixtures/companies';

const LOOKUPS = {
  applicants: CARIO_COMPANIES.map(c => ({ id: c.id, title: c.title })),
  referralTargets: [
    { id: 1, title: { 'fa-IR': 'واحد بررسی مدارک', 'en-US': 'Document Review Unit' } },
    { id: 2, title: { 'fa-IR': 'واحد بازرسی فیزیکی', 'en-US': 'Physical Inspection Unit' } },
    { id: 3, title: { 'fa-IR': 'مدیر فنی', 'en-US': 'Technical Manager' } },
  ],
  inspectors: [
    { id: CARIO_USERS.farshid.id, title: CARIO_USERS.farshid.title },
    { id: CARIO_USERS.shadab.id, title: CARIO_USERS.shadab.title },
    { id: CARIO_USERS.tal.id, title: CARIO_USERS.tal.title },
  ],
  reviewers: [
    { id: CARIO_USERS.vahid.id, title: CARIO_USERS.vahid.title },
    { id: CARIO_USERS.sohail.id, title: CARIO_USERS.sohail.title },
  ],
};

function lookupOptions(name, q = '') {
  const items = LOOKUPS[name] ?? [];
  if (!q)
    return items;
  const lower = q.toLowerCase();
  return items.filter(i =>
    Object.values(i.title).some(t => t.toLowerCase().includes(lower))
  );
}

function lookupItem(name, id) {
  return (LOOKUPS[name] ?? []).find(i => i.id === Number(id));
}

export function handleLookup(method, url, params) {
  const crtblMatch = url.match(/^\/crtbl\/tousers\/typeapproval\.(\d+)$/);
  if (method === 'GET' && crtblMatch) {
    const options = LOOKUPS.inspectors.map(i => ({
      value: i.id,
      label: i.title['fa-IR'],
      title: i.title,
    }));
    return { status: 200, data: options };
  }

  const listMatch = url.match(/^\/(?:lookup|crtbl)\/([^/]+)$/);
  if (method === 'GET' && listMatch) {
    const name = listMatch[1];
    const items = lookupOptions(name, params?.q ?? '');
    const data = items.map(i => ({
      id: i.id,
      title: i.title,
      meta: null,
    }));
    return { status: 200, data };
  }

  const itemMatch = url.match(/^\/(?:lookup|crtbl)\/([^/]+)\/(\d+)$/);
  if (method === 'GET' && itemMatch) {
    const item = lookupItem(itemMatch[1], itemMatch[2]);
    if (!item)
      return { status: 404 };
    return {
      status: 200,
      data: { id: item.id, title: item.title, meta: null },
    };
  }

  const fieldsMatch = url.match(/^\/(?:lookup|crtbl)\/([^/]+)\/fields$/);
  if (method === 'GET' && fieldsMatch) {
    return { status: 200, data: { fields: [{ name: 'title', type: 'text', required: true }] } };
  }

  return null;
}
