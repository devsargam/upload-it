import authenticator from 'authenticator';
import { sign } from 'hono/jwt';
import { sendConfirmationMail } from '@/services/resend/send-mail';
import { factory } from '@/lib/factory';
import { Context } from 'hono';
import { AppEnv } from '@/types/app';

export const confirmEmail = factory.createHandlers(async (c: Context<AppEnv>) => {
    const { email } = await c.req.json();
    const formattedToken = authenticator.generateToken(c.env.JWT_SECRET + email);

    try {
      await sendConfirmationMail({ email, otp: formattedToken, c });
      return c.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return c.json({ success: false, message: "Failed to send OTP" }, 500);
    }
  })

export const verifyEmail = factory.createHandlers(async (c: Context<AppEnv>) => {
    const { email, otp } = await c.req.json();
    const isValid = authenticator.verifyToken(c.env.JWT_SECRET + email, otp);

    if (!isValid) {
      return c.json({ isValid: false }, 400);
    }

    const token = await sign({
      payload: { email },
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    }, c.env.JWT_SECRET);

    return c.json({ isValid: true, token });
});
