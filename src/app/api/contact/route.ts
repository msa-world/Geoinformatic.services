import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, phone, subject, message } = await req.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'GEOINFORMATIC.SERVICES@GMAIL.COM',
        pass: 'asjv sfbz voym rctx',
      },
    });

    const mailOptions = {
      from: `"Geoinformatic Services" <GEOINFORMATIC.SERVICES@GMAIL.COM>`,
      to: 'GEOINFORMATIC.SERVICES@GMAIL.COM',
      replyTo: email,
      subject: `New Inquiry: ${subject || 'General'} - ${firstName} ${lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; mx-auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #1f2937 0%, #000 100%); padding: 30px; text-align: center; }
            .header img { max-height: 50px; }
            .content { padding: 30px; }
            .field-row { margin-bottom: 15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; }
            .field-label { font-weight: bold; color: #555; text-transform: uppercase; font-size: 0.8rem; margin-bottom: 5px; display: block; }
            .field-value { font-size: 1rem; color: #000; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 0.8rem; color: #888; }
            .highlight { color: #D97D25; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
               <img src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/986c6fe2-3527-491b-b576-ae12c431a91d-geo-informatic-com/assets/images/download-15-1.png" alt="Geoinformatic Services" style="width: 200px; height: auto;" />
            </div>
            <div class="content">
              <h2 style="text-align: center; margin-bottom: 30px; color: #111;">New Website Inquiry</h2>
              
              <div class="field-row">
                <span class="field-label">Sender Name</span>
                <div class="field-value">${firstName} ${lastName}</div>
              </div>
              
              <div class="field-row">
                <span class="field-label">Email Address</span>
                <div class="field-value"><a href="mailto:${email}" style="color: #D97D25; text-decoration: none;">${email}</a></div>
              </div>
              
              <div class="field-row">
                <span class="field-label">Phone Number</span>
                <div class="field-value">${phone || 'Not provided'}</div>
              </div>
              
              <div class="field-row">
                <span class="field-label">Subject</span>
                <div class="field-value">${subject}</div>
              </div>
              
              <div style="margin-top: 20px;">
                <span class="field-label">Message</span>
                <div class="field-value" style="background: #f9fafb; padding: 15px; border-radius: 4px; border-left: 4px solid #D97D25;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Geoinformatic Services. All rights reserved.</p>
              <p>This email was sent via the Contact Form on your website.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('SMTP Error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
