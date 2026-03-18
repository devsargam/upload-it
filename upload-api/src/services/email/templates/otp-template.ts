export const generateOTPTemplate = (otp: string): string =>
  `Your Upload-It verification code is: ${otp}\n\nThis code is valid for 2 minutes. If you didn’t request this, ignore this email.`;
