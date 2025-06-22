import authenticator from 'authenticator';
import { config } from '@/lib/config';
import { sign } from 'hono/jwt';
import { sendConfirmationMail } from '@/services/resend/send-mail';
import { factory } from '@/lib/factory';
import { Context } from 'hono';

export const confirmEmail = factory.createHandlers(async (c: Context) => {
    const { email } = await c.req.json();
    const formattedToken = authenticator.generateToken(config.secret + email);

    try {
      await sendConfirmationMail({ email, otp: formattedToken });
      return c.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return c.json({ success: false, message: "Failed to send OTP" }, 500);
    }
  })

export const verifyEmail = factory.createHandlers(async (c: Context) => {
    const { email, otp } = await c.req.json();
    const isValid = authenticator.verifyToken(config.secret + email, otp);
    
    if (!isValid) {
      return c.json({ isValid: false }, 400);
    }

    const token = await sign({
      payload: { email }
    }, config.secret);

    return c.json({ isValid: true, token });   
});