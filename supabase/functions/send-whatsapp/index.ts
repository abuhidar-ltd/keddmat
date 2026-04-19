import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ULTRAMSG_INSTANCE_ID = Deno.env.get('ULTRAMSG_INSTANCE_ID');
    const ULTRAMSG_TOKEN = Deno.env.get('ULTRAMSG_TOKEN');

    if (!ULTRAMSG_INSTANCE_ID) {
      throw new Error('ULTRAMSG_INSTANCE_ID is not configured');
    }
    if (!ULTRAMSG_TOKEN) {
      throw new Error('ULTRAMSG_TOKEN is not configured');
    }

    const { to, message, link } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = to.replace(/[^0-9]/g, '');

    // Send the text message
    const chatUrl = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;
    const chatForm = new URLSearchParams();
    chatForm.append('token', ULTRAMSG_TOKEN);
    chatForm.append('to', cleanPhone);
    chatForm.append('body', message);
    chatForm.append('priority', '10');

    const chatResponse = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: chatForm.toString(),
    });
    const chatResult = await chatResponse.json();
    console.log('Chat message result:', chatResult);

    // If a link is provided, send it separately as a link message with preview
    let linkResult = null;
    if (link) {
      try {
        const linkUrl = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/link`;
        const linkForm = new URLSearchParams();
        linkForm.append('token', ULTRAMSG_TOKEN);
        linkForm.append('to', cleanPhone);
        linkForm.append('link', link);
        linkForm.append('title', 'خدمات - منصة خدمات منزلية وصيانة عامة');
        linkForm.append('description', 'كهربائي، سباك، نجار، حداد، تنظيف، ديكور، نقل أثاث، ميكانيكي وأكثر | أطلب خدمة طارئة الآن!');
        linkForm.append('image', 'https://simple-begin-bot.lovable.app/logo-khadamat.png');
        linkForm.append('priority', '10');

        console.log('Sending link message to:', cleanPhone, 'link:', link);
        console.log('Link request URL:', linkUrl);
        console.log('Link form data:', linkForm.toString());

        const linkResponse = await fetch(linkUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: linkForm.toString(),
        });
        
        const linkResponseText = await linkResponse.text();
        console.log('Link response status:', linkResponse.status);
        console.log('Link response body:', linkResponseText);
        
        try {
          linkResult = JSON.parse(linkResponseText);
        } catch {
          linkResult = { raw: linkResponseText };
        }
      } catch (linkError) {
        console.error('Link message error:', linkError);
        linkResult = { error: linkError instanceof Error ? linkError.message : 'Unknown link error' };
      }
    }

    return new Response(JSON.stringify({ success: true, result: chatResult, linkResult }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
