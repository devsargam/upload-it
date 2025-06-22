export const generateOTPTemplate = (otp: string): string => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Upload-It Email Verification</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f6f8;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      .header {
        background-color: #1e293b;
        padding: 30px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 28px;
      }
      .content {
        padding: 30px 40px;
      }
      .content h2 {
        margin-top: 0;
        font-size: 22px;
        color: #111827;
      }
      .content p {
        font-size: 16px;
        line-height: 1.6;
        color: #374151;
      }
      .otp-box {
        margin: 30px 0;
        padding: 16px;
        background-color: #e0f2fe;
        border: 2px dashed #0284c7;
        border-radius: 8px;
        text-align: center;
      }
      .otp-code {
        font-size: 32px;
        font-weight: bold;
        color: #0c4a6e;
        letter-spacing: 4px;
      }
      .footer {
        padding: 20px 40px;
        font-size: 13px;
        text-align: center;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
        background-color: #f9fafb;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Upload-It</h1>
      </div>
      <div class="content">
        <h2>Email Verification</h2>
        <p>Thanks for signing up with Upload-It! To complete your registration and secure your account, please use the verification code below:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div style="margin-top: 10px; font-size: 14px;">This code is valid for 2 minutes.</div>
        </div>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        Upload-It will never ask you to disclose your password. This is an automated message — please do not reply.
      </div>
    </div>
  </body>
</html>
`;
