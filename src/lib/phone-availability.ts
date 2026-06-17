import type { SupabaseClient } from "@supabase/supabase-js";

export async function isPhoneNumberTakenOnAccount(
  supabase: SupabaseClient,
  normalizedPhone: string
): Promise<{ taken: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("is_phone_number_taken", {
    phone: normalizedPhone,
  });

  if (error) {
    return { taken: false, error: error.message };
  }

  return { taken: data === true };
}
