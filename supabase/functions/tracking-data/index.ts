import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('Received tracking data:', body)

    // Validate required fields
    const { user_id, pill_id, date, taken, to_be_taken, skipped } = body
    
    if (!user_id || !pill_id || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, pill_id, date' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate user exists
    const { data: userCheck, error: userError } = await supabase.auth.admin.getUserById(user_id)
    if (userError || !userCheck.user) {
      console.error('Invalid user_id:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate pill belongs to user
    const { data: pillCheck, error: pillError } = await supabase
      .from('pills')
      .select('id')
      .eq('id', pill_id)
      .eq('user_id', user_id)
      .single()

    if (pillError || !pillCheck) {
      console.error('Invalid pill_id for user:', pillError)
      return new Response(
        JSON.stringify({ error: 'Invalid pill_id or pill does not belong to user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare tracking data
    const trackingData = {
      id: pill_id,
      user_id: user_id,
      date: date,
      taken: taken || 0,
      to_be_taken: to_be_taken || 0,
      skipped: skipped || 0,
      first_intake: body.first_intake || null,
      second_intake: body.second_intake || null,
      third_intake: body.third_intake || null,
    }

    // Upsert tracking data
    const { data, error } = await supabase
      .from('tracking')
      .upsert(trackingData, {
        onConflict: 'id,user_id,date',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save tracking data', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Successfully saved tracking data:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Tracking data saved successfully',
        data: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})