import { handleAuth } from './auth';
import { CARIO_USERS } from './fixtures/users';
import { handleLookup } from './lookups';
import { handleCrtbl } from './crtbl';
import { handleAdmin } from './admin';

function handleMisc(method, url) {
  if (method === 'GET' && url === '/notif') {
    return {
      status: 200,
      data: {
        rows: [
          {
            id: 1,
            shown: false,
            payload: {
              key: 'crtblForward',
              data: {
                tid: 3,
                code: 'PEQI-1404-1003',
                uidt: CARIO_USERS.esfandiar.id,
                ut: CARIO_USERS.farshid.title,
                t: '2025-09-30T08:45:00Z',
              },
            },
          },
        ],
        count: 1,
      },
    };
  }
  if (method === 'POST' && url === '/notif')
    return { status: 200, data: { rows: [], count: 0 } };

  if (method === 'GET' && url === '/changelog') {
    return {
      status: 200,
      data: {
        days: [
          {
            date: '2025-10-01',
            items: [
              { title: { 'fa-IR': 'نسخه نمایشی PEQI', 'en-US': 'PEQI prototype release' }, body: { 'fa-IR': 'اولین نسخه نمایشی سامانه تأیید نوع', 'en-US': 'First type-approval prototype' } },
            ],
          },
        ],
      },
    };
  }

  if (method === 'GET' && (url.startsWith('/captcha') || url.startsWith('/api/captcha')))
    return { status: 200, data: 'MOCK' };

  return null;
}

/** Some components build URLs with _baseURL (/api) while api already has that baseURL. */
function normalizeUrl(config) {
  let url = config.url ?? '';
  const base = (config.baseURL ?? '').replace(/\/$/, '');
  if (base && url && !url.startsWith('http') && !url.startsWith(base))
    url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  url = url.replace(/\?.*$/, '');
  if (url.startsWith('/api/'))
    url = url.slice(4);
  else if (url === '/api')
    url = '/';
  return url;
}

function parseBody(data) {
  if (data == null || typeof data === 'object')
    return data ?? {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return {};
}

export async function mockRequest(config) {
  const method = (config.method ?? 'get').toUpperCase();
  const url = normalizeUrl(config);
  const params = config.params ?? {};
  const body = parseBody(config.data);

  const handlers = [handleAuth, handleCrtbl, handleLookup, handleAdmin, handleMisc];
  for (const handler of handlers) {
    const result = handler(method, url, body, params);
    if (result)
      return result;
  }

  console.warn('[mock] unhandled:', method, url);
  return { status: 404, data: { key: 'notFound' } };
}

export function createMockAdapter() {
  return async (config) => {
    const result = await mockRequest(config);
    const response = {
      data: result.data,
      status: result.status ?? 200,
      statusText: 'OK',
      headers: {},
      config,
    };
    if (response.status >= 400) {
      const error = new Error(`Request failed with status code ${response.status}`);
      error.response = response;
      error.config = config;
      throw error;
    }
    return response;
  };
}
