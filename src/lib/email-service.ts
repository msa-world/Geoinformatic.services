
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'GEOINFORMATIC.SERVICES@GMAIL.COM',
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

type EmailType = 'LOGIN_ALERT' | 'JOB_APPLICATION_USER' | 'JOB_APPLICATION_ADMIN' | 'JOB_ALERT' | 'STATUS_UPDATE';

interface EmailPayload {
  to: string;
  subject: string;
  type: EmailType;
  data: any; // Flexible data based on type
}

export async function sendEmail({ to, subject, type, data }: EmailPayload) {
  const htmlContent = getTemplate(type, data);

  const mailOptions = {
    // Replaces "Geo Informatic Services" with "Geoinformatic Services" throughout the file
    from: `"Geoinformatic Services" <GEOINFORMATIC.SERVICES@GMAIL.COM>`,
    to,
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Sent ${type} to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send ${type} to ${to}:`, error);
    return { success: false, error };
  }
}

function getTemplate(type: EmailType, data: any): string {
  const year = new Date().getFullYear();
  const logoUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/986c6fe2-3527-491b-b576-ae12c431a91d-geo-informatic-com/assets/images/download-15-1.png";

  const baseLayout = (content: string, title: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f5; padding-bottom: 40px; }
        .webkit { max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background: #111827; padding: 20px; text-align: center; border-bottom: 4px solid #D97D25; }
        .header img { height: 40px; width: auto; }
        .content { padding: 40px 30px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #D97D25; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .btn:hover { background-color: #b4661b; }
        h1 { color: #111827; font-size: 24px; margin-bottom: 10px; font-weight: 700; }
        p { margin-bottom: 15px; color: #4b5563; font-size: 16px; }
        .highlight { color: #D97D25; font-weight: bold; }
        .info-box { background-color: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #D97D25; margin: 20px 0; }
        .label { font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; font-weight: 600; }
        .value { font-size: 15px; font-weight: 500; color: #1f2937; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="webkit">
          <div class="header">
            <img src="${logoUrl}" alt="Geoinformatic Services">
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>&copy; ${year} Geoinformatic Services. All rights reserved.</p>
            <p>Flat 05, 2nd Floor, National Business Center, Murree Road, Rawalpindi</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  switch (type) {
    case 'LOGIN_ALERT':
      return baseLayout(`
        <h1>New Login Detected</h1>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>We detected a new login to your account at <strong>Geoinformatic Services</strong>.</p>
        <div class="info-box">
          <div class="label">Time</div>
          <div class="value">${new Date().toLocaleString()}</div>
          <div class="label">Email</div>
          <div class="value">${data.email}</div>
        </div>
        <p>If this was you, you can safely ignore this email. If not, please contact support immediately.</p>
      `, "New Login");

    case 'JOB_APPLICATION_USER':
      return baseLayout(`
        <h1>Application Received</h1>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>Thanks for applying to <strong>${data.jobTitle}</strong>. We have received your application and our team will review it shortly.</p>
        <center><a href="${data.dashboardLink}" class="btn">View Application Status</a></center>
      `, "Application Received");

    case 'JOB_APPLICATION_ADMIN':
      return baseLayout(`
        <h1>New Job Application</h1>
        <p>A new candidate has applied for <strong>${data.jobTitle}</strong>.</p>
        <div class="info-box">
          <div class="label">Candidate</div>
          <div class="value">${data.userName}</div>
          <div class="label">Email</div>
          <div class="value">${data.userEmail}</div>
          <div class="label">Position</div>
          <div class="value">${data.jobTitle}</div>
        </div>
        <center><a href="${data.adminLink}" class="btn">Review Application</a></center>
      `, "New Candidate");

    case 'STATUS_UPDATE':
      const statusColors: any = {
        'shortlisted': '#2563eb', // Blue
        'interviewed': '#9333ea', // Purple
        'accepted': '#16a34a',    // Green
        'rejected': '#dc2626',    // Red
        'pending': '#ca8a04'      // Yellow
      };
      const color = statusColors[data.newStatus] || '#333';
      return baseLayout(`
        <h1>Application Status Update</h1>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>The status of your application for <strong>${data.jobTitle}</strong> has been updated.</p>
        
        <div style="text-align: center; padding: 30px 0;">
          <span style="display: inline-block; padding: 10px 20px; background-color: ${color}15; color: ${color}; border: 1px solid ${color}; border-radius: 99px; font-weight: bold; text-transform: uppercase;">
            ${data.newStatus}
          </span>
        </div>

        <p>Log in to your dashboard to view more details.</p>
        <center><a href="${data.dashboardLink}" class="btn">Go to Dashboard</a></center>
      `, "Status Update");

    case 'JOB_ALERT':
      return baseLayout(`
        <h1>New Job Opportunity</h1>
        <p>Hello,</p>
        <p>A new position <strong>${data.jobTitle}</strong> matches your interests at Geoinformatic Services.</p>
        
        <div class="info-box">
          <div class="label">Role</div>
          <div class="value">${data.jobTitle}</div>
          <div class="label">Location</div>
          <div class="value">${data.location}</div>
          <div class="label">Type</div>
          <div class="value">${data.type}</div>
        </div>
        
        <p>Don't miss out on this opportunity!</p>
        <center><a href="${data.jobLink}" class="btn">Apply Now</a></center>
      `, "Job Alert");

    default:
      return baseLayout(`<p>Notification from Geoinformatic Services</p>`, "Notification");
  }
}
