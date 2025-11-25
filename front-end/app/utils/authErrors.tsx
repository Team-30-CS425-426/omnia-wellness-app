// utils/authErrors.ts

export const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Login instead?';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/invalid-credential':
             return 'Invalid email or password.';
        case 'auth/network-request-failed':
            return 'Network error. Check your internet connection.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Try again later.';
        case 'auth/missing-email':
            return 'Please enter an email address.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};