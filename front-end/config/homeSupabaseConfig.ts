import { createClient } from "@supabase/supabase-js";

/*
Temporary development config for home tab
*/

export const supabase = createClient(
    'https://pflqaoqpwucsewvkjajc.supabase.co',
    'sb_publishable_NNnruGDoKGCeLjAG4pkecg_j0Q97utA'
)