import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587
const SMTP_TLS = process.env.SMTP_TLS === 'true'
const SMTP_USERNAME = process.env.SMTP_USERNAME
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_SENDER_EMAIL = process.env.SMTP_SENDER_EMAIL

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_TLS,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text?: string
  html?: string
}) {
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    console.warn('SMTP not configured. Email not sent.')
    return
  }

  await transporter.sendMail({
    from: `"AgentHub" <${SMTP_SENDER_EMAIL || SMTP_USERNAME}>`,
    to,
    subject,
    text,
    html,
  })
}
