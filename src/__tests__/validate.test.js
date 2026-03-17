import { describe, it, expect } from 'vitest';
import { validate } from '../functions/Formatter/validate.js';

describe('validate', () => {
  describe('required', () => {
    it('should return error for empty value when required', () => {
      const errors = validate('', 'required');
      expect(errors).toEqual([{ code: 'required', message: 'Campo obrigatório' }]);
    });

    it('should return error for null value when required', () => {
      const errors = validate(null, { type: 'text', required: true });
      expect(errors).toEqual([{ code: 'required', message: 'Campo obrigatório' }]);
    });

    it('should return no errors for non-empty value when required', () => {
      const errors = validate('hello', 'required');
      expect(errors).toEqual([]);
    });
  });

  describe('cpf', () => {
    it('should reject invalid CPF', () => {
      const errors = validate('12345678901', 'cpf');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe('cpf');
    });

    it('should reject all-same-digit CPF', () => {
      const errors = validate('11111111111', 'cpf');
      expect(errors[0].code).toBe('cpf');
    });

    it('should accept valid CPF', () => {
      const errors = validate('529.982.247-25', 'cpf');
      expect(errors).toEqual([]);
    });

    it('should skip validation for empty when not required', () => {
      const errors = validate('', 'cpf');
      expect(errors).toEqual([]);
    });
  });

  describe('email', () => {
    it('should accept valid email', () => {
      expect(validate('user@example.com', 'email')).toEqual([]);
    });

    it('should reject invalid email', () => {
      const errors = validate('not-an-email', 'email');
      expect(errors[0].code).toBe('email');
    });
  });

  describe('phone', () => {
    it('should accept valid 10-digit phone', () => {
      expect(validate('(11) 1234-5678', 'phone')).toEqual([]);
    });

    it('should accept valid 11-digit phone', () => {
      expect(validate('(11) 91234-5678', 'phone')).toEqual([]);
    });

    it('should reject short phone', () => {
      const errors = validate('123', 'phone');
      expect(errors[0].code).toBe('phone');
    });
  });

  describe('date', () => {
    it('should accept ISO date', () => {
      expect(validate('2024-01-15', 'date')).toEqual([]);
    });

    it('should accept dd/mm/yyyy date', () => {
      expect(validate('15/01/2024', 'date')).toEqual([]);
    });

    it('should reject invalid date', () => {
      const errors = validate('not-a-date', 'date');
      expect(errors[0].code).toBe('date');
    });
  });

  describe('number', () => {
    it('should accept valid numbers', () => {
      expect(validate('42', 'number')).toEqual([]);
    });

    it('should reject non-numeric', () => {
      const errors = validate('abc', 'number');
      expect(errors[0].code).toBe('number');
    });

    it('should validate min/max', () => {
      const errors = validate('5', { type: 'number', min: 10 });
      expect(errors[0].code).toBe('min');
    });
  });

  describe('pattern', () => {
    it('should validate regex pattern', () => {
      const errors = validate('abc', { type: 'text', pattern: '^\\d+$' });
      expect(errors[0].code).toBe('pattern');
    });

    it('should accept matching pattern', () => {
      expect(validate('123', { type: 'text', pattern: '^\\d+$' })).toEqual([]);
    });

    it('should reject overly long patterns (ReDoS protection)', () => {
      const longPattern = 'a'.repeat(501);
      const errors = validate('test', { type: 'text', pattern: longPattern });
      expect(errors[0].code).toBe('pattern');
    });

    it('should handle invalid regex gracefully', () => {
      const errors = validate('test', { type: 'text', pattern: '[invalid' });
      expect(errors[0].code).toBe('pattern');
    });
  });

  describe('length constraints', () => {
    it('should validate minLength', () => {
      const errors = validate('ab', { type: 'text', minLength: 3 });
      expect(errors[0].code).toBe('minLength');
    });

    it('should validate maxLength', () => {
      const errors = validate('abcdef', { type: 'text', maxLength: 3 });
      expect(errors[0].code).toBe('maxLength');
    });
  });

  describe('custom validator', () => {
    it('should call custom function', () => {
      const errors = validate('bad', { type: 'text', custom: () => 'Custom error' });
      expect(errors[0]).toEqual({ code: 'custom', message: 'Custom error' });
    });

    it('should pass when custom returns true', () => {
      expect(validate('ok', { type: 'text', custom: () => true })).toEqual([]);
    });
  });

  describe('batch validation', () => {
    it('should validate array of entries', () => {
      const results = validate([
        ['', 'required'],
        ['user@test.com', 'email'],
      ]);
      expect(results[0].length).toBe(1);
      expect(results[1].length).toBe(0);
    });

    it('should validate object entries', () => {
      const results = validate([
        { value: '', format: 'required' },
        { value: 'user@test.com', format: 'email' },
      ]);
      expect(results[0].length).toBe(1);
      expect(results[1].length).toBe(0);
    });
  });
});
