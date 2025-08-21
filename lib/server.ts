// lib/server.ts
import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createServerActionClient,
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// Use Next's cookies helper directly; do not await. These factories are synchronous.
export const supabaseServer = () =>
  createServerComponentClient<Database>({ cookies });

export const supabaseAction = () =>
  createServerActionClient<Database>({ cookies });
