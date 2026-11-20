export interface VenezuelanBank {
  code: string;
  name: string;
  shortName: string;
}

export const VENEZUELAN_BANKS: readonly VenezuelanBank[] = [
  { code: '0102', name: 'Banco de Venezuela', shortName: 'BDV' },
  { code: '0134', name: 'Banesco', shortName: 'Banesco' },
  { code: '0105', name: 'Banco Mercantil', shortName: 'Mercantil' },
  { code: '0108', name: 'BBVA Provincial', shortName: 'Provincial' },
  { code: '0191', name: 'Banco Nacional de Crédito (BNC)', shortName: 'BNC' },
  { code: '0172', name: 'Bancamiga', shortName: 'Bancamiga' },
  { code: '0114', name: 'Bancaribe', shortName: 'Bancaribe' },
  { code: '0174', name: 'Banplus', shortName: 'Banplus' },
  { code: '0175', name: 'Banco Bicentenario', shortName: 'Bicentenario' },
  { code: '0163', name: 'Banco del Tesoro', shortName: 'Tesoro' },
  { code: '0151', name: 'Banco Fondo Común (BFC)', shortName: 'BFC' },
  { code: '0169', name: 'R4 Banco Microfinanciero', shortName: 'R4 / Mi Banco' },
  { code: '0177', name: 'BANFANB', shortName: 'BANFANB' },
  { code: '0168', name: 'Bancrecer', shortName: 'Bancrecer' },
  { code: '0138', name: 'Banco Plaza', shortName: 'Plaza' },
  { code: '0128', name: 'Banco Caroní', shortName: 'Caroní' },
  { code: '0104', name: 'Venezolano de Crédito', shortName: 'BVC' },
  { code: '0115', name: 'Banco Exterior', shortName: 'Exterior' },
  { code: '0137', name: 'Banco Sofitasa', shortName: 'Sofitasa' },
  { code: '0157', name: 'DelSur Banco Universal', shortName: 'DelSur' },
  { code: '0156', name: '100% Banco', shortName: '100% Banco' },
  { code: '0171', name: 'Banco Activo', shortName: 'Activo' },
  { code: '0146', name: 'Bangente', shortName: 'Bangente' },
];

export function findBankByCode(code: string): VenezuelanBank | undefined {
  return VENEZUELAN_BANKS.find((bank) => bank.code === code.trim());
}

export function formatBankLabel(code: string): string {
  const bank = findBankByCode(code);
  return bank ? `${bank.code} - ${bank.name}` : code;
}
