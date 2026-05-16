/**
 * VietQR bank brand → short code mapping (img.vietqr.io accepts either
 * BIN or short code; we use short codes for readability).
 *
 * Keys are normalized (lowercase, no diacritics, no spaces). Values are the
 * short codes recognized by vietqr.io. List covers the major Vietnamese
 * retail banks; extend as providers come online with rarer brands.
 */
const RAW: Record<string, string> = {
  // Top brands
  vietcombank: 'VCB',
  vcb: 'VCB',
  vietinbank: 'CTG',
  ctg: 'CTG',
  bidv: 'BIDV',
  agribank: 'AGRIBANK',
  techcombank: 'TCB',
  tcb: 'TCB',
  mbbank: 'MB',
  mb: 'MB',
  acb: 'ACB',
  vpbank: 'VPB',
  vpb: 'VPB',
  sacombank: 'STB',
  stb: 'STB',
  tpbank: 'TPB',
  tpb: 'TPB',
  hdbank: 'HDB',
  hdb: 'HDB',
  shb: 'SHB',
  vib: 'VIB',
  ocb: 'OCB',
  msb: 'MSB',
  seabank: 'SEAB',
  eximbank: 'EIB',
  eib: 'EIB',
  // Digital banks
  cake: 'CAKE',
  ubank: 'UBANK',
  timo: 'TIMO',
  // Foreign
  shinhan: 'SHBVN',
  hsbc: 'HSBC',
  standardchartered: 'SCVN',
  woori: 'WVN',
  publicbank: 'PBVN',
};

export const VIETQR_BANK_CODES = RAW;

export function normalizeBankBrand(input: string): string | null {
  if (!input) return null;
  // Drop diacritics ("Vietcombank", "Vietcom Bank", "VietComBank" → "vietcombank")
  const key = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return RAW[key] ?? null;
}
