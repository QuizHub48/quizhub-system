// Email: must have local@domain.tld format
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test((email || '').trim());

// Phone: strip non-digits, must have 9–15 digits (9+ is realistic for most countries)
// Accepts: +94771234567  |  077-123-4567  |  +1 (800) 555-0199  |  0771234567  etc.
export const isValidPhone = (phone) => {
  if (!phone || phone.trim() === '') return true; // phone is optional
  const digitsOnly = phone.replace(/\D/g, ''); // remove all non-digits
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
};

export const emailError   = 'Enter a valid email address (e.g. you@example.com)';
export const phoneError   = 'Enter a valid phone number (e.g. +94 77 123 4567)';
