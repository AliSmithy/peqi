/** Companies from cario DB (`lookup_items` where `lookups.name = 'customers'`). */
export const CARIO_COMPANIES = [
  { id: 5, title: { 'fa-IR': 'شرکت صنایع اتومبیل سازی فردا', 'en-US': 'Farda Motor Manufacturing' } },
  { id: 7, title: { 'fa-IR': 'شرکت آرتابان موتور', 'en-US': 'Artaban Motor' } },
  { id: 15, title: { 'fa-IR': 'شرکت شتابران خودرو پرشیا', 'en-US': 'Shetabran Khodro Persia' } },
  { id: 38, title: { 'fa-IR': 'شرکت سازه های خودرو دیار', 'en-US': 'Diar Vehicle Structures' } },
  { id: 47, title: { 'fa-IR': 'شرکت خودرو سازان بم', 'en-US': 'Bam Automakers' } },
  { id: 53, title: { 'fa-IR': 'شرکت بهمن موتور', 'en-US': 'Bahman Motor' } },
  { id: 57, title: { 'fa-IR': 'مدیران خودرو', 'en-US': 'MVM' } },
  { id: 59, title: { 'fa-IR': 'شرکت کرمان موتور', 'en-US': 'Kerman Motor' } },
];

/** Vehicles from cario DB (`jobs.data.car` + `customerName`). */
export const CARIO_VEHICLES = [
  { car: 'SUBA-M4', companyId: 5, productType: 'سواری' },
  { car: 'SX5', companyId: 5, productType: 'شاسی‌بلند' },
  { car: 'MAXUS STAR H', companyId: 15, productType: 'شاسی‌بلند' },
  { car: 'MAXUS T90', companyId: 15, productType: 'وانت' },
  { car: 'TANK 300', companyId: 15, productType: 'شاسی‌بلند' },
  { car: 'XTRIM TX', companyId: 57, productType: 'شاسی‌بلند' },
  { car: 'Z6 GT', companyId: 57, productType: 'سواری' },
  { car: 'KMC X5', companyId: 59, productType: 'شاسی‌بلند' },
  { car: 'X3 PRO', companyId: 47, productType: 'شاسی‌بلند' },
  { car: 'U5 PLUS', companyId: 38, productType: 'سواری' },
  { car: 'RESPECT', companyId: 53, productType: 'شاسی‌بلند' },
  { car: 'RESPECT PRIME', companyId: 53, productType: 'شاسی‌بلند' },
];

export function companyById(id) {
  return CARIO_COMPANIES.find(c => c.id === id);
}

export function vehicleSeedFields(vehicle) {
  const company = companyById(vehicle.companyId);
  const customerName = company?.title['fa-IR'] ?? '';
  return {
    vehicleModel: vehicle.car,
    customerName,
    manufacturer: customerName,
    productType: vehicle.productType,
    applicantId: vehicle.companyId,
  };
}
