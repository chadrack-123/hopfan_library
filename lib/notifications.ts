import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,   // your Brevo account email
    pass: process.env.BREVO_SMTP_KEY,    // your Brevo SMTP key
  },
  connectionTimeout: 8000,  // 8s to establish connection
  greetingTimeout: 8000,    // 8s to receive server greeting
  socketTimeout: 10000,     // 10s for each socket operation
});

export async function sendEmail(to: string, subject: string, html: string) {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Email send timed out after 15 seconds")), 15000)
  );
  await Promise.race([
    transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "HOPFAN Library <hopfan.library@gmail.com>",
      to,
      subject,
      html,
    }),
    timeout,
  ]);
}

export async function sendWhatsApp(_to: string, _body: string) {
  // WhatsApp notifications are disabled — uncomment and configure when ready
  throw new Error("WhatsApp notifications are not enabled yet.");
  /*
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error(
      "WhatsApp not configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env"
    );
  }

  // E.164 without leading + (Meta API requirement)
  const to164 = _to.replace(/\s/g, "").replace(/^\+/, "");

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to164,
        type: "text",
        text: { body: _body },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `WhatsApp API error: ${res.status}`);
  }
  return res.json();
  */
}

export function buildLoanConfirmationEmail(
  memberName: string,
  memberCode: string,
  bookTitle: string,
  bookAuthor: string,
  borrowedAt: string,
  dueDate: string,
  dueDays: number
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
      <div style="background:#166534;color:white;padding:16px 24px;border-radius:6px 6px 0 0">
        <h1 style="margin:0;font-size:20px">House of Prayer for all Nations</h1>
        <p style="margin:4px 0 0;font-size:14px;opacity:.85">Library System — Loan Confirmation</p>
      </div>
      <div style="padding:24px">
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>Your book loan has been confirmed. Please find the details below.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f0fdf4">
            <td style="padding:10px 12px;font-weight:600;width:40%">Member Name</td>
            <td style="padding:10px 12px">${memberName}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;font-weight:600">Member Code</td>
            <td style="padding:10px 12px">${memberCode}</td>
          </tr>
          <tr style="background:#f0fdf4">
            <td style="padding:10px 12px;font-weight:600">Book Title</td>
            <td style="padding:10px 12px"><strong>${bookTitle}</strong></td>
          </tr>
          <tr>
            <td style="padding:10px 12px;font-weight:600">Author</td>
            <td style="padding:10px 12px">${bookAuthor}</td>
          </tr>
          <tr style="background:#f0fdf4">
            <td style="padding:10px 12px;font-weight:600">Date Borrowed</td>
            <td style="padding:10px 12px">${borrowedAt}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;font-weight:600">Return By</td>
            <td style="padding:10px 12px;color:#166534;font-weight:600">${dueDate}</td>
          </tr>
          <tr style="background:#f0fdf4">
            <td style="padding:10px 12px;font-weight:600">Loan Period</td>
            <td style="padding:10px 12px">${dueDays} days</td>
          </tr>
        </table>
        <p style="background:#fef9c3;border-left:4px solid #ca8a04;padding:10px 14px;border-radius:4px;font-size:13px;margin:16px 0">
          Please return the book by <strong>${dueDate}</strong> to avoid late fines.
          A fine of R${process.env.FINE_PER_DAY ?? "5"} per day will be charged for each day overdue.
        </p>
        <p>God bless you,<br/><strong>HOPFAN Library</strong></p>
      </div>
    </div>
  `;
}

export function buildDueReminderEmail(
  memberName: string,
  bookTitle: string,
  dueDate: string
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
      <div style="background:#1a56db;color:white;padding:16px 24px;border-radius:6px 6px 0 0">
        <h1 style="margin:0;font-size:20px">House of Prayer for all Nations</h1>
        <p style="margin:4px 0 0;font-size:14px;opacity:.85">Library System</p>
      </div>
      <div style="padding:24px">
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>This is a friendly reminder that the book you borrowed is due soon.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:10px 12px;font-weight:600">Book</td>
            <td style="padding:10px 12px">${bookTitle}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;font-weight:600">Due Date</td>
            <td style="padding:10px 12px;color:#dc2626;font-weight:600">${dueDate}</td>
          </tr>
        </table>
        <p>Please return the book on or before the due date to avoid late fees.</p>
        <p>God bless you,<br/><strong>HOPFAN Library</strong></p>
      </div>
    </div>
  `;
}

export function buildOverdueEmail(
  memberName: string,
  bookTitle: string,
  dueDate: string,
  fine: number
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
      <div style="background:#dc2626;color:white;padding:16px 24px;border-radius:6px 6px 0 0">
        <h1 style="margin:0;font-size:20px">House of Prayer for all Nations</h1>
        <p style="margin:4px 0 0;font-size:14px;opacity:.85">Library System — Overdue Notice</p>
      </div>
      <div style="padding:24px">
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>The following book is <strong style="color:#dc2626">overdue</strong>. Please return it as soon as possible.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#fef2f2">
            <td style="padding:10px 12px;font-weight:600">Book</td>
            <td style="padding:10px 12px">${bookTitle}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;font-weight:600">Was Due</td>
            <td style="padding:10px 12px;color:#dc2626;font-weight:600">${dueDate}</td>
          </tr>
          <tr style="background:#fef2f2">
            <td style="padding:10px 12px;font-weight:600">Current Fine</td>
            <td style="padding:10px 12px;color:#dc2626;font-weight:600">R${fine.toFixed(2)}</td>
          </tr>
        </table>
        <p>Please return the book immediately to stop the fine from increasing.</p>
        <p>God bless you,<br/><strong>HOPFAN Library</strong></p>
      </div>
    </div>
  `;
}

export function buildFeedbackRequestEmail(
  memberName: string,
  bookTitle: string,
  feedbackUrl: string
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
      <div style="background:#7c3aed;color:white;padding:16px 24px;border-radius:6px 6px 0 0">
        <h1 style="margin:0;font-size:20px">House of Prayer for all Nations</h1>
        <p style="margin:4px 0 0;font-size:14px;opacity:.85">Library System — Book Feedback</p>
      </div>
      <div style="padding:24px">
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>We hope you enjoyed reading <strong>"${bookTitle}"</strong>. We'd love to hear your thoughts!</p>
        <p>Please take a moment to share your feedback by clicking the button below. It only takes a minute and helps us serve the congregation better.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${feedbackUrl}"
            style="display:inline-block;background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600">
            Share My Feedback
          </a>
        </div>
        <p style="font-size:13px;color:#6b7280">Or copy this link into your browser:<br/>
          <a href="${feedbackUrl}" style="color:#7c3aed;word-break:break-all">${feedbackUrl}</a>
        </p>
        <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px;margin-top:16px">
          This link is personal to you. No login required — just click and share your thoughts.
        </p>
        <p>God bless you,<br/><strong>HOPFAN Library</strong></p>
      </div>
    </div>
  `;
}
