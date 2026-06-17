const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data: alts } = await supabaseAdmin.from("alternatives").select("id, code, name");
  console.log("ALTERNATIVES IN DB:");
  console.log(alts);

  const { data: clusters } = await supabaseAdmin.from("clusters").select("id, name");
  console.log("\nCLUSTERS IN DB:");
  console.log(clusters);
}

check();
