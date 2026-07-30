from email.message import EmailMessage
import smtplib

from app.core.config import settings


class EmailDeliveryError(Exception):
    pass


def send_verification_code(*, email: str, code: str, full_name: str) -> None:
    subject = "Your SRS Diagram Platform verification code"
    body = (
        f"Hi {full_name},\n\n"
        f"Your verification code is: {code}\n\n"
        "This code expires soon. If you did not request this, you can ignore this email."
    )

    if settings.email_delivery_mode == "console":
        print(f"[email verification] To: {email} Code: {code}")
        return

    if settings.email_delivery_mode != "smtp":
        raise EmailDeliveryError("Unsupported email delivery mode")
    if not settings.smtp_host:
        raise EmailDeliveryError("SMTP_HOST is required for smtp email delivery")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = email
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)
