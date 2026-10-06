import { getCurrentUser } from './auth';
import {
  FLOW_NAME,
  FLOW_TITLE,
  RING_TITLES,
  buildRings,
  ringPolicy,
  defaultFormData,
  seedTasks,
} from './fixtures/typeapproval';
import { CARIO_USERS } from './fixtures/users';

let tasks = seedTasks();
let nextTaskId = 13;
let nextFileId = 1;
const files = {};

function findTask(id) {
  return tasks.find(t => t.id === Number(id));
}

function buildInit(ring) {
  return {
    flow_name: FLOW_NAME,
    flow_title: FLOW_TITLE,
    ring_order: ring,
    ring_title: RING_TITLES[ring - 1],
    policy: ringPolicy(ring),
  };
}

function buildTaskPayload(task) {
  const ring = task.ring_order;
  const data = task.formData[ring] ?? defaultFormData(ring);
  return {
    id: task.id,
    follow_code: task.follow_code,
    own: task.own,
    status: task.status,
    to: null,
    note: '',
    data,
    init: buildInit(ring),
    file_sources: [`typeapproval.${ring}`],
  };
}

function listRow(task, rn) {
  return {
    id: task.id,
    rn,
    follow_code: task.follow_code,
    flow_title: FLOW_TITLE,
    ring_order: task.ring_order,
    ring_cnt: 14,
    ring_title: RING_TITLES[task.ring_order - 1],
    status: task.status,
    user_from: task.user_from,
    user_to: task.user_to,
    sent_at: task.sent_at,
    seen_at: task.seen_at,
    vehicleModel: task.vehicleModel,
    customerName: task.customerName,
    manufacturer: task.manufacturer,
    productType: task.productType,
  };
}

export function handleCrtbl(method, url, body, params) {
  const listMatch = url.match(/^\/crtbl\/list\/(\d+)$/);
  if (method === 'GET' && listMatch) {
    const page = Number(listMatch[1]);
    const lastPage = 1;
    if (page > lastPage)
      return { status: 200, data: { rows: [], lastPage, page } };
    let rows = tasks.map((t, i) => listRow(t, i + 1));
    if (params?.follow_code)
      rows = rows.filter(r => r.follow_code.includes(params.follow_code));
    if (params?.status)
      rows = rows.filter(r => r.status === params.status);
    return { status: 200, data: { rows, lastPage, page } };
  }

  const loadMatch = url.match(/^\/crtbl\/load\/(\d+)$/);
  if (method === 'GET' && loadMatch) {
    const task = findTask(loadMatch[1]);
    if (!task)
      return { status: 404 };
    if (!task.own) {
      return {
        status: 200,
        data: {
          stat: {
            own: false,
            task_id: task.id,
            follow_code: task.follow_code,
            flow_title: FLOW_TITLE,
            ring_order: task.ring_order,
            current_ring_order: task.ring_order,
            current_job_id: task.ring_order,
          },
          data: null,
          rings: buildRings(),
        },
      };
    }
    const payload = buildTaskPayload(task);
    return {
      status: 200,
      data: {
        stat: {
          own: true,
          task_id: task.id,
          follow_code: task.follow_code,
          flow_title: FLOW_TITLE,
          ring_order: task.ring_order,
          current_ring_order: task.ring_order,
          current_job_id: task.ring_order,
        },
        data: payload,
        rings: buildRings(),
      },
    };
  }

  const wrkflwMatch = url.match(/^\/crtbl\/wrkflw\/(\d+)$/);
  if (method === 'GET' && wrkflwMatch) {
    const task = findTask(wrkflwMatch[1]);
    if (!task)
      return { status: 404 };
    const steps = [];
    for (let r = 1; r <= task.ring_order; r++) {
      steps.push({
        rn: r,
        ring_order: r,
        task_id: task.id,
        job_id: r,
        title: RING_TITLES[r - 1],
        sent_at: task.sent_at,
        user_from: task.user_from,
        user_to: task.user_to,
        note: r === 1 ? 'شروع فرآیند' : '',
        way: { color: r === task.ring_order ? 'primary' : 'positive' },
      });
    }
    return { status: 200, data: steps };
  }

  const jobMatch = url.match(/^\/crtbl\/job\/(\d+)\/(\d+)$/);
  if (method === 'GET' && jobMatch) {
    const task = findTask(jobMatch[1]);
    if (!task)
      return { status: 404 };
    const jobRing = Number(jobMatch[2]);
    if (jobRing < 1 || jobRing > task.ring_order)
      return { status: 404, data: { key: 'jobNotFound' } };
    const saved = task.formData[jobRing] ?? defaultFormData(jobRing);
    return {
      status: 200,
      data: {
        id: task.id,
        jid: jobRing,
        follow_code: task.follow_code,
        own: jobRing === task.ring_order && task.own,
        status: jobRing === task.ring_order ? task.status : 'f',
        data: saved,
        init: buildInit(jobRing),
      },
    };
  }

  const flowinitMatch = url.match(/^\/crtbl\/flowinit\/([^/]+)\/(\d+)$/);
  if (method === 'GET' && flowinitMatch) {
    const ring = Number(flowinitMatch[2]);
    const data = defaultFormData(ring);
    return {
      status: 200,
      data: {
        own: true,
        id: null,
        follow_code: null,
        status: 'n',
        data,
        init: buildInit(ring),
        rings: buildRings(),
      },
    };
  }

  const actionMatch = url.match(/^\/crtbl\/(save|forward|backward|cancel|finish)\/([^/]+)\/(\d+)$/);
  if (method === 'POST' && actionMatch) {
    const [, action, , ringStr] = actionMatch;
    const ring = Number(ringStr);
    const taskId = body?.id;
    let task = taskId ? findTask(taskId) : null;

    if (!task && action === 'save') {
      const newId = nextTaskId++;
      task = {
        id: newId,
        follow_code: `PEQI-1404-${String(1000 + newId)}`,
        flow_name: FLOW_NAME,
        ring_order: ring,
        status: 't',
        own: true,
        user_from: getCurrentUser()?.utitle ?? CARIO_USERS.ali.title,
        user_to: { 'fa-IR': '—', 'en-US': '—' },
        sent_at: new Date().toISOString(),
        seen_at: new Date().toISOString(),
        vehicleModel: body?.data?.vehicleModel ?? '',
        customerName: body?.data?.applicant ? 'متقاضی' : '',
        manufacturer: body?.data?.manufacturer ?? '',
        productType: body?.data?.productType ?? '',
        formData: {},
      };
      tasks.unshift(task);
    }

    if (task) {
      task.formData[ring] = { ...body.data };
      if (action === 'forward' && ring < 14) {
        task.ring_order = ring + 1;
        task.status = 'a';
      } else if (action === 'backward' && ring > 1) {
        task.ring_order = ring - 1;
        task.status = 'a';
      } else if (action === 'finish' || (action === 'forward' && ring === 14)) {
        task.status = 'f';
        task.own = false;
      } else if (action === 'cancel') {
        task.status = 'c';
        task.own = false;
      } else if (action === 'save') {
        task.status = 't';
      }
      const payload = buildTaskPayload(task);
      payload.id = task.id;
      payload.follow_code = task.follow_code;
      return { status: 200, data: { data: payload, key: action } };
    }
    return { status: 404 };
  }

  const filesListMatch = url.match(/^\/crtbl\/files\/([^/]+)\/(\d+)\/(\d+)$/);
  if (method === 'GET' && filesListMatch) {
    const key = `${filesListMatch[1]}/${filesListMatch[2]}`;
    return { status: 200, data: files[key] ?? [] };
  }

  const fileDeleteMatch = url.match(/^\/crtbl\/files\/(\d+)$/);
  if (method === 'DELETE' && fileDeleteMatch) {
    const id = Number(fileDeleteMatch[1]);
    Object.keys(files).forEach(k => {
      files[k] = (files[k] ?? []).filter(f => f.id !== id);
    });
    return { status: 200, data: { key: 'fileDeleted' } };
  }

  if (method === 'POST' && url.startsWith('/crtbl/files/')) {
    const entityId = url.split('/').pop();
    const key = `upload/${entityId}`;
    const file = {
      id: nextFileId++,
      name: 'sample-document.pdf',
      size: 102400,
      mime: 'application/pdf',
      uploaded_at: new Date().toISOString(),
    };
    if (!files[key])
      files[key] = [];
    files[key].push(file);
    return { status: 200, data: { key: 'fileUploaded', file } };
  }

  const reportMetaMatch = url.match(/^\/crtbl\/report\/([^/]+)\/(\d+)\/meta$/);
  if (method === 'GET' && reportMetaMatch) {
    return {
      status: 200,
      data: {
        exists: true,
        generatedAt: '2025-10-01T12:00:00Z',
        stale: false,
      },
    };
  }

  return null;
}

export function resetCrtblState() {
  tasks = seedTasks();
  nextTaskId = 13;
}
