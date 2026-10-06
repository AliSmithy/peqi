import { i18n } from 'src/boot/i18n'

/** Resolve JSONB i18n title objects ({ "fa-IR": "...", "en-US": "..." }) for the active locale. */
export function localizedTitle(title) {
  if (title == null || title === '') return '-';
  if (typeof title === 'string') return title;
  const locale = i18n.global.locale.value;
  return title[locale] ?? title['fa-IR'] ?? title['en-US'] ?? Object.values(title).find((v) => v != null && v !== '') ?? '-';
}

export function localizedDateTime(val, format = 'yyyy/MM/dd (HH:mm)') {
  if (!val || !val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  const opts = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    // timeZone: "+03:30"
  };
  const hasTime = typeof val === 'string' && (val.includes('T') || val.includes(':'));
  if (hasTime) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
    opts.hour12 = false;
  }
  const parts = new Intl.DateTimeFormat(i18n.global.locale.value, opts).formatToParts(d);
  const find = (type) => parts.find(p => p.type === type)?.value || '';
  const Y = find('year');
  const M = find('month');
  const D = find('day');
  if (hasTime) {
    const H = find('hour');
    const m = find('minute');
    return format.replace('yyyy', Y).replace('MM', M).replace('dd', D).replace('HH', H).replace('mm', m);
  }
  return format.replace('yyyy', Y).replace('MM', M).replace('dd', D);
}

export class validate {
  static required(val) {
    if (typeof val == "number") return (val || i18n.global.t('validate.required'));
    else return (val && val.length > 0 || i18n.global.t('validate.required'));
  }
  static same(val1, val2) {
    return (val1 == val2 || i18n.global.t('validate.same'));
  }
  static requiredArray(val) {
    return (Array.isArray(val) && val.length > 0 || i18n.global.t('validate.required'));
  }
}