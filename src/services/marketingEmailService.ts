
/**
 * Marketing Email Service
 * Generates and manages marketing email templates and campaigns
 */

interface MarketingEmailParams {
  name: string;
  company: string;
}

interface Attachment {
  filename: string;
  content: string; // Base64 encoded content
  contentType: string;
}

/**
 * Generate a branded HTML email template for marketing purposes.
 * This template includes a multicolored text logo, and supports basic HTML for styling.
 */
const generateMarketingEmailTemplate = (title: string, content: string): string => {
  const logo = `
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -1px;">
      <span style="color: #4f46e5;">flo</span><span style="color: #3b82f6;">in</span><span style="color: #10b981;">vi</span><span style="color: #f59e0b;">te</span>
    </h1>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f9fafb;">
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<div style="margin-bottom: 30px;">
  ${logo}
</div>
<div>
  <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px;">${title}</h2>
  ${content}
</div>
<div style="margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af;">
  <p>Xtenalyze | 123 Innovation Drive, Tech City, 12345</p>
  <p><a href="#" style="color: #9ca3af;">Unsubscribe</a></p>
</div>
</div>
</body>
</html>`;
};

/**
 * Generate the "Xtenalyze Pitch" email.
 */
export const generateXtenalyzePitchEmail = (params: MarketingEmailParams, attachments?: Attachment[]): { subject: string; body: string; attachments?: Attachment[] } => {
  const { name, company } = params;

  const subject = `Fire safety / Digital logs for ${company}`;

  const content = `
    <p>Hi ${name},</p>
    <p>I'm the lead developer at Xtenalyze. We built a 'One-Click Evacuation PDF' tool for UK offices to replace manual paper logs and automate host notifications.</p>
    <p>It includes features like:</p>
    <ul>
      <li><strong>One-click PDF generation</strong> of everyone on site.</li>
      <li>Automated notifications for hosts.</li>
      <li>A searchable digital logbook.</li>
    </ul>
    <p>Can I send you a 45-second video showing how it works for ${company}?</p>
    <p>Best regards,<br>The Xtenalyze Team</p>
  `;

  const body = generateMarketingEmailTemplate(subject, content);

  return { subject, body, attachments };
};
