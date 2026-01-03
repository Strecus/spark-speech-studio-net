import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mic2, ArrowLeft, ArrowRight, Upload, FileText, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, title: "Topic & Message", description: "What's your talk about?", fields: ["title", "topic", "keyMessage"] },
  { id: 2, title: "Your Audience", description: "Who will be listening?", fields: ["audienceDemographics"] },
  { id: 3, title: "Your Story", description: "What makes you the right speaker?", fields: ["speakerBackground"] },
  { id: 4, title: "Duration & Tone", description: "How should it feel?", fields: ["durationMinutes", "tone"] },
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

export default function SpeechUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedContent, setUploadedContent] = useState("");
  const [step, setStep] = useState<"upload" | "select" | number>("upload");
  const [selectedSteps, setSelectedSteps] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedContent(content);
      toast({
        title: "Speech uploaded",
        description: "Now select which fields you'd like to edit.",
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Could not read the file. Please try again.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handlePasteContent = () => {
    // Allow user to paste content directly
    navigator.clipboard.readText().then((text) => {
      setUploadedContent(text);
      toast({
        title: "Content pasted",
        description: "Now select which fields you'd like to edit.",
      });
    }).catch(() => {
      toast({
        title: "Could not paste",
        description: "Please copy the content first, then try again.",
        variant: "destructive",
      });
    });
  };

  const handleStepToggle = (stepId: number) => {
    setSelectedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const handleContinueFromSelect = () => {
    if (selectedSteps.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one section to edit.",
        variant: "destructive",
      });
      return;
    }
    // Sort selected steps and go to first one
    const sortedSteps = [...selectedSteps].sort((a, b) => a - b);
    setStep(sortedSteps[0]);
  };

  const canProceed = () => {
    const currentStepNum = typeof step === "number" ? step : 0;
    switch (currentStepNum) {
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

  const getNextStep = () => {
    if (typeof step !== "number") return null;
    const sortedSteps = [...selectedSteps].sort((a, b) => a - b);
    const currentIndex = sortedSteps.indexOf(step);
    if (currentIndex < sortedSteps.length - 1) {
      return sortedSteps[currentIndex + 1];
    }
    return null;
  };

  const handleSave = async () => {
    if (!user || !uploadedContent.trim()) {
      toast({
        title: "Missing content",
        description: "Please upload speech content first.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("speeches")
        .insert({
          user_id: user.id,
          title: formData.title || "Untitled Speech",
          topic: formData.topic || "General",
          key_message: formData.keyMessage || null,
          audience_demographics: formData.audienceDemographics || null,
          speaker_background: formData.speakerBackground || null,
          duration_minutes: formData.durationMinutes,
          tone: formData.tone,
          content: uploadedContent,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Speech saved!",
        description: "Your uploaded speech has been saved.",
      });

      navigate(`/speech/${data.id}`);
    } catch (error: any) {
      console.error("Error saving speech:", error);
      toast({
        title: "Save failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
        {/* Upload Step */}
        {step === "upload" && (
          <>
            <div className="mb-8 animate-fade-in">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Upload Your Speech
              </h1>
              <p className="text-muted-foreground">
                Upload a text file or paste your speech content, then customize the details.
              </p>
            </div>

            <Card className="shadow-card animate-fade-in">
              <CardHeader>
                <CardTitle>Upload Speech Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload Text File</Label>
                  <div className="flex items-center gap-4">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".txt,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      or paste content below
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="speech-content">Speech Content</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePasteContent}
                      className="h-auto py-1"
                    >
                      Paste from Clipboard
                    </Button>
                  </div>
                  <Textarea
                    id="speech-content"
                    value={uploadedContent}
                    onChange={(e) => setUploadedContent(e.target.value)}
                    placeholder="Paste your speech content here or upload a file..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (!uploadedContent.trim()) {
                      toast({
                        title: "No content",
                        description: "Please upload or paste your speech content first.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setStep("select");
                  }}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Field Selection Step */}
        {step === "select" && (
          <>
            <div className="mb-8 animate-fade-in">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Select Fields to Edit
              </h1>
              <p className="text-muted-foreground">
                Choose which sections you'd like to customize. You'll go through each selected section one by one.
              </p>
            </div>

            <Card className="shadow-card animate-fade-in">
              <CardHeader>
                <CardTitle>Available Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {STEPS.map((stepInfo) => (
                  <div
                    key={stepInfo.id}
                    className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={`step-${stepInfo.id}`}
                      checked={selectedSteps.includes(stepInfo.id)}
                      onCheckedChange={() => handleStepToggle(stepInfo.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`step-${stepInfo.id}`}
                        className="text-base font-medium cursor-pointer"
                      >
                        {stepInfo.title}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stepInfo.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {stepInfo.fields.map((field) => (
                          <span
                            key={field}
                            className="text-xs px-2 py-1 bg-muted rounded-md capitalize"
                          >
                            {field === "keyMessage"
                              ? "Key Message"
                              : field === "audienceDemographics"
                              ? "Audience"
                              : field === "speakerBackground"
                              ? "Background"
                              : field === "durationMinutes"
                              ? "Duration"
                              : field}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleContinueFromSelect} disabled={selectedSteps.length === 0}>
                    Continue to Editing
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Editing Steps */}
        {typeof step === "number" && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {STEPS.filter((s) => selectedSteps.includes(s.id)).map((s, i, arr) => {
                  const stepIndex = selectedSteps.indexOf(s.id);
                  const isActive = step === s.id;
                  const isCompleted = selectedSteps.indexOf(step) > stepIndex;
                  return (
                    <div key={s.id} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                            ? "bg-primary/50 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {stepIndex + 1}
                      </div>
                      {i < arr.length - 1 && (
                        <div
                          className={`w-full h-1 mx-2 rounded ${
                            isCompleted ? "bg-primary" : "bg-muted"
                          }`}
                          style={{ width: "3rem" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <h2 className="text-2xl font-display font-bold">
                {STEPS.find((s) => s.id === step)?.title}
              </h2>
              <p className="text-muted-foreground">
                {STEPS.find((s) => s.id === step)?.description}
              </p>
            </div>

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
                    onClick={() => {
                      const sortedSteps = [...selectedSteps].sort((a, b) => a - b);
                      const currentIndex = sortedSteps.indexOf(step);
                      if (currentIndex > 0) {
                        setStep(sortedSteps[currentIndex - 1]);
                      } else {
                        setStep("select");
                      }
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  {getNextStep() ? (
                    <Button onClick={() => setStep(getNextStep()!)} disabled={!canProceed()}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleSave} disabled={saving || !canProceed()} className="gap-2">
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Save Speech
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

