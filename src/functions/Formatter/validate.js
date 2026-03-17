/**
 * Validador genérico.
 * Valida um valor (ou array de valores) contra um formato desejado e retorna array de erros.
 *
 * @param {*} valueOrArray - Valor a validar OU array de [value, format] ou { value, format }
 * @param {string|Object} [format] - Formato desejado (quando valueOrArray é valor único)
 * @returns {Array<{code: string, message: string}>|Array<Array<{code: string, message: string}>>} Erros. Se array de entradas: array de arrays de erros.
 *
 * @example
 * validate('', 'required') // [{ code: 'required', message: 'Campo obrigatório' }]
 * validate('123', 'cpf')   // [{ code: 'cpf', message: 'CPF inválido' }]
 * validate('a@b.com', 'email') // []
 *
 * validate([
 *   [cpfValue, 'cpf'],
 *   [emailValue, 'email'],
 * ]) // [[...errosCpf], [...errosEmail]]
 *
 * validate([
 *   { value: cpfValue, format: 'cpf' },
 *   { value: emailValue, format: 'email' },
 * ]) // [[...errosCpf], [...errosEmail]]
 */
export function validate(valueOrArray, format) {
  if (Array.isArray(valueOrArray)) {
    return valueOrArray.map((item) => {
      const [val, fmt] = Array.isArray(item)
        ? item
        : [item?.value, item?.format ?? item?.type];
      return validateSingle(val, fmt);
    });
  }
  return validateSingle(valueOrArray, format);
}

function validateSingle(value, format) {
  const errors = [];

  if (format == null) return errors;

  const opts = typeof format === 'string' ? { type: format } : format;

  const { type, required = false, minLength, maxLength, pattern, custom } = opts;

  const str = value != null ? String(value).trim() : '';
  const isEmpty = str === '' || value == null;

  // Required
  const checkRequired = required || type === 'required';
  if (checkRequired && isEmpty) {
    errors.push({ code: 'required', message: 'Campo obrigatório' });
    return errors;
  }

  if (isEmpty && !checkRequired) return errors;

  // Type validators
  switch (type) {
    case 'cpf':
      if (!isValidCPF(str)) {
        errors.push({ code: 'cpf', message: 'CPF inválido' });
      }
      break;

    case 'email':
      if (!isValidEmail(str)) {
        errors.push({ code: 'email', message: 'Email inválido' });
      }
      break;

    case 'phone':
      if (!isValidPhone(str)) {
        errors.push({ code: 'phone', message: 'Telefone inválido' });
      }
      break;

    case 'date':
      if (!isValidDate(str)) {
        errors.push({ code: 'date', message: 'Data inválida' });
      }
      break;

    case 'number': {
      const num = Number(value);
      if (Number.isNaN(num)) {
        errors.push({ code: 'number', message: 'Deve ser um número' });
      } else {
        if (opts.min != null && num < opts.min) {
          errors.push({ code: 'min', message: `Valor mínimo: ${opts.min}` });
        }
        if (opts.max != null && num > opts.max) {
          errors.push({ code: 'max', message: `Valor máximo: ${opts.max}` });
        }
      }
      break;
    }

    default:
      break;
  }

  // Length
  if (minLength != null && str.length < minLength) {
    errors.push({ code: 'minLength', message: `Mínimo ${minLength} caracteres` });
  }
  if (maxLength != null && str.length > maxLength) {
    errors.push({ code: 'maxLength', message: `Máximo ${maxLength} caracteres` });
  }

  // Pattern (regex) — with ReDoS protection
  if (pattern != null) {
    try {
      if (typeof pattern === 'string' && pattern.length > 500) {
        errors.push({ code: 'pattern', message: opts.patternMessage || 'Formato inválido' });
      } else {
        const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        if (!re.test(str)) {
          errors.push({ code: 'pattern', message: opts.patternMessage || 'Formato inválido' });
        }
      }
    } catch {
      errors.push({ code: 'pattern', message: opts.patternMessage || 'Formato inválido' });
    }
  }

  // Custom validator
  if (typeof custom === 'function') {
    const customResult = custom(value);
    if (customResult !== true) {
      errors.push({
        code: 'custom',
        message: typeof customResult === 'string' ? customResult : 'Valor inválido',
      });
    }
  }

  return errors;
}

function isValidCPF(str) {
  const digits = str.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  if (d2 !== parseInt(digits[10], 10)) return false;

  return true;
}

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isValidPhone(str) {
  const digits = str.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

function isValidDate(str) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return !Number.isNaN(d.getTime());
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split('/');
    const d = new Date(yyyy, mm - 1, dd);
    return !Number.isNaN(d.getTime()) && d.getDate() === parseInt(dd, 10);
  }
  return false;
}
