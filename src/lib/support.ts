import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const MESSAGE_KINDS = ["idea", "problem", "other"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];
export const MESSAGE_MIN = 5;
export const MESSAGE_MAX = 2000;

export type SupportMessage = Database["public"]["Tables"]["support_messages"]["Row"];

const KIND_LABEL: Record<MessageKind, string> = {
  idea: "💡 Suggestion",
  problem: "🐞 Problem",
  other: "💬 Other",
};

/**
 * Saves the message as the signed-in user, then emails it to the team when
 * RESEND_API_KEY is set. The message is kept even if the email fails.
 */
export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((input: { kind: string; body: string; lang: string }) => {
    const kind = MESSAGE_KINDS.find((k) => k === input?.kind);
    const body = String(input?.body ?? "").trim();
    if (!kind) throw new Error("Pick a message type.");
    if (body.length < MESSAGE_MIN || body.length > MESSAGE_MAX) throw new Error("Message length");
    return { kind, body, lang: input.lang === "ar" ? "ar" : "en" };
  })
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    const auth = getRequest()?.headers.get("authorization") ?? "";
    if (!url || !key) throw new Error("Something went wrong. Please try again.");
    if (!auth.startsWith("Bearer ")) throw new Error("not authenticated");

    const db = createClient<Database>(url, key, {
      global: { headers: { Authorization: auth } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: saved, error } = await db.rpc("send_support_message", {
      p_kind: data.kind,
      p_body: data.body,
      p_lang: data.lang,
    });
    if (error) throw new Error(error.message);
    const from = saved as { id: string; email: string; name: string };

    await emailTeam(data.kind, data.body, data.lang, from).catch((e) =>
      console.error("[support] email alert failed", e),
    );
    return { ok: true };
  });

async function emailTeam(
  kind: MessageKind,
  body: string,
  lang: string,
  from: { email: string; name: string },
) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return;
  const to = process.env["SUPPORT_EMAIL"] || "5daysnodrama@gmail.com";
  const text = [
    `${KIND_LABEL[kind]} from ${from.name} <${from.email}>`,
    `Language: ${lang === "ar" ? "Arabic" : "English"}`,
    "",
    body,
    "",
    "—",
    "Reply to this email to answer them directly.",
    "All messages: https://5daysnodrama.app/admin/messages",
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env["SUPPORT_FROM"] || "5 Days No Drama <onboarding@resend.dev>",
      to: [to],
      reply_to: from.email,
      subject: `${KIND_LABEL[kind]} — ${from.name}`,
      text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/* ---------- Admin ---------- */

export async function adminMessages(): Promise<SupportMessage[]> {
  const { data, error } = await supabase.rpc("admin_messages");
  if (error) throw error;
  return data ?? [];
}

export async function setMessageDone(id: string, done: boolean) {
  const { error } = await supabase.rpc("set_message_done", { p_id: id, p_done: done });
  if (error) throw error;
}
