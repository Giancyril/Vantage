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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const htmlContent = await render(emailElement as any);

  if (resendApiKey && !resendApiKey.startsWith("re_...")) {
    try {
      const resend = new Resend(resendApiKey);
      const result = await resend.emails.send({
        from: "Vantage Intelligence <digest@resend.dev>",
        to: recipientEmail,
        subject: `Your Daily AI Intelligence Briefing — ${digest.date}`,
        html: htmlContent,
      });

      return {
        success: true,
        // result.data is null on error, string id on success
        messageId: result.data?.id ?? undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delivery failed";
      console.warn("Resend email delivery failed, using simulated delivery:", err);
      return { success: false, error: message };
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
