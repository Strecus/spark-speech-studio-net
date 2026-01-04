import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, topic, keyMessage, audienceDemographics, speakerBackground, durationMinutes, tone } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const prompt = `You are an expert TED talk speechwriter. Create compelling, authentic speeches that inspire audiences. Structure with a strong hook, clear narrative arc, and memorable conclusion. Use storytelling, rhetorical devices, and emotional connection. Match the requested tone and duration.

Write a ${durationMinutes}-minute TED-style speech with the following details:

Title: ${title}
Topic: ${topic}
${keyMessage ? `Key Message: ${keyMessage}` : ""}
Target Audience: ${audienceDemographics}
Speaker Background: ${speakerBackground}
Tone: ${tone}

Create a complete speech draft with:
1. A captivating opening hook
2. Personal stories or examples
3. Clear main points with transitions
4. A powerful, memorable conclusion

IMPORTANT FORMATTING REQUIREMENTS:
- Do NOT use any text styling (no markdown, no bold, no italics, no asterisks, no underscores)
- Use blank lines (double line breaks) to separate sections
- Write in plain text only - the speech will be copied and pasted, so avoid any formatting characters
- Write naturally as if the speaker is delivering it live
- Aim for approximately ${durationMinutes * 130} words`;

    // Use gpt-3.5-turbo for faster generation (about 2-3x faster than gpt-4o-mini)
    // Calculate approximate word count target
    const targetWords = durationMinutes * 130;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert TED talk speechwriter. Create compelling, authentic speeches that inspire audiences. Structure with a strong hook, clear narrative arc, and memorable conclusion. Use storytelling, rhetorical devices, and emotional connection. Match the requested tone and duration.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: Math.min(targetWords * 1.5, 2000), // Limit tokens for faster generation
        temperature: 0.8, // Slightly lower for more consistent, faster output
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
