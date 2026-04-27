import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { action, userId, email, password } = await req.json();

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerToken = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await adminClient.auth.getUser(callerToken);
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: roleCheck } = await adminClient
      .from("user_roles").select("role").eq("user_id", caller.id).single();
    if (!roleCheck || roleCheck.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Super admin only" }), { status: 403, headers: corsHeaders });
    }

    let result;
    if (action === "update_password") {
      result = await adminClient.auth.admin.updateUserById(userId, { password });
    } else if (action === "delete_user") {
      // Delete from profiles + user_roles first
      await adminClient.from("profiles").delete().eq("user_id", userId);
      await adminClient.from("user_roles").delete().eq("user_id", userId);
      result = await adminClient.auth.admin.deleteUser(userId);
    } else if (action === "list_users") {
      result = await adminClient.auth.admin.listUsers();
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: corsHeaders
    });
  }
});
