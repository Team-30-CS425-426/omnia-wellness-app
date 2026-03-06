import { validateRegistrationInput } from '../../utils/validator';

describe('validateRegistrationInput', () => {
  it('throws when email is missing', () => {
    expect(() => validateRegistrationInput('', 'password123'))
      .toThrow('Email and password are required for registration.');
  });

  it('throws when password is missing', () => {
    expect(() => validateRegistrationInput('test@example.com', ''))
      .toThrow('Email and password are required for registration.');
  });

  it('throws when password is shorter than 6 characters', () => {
    expect(() => validateRegistrationInput('test@example.com', '12345'))
      .toThrow('Password must be at least 6 characters long.');
  });

  it('does NOT throw for a valid email and password (>= 6 chars)', () => {
    expect(() => validateRegistrationInput('test@example.com', '123456'))
      .not.toThrow();
  });
});