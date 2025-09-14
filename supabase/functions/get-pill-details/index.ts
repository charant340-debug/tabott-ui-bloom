import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { formatInTimeZone, toZonedTime } from 'https://esm.sh/date-fns-tz@3.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pill ID from URL params or request body
    const url = new URL(req.url);
    const pillId = url.searchParams.get('pillId');
    
    if (!pillId) {
      return new Response(
        JSON.stringify({ error: 'Pill ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching details for pill: ${pillId}`);

    // Get pill information
    const { data: pillData, error: pillError } = await supabase
      .from('pills')
      .select('*')
      .eq('id', pillId)
      .single();

    if (pillError) {
      console.error('Error fetching pill:', pillError);
      return new Response(
        JSON.stringify({ error: 'Pill not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get latest tracking data for this pill
    const { data: trackingData, error: trackingError } = await supabase
      .from('tracking')
      .select('*')
      .eq('id', pillId)
      .order('date', { ascending: false })
      .limit(1);

    if (trackingError) {
      console.error('Error fetching tracking data:', trackingError);
    }

    // Calculate next intake time in IST
    const calculateNextIntake = () => {
      const nowIST = toZonedTime(new Date(), 'Asia/Kolkata');
      const currentTimeIST = formatInTimeZone(nowIST, 'Asia/Kolkata', 'HH:mm');
      
      const doses = [
        pillData.dose1_time,
        pillData.dose2_time, 
        pillData.dose3_time
      ].filter(Boolean).map(time => time.substring(0, 5)).sort();

      for (const dose of doses) {
        if (dose && dose > currentTimeIST) {
          return `Today ${dose} IST`;
        }
      }
      
      // If no more doses today, return first dose tomorrow
      return doses.length > 0 ? `Tomorrow ${doses[0]} IST` : 'No scheduled doses';
    };

    // Get last taken time in IST
    const getLastTaken = () => {
      if (!trackingData || trackingData.length === 0) {
        return null;
      }

      const record = trackingData[0];
      
      // Check third_intake first, then second_intake, then first_intake
      if (record.third_intake) {
        return formatInTimeZone(new Date(record.third_intake), 'Asia/Kolkata', 'MMM dd, yyyy HH:mm zzz');
      } else if (record.second_intake) {
        return formatInTimeZone(new Date(record.second_intake), 'Asia/Kolkata', 'MMM dd, yyyy HH:mm zzz');
      } else if (record.first_intake) {
        return formatInTimeZone(new Date(record.first_intake), 'Asia/Kolkata', 'MMM dd, yyyy HH:mm zzz');
      }
      
      return null;
    };

    const response = {
      pillId: pillData.id,
      pillName: pillData.name,
      pillCount: pillData.pills_count || 0,
      nextIntake: calculateNextIntake(),
      lastTaken: getLastTaken(),
      isLowStock: (pillData.pills_count || 0) <= 5,
      doseTimes: {
        dose1: pillData.dose1_time ? pillData.dose1_time.substring(0, 5) : null,
        dose2: pillData.dose2_time ? pillData.dose2_time.substring(0, 5) : null,
        dose3: pillData.dose3_time ? pillData.dose3_time.substring(0, 5) : null
      },
      intervalDays: pillData.interval_days,
      snoozeDuration: pillData.snooze_duration
    };

    console.log('Pill details response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-pill-details function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});