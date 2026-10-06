import { CARIO_USERS } from './users';
import { CARIO_VEHICLES, vehicleSeedFields } from './companies';

const DEFAULT_VEHICLE = CARIO_VEHICLES[0];
const DEFAULT_VEHICLE_FIELDS = vehicleSeedFields(DEFAULT_VEHICLE);

export const FLOW_NAME = 'typeapproval';

export const FLOW_TITLE = {
  'fa-IR': 'فرآیند تأیید نوع',
  'en-US': 'Type Approval Process',
};

export const RING_TITLES = [
  { 'fa-IR': 'ثبت و ارجاع نامه درخواست تأیید نوع', 'en-US': 'Register & refer type-approval request letter' },
  { 'fa-IR': 'فرم درخواست تأیید نوع', 'en-US': 'Type-approval application form' },
  { 'fa-IR': 'صدور پیش‌فاکتور', 'en-US': 'Issue proforma invoice' },
  { 'fa-IR': 'تحویل مدارک', 'en-US': 'Document delivery' },
  { 'fa-IR': 'تأیید پیش‌فاکتور و آغاز فرآیند', 'en-US': 'Confirm proforma & start process' },
  { 'fa-IR': 'بررسی مدارک', 'en-US': 'Document review' },
  { 'fa-IR': 'بازرسی فیزیکی محصول', 'en-US': 'Physical product inspection' },
  { 'fa-IR': 'بازرسی خط تولید و ارزیابی اولیه QMS', 'en-US': 'Production line inspection & QMS evaluation' },
  { 'fa-IR': 'گزارش‌های فنی و گزارش فنی کل', 'en-US': 'Technical reports & overall report' },
  { 'fa-IR': 'گزارش استانداردها (۸۵گانه)', 'en-US': 'Standards compliance report (85 items)' },
  { 'fa-IR': 'تکمیل موارد و تأیید مدیر فنی', 'en-US': 'Completion & technical manager approval' },
  { 'fa-IR': 'وضعیت مالی، فاکتور و صورتحساب', 'en-US': 'Financial status, invoice & billing' },
  { 'fa-IR': 'تکمیل سامانه اداره استاندارد', 'en-US': 'National standards system registration' },
  { 'fa-IR': 'صدور گزارش تأیید نوع', 'en-US': 'Issue type-approval report' },
];

export function buildRings() {
  return RING_TITLES.map((title, idx) => ({
    id: idx + 1,
    order: idx + 1,
    title,
  }));
}

export function ringPolicy(ringOrder) {
  return {
    forward: ringOrder < 14,
    backward: ringOrder > 1,
    cancel: true,
    finish: ringOrder === 14,
  };
}

function buildStandards() {
  const topics = [
    'Safety', 'Emissions', 'Lighting', 'Braking', 'Steering', 'Tyres', 'Glass', 'Seats',
    'Restraints', 'Noise', 'Electromagnetic', 'Fuel', 'Mass', 'Dimensions', 'Visibility',
  ];
  return Array.from({ length: 85 }, (_, i) => ({
    no: i + 1,
    code: `ISIRI ${6924 + (i % 120)}`,
    title: { 'fa-IR': `استاندارد ${i + 1} — ${topics[i % topics.length]}`, 'en-US': `Standard ${i + 1} — ${topics[i % topics.length]}` },
    result: i % 7 === 0 ? 'pending' : 'pass',
    evidence: i % 5 === 0 ? '' : `EV-${String(i + 1).padStart(3, '0')}`,
  }));
}

export function defaultFormData(ring) {
  const base = {
    description: '',
    notes: '',
  };
  switch (ring) {
    case 1:
      return {
        ...base,
        letterNo: '',
        letterDate: '',
        applicant: null,
        referralTarget: null,
        vehicleModel: '',
        productType: '',
        manufacturer: '',
      };
    case 2:
      return {
        ...base,
        manufacturer: DEFAULT_VEHICLE_FIELDS.manufacturer,
        model: DEFAULT_VEHICLE_FIELDS.vehicleModel,
        vinFrom: 'IRTA000001',
        vinTo: 'IRTA000500',
        components: [
          { name: 'سیستم ترمز', standard: 'ISIRI 6924' },
          { name: 'چراغ جلو', standard: 'ECE R112' },
        ],
        contactName: 'علی رضایی',
        contactPhone: '021-88776655',
        declarationAccepted: false,
      };
    case 3:
      return {
        ...base,
        invoiceNo: 'PF-1404-001',
        invoiceDate: '1404/07/01',
        lineItems: [
          { desc: 'هزینه بررسی مدارک', qty: 1, unitPrice: 45000000 },
          { desc: 'بازرسی فیزیکی', qty: 1, unitPrice: 120000000 },
          { desc: 'بازرسی خط تولید', qty: 1, unitPrice: 85000000 },
        ],
        vatPercent: 10,
        paymentTerms: '۵۰٪ پیش‌پرداخت، ۵۰٪ پس از تأیید',
      };
    case 4:
      return {
        ...base,
        documents: [
          { key: 'iso6924', label: 'استاندارد ۶۹۲۴', received: false, receivedDate: '', status: 'pending' },
          { key: 'emark', label: 'مدارک E-mark', received: false, receivedDate: '', status: 'pending' },
          { key: 'copplan', label: 'COP PLAN', received: false, receivedDate: '', status: 'pending' },
          { key: 'bom', label: 'BOM', received: false, receivedDate: '', status: 'pending' },
          { key: 'commitment', label: 'نامه‌های تعهدات', received: false, receivedDate: '', status: 'pending' },
        ],
      };
    case 5:
      return {
        ...base,
        proformaConfirmed: false,
        processStartDate: '',
        inspectorTeam: [],
        confirmationNote: '',
      };
    case 6:
      return {
        ...base,
        reviews: [
          { doc: 'استاندارد ۶۹۲۴', reviewer: null, result: 'pending', comment: '', resubmit: false },
          { doc: 'E-mark', reviewer: null, result: 'pending', comment: '', resubmit: false },
          { doc: 'COP PLAN', reviewer: null, result: 'pending', comment: '', resubmit: false },
          { doc: 'BOM', reviewer: null, result: 'pending', comment: '', resubmit: false },
          { doc: 'نامه تعهدات', reviewer: null, result: 'pending', comment: '', resubmit: false },
        ],
      };
    case 7:
      return {
        ...base,
        checklist: [
          { item: 'بدنه و رنگ', result: 'pass', note: '' },
          { item: 'چراغ‌ها و سیستم روشنایی', result: 'pass', note: '' },
          { item: 'سیستم ترمز', result: 'pending', note: '' },
          { item: 'ایمنی سرنشینان', result: 'pass', note: '' },
          { item: 'سیستم سوخت‌رسانی', result: 'pass', note: '' },
        ],
        inspectorNotes: 'بازرسی اولیه انجام شد. موارد جزئی در گزارش فنی ثبت می‌شود.',
      };
    case 8:
      return {
        ...base,
        facilityName: `کارخانه ${DEFAULT_VEHICLE_FIELDS.customerName}`,
        facilityAddress: 'استان سمنان – شهرک صنعتی شرق',
        visitDate: '1404/07/15',
        qmsSections: [
          { section: 'A', title: 'مدیریت کیفیت', score: 4, max: 5 },
          { section: 'B', title: 'کنترل فرآیند', score: 3, max: 5 },
          { section: 'C', title: 'کنترل محصول', score: 4, max: 5 },
          { section: 'D', title: 'بهبود مستمر', score: 3, max: 5 },
          { section: 'E', title: 'منابع انسانی', score: 4, max: 5 },
          { section: 'F', title: 'تأمین‌کنندگان', score: 3, max: 5 },
        ],
      };
    case 9:
      return {
        ...base,
        technicalReports: [
          { title: 'گزارش ایمنی', author: CARIO_USERS.farshid.title['fa-IR'], date: '1404/07/20', status: 'draft' },
          { title: 'گزارش آلایندگی', author: CARIO_USERS.shadab.title['fa-IR'], date: '1404/07/21', status: 'approved' },
        ],
        overallConclusion: '',
        nonConformities: [
          { id: 1, desc: 'عدم تطابق برچسب VIN', severity: 'minor', status: 'open' },
        ],
      };
    case 10:
      return {
        ...base,
        standards: buildStandards(),
        filterText: '',
      };
    case 11:
      return {
        ...base,
        openItems: [
          { id: 1, desc: 'اصلاح برچسب VIN', dueDate: '1404/08/01', status: 'done' },
          { id: 2, desc: 'ارائه گواهی کالیبراسیون', dueDate: '1404/08/05', status: 'open' },
        ],
        managerApproved: false,
        approvalDate: '',
      };
    case 12:
      return {
        ...base,
        financialStatus: 'partial',
        finalInvoiceNo: 'INV-1404-001',
        finalAmount: 285000000,
        paidAmount: 142500000,
        billingNote: '',
        paymentConfirmed: false,
      };
    case 13:
      return {
        ...base,
        naciRegistrationNo: '',
        naciSubmitted: false,
        finalApproval: false,
        certificateNo: '',
      };
    case 14:
      return {
        ...base,
        reportNo: '',
        validityFrom: '',
        validityTo: '',
        issuedDate: '',
        archiveNote: '',
      };
    default:
      return base;
  }
}

export function seedTasks() {
  const routing = [
    { from: CARIO_USERS.farshid.title, to: CARIO_USERS.esfandiar.title },
    { from: CARIO_USERS.shadab.title, to: CARIO_USERS.alireza.title },
    { from: CARIO_USERS.sohail.title, to: CARIO_USERS.esfandiar.title },
    { from: CARIO_USERS.tal.title, to: CARIO_USERS.alireza.title },
    { from: CARIO_USERS.farshid.title, to: CARIO_USERS.esfandiar.title },
    { from: CARIO_USERS.vahid.title, to: CARIO_USERS.alireza.title },
    { from: CARIO_USERS.shadab.title, to: CARIO_USERS.esfandiar.title },
    { from: CARIO_USERS.tal.title, to: CARIO_USERS.esfandiar.title },
    { from: CARIO_USERS.farshid.title, to: CARIO_USERS.alireza.title },
    { from: CARIO_USERS.sohail.title, to: CARIO_USERS.alireza.title },
    { from: CARIO_USERS.vahid.title, to: CARIO_USERS.esfandiar.title },
    { from: CARIO_USERS.ali.title, to: CARIO_USERS.esfandiar.title },
  ];
  const taskMeta = [
    { id: 1, follow_code: 'PEQI-1404-1001', ring: 1, status: 'a', sent_at: '2025-09-28T09:15:00Z' },
    { id: 2, follow_code: 'PEQI-1404-1002', ring: 2, status: 'a', sent_at: '2025-09-29T11:20:00Z' },
    { id: 3, follow_code: 'PEQI-1404-1003', ring: 4, status: 'a', sent_at: '2025-09-30T08:45:00Z' },
    { id: 4, follow_code: 'PEQI-1404-1004', ring: 5, status: 't', sent_at: '2025-10-01T10:30:00Z' },
    { id: 5, follow_code: 'PEQI-1404-1005', ring: 7, status: 'a', sent_at: '2025-10-02T14:00:00Z' },
    { id: 6, follow_code: 'PEQI-1404-1006', ring: 8, status: 'a', sent_at: '2025-10-03T09:30:00Z' },
    { id: 7, follow_code: 'PEQI-1404-1007', ring: 9, status: 't', sent_at: '2025-10-04T16:10:00Z' },
    { id: 8, follow_code: 'PEQI-1404-1008', ring: 10, status: 'a', sent_at: '2025-10-05T07:55:00Z' },
    { id: 9, follow_code: 'PEQI-1404-1009', ring: 11, status: 'a', sent_at: '2025-10-05T12:20:00Z' },
    { id: 10, follow_code: 'PEQI-1404-1010', ring: 12, status: 't', sent_at: '2025-10-06T10:00:00Z' },
    { id: 11, follow_code: 'PEQI-1404-1011', ring: 13, status: 'a', sent_at: '2025-10-06T13:40:00Z' },
    { id: 12, follow_code: 'PEQI-1404-1012', ring: 14, status: 'f', sent_at: '2025-09-20T08:00:00Z' },
  ];
  const samples = taskMeta.map((task, idx) => ({
    ...task,
    ...vehicleSeedFields(CARIO_VEHICLES[idx]),
  }));
  return samples.map((s, idx) => {
    const route = routing[idx] ?? routing[0];
    const formData = {};
    for (let r = 1; r <= s.ring; r++)
      formData[r] = defaultFormData(r);
    if (s.ring >= 7)
      formData[7].checklist[2].result = 'pass';
    if (s.ring >= 1) {
      formData[1].vehicleModel = s.vehicleModel;
      formData[1].manufacturer = s.manufacturer;
      formData[1].productType = s.productType;
      formData[1].applicant = s.applicantId;
    }
    if (s.ring >= 2) {
      formData[2].manufacturer = s.manufacturer;
      formData[2].model = s.vehicleModel;
    }
    return {
      id: s.id,
      follow_code: s.follow_code,
      flow_name: FLOW_NAME,
      ring_order: s.ring,
      status: s.status,
      own: s.status !== 'f' && s.status !== 'c',
      user_from: route.from,
      user_to: route.to,
      sent_at: s.sent_at,
      seen_at: s.sent_at,
      vehicleModel: s.vehicleModel,
      customerName: s.customerName,
      manufacturer: s.manufacturer,
      productType: s.productType,
      formData,
    };
  });
}
