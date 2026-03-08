
export function validateRegistrationInput(email: string, password: string): void {
    if (!email || !password) {
      throw new Error('Email and password are required for registration.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
  }
  
  
  