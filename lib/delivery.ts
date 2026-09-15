import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import type { AssembledDigest } from "@/lib/digest";
import DigestEmail from "@/emails/DigestEmail";

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  previewMode?: boolean;
  error?: string;
}

export async function sendDigestEmail(
  digest: AssembledDigest,
  recipientEmail: string,
  userName: string = "Subscriber"
): Promise<DeliveryResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const emailElement = React.createElement(DigestEmail, { digest, userName, appUrl });
  const htmlContent = await render(emailElement as any);

  if (resendApiKey && !resendApiKey.startsWith("re_...")) {
    try {
      const resend = new Resend(resendApiKey);
      const data = await resend.emails.send({
        from: "Distill Intelligence <digest@resend.dev>",
        to: recipientEmail,
        subject: `Your Daily AI Intelligence Briefing — ${digest.date}`,
        html: htmlContent,
      });

      return {
        success: true,
        messageId: data.data?.id,
      };
    } catch (err: any) {
      console.warn("Resend email delivery failed, using simulated delivery:", err);
      return {
        success: false,
        error: err?.message || "Delivery failed",
      };
    }
  }

  // Simulated / dev delivery fallback
  console.log(`[DELIVERY] Simulated email send to ${recipientEmail} with ${digest.totalStories} stories.`);
  return {
    success: true,
    previewMode: true,
    messageId: `simulated-${Date.now()}`,
  };
}
