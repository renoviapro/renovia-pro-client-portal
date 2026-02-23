"""Envoi email magic link — style identique au site principal Renovia Pro."""
import smtplib
from email.mime.text import MIMEText
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

LOGO_URL   = "https://renoviapro.fr/logo.png"
TEXT_URL   = "https://renoviapro.fr/renovia-pro-text.png?v=2"
GOLD       = "#FEBD17"

EMAIL_HEADER = f"""
<div style="background:#000; padding:24px; text-align:center;">
  <table align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="vertical-align:middle; padding-right:14px;">
        <img src="{LOGO_URL}" alt="Logo" width="90" height="90" style="display:block; border:0;" />
      </td>
      <td style="vertical-align:middle;">
        <img src="{TEXT_URL}" alt="RENOVIA PRO" width="220" height="58" style="display:block; border:0;" />
      </td>
    </tr>
  </table>
</div>
"""

EMAIL_FOOTER = f"""
<div style="background:#000; padding:12px 16px; text-align:center;">
  <img src="{TEXT_URL}" alt="RENOVIA PRO" width="100" height="26" style="display:inline-block; border:0; vertical-align:middle;" />
  <br/>
  <span style="color:#666; font-size:11px; font-family:Arial,sans-serif;">
    06 01 64 27 76 &nbsp;|&nbsp; contact@renoviapro.fr &nbsp;|&nbsp; renoviapro.fr
  </span>
</div>
"""


def _magic_link_html(link: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connexion – Renovia Pro</title>
</head>
<body style="margin:0; padding:0; background:#f9f9f9; font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr><td>{EMAIL_HEADER}</td></tr>
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 16px; font-size:22px; color:#111;">Connexion à votre espace client</h2>
              <p style="margin:0 0 12px; font-size:15px; color:#555; line-height:1.7;">Bonjour,</p>
              <p style="margin:0 0 28px; font-size:15px; color:#555; line-height:1.7;">
                Cliquez sur le bouton ci-dessous pour vous connecter à votre espace client Renovia Pro.<br/>
                Ce lien est <strong style="color:#000;">valable 15 minutes</strong> et ne peut être utilisé qu'une seule fois.
              </p>
              <div style="margin:0 0 28px; text-align:center;">
                <a href="{link}"
                   style="display:inline-block; background:{GOLD}; color:#000; padding:14px 40px; border-radius:40px; text-decoration:none; font-weight:700; font-size:16px; letter-spacing:0.5px;">
                  Se connecter à mon espace
                </a>
              </div>
              <div style="padding:16px; background:#f9f9f9; border-left:4px solid {GOLD}; border-radius:4px; margin-bottom:16px;">
                <p style="margin:0 0 6px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:1px;">Lien de secours</p>
                <a href="{link}" style="font-size:12px; color:{GOLD}; word-break:break-all;">{link}</a>
              </div>
              <p style="margin:0; font-size:12px; color:#aaa; line-height:1.6;">
                Si vous n'avez pas demandé cette connexion, ignorez cet email.
              </p>
            </td>
          </tr>
          <tr><td>{EMAIL_FOOTER}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_welcome_email(to: str, link: str) -> bool:
    """Email de bienvenue pour un nouveau compte — lien magique inclus."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL] SMTP non configuré, skip welcome")
        return False
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0; padding:0; background:#f9f9f9; font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td>{EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding:36px 32px;">
            <h2 style="margin:0 0 8px; font-size:24px; color:#111;">Bienvenue chez Renovia Pro !</h2>
            <p style="margin:0 0 8px; font-size:14px; color:#FEBD17; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Votre espace client vient d'être créé</p>
            <p style="margin:0 0 28px; font-size:15px; color:#555; line-height:1.7;">
              Bonjour,<br/><br/>
              Nous avons créé votre espace client Renovia Pro avec l'adresse <strong style="color:#111;">{to}</strong>.<br/>
              Cliquez sur le bouton ci-dessous pour accéder à votre espace et compléter votre profil.<br/>
              Ce lien est <strong style="color:#000;">valable 15 minutes</strong>.
            </p>
            <div style="margin:0 0 28px; text-align:center;">
              <a href="{link}" style="display:inline-block; background:{GOLD}; color:#000; padding:16px 44px; border-radius:40px; text-decoration:none; font-weight:700; font-size:16px; letter-spacing:0.5px;">
                Accéder à mon espace client
              </a>
            </div>
            <div style="padding:16px; background:#f9f9f9; border-left:4px solid {GOLD}; border-radius:4px; margin-bottom:16px;">
              <p style="margin:0 0 6px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:1px;">Lien de secours</p>
              <a href="{link}" style="font-size:12px; color:{GOLD}; word-break:break-all;">{link}</a>
            </div>
            <p style="margin:0; font-size:12px; color:#aaa; line-height:1.6;">
              Si vous n'avez pas demandé la création de ce compte, ignorez cet email.
            </p>
          </td>
        </tr>
        <tr><td>{EMAIL_FOOTER}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""
    msg = MIMEText(html, "html", "utf-8")
    msg["Subject"] = "Bienvenue dans votre espace client – Renovia Pro"
    msg["From"] = SMTP_FROM or "noreply@renoviapro.fr"
    msg["To"] = to
    try:
        port = int(SMTP_PORT)
        print(f"[EMAIL] Envoi welcome à {to}")
        if port == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, port, timeout=15) as s:
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(msg["From"], [to], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, port, timeout=15) as s:
                s.starttls()
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(msg["From"], [to], msg.as_string())
        print(f"[EMAIL] OK welcome envoyé à {to}")
        return True
    except Exception as e:
        print(f"[EMAIL] ERREUR: {e}")
        return False


def send_reset_password_email(to: str, link: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL] SMTP non configuré, skip reset password")
        return False
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0; padding:0; background:#f9f9f9; font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td>{EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding:36px 32px;">
            <h2 style="margin:0 0 16px; font-size:22px; color:#111;">Réinitialisation de votre mot de passe</h2>
            <p style="margin:0 0 12px; font-size:15px; color:#555; line-height:1.7;">Bonjour,</p>
            <p style="margin:0 0 28px; font-size:15px; color:#555; line-height:1.7;">
              Vous avez demandé à réinitialiser votre mot de passe.<br/>
              Cliquez sur le bouton ci-dessous — ce lien est <strong style="color:#000;">valable 15 minutes</strong>.
            </p>
            <div style="margin:0 0 28px; text-align:center;">
              <a href="{link}" style="display:inline-block; background:{GOLD}; color:#000; padding:14px 40px; border-radius:40px; text-decoration:none; font-weight:700; font-size:16px; letter-spacing:0.5px;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <div style="padding:16px; background:#f9f9f9; border-left:4px solid {GOLD}; border-radius:4px; margin-bottom:16px;">
              <p style="margin:0 0 6px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:1px;">Lien de secours</p>
              <a href="{link}" style="font-size:12px; color:{GOLD}; word-break:break-all;">{link}</a>
            </div>
            <p style="margin:0; font-size:12px; color:#aaa; line-height:1.6;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe reste inchangé.
            </p>
          </td>
        </tr>
        <tr><td>{EMAIL_FOOTER}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""
    msg = MIMEText(html, "html", "utf-8")
    msg["Subject"] = "Réinitialisation de votre mot de passe – Renovia Pro"
    msg["From"] = SMTP_FROM or "noreply@renoviapro.fr"
    msg["To"] = to
    try:
        port = int(SMTP_PORT)
        print(f"[EMAIL] Envoi reset password à {to}")
        if port == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, port, timeout=15) as s:
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(msg["From"], [to], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, port, timeout=15) as s:
                s.starttls()
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(msg["From"], [to], msg.as_string())
        print(f"[EMAIL] OK reset password envoyé à {to}")
        return True
    except Exception as e:
        print(f"[EMAIL] ERREUR: {e}")
        return False


def send_internal_notification(subject: str, html_content: str) -> bool:
    """Envoie une notification interne à l'adresse Renovia Pro (contact@renoviapro.fr)."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL] SMTP non configuré, skip notification interne")
        return False
    to = "contact@renoviapro.fr"
    msg = MIMEText(html_content, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM or "noreply@renoviapro.fr"
    msg["To"] = to
    try:
        port = int(SMTP_PORT)
        if port == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, port, timeout=15) as s:
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(msg["From"], [to], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, port, timeout=15) as s:
                s.starttls()
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(msg["From"], [to], msg.as_string())
        print(f"[EMAIL] Notification interne envoyée : {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] ERREUR notification interne: {e}")
        return False


def send_magic_link_email(to: str, link: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL] SMTP non configuré (SMTP_USER/SMTP_PASSWORD ou SMTP_PASS), skip magic link")
        return False
    subject = "Connexion à votre espace client – Renovia Pro"
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
