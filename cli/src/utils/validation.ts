export function validateEmail(input: string): string | boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input) || "Please enter a valid email";
}

export function validateOtp(input: string): string | boolean {
  return /^\d{6}$/.test(input) || "Please enter a valid 6-digit code";
} 