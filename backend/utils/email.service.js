import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM =
  process.env.SMTP_FROM || "FASYL PMO <no-reply@fasyl.com>";

let transporter = null;

export const isEmailConfigured = () =>
  Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error("SMTP is not configured");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  return transporter;
};

/**
 * Sends an email over SMTP. Never throws — assignment flows must not break
 * when mail delivery fails. Logs the outcome and returns a result object.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    return { success: false, error: "No recipient email provided" };
  }

  if (!isEmailConfigured()) {
    console.warn(
      `📧 Email skipped (SMTP not configured) -> ${to}: ${subject}`,
    );
    return { success: false, skipped: true, error: "SMTP not configured" };
  }

  try {
    const info = await getTransporter().sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Email sent to ${to} | ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email failed for ${to} | ${subject}`, error.message);
    return { success: false, error: error.message };
  }
};
