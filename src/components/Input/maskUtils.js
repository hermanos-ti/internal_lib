/**
 * Funções de máscara para inputs.
 * Cada função recebe o valor bruto e retorna o valor formatado.
 * Use com useInput: useInput('', maskUtils.maskCPF)
 */

/**
 * Máscara CPF: 999.999.999-99
 * @param {string} value
 * @returns {string}
 */
export function maskCPF(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Máscara telefone: (99) 99999-9999 ou (99) 9999-9999
 * @param {string} value
 * @returns {string}
 */
export function maskPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/**
 * Máscara moeda BRL: formata como R$ 1.234,56
 * @param {string} value
 * @returns {string}
 */
export function maskCurrency(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 0) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Máscara data: dd/mm/yyyy
 * @param {string} value
 * @returns {string}
 */
export function maskDate(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export const maskUtils = {
  maskCPF,
  maskPhone,
  maskCurrency,
  maskDate,
};
