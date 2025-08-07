import { MailService } from '@sendgrid/mail';

const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (!sendgridApiKey) {
  console.warn("SENDGRID_API_KEY environment variable not set - email sending will be disabled");
}

const mailService = new MailService();
if (sendgridApiKey) {
  mailService.setApiKey(sendgridApiKey);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(
  apiKey: string,
  params: EmailParams
): Promise<boolean> {
  try {
    // Use the pre-configured mailService instead of apiKey parameter
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
