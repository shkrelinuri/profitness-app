import { createClient } from "@supabase/supabase-js";
import {
  MaksisoftIntegrationError,
  MaksisoftIntegrationUnavailableError,
  type MaksisoftMembershipSnapshot,
  type MaksisoftMembershipWriter,
} from "@/lib/integrations/maksisoft/membership-service";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export const persistMaksisoftSnapshot: MaksisoftMembershipWriter = async (
  externalMemberId: string,
  snapshot: MaksisoftMembershipSnapshot,
  snapshotFingerprint: string,
) => {
  const config = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceRoleKey) {
    throw new MaksisoftIntegrationUnavailableError();
  }

  const supabase = createClient(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("sync_maksisoft_membership", {
    p_external_member_id: externalMemberId,
    p_status: snapshot.status,
    p_starts_at: new Date(snapshot.startsAt).toISOString(),
    p_expires_at: snapshot.expiresAt ? new Date(snapshot.expiresAt).toISOString() : null,
    p_privileges: [...new Set(snapshot.privileges)],
    p_snapshot_fingerprint: snapshotFingerprint,
  });
  if (error || !data) {
    if (error) console.error("Maksisoft membership persistence failed.", error);
    throw new MaksisoftIntegrationError("The trusted membership snapshot could not be saved.", true);
  }
};
