import * as nodemailer from "nodemailer";
import { defineString } from "firebase-functions/params";

const GMAIL_USER = defineString("GMAIL_USER", { default: "" });
const GMAIL_APP_PASSWORD = defineString("GMAIL_APP_PASSWORD", { default: "" });

interface AlertCardInfo {
  id: string;
  title: string;
  siteName: string;
  keyword: string;
  snippet: string;
  url: string;
}

export async function sendAlertEmail(
  toEmails: string[],
  newCards: AlertCardInfo[]
): Promise<boolean> {
  const gmailUser = GMAIL_USER.value();
  const gmailPassword = GMAIL_APP_PASSWORD.value();

  if (!gmailUser || !gmailPassword) {
    console.warn("Gmail credentials not configured. Skipping email.");
    return false;
  }

  if (toEmails.length === 0 || newCards.length === 0) {
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    const cardListHtml = newCards
      .map(
        (card) => `
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #FF8C00;">
        <div style="margin-bottom: 8px;">
          <span style="background: #8B4513; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${card.siteName}</span>
          <span style="background: #FFF9E6; color: #FF8C00; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 4px;">${card.keyword}</span>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #333;">${card.title}</h3>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #666; line-height: 1.5;">${card.snippet}</p>
        <a href="https://salt-bbang.com/admin?card=${card.id}" style="display: inline-block; background: #FF8C00; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold;">카드 보기</a>
      </div>`
      )
      .join("");

    const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: #8B4513; padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 18px;">솔트빵 키워드 알림</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">새로운 게시물이 ${newCards.length}건 감지되었습니다</p>
      </div>
      <div style="background: white; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #eee; border-top: none;">
        ${cardListHtml}
        <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee;">
          <a href="https://salt-bbang.com/admin" style="color: #8B4513; font-size: 13px; text-decoration: none;">관리자 페이지에서 모두 보기 →</a>
        </div>
      </div>
    </div>`;

    await transporter.sendMail({
      from: `"솔트빵 알림" <${gmailUser}>`,
      to: toEmails.join(", "),
      subject: `[솔트빵] 새로운 키워드 알림 ${newCards.length}건`,
      html,
    });

    return true;
  } catch (error) {
    console.error("Error sending alert email:", error);
    return false;
  }
}
