import * as brevo from "@getbrevo/brevo";

let apiInstance: brevo.TransactionalEmailsApi | null = null;

function getApiInstance(): brevo.TransactionalEmailsApi {
  if (!apiInstance) {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not defined");
    }
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );
  }
  return apiInstance;
}

interface SendEmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export async function sendAnalysisEmail({
  to,
  toName,
  subject,
  htmlContent,
}: SendEmailParams): Promise<boolean> {
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: "Bojan - arsenio.at",
    email: "office@arsenio.at",
  };

  sendSmtpEmail.to = [
    {
      email: to,
      name: toName,
    },
  ];

  // CC an dich selbst
  sendSmtpEmail.cc = [
    {
      email: "office@arsenio.at",
      name: "arsenio.at",
    },
  ];

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = wrapInEmailTemplate(htmlContent, toName);

  try {
    await getApiInstance().sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

function wrapInEmailTemplate(content: string, name: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihre Website-Analyse ist fertig</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:20px 0;">
        <table role="presentation" style="max-width:680px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ec4899,#8b5cf6);padding:30px 20px;text-align:center;">
              <img src="https://arsenio.at/wp-content/uploads/2025/03/favicon_black.png" alt="arsenio.at" style="width:60px;margin-bottom:10px;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">Website-Analyse Ergebnis</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:30px 20px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 10px 0;font-size:14px;color:#6b7280;">
                Sie haben diese E-Mail erhalten, weil Sie eine kostenlose Website-Analyse angefordert haben.
              </p>
              <p style="margin:0;font-size:14px;color:#6b7280;">
                <strong>arsenio.at</strong> |
                <a href="mailto:office@arsenio.at" style="color:#ec4899;">office@arsenio.at</a> |
                +43 660 150 3210
              </p>
              <p style="margin:15px 0 0 0;font-size:12px;color:#9ca3af;">
                <a href="https://arsenio.at/impressum" style="color:#9ca3af;">Impressum</a> |
                <a href="https://arsenio.at/datenschutz" style="color:#9ca3af;">Datenschutz</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
