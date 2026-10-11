import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: false,
  });

const baseStyle = `
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); padding: 32px 40px; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; color: #334155; line-height: 1.6; }
    .body h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
    .btn { display: inline-block; background: #0ea5e9; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
  </style>
`;

export const sendInviteEmail = async (email: string, token: string, name: string, role: string) => {
  const transporter = createTransporter();
  const inviteLink = `${process.env.NEXTAUTH_URL}/set-password?token=${token}`;

  await transporter.sendMail({
    from: `"InternHub" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `You're invited to InternHub as ${role}`,
    html: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Welcome to InternHub</h1>
          <p>Your internship management platform</p>
        </div>
        <div class="body">
          <h2>Hello, ${name}! 👋</h2>
          <p>You've been invited to join InternHub as a <strong>${role}</strong>.</p>
          <p>Click the button below to set your password and access your dashboard:</p>
          <a href="${inviteLink}" class="btn">Set Up My Account →</a>
          <div class="info-box">
            <strong>🔗 Link not working?</strong><br/>
            Copy and paste: <code style="word-break:break-all;font-size:12px;">${inviteLink}</code>
          </div>
          <p style="color:#64748b;font-size:13px;">⏰ This link expires in 48 hours.</p>
        </div>
        <div class="footer">InternHub · Your internship management platform</div>
      </div>
    `,
  });
  return true;
};

export const sendTaskAssignedEmail = async (internEmail: string, internName: string, taskTitle: string) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"InternHub" <${process.env.EMAIL_FROM}>`,
    to: internEmail,
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      ${baseStyle}
      <div class="container">
        <div class="header"><h1>New Task Assigned</h1></div>
        <div class="body">
          <h2>Hello, ${internName}!</h2>
          <p>A new task has been assigned to you:</p>
          <div class="info-box"><strong>📋 ${taskTitle}</strong></div>
          <p>Log in to your dashboard to view the details and start working.</p>
          <a href="${process.env.NEXTAUTH_URL}/intern/tasks" class="btn">View Task →</a>
        </div>
        <div class="footer">InternHub</div>
      </div>
    `,
  });
  return true;
};

export const sendTaskReviewedEmail = async (internEmail: string, internName: string, taskTitle: string, status: string, remarks?: string) => {
  const transporter = createTransporter();
  const approved = status === "APPROVED";
  await transporter.sendMail({
    from: `"InternHub" <${process.env.EMAIL_FROM}>`,
    to: internEmail,
    subject: `Task Review: ${taskTitle} — ${approved ? "✅ Approved" : "🔄 Needs Rework"}`,
    html: `
      ${baseStyle}
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, ${approved ? "#10b981, #059669" : "#ef4444, #dc2626"} 100%)">
          <h1>${approved ? "✅ Task Approved!" : "🔄 Rework Required"}</h1>
        </div>
        <div class="body">
          <h2>Hello, ${internName}!</h2>
          <p>Your submission for <strong>${taskTitle}</strong> has been reviewed.</p>
          ${remarks ? `<div class="info-box"><strong>Mentor Feedback:</strong><br/>${remarks}</div>` : ""}
          <a href="${process.env.NEXTAUTH_URL}/intern/tasks" class="btn">View Dashboard →</a>
        </div>
        <div class="footer">InternHub</div>
      </div>
    `,
  });
  return true;
};

export const sendWeeklyReportNotification = async (mentorEmail: string, internName: string, weekNumber: number) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"InternHub" <${process.env.EMAIL_FROM}>`,
    to: mentorEmail,
    subject: `Weekly Report Submitted: ${internName} — Week ${weekNumber}`,
    html: `
      ${baseStyle}
      <div class="container">
        <div class="header"><h1>📊 Weekly Report Submitted</h1></div>
        <div class="body">
          <h2>New Report Available</h2>
          <p><strong>${internName}</strong> has submitted their Week ${weekNumber} report.</p>
          <a href="${process.env.NEXTAUTH_URL}/mentor/reports" class="btn">Review Report →</a>
        </div>
        <div class="footer">InternHub</div>
      </div>
    `,
  });
  return true;
};

export const sendEvaluationEmail = async (internEmail: string, internName: string, finalScore: number) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"InternHub" <${process.env.EMAIL_FROM}>`,
    to: internEmail,
    subject: `🎓 Your Internship Evaluation is Ready`,
    html: `
      ${baseStyle}
      <div class="container">
        <div class="header"><h1>🎓 Evaluation Complete</h1></div>
        <div class="body">
          <h2>Congratulations, ${internName}!</h2>
          <p>Your mentor has completed your performance evaluation.</p>
          <div class="info-box"><strong>Final Score: ${finalScore}/100</strong></div>
          <a href="${process.env.NEXTAUTH_URL}/intern" class="btn">View Full Evaluation →</a>
        </div>
        <div class="footer">InternHub</div>
      </div>
    `,
  });
  return true;
};
