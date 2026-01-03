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
    const { speechContent } = await req.json();
    
    if (!speechContent || !speechContent.trim()) {
      return new Response(JSON.stringify({ error: "Speech content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const prompt = `Analyze the following speech for rhetorical effectiveness. Provide a JSON response with numerical scores (0-100) and detailed descriptions for each of the three rhetorical appeals:

1. **Logos** (Logical Appeal): Evaluate the use of logic, reasoning, evidence, and structured arguments
2. **Pathos** (Emotional Appeal): Evaluate the use of emotion, storytelling, personal connections, and audience engagement
3. **Ethos** (Credibility Appeal): Evaluate the speaker's credibility, authority, trustworthiness, and authenticity

You must respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just the JSON):
{
  "logos": <number 0-100>,
  "pathos": <number 0-100>,
  "ethos": <number 0-100>,
  "logos_description": "<detailed explanation of the logos score>",
  "pathos_description": "<detailed explanation of the pathos score>",
  "ethos_description": "<detailed explanation of the ethos score>"
}

Speech to analyze:
${speechContent}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response from OpenAI
    let analysis;
    try {
      // Extract JSON from the response (in case there's extra text or markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse analysis:", text);
      throw new Error("Failed to parse AI response");
    }

    // Validate the analysis structure
    if (
      typeof analysis.logos !== "number" ||
      typeof analysis.pathos !== "number" ||
      typeof analysis.ethos !== "number"
    ) {
      throw new Error("Invalid analysis format received");
    }

    // Ensure scores are within 0-100 range
    analysis.logos = Math.max(0, Math.min(100, Math.round(analysis.logos)));
    analysis.pathos = Math.max(0, Math.min(100, Math.round(analysis.pathos)));
    analysis.ethos = Math.max(0, Math.min(100, Math.round(analysis.ethos)));

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

