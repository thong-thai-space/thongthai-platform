import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { extractApiErrorMessage } from './api-error';

function axiosErrorWith(data: unknown): AxiosError {
  const err = new AxiosError('Request failed');
  err.response = {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: {} } as never,
  };
  return err;
}

describe('extractApiErrorMessage', () => {
  it('returns the flat message from class-validator (string[])', () => {
    const err = axiosErrorWith({ message: ['email must be valid', 'password too weak'] });
    expect(extractApiErrorMessage(err)).toBe('email must be valid');
  });

  it('returns the flat message when it is a single string', () => {
    const err = axiosErrorWith({ message: 'Email already registered' });
    expect(extractApiErrorMessage(err)).toBe('Email already registered');
  });

  it('falls back to the response envelope shape', () => {
    const err = axiosErrorWith({ error: { message: 'Invoice cannot be deleted' } });
    expect(extractApiErrorMessage(err)).toBe('Invoice cannot be deleted');
  });

  it('uses axios error.message when no body message is present', () => {
    const err = new AxiosError('Network Error');
    expect(extractApiErrorMessage(err)).toBe('Network Error');
  });

  it('uses Error.message for non-axios errors', () => {
    expect(extractApiErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns the fallback for unknown shapes', () => {
    expect(extractApiErrorMessage(null, 'try again')).toBe('try again');
    expect(extractApiErrorMessage(42, 'try again')).toBe('try again');
  });
});
