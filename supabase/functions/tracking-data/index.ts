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
    const { user_id, date, pills } = body
    
    if (!user_id || !date || !pills) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, date, pills' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Convert date format from DD-M-YYYY to YYYY-MM-DD
    let formattedDate = date;
    if (typeof date === 'string' && date.includes('-')) {
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts;
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    console.log('Original date:', date, 'Formatted date:', formattedDate);

    if (typeof pills !== 'object' || Object.keys(pills).length === 0) {
      return new Response(
        JSON.stringify({ error: 'Pills must be an object with at least one pill' }),
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

    // Get all pill IDs to validate
    const pillIds = Object.keys(pills)
    
    // Validate all pills belong to user
    const { data: pillsCheck, error: pillsError } = await supabase
      .from('pills')
      .select('id')
      .eq('user_id', user_id)
      .in('id', pillIds)

    if (pillsError) {
      console.error('Error checking pills:', pillsError)
      return new Response(
        JSON.stringify({ error: 'Error validating pills' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const validPillIds = pillsCheck?.map(p => p.id) || []
    const invalidPillIds = pillIds.filter(id => !validPillIds.includes(id))

    if (invalidPillIds.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid pill IDs or pills do not belong to user: ${invalidPillIds.join(', ')}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check which tracking records already exist for this date
    const { data: existingRecords, error: existingError } = await supabase
      .from('tracking')
      .select('id')
      .eq('user_id', user_id)
      .eq('date', formattedDate)
      .in('id', pillIds)

    if (existingError) {
      console.error('Error checking existing records:', existingError)
      return new Response(
        JSON.stringify({ error: 'Error checking existing tracking records' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const existingPillIds = existingRecords?.map(r => r.id) || []
    const newPillIds = pillIds.filter(id => !existingPillIds.includes(id))

    if (newPillIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All tracking records already exist for this date',
          processed_pills: 0,
          skipped_pills: pillIds.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare tracking data only for new pills
    const trackingDataArray = newPillIds.map(pillId => {
      const pillData = pills[pillId]
      return {
        id: pillId,
        user_id: user_id,
        date: formattedDate,
        taken: pillData.taken || 0,
        to_be_taken: pillData.to_be_taken || 0,
        skipped: pillData.skipped || 0,
        first_intake: pillData.first_intake || null,
        second_intake: pillData.second_intake || null,
        third_intake: pillData.third_intake || null,
      }
    })

    // Insert only new tracking data
    const { data, error } = await supabase
      .from('tracking')
      .insert(trackingDataArray)
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

    console.log('Successfully saved tracking data for all pills:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Tracking data saved successfully for ${newPillIds.length} pills`,
        data: data,
        processed_pills: newPillIds.length,
        skipped_pills: existingPillIds.length
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