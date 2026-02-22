"""Envoi email magic link — même logique SMTP que le site principal (port 465 SSL, 587 STARTTLS)."""
import smtplib
from email.mime.text import MIMEText
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

# Couleur or Renovia Pro
GOLD = "#FEBD17"
DARK = "#0d0d0d"

def _magic_link_html(link: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connexion – Renovia Pro</title>
</head>
<body style="margin:0; padding:0; background:#0d0d0d; font-family: 'Poppins', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px; background:#1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
          <tr>
            <td style="padding: 28px 24px 20px; text-align: center; border-bottom: 2px solid {GOLD};">
              <span style="font-size: 22px; font-weight: 700; color: {GOLD}; letter-spacing: 0.5px;">RENOVIA PRO</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Bonjour,</p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #b0b0b0; line-height: 1.6;">Cliquez sur le bouton ci-dessous pour accéder à votre espace client. Ce lien expire dans 15 minutes et ne peut être utilisé qu'une fois.</p>
              <p style="margin: 0 0 24px; text-align: center;">
                <a href="{link}" style="display: inline-block; padding: 14px 32px; background: {GOLD}; color: #000; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px;">Se connecter</a>
              </p>
              <p style="margin: 0; font-size: 13px; color: #888;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/><a href="{link}" style="color: {GOLD}; word-break: break-all;">{link}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; background: #111; font-size: 12px; color: #666; text-align: center;">
              Renovia Pro – Rénovation intérieure · Alpes-Maritimes & Var
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

def send_magic_link_email(to: str, link: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL] SMTP non configuré (SMTP_USER/SMTP_PASSWORD ou SMTP_PASS), skip magic link")
        return False
    subject = "Connexion à votre espace client Renovia Pro"
    body = _magic_link_html(link)
    msg = MIMEText(body, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM or "noreply@renoviapro.fr"
    msg["To"] = to
    try:
        port = int(SMTP_PORT)
        print(f"[EMAIL] Envoi magic link à {to} via {SMTP_HOST}:{port}")
        if port == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, port, timeout=15) as s:
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(msg["From"], [to], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, port, timeout=15) as s:
                s.starttls()
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(msg["From"], [to], msg.as_string())
        print(f"[EMAIL] OK magic link envoyé à {to}")
        return True
    except Exception as e:
        print(f"[EMAIL] ERREUR SMTP: {type(e).__name__}: {e}")
        return False
