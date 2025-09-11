import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { device_id, ssid, password } = await req.json();

    // Validate required fields
    if (!device_id || !ssid || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: device_id, ssid, password' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Setting up device: ${device_id}`);

    // Prepare the setup payload
    const setupPayload = {
      device_id,
      ssid,
      password,
      timestamp: new Date().toISOString()
    };

    // Create the topic in the format: setup/{device_id}
    const topic = `setup/${device_id}`;

    console.log(`Sending setup message to topic: ${topic}`);

    // Send HTTP message to the MQTT endpoint
    const response = await fetch('https://429f0396-ad22-4bda-a079-6c8e3bb00733-00-h0o800qsau06.kirk.replit.dev/send-mqtt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Topic': topic
      },
      body: JSON.stringify(setupPayload)
    });

    if (!response.ok) {
      console.error(`HTTP error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to send setup message to device' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await response.text();
    console.log(`Setup message sent successfully. Response: ${result}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Device setup message sent successfully',
        topic,
        device_id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in device-setup function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});