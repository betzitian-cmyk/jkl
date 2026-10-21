/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SendInviteEmailParams {
  recipientName: string;
  workEmail: string;
  companyName: string;
  inviteUrl: string;
  temporaryPassword?: string;
  expiresInHours?: number;
}

/**
 * Sends a secure onboarding invitation email.
 * For development/preview environments, this prints the full branded HTML template to the console
 * to allow administrators to easily capture the link and temporary credentials for manual testing.
 */
export async function sendOnboardingInviteEmail(params: SendInviteEmailParams): Promise<{ success: boolean; message: string }> {
  const {
    recipientName,
    workEmail,
    companyName,
    inviteUrl,
    temporaryPassword,
    expiresInHours = 72,
  } = params;

  const expirationText = `${expiresInHours} heures / ${expiresInHours} hours`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bienvenue chez ${companyName} / Welcome to ${companyName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-b: 2px solid #f1f5f9;
      margin-bottom: 25px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: -0.05em;
    }
    .welcome-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 15px;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .credentials-box {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      font-family: monospace;
    }
    .footer {
      font-size: 11px;
      color: #64748b;
      border-t: 1px solid #f1f5f9;
      padding-top: 20px;
      text-align: center;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ApplepAI <span style="font-weight:300; color:#64748b;">powered by</span> ApplechAI</div>
      <div class="welcome-title">Fiche d'intégration d'employé / Employee Onboarding Portal</div>
    </div>
    
    <p>Bonjour / Hello <strong>${recipientName}</strong>,</p>
    
    <p>
      Bienvenue au sein de l'équipe de <strong>${companyName}</strong> ! Votre administrateur a initié votre dossier d'embauche sécurisé. 
      Veuillez cliquer sur le bouton ci-dessous pour accepter votre invitation, configurer votre mot de passe et remplir votre questionnaire d'intégration.
    </p>
    <p>
      Welcome to the team at <strong>${companyName}</strong>! Your administrator has initiated your secure onboarding profile. 
      Please click the button below to accept your invitation, set your password, and complete your hire questionnaire.
    </p>

    <div style="text-align: center;">
      <a href="${inviteUrl}" class="btn" target="_blank">Créer mon compte / Accept Invitation</a>
    </div>

    ${temporaryPassword ? `
    <div class="credentials-box">
      <strong>Identifiants temporaires / Temporary Credentials:</strong><br/>
      Courriel / Email: ${workEmail}<br/>
      Mot de passe temporaire / Temporary Password: <span style="font-weight:bold;color:#b91c1c;">${temporaryPassword}</span>
    </div>
    ` : ''}

    <p style="font-size: 12px; color: #ef4444;">
      <strong>Note de sécurité / Security Notice:</strong> Ce lien sécurisé à usage unique expirera dans <strong>${expirationText}</strong>.
      Il ne doit pas être partagé.
      <br/>
      This secure single-use link will expire in <strong>${expirationText}</strong>. Do not share this email.
    </p>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${companyName} &bull; Solutions de paie intelligentes propulsées par ApplechAI</p>
      <p>Port 3000 &bull; Montreal, Quebec, Canada</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Print to terminal for debugging and validation in preview environment
  console.log("\n==============================================================================");
  console.log(`📬 DISPATCHING ONBOARDING EMAIL TO: ${workEmail}`);
  console.log(`🔗 PORTAL ACCESS LINK: ${inviteUrl}`);
  if (temporaryPassword) {
    console.log(`🔑 TEMPORARY CREDENTIALS - PASS: ${temporaryPassword}`);
  }
  console.log("==============================================================================\n");

  return {
    success: true,
    message: "Invitation email successfully prepared and printed to terminal output."
  };
}
