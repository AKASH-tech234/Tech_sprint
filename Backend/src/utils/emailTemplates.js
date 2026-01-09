export const issueSubmittedTemplate = (issue) => ({
  subject: "Complaint Received",
  html: `
    <h2>Complaint Submitted</h2>
    <p><b>ID:</b> ${issue._id}</p>
    <p><b>Title:</b> ${issue.title}</p>
    <p>Status: Pending</p>
  `,
});


export const issueAssignedTemplate = (issue) => ({
  subject: "New Issue Assigned",
  html: `
    <h2>New Issue Assigned</h2>
    <p>Issue: <b>${issue.title}</b></p>
    <p>Please start working on it.</p>
  `,
});

export const issueSolvedTemplate = (issue) => ({
  subject: "Issue Marked as Solved",
  html: `
    <h2>Issue Solved</h2>
    <p>The issue <b>${issue.title}</b> has been solved.</p>
  `,
});

// Password Reset Email Template
export const passwordResetTemplate = (resetUrl, username) => ({
  subject: "Password Reset Request - CitizenVoice",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; text-align: center;">
            <!-- Logo/Header -->
            <h1 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">
              🏛️ CitizenVoice
            </h1>
            <p style="color: #94a3b8; margin: 0 0 30px 0; font-size: 14px;">
              Empowering Citizens, Building Better Communities
            </p>
            
            <!-- Main Content -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
              <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 22px;">
                Password Reset Request
              </h2>
              <p style="color: #cbd5e1; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                Hi${username ? ` <strong style="color: #f43f5e;">${username}</strong>` : ''},
              </p>
              <p style="color: #cbd5e1; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 25px;">
                Reset My Password
              </a>
              
              <p style="color: #94a3b8; margin: 25px 0 0 0; font-size: 14px;">
                ⏰ This link will expire in <strong style="color: #f43f5e;">15 minutes</strong>
              </p>
            </div>
            
            <!-- Security Notice -->
            <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #fda4af; margin: 0; font-size: 13px;">
                🔒 If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <!-- Alternative Link -->
            <p style="color: #64748b; font-size: 12px; margin: 20px 0 0 0; word-break: break-all;">
              If the button doesn't work, copy and paste this link:<br>
              <a href="${resetUrl}" style="color: #8b5cf6;">${resetUrl}</a>
            </p>
            
            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} CitizenVoice. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});

// Password Reset Success Email Template
export const passwordResetSuccessTemplate = (username) => ({
  subject: "Password Changed Successfully - CitizenVoice",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; text-align: center;">
            <!-- Logo/Header -->
            <h1 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">
              🏛️ CitizenVoice
            </h1>
            
            <!-- Success Icon -->
            <div style="font-size: 60px; margin: 20px 0;">✅</div>
            
            <!-- Main Content -->
            <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 22px;">
              Password Changed Successfully
            </h2>
            <p style="color: #cbd5e1; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Hi${username ? ` <strong style="color: #f43f5e;">${username}</strong>` : ''},
            </p>
            <p style="color: #cbd5e1; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
              Your password has been changed successfully. You can now log in with your new password.
            </p>
            
            <!-- Security Notice -->
            <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #fda4af; margin: 0; font-size: 13px;">
                🔒 If you didn't make this change, please contact support immediately.
              </p>
            </div>
            
            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} CitizenVoice. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});
