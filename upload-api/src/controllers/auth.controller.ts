import authenticator from 'authenticator';
import { CONFIG } from '@/lib/config';
import { sign } from 'hono/jwt';
import { sendConfirmationMail } from '@/services/resend/send-mail';
import { factory } from '@/lib/factory';
import { Context } from 'hono';

export const confirmEmail = factory.createHandlers(async (c: Context) => {
    const { email } = await c.req.json();
    const formattedToken = authenticator.generateToken(CONFIG.SECRET + email);

    try {
      await sendConfirmationMail({ email, otp: formattedToken, c });
      return c.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return c.json({ success: false, message: "Failed to send OTP" }, 500);
    }
  })

export const verifyEmail = factory.createHandlers(async (c: Context) => {
    const { email, otp } = await c.req.json();
    const isValid = authenticator.verifyToken(CONFIG.SECRET + email, otp);
    
    if (!isValid) {
      return c.json({ isValid: false }, 400);
    }

    const token = await sign({
      payload: { email }
    }, CONFIG.SECRET);

    return c.json({ isValid: true, token });   
});