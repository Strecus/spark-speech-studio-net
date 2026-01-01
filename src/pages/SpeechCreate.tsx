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
import { Mic2, ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
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
  { value: 15, label: "15 minutes (Standard TED)" },
  { value: 18, label: "18 minutes (Classic TED)" },
];

export default function SpeechCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    if (!user) return;
    
    setGenerating(true);

    try {
      // Call the AI edge function to generate speech
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            title: formData.title,
            topic: formData.topic,
            keyMessage: formData.keyMessage,
            audienceDemographics: formData.audienceDemographics,
            speakerBackground: formData.speakerBackground,
            durationMinutes: formData.durationMinutes,
            tone: formData.tone,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate speech");
      }

      const { content } = await response.json();

      // Save to database
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

      if (error) throw error;

      toast({
        title: "Speech generated!",
        description: "Your AI-powered draft is ready for review.",
      });

      navigate(`/speech/${data.id}`);
    } catch (error: any) {
      console.error("Error generating speech:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Please try again later.",
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
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">TED Talk Studio</span>
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
