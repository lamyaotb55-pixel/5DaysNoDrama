import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getPlan, isBuiltinId, type BuiltinPlanId, type Day, type Exercise } from "./program";
import { communityContent, type CommunityContent, type MyPlan } from "./store";

/* ---------- Plans by You: published plans, review, follows ---------- */

export type PublicPlan = {
  id: string;
  name: string;
  description: string;
  base: BuiltinPlanId;
  author: string;
  authorId: string;
  version: number;
  followers: number;
  status: string;
  approvedAt: string | null;
  content: CommunityContent | null;
};

export type Submission = {
  id: string;
  planId: string;
  name: string;
  description: string;
  base: BuiltinPlanId;
  content: CommunityContent | null;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  createdAt: string;
};

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const safeUrl = (v: unknown) =>
  typeof v === "string" && /^(https:\/\/|\/media\/)[^\s"'<>]+$/i.test(v) ? v : undefined;

function cleanExercise(v: unknown): Exercise | null {
  if (!v || typeof v !== "object") return null;
  const e = v as Record<string, unknown>;
  const name = text(e["name"], 80).trim();
  if (!name) return null;
  return {
    name,
    sets: num(e["sets"], 1, 10, 3),
    reps: text(e["reps"], 20) || "10",
    perSide: e["perSide"] === true || undefined,
    media: safeUrl(e["media"]),
  };
}

function cleanDays(v: unknown): Day[] {
  const list = Array.isArray(v) ? v.slice(0, 5) : [];
  return Array.from({ length: 5 }, (_, i) => {
    const d = (list[i] ?? {}) as Record<string, unknown>;
    const exercises = (Array.isArray(d["exercises"]) ? d["exercises"] : [])
      .slice(0, 20)
      .map(cleanExercise)
      .filter((x): x is Exercise => x !== null);
    return {
      day: i + 1,
      title: text(d["title"], 40) || `Day ${i + 1}`,
      focus: text(d["focus"], 60),
      exercises,
    };
  });
}

/** Plans written by other people are data from the network; never trust their shape. */
export function cleanContent(v: unknown): CommunityContent | null {
  if (!v || typeof v !== "object") return null;
  const c = v as Record<string, unknown>;
  return {
    day5Alt: c["day5Alt"] === true,
    days: cleanDays(c["days"]),
    phase2: cleanDays(c["phase2"]),
  };
}

const toBase = (v: unknown): BuiltinPlanId =>
  isBuiltinId(v as string) ? (v as BuiltinPlanId) : "tone-up";

type PlanRow = {
  id: string;
  name: string;
  description: string;
  base: string;
  author_name: string;
  author_id: string;
  version: number;
  followers: number;
  status: string;
  approved_at: string | null;
  content?: Json | null;
};

function toPublic(r: PlanRow): PublicPlan {
  return {
    id: r.id,
    name: text(r.name, 60),
    description: text(r.description, 500),
    base: toBase(r.base),
    author: text(r.author_name, 60) || "Anonymous",
    authorId: r.author_id,
    version: r.version,
    followers: r.followers,
    status: r.status,
    approvedAt: r.approved_at,
    content: r.content === undefined ? null : cleanContent(r.content),
  };
}

const LIST_COLUMNS =
  "id,name,description,base,author_name,author_id,version,followers,status,approved_at";

export async function listPublicPlans(sort: "followers" | "newest"): Promise<PublicPlan[]> {
  const { data, error } = await supabase
    .from("community_plans")
    .select(LIST_COLUMNS)
    .eq("status", "approved")
    .order(sort === "followers" ? "followers" : "approved_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(toPublic);
}

/** One plan with its content. Authors and the admin can also see plans that aren't public. */
export async function getCommunityPlan(id: string): Promise<PublicPlan | null> {
  const { data, error } = await supabase
    .from("community_plans")
    .select(`${LIST_COLUMNS},content`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toPublic(data) : null;
}

export async function getCommunityPlans(ids: string[]): Promise<PublicPlan[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("community_plans")
    .select(`${LIST_COLUMNS},content`)
    .in("id", ids);
  if (error) throw error;
  return (data ?? []).map(toPublic);
}

/** Latest submission per plan for the signed-in author. */
export async function myLatestSubmissions(planIds: string[]): Promise<Record<string, Submission>> {
  if (!planIds.length) return {};
  const { data, error } = await supabase
    .from("plan_submissions")
    .select("id,plan_id,name,description,base,status,note,created_at")
    .in("plan_id", planIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const out: Record<string, Submission> = {};
  for (const r of data ?? []) {
    if (out[r.plan_id]) continue;
    out[r.plan_id] = {
      id: r.id,
      planId: r.plan_id,
      name: r.name,
      description: r.description,
      base: toBase(r.base),
      content: null,
      status: r.status as Submission["status"],
      note: r.note,
      createdAt: r.created_at,
    };
  }
  return out;
}

export async function submitPlan(plan: MyPlan): Promise<string> {
  const { data, error } = await supabase.rpc("submit_plan", {
    p_plan_id: plan.communityId ?? null,
    p_name: plan.name,
    p_description: plan.description,
    p_base: plan.base,
    p_content: communityContent(plan) as unknown as Json,
  });
  if (error) throw error;
  return data;
}

export async function unpublishPlan(communityId: string) {
  const { error } = await supabase.rpc("set_plan_status", {
    p_plan_id: communityId,
    p_status: "unpublished",
  });
  if (error) throw error;
}

export async function setFollow(communityId: string, follow: boolean): Promise<number> {
  const { data, error } = await supabase.rpc("follow_plan", {
    p_plan_id: communityId,
    p_follow: follow,
  });
  if (error) throw error;
  return data;
}

/* ---------- Admin ---------- */

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

export async function pendingSubmissions(): Promise<
  (Submission & { author: string; liveVersion: number })[]
> {
  const { data, error } = await supabase
    .from("plan_submissions")
    .select("id,plan_id,name,description,base,content,status,note,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const plans = await getCommunityPlans([...new Set(rows.map((r) => r.plan_id))]);
  const authors = Object.fromEntries(plans.map((p) => [p.id, p]));
  return rows.map((r) => ({
    id: r.id,
    planId: r.plan_id,
    name: text(r.name, 60),
    description: text(r.description, 500),
    base: toBase(r.base),
    content: cleanContent(r.content),
    status: "pending" as const,
    note: r.note,
    createdAt: r.created_at,
    author: authors[r.plan_id]?.author ?? "Unknown",
    liveVersion: authors[r.plan_id]?.version ?? 0,
  }));
}

export async function reviewSubmission(id: string, approve: boolean, note: string) {
  const { error } = await supabase.rpc("review_submission", {
    p_submission_id: id,
    p_approve: approve,
    p_note: note,
  });
  if (error) throw error;
}

/** Plans the admin can manage: everything that has been approved at least once. */
export async function adminPlans(): Promise<PublicPlan[]> {
  const { data, error } = await supabase
    .from("community_plans")
    .select(LIST_COLUMNS)
    .in("status", ["approved", "hidden"])
    .order("approved_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(toPublic);
}

export async function setHidden(communityId: string, hidden: boolean) {
  const { error } = await supabase.rpc("set_plan_status", {
    p_plan_id: communityId,
    p_status: hidden ? "hidden" : "approved",
  });
  if (error) throw error;
}

/** Turn database errors into a sentence a person can act on. */
export function errorText(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? "";
  if (/JWT|not authenticated|permission denied/i.test(msg)) return "Please sign in and try again.";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "You're offline. Check your connection.";
  return msg || "Something went wrong. Please try again.";
}

/* ---------- Display helpers ---------- */

export const goalName = (base: string) => getPlan(base)?.name ?? "Tone Up";

/** Where a user plan stands in Plans by You, from the author's point of view. */
export function shareStatus(
  plan: MyPlan,
  live: PublicPlan | undefined,
  sub: Submission | undefined,
): { label: string; tone: "muted" | "wait" | "live" | "warn"; note?: string | undefined } | null {
  if (!plan.communityId) return null;
  if (sub?.status === "pending")
    return {
      label: live?.status === "approved" ? "Live · update in review" : "Waiting for review",
      tone: "wait",
    };
  if (live?.status === "approved") return { label: "Live on Plans by You", tone: "live" };
  if (live?.status === "hidden") return { label: "Hidden by the team", tone: "warn" };
  if (live?.status === "unpublished") return { label: "Unpublished", tone: "muted" };
  if (sub?.status === "rejected")
    return { label: "Not approved", tone: "warn", note: sub.note ?? undefined };
  return { label: "Waiting for review", tone: "wait" };
}
