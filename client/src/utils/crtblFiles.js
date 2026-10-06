import { _baseURL } from 'src/boot/axios';

export const FILES_API = '/crtbl/files';

/** Fallback when the server has not sent `limits.fileSize` (or the value is invalid). */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Same rule as report embedding: a trailing digit means one file. */
export function isMultiSlot(key) {
  return !/\d$/.test(String(key ?? ''));
}

export function fileKindKey(file) {
  const kind = file?.meta?.kind;
  if (kind == null) return '';
  if (typeof kind === 'object') return kind.key != null ? String(kind.key) : '';
  return String(kind);
}

export function fileMime(file) {
  return file?.mime_type || file?.type || '';
}

export function isImageFile(file) {
  return !!fileMime(file).startsWith('image');
}

const WILDCARD_EXTS = {
  'image/': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tif', '.tiff', '.heic', '.heif', '.ico', '.avif'],
  'video/': ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'],
  'audio/': ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'],
};

function fileExt(name) {
  const n = String(name || '').toLowerCase();
  const i = n.lastIndexOf('.');
  return i >= 0 ? n.slice(i) : '';
}

/** Match a File against an HTML `accept` string (`image/*`, `.png`, `application/pdf`). */
export function fileMatchesAccept(file, accept) {
  const spec = String(accept ?? '').trim();
  if (!spec) return true;
  const type = String(file?.type || file?.mime_type || '').toLowerCase();
  const ext = fileExt(file?.name);
  return spec.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some(token => {
    if (token.startsWith('.'))
      return ext === token;
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -1);
      if (type.startsWith(prefix)) return true;
      const exts = WILDCARD_EXTS[prefix];
      return !!(exts && ext && exts.includes(ext));
    }
    if (type === token) return true;
    if (token === 'application/pdf' && ext === '.pdf') return true;
    return false;
  });
}

export function isPdfFile(file) {
  return String(fileMime(file)).toLowerCase().includes('pdf');
}

export function getFileIcon(mimeType = '') {
  const type = String(mimeType || '').toLowerCase();
  if (type.includes('pdf')) return 'picture_as_pdf';
  if (type.includes('word') || type.includes('officedocument') || type.includes('docx') || type.includes('doc')) return 'description';
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return 'table_chart';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'slideshow';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gzip')) return 'folder_zip';
  if (type.includes('video')) return 'movie';
  if (type.includes('audio')) return 'audio_file';
  return 'insert_drive_file';
}

export function getDownloadUrl(id, thumb = false) {
  return `${_baseURL}/crtbl/dl/${id}${thumb ? '/thumb' : ''}`;
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = n;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  const value = i === 0 ? Math.round(size) : size.toFixed(1).replace(/\.0$/, '');
  return `${value} ${units[i]}`;
}

export function slotKindMeta(slot) {
  const out = {
    key: slot.key,
    label: slot.label,
  };
  if (slot.category)
    out.category = slot.category;
  const description = String(slot.description ?? '').trim();
  if (description)
    out.description = description;
  return out;
}

export function newFileFieldKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID();
  return `f-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toSlot(item, category) {
  return {
    key: item.key,
    label: item.label || item.key,
    description: String(item.description ?? '').trim(),
    category: category || '',
    multi: isMultiSlot(item.key),
  };
}

function dropdownItemsFromFields(fields) {
  if (!fields || typeof fields !== 'object') return [];
  if (Array.isArray(fields.items)) return fields.items;
  for (const field of Object.values(fields)) {
    if (field?.type === 'dropdown' && Array.isArray(field.items))
      return field.items;
  }
  return [];
}

/** Turn slot `fieldItems` trees into labeled groups of upload slots. */
export function flattenSlotGroups(fields) {
  const items = dropdownItemsFromFields(fields);
  const groups = [];
  let loose = [];

  const pushLoose = () => {
    if (!loose.length) return;
    groups.push({ id: `loose-${groups.length}`, label: '', slots: loose });
    loose = [];
  };

  items.forEach((item, index) => {
    if (Array.isArray(item?.children)) {
      pushLoose();
      groups.push({
        id: `g-${index}`,
        label: item.label || '',
        slots: item.children.filter(c => c?.key != null).map(child => toSlot(child, item.label)),
      });
    }
    else if (item?.key != null) {
      loose.push(toSlot(item, ''));
    }
  });
  pushLoose();
  return groups;
}
