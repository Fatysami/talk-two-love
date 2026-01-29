import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text || !targetLang) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text and targetLang" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Language name mapping for better prompts
    const languageNames: Record<string, string> = {
      'ar': 'Arabic (Moroccan dialect)',
      'ar-MA': 'Arabic (Moroccan dialect)',
      'tr': 'Turkish',
      'tr-TR': 'Turkish',
      'fr': 'French',
      'fr-FR': 'French',
      'en': 'English',
      'en-US': 'English',
      'en-GB': 'English',
    };

    const sourceLanguage = sourceLang ? (languageNames[sourceLang] || sourceLang) : 'the detected language';
    const targetLanguage = languageNames[targetLang] || targetLang;

    const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
    
IMPORTANT RULES:
- Return ONLY the translated text, nothing else
- Keep the same tone and style
- For Moroccan Arabic (Darija), use natural colloquial expressions
- Preserve any names, numbers, or technical terms as appropriate
- Do not add explanations or notes`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error("No translation received from AI");
    }

    return new Response(
      JSON.stringify({ 
        translatedText,
        sourceLang: sourceLang || 'auto',
        targetLang 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
