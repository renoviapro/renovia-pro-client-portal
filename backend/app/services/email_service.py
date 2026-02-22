import smtplib
from email.mime.text import MIMEText
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

def send_magic_link_email(to: str, link: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL] SMTP non configuré, skip magic link")
        return False
    subject = "Connexion à votre espace client Renovia Pro"
    body = f"""
    <p>Bonjour,</p>
    <p>Cliquez sur le lien ci-dessous pour vous connecter à votre espace client :</p>
    <p><a href="{link}">{link}</a></p>
    <p>Ce lien expire dans 15 minutes et ne peut être utilisé qu'une fois.</p>
    <p>— Renovia Pro</p>
    """
    msg = MIMEText(body, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_FROM, [to], msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL] {e}")
        return False
