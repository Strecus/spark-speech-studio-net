import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  { id: 1, title: "Topic & Message", description: "What's your talk about?" },
  { id: 2, title: "Your Audience", description: "Who will be listening?" },
  { id: 3, title: "Your Story", description: "What makes you the right speaker?" },
  { id: 4, title: "Duration & Tone", description: "How should it feel?" },
];

const TONES = [
  { value: "inspiring", label: "Inspiring & Uplifting" },
  { value: "educational", label: "Educational & Informative" },
  { value: "storytelling", label: "Personal Storytelling" },
  { value: "persuasive", label: "Persuasive & Call-to-Action" },
  { value: "humorous", label: "Humorous & Engaging" },
];

const DURATIONS = [
  { value: 5, label: "5 minutes (Lightning Talk)" },
  { value: 10, label: "10 minutes (Short Talk)" },
  { value: 15, label: "15 minutes (Standard Presentation)" },
  { value: 18, label: "18 minutes (Extended Presentation)" },
];

export default function SpeechCreate() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    keyMessage: "",
    audienceDemographics: "",
    speakerBackground: "",
    durationMinutes: 15,
    tone: "inspiring",
  });

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.topic.trim();
      case 2:
        return formData.audienceDemographics.trim();
      case 3:
        return formData.speakerBackground.trim();
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate a speech.",
        variant: "destructive",
      });
      return;
    }

    // Validate environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      toast({
        title: "Configuration error",
        description: "Missing Supabase configuration. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const requestBody = {
        title: formData.title,
        topic: formData.topic,
        keyMessage: formData.keyMessage,
        audienceDemographics: formData.audienceDemographics,
        speakerBackground: formData.speakerBackground,
        durationMinutes: formData.durationMinutes,
        tone: formData.tone,
      };

      // Validate required fields
      if (!formData.title || !formData.topic) {
        throw new Error("Title and topic are required");
      }

      // Use the same approach as analyze-speech which works
      // Try anon key first since session token is being rejected
      const functionUrl = `${supabaseUrl}/functions/v1/generate-speech`;
      // Use anon key instead of session token - session token is causing "Invalid JWT"
      const token = supabaseKey;
      
      console.log("Calling generate-speech function (using anon key):", {
        url: functionUrl,
        hasSession: !!session,
        usingToken: "anon key",
        body: requestBody,
      });

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status, response.statusText);

      // Get response text first to handle both JSON and text errors
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        let errorMessage = "Failed to generate speech";
        if (response.status === 401) {
          const errorMsg = errorData.message || errorData.error || "Invalid JWT";
          errorMessage = `Authentication failed (401): ${errorMsg}. The generate-speech function may not be deployed to Supabase or requires different permissions. Please check your Supabase Edge Functions dashboard and ensure the function is deployed.`;
        } else if (response.status === 404) {
          errorMessage = "Function not found (404). Please ensure the generate-speech Edge Function is deployed to Supabase using: supabase functions deploy generate-speech";
        } else if (response.status === 500) {
          errorMessage = errorData.error || errorData.message || "Server error occurred while generating speech.";
        } else {
          errorMessage = errorData.error || errorData.message || `Request failed with status ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      // Parse successful response
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Invalid response format from server");
      }

      if (!responseData.content) {
        console.error("Response missing content:", responseData);
        throw new Error("Response did not contain speech content");
      }

      const { content } = responseData;
      
      console.log("Speech content received, length:", content?.length || 0);
      
      // Save to database
      console.log("Saving speech to database...");
      const { data, error } = await supabase
        .from("speeches")
        .insert({
          user_id: user.id,
          title: formData.title,
          topic: formData.topic,
          key_message: formData.keyMessage,
          audience_demographics: formData.audienceDemographics,
          speaker_background: formData.speakerBackground,
          duration_minutes: formData.durationMinutes,
          tone: formData.tone,
          content: content,
          status: "draft",
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw new Error(`Failed to save speech: ${error.message || "Database error"}`);
      }

      if (!data) {
        throw new Error("Speech was created but no data was returned");
      }

      console.log("Speech saved successfully:", data.id);

      toast({
        title: "Speech generated!",
        description: "Your AI-powered draft is ready. You can edit it from the dashboard.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating speech:", {
        error,
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      let errorMessage = "Please try again later.";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      }

      toast({
        title: "Creation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img 
                src="/ReadySpeakerOne-logo.webp" 
                alt="Ready Speaker One" 
                className="h-10 w-auto"
              />
              <span className="font-display font-bold text-xl">Ready Speaker One Talk Studio</span>
            </Link>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 rounded ${
                      step > s.id ? "bg-primary" : "bg-muted"
                    }`}
                    style={{ width: "3rem" }}
                  />
                )}
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-display font-bold">{STEPS[step - 1].title}</h2>
          <p className="text-muted-foreground">{STEPS[step - 1].description}</p>
        </div>

        {/* Form Steps */}
        <Card className="shadow-card animate-fade-in">
          <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Speech Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., The Power of Vulnerability"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic / Theme</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Personal growth, technology, education..."
                    value={formData.topic}
                    onChange={(e) => updateField("topic", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyMessage">Key Message (Optional)</Label>
                  <Textarea
                    id="keyMessage"
                    placeholder="What's the one idea you want your audience to remember?"
                    value={formData.keyMessage}
                    onChange={(e) => updateField("keyMessage", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audience">Describe Your Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="Who will be listening? (e.g., professionals in tech, college students, general public, entrepreneurs...)"
                    value={formData.audienceDemographics}
                    onChange={(e) => updateField("audienceDemographics", e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include details like age range, profession, interests, and what they might already know about your topic.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="background">Your Background & Stories</Label>
                  <Textarea
                    id="background"
                    placeholder="What personal experiences, expertise, or stories make you the right person to give this talk?"
                    value={formData.speakerBackground}
                    onChange={(e) => updateField("speakerBackground", e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Share your credentials, personal journey, or unique perspectives that add authenticity to your message.
                  </p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Target Duration</Label>
                  <Select
                    value={formData.durationMinutes.toString()}
                    onValueChange={(v) => updateField("durationMinutes", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value.toString()}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tone & Style</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(v) => updateField("tone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {step < 4 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Speech
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
