import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Gmail SMTP using an App Password (Google Account → Security → App passwords).
 * Optional: when GMAIL_USER / GMAIL_APP_PASSWORD are unset, sending is skipped.
 */
function gmailConfig() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user && !pass) return null;
  if (!user || !pass) throw new Error("Set both GMAIL_USER and GMAIL_APP_PASSWORD, or neither");
  return { user, pass };
}

let transporter: Transporter | null = null;

export function mailerConfigured() {
  return process.env.EMAIL_TURN_OFF !== "true" && gmailConfig() !== null;
}

export async function sendMail(message: { to: string; subject: string; text: string; html: string; replyTo?: string }) {
  if (process.env.EMAIL_TURN_OFF === "true") return false;

  const config = gmailConfig();
  if (!config) return false;
  transporter ??= nodemailer.createTransport({ service: "gmail", auth: config });
  await transporter.sendMail({ from: `"AL Flower Shop" <${config.user}>`, ...message });
  return true;
}
