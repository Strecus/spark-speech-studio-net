import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import SpeechAnalysis from "@/components/SpeechAnalysis";
import DemoSpeechSelector from "@/components/DemoSpeechSelector";
import { getDemoSpeech } from "@/lib/demoSpeech";
import { useAuth } from "@/hooks/useAuth";
import { 
  Mic2, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Clock,
  FileText,
  Users,
  User,
  Timer,
  Sparkles
} from "lucide-react";

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

interface Speech {
  id: string;
  title: string;
  topic: string;
  key_message: string | null;
  audience_demographics: string | null;
  speaker_background: string | null;
  duration_minutes: number;
  tone: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SpeechEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [pendingMarkComplete, setPendingMarkComplete] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const [audienceDemographics, setAudienceDemographics] = useState("");
  const [speakerBackground, setSpeakerBackground] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [tone, setTone] = useState("inspiring");
  
  // Store original values for change detection
  const originalValuesRef = useRef<{
    topic: string;
    keyMessage: string;
    audienceDemographics: string;
    speakerBackground: string;
    durationMinutes: number;
    tone: string;
  } | null>(null);

  useEffect(() => {
    if (id === "demo") {
      // Show selector, don't load a speech yet
      setLoading(false);
    } else if (id?.startsWith("demo-speech-")) {
      loadDemoSpeech(id);
    } else if (id) {
      fetchSpeech();
    }
  }, [id]);

  const loadDemoSpeech = (speechId: string) => {
    const demoSpeech = getDemoSpeech(speechId);
    if (demoSpeech) {
      setSpeech(demoSpeech as Speech);
      setTitle(demoSpeech.title);
      setContent(demoSpeech.content);
      setTopic(demoSpeech.topic);
      setKeyMessage(demoSpeech.key_message || "");
      setAudienceDemographics(demoSpeech.audience_demographics || "");
      setSpeakerBackground(demoSpeech.speaker_background || "");
      setDurationMinutes(demoSpeech.duration_minutes || 15);
      setTone(demoSpeech.tone || "inspiring");
      
      // Store original values for demo speech (though demo speeches are read-only)
      originalValuesRef.current = {
        topic: demoSpeech.topic,
        keyMessage: demoSpeech.key_message || "",
        audienceDemographics: demoSpeech.audience_demographics || "",
        speakerBackground: demoSpeech.speaker_background || "",
        durationMinutes: demoSpeech.duration_minutes || 15,
        tone: demoSpeech.tone || "inspiring",
      };
      
      setLoading(false);
    } else {
      toast({
        title: "Demo speech not found",
        variant: "destructive",
      });
      navigate("/speech/demo");
    }
  };

  const handleDemoSpeechSelect = (speechId: string) => {
    navigate(`/speech/${speechId}`);
  };

  const fetchSpeech = async () => {
    const { data, error } = await supabase
      .from("speeches")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error loading speech",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } else if (!data) {
      toast({
        title: "Speech not found",
        variant: "destructive",
      });
      navigate("/dashboard");
    } else {
      setSpeech(data);
      setTitle(data.title);
      setContent(data.content || "");
      setTopic(data.topic);
      setKeyMessage(data.key_message || "");
      setAudienceDemographics(data.audience_demographics || "");
      setSpeakerBackground(data.speaker_background || "");
      setDurationMinutes(data.duration_minutes || 15);
      setTone(data.tone || "inspiring");
      
      // Store original values
      originalValuesRef.current = {
        topic: data.topic,
        keyMessage: data.key_message || "",
        audienceDemographics: data.audience_demographics || "",
        speakerBackground: data.speaker_background || "",
        durationMinutes: data.duration_minutes || 15,
        tone: data.tone || "inspiring",
      };
    }
    setLoading(false);
  };

  const hasDetailsChanged = (): boolean => {
    if (!originalValuesRef.current) return false;
    const original = originalValuesRef.current;
    
    return (
      topic !== original.topic ||
      keyMessage !== original.keyMessage ||
      audienceDemographics !== original.audienceDemographics ||
      speakerBackground !== original.speakerBackground ||
      durationMinutes !== original.durationMinutes ||
      tone !== original.tone
    );
  };

  const handleRegenerate = async () => {
    if (!speech || !user) return;
    
    setShowRegenerateDialog(false);
    setSaving(true);

    try {
      // Call the AI edge function to regenerate speech
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            title,
            topic,
            keyMessage,
            audienceDemographics,
            speakerBackground,
            durationMinutes,
            tone,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to regenerate speech");
      }

      const { content: newContent } = await response.json();

      // Update with new content and all fields
      const { error } = await supabase
        .from("speeches")
        .update({
          title,
          topic,
          key_message: keyMessage,
          audience_demographics: audienceDemographics,
          speaker_background: speakerBackground,
          duration_minutes: durationMinutes,
          tone,
          content: newContent,
          status: speech.status,
        })
        .eq("id", speech.id);

      if (error) throw error;

      setContent(newContent);
      setSpeech((prev) => prev ? {
        ...prev,
        topic,
        key_message: keyMessage,
        audience_demographics: audienceDemographics,
        speaker_background: speakerBackground,
        duration_minutes: durationMinutes,
        tone,
        content: newContent,
      } : null);
      
      // Update original values
      originalValuesRef.current = {
        topic,
        keyMessage,
        audienceDemographics,
        speakerBackground,
        durationMinutes,
        tone,
      };

      toast({
        title: "Speech regenerated!",
        description: "Your speech has been regenerated with the updated details.",
      });
    } catch (error: any) {
      console.error("Error regenerating speech:", error);
      toast({
        title: "Regeneration failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (markComplete = false) => {
    if (!speech) return;
    
    // Demo speeches are read-only
    if (speech.id.startsWith("demo-speech-") || id?.startsWith("demo-speech-")) {
      toast({
        title: "Demo speech is read-only",
        description: "This is a demo speech for testing. Create your own speech to edit and save.",
        variant: "default",
      });
      return;
    }
    
    // Check if details have changed
    if (hasDetailsChanged()) {
      setPendingMarkComplete(markComplete);
      setShowRegenerateDialog(true);
      return;
    }

    await performSave(markComplete);
  };

  const performSave = async (markComplete = false) => {
    if (!speech) return;
    
    setSaving(true);

    const { error } = await supabase
      .from("speeches")
      .update({
        title,
        content,
        topic,
        key_message: keyMessage,
        audience_demographics: audienceDemographics,
        speaker_background: speakerBackground,
        duration_minutes: durationMinutes,
        tone,
        status: markComplete ? "completed" : speech.status,
      })
      .eq("id", speech.id);

    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: markComplete ? "Speech marked as complete!" : "Changes saved",
      });
      if (markComplete) {
        setSpeech((prev) => prev ? { ...prev, status: "completed" } : null);
      }
      
      // Update original values after save
      originalValuesRef.current = {
        topic,
        keyMessage,
        audienceDemographics,
        speakerBackground,
        durationMinutes,
        tone,
      };
    }
    setSaving(false);
  };

  const handleSaveWithoutRegenerate = async () => {
    setShowRegenerateDialog(false);
    await performSave(pendingMarkComplete);
    setPendingMarkComplete(false);
  };

  const estimateWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const estimateDuration = (text: string) => {
    // Average speaking rate: 130 words per minute
    const words = estimateWordCount(text);
    return Math.ceil(words / 130);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show selector if on /speech/demo route without a specific speech selected
  if (id === "demo" && !speech) {
    return <DemoSpeechSelector onSelect={handleDemoSpeechSelect} />;
  }

  if (!speech) return null;

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
          <div className="flex items-center gap-2">
            <Badge variant={speech.status === "completed" ? "default" : "secondary"}>
              {speech.status === "completed" ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2 animate-fade-in">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-display font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                placeholder="Speech Title"
              />
            </div>

            <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.05s" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Speech Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] resize-none border-none focus-visible:ring-0 p-0 text-base leading-relaxed"
                  placeholder="Your speech content will appear here..."
                />
              </CardContent>
            </Card>

            {/* Actions */}
            {speech.id.startsWith("demo-speech-") || id?.startsWith("demo-speech-") ? (
              <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    This is a demo speech for testing the analysis feature. Create your own speech to edit and save.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <Button onClick={() => handleSave(false)} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                {speech.status !== "completed" && (
                  <Button
                    variant="outline"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="border-success text-success hover:bg-success hover:text-success-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Speech Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Word Count</span>
                  <span className="font-medium">{estimateWordCount(content)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Est. Duration</span>
                  <span className="font-medium">{estimateDuration(content)} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Target Duration</span>
                  <span className="font-medium">{durationMinutes} min</span>
                </div>
              </CardContent>
            </Card>

            {/* Speech Analysis */}
            {!speech.id.startsWith("demo-speech-") && id && !id.startsWith("demo-speech-") ? (
              <SpeechAnalysis speechId={speech.id} speechContent={content} />
            ) : null}

            {/* Speech Details */}
            <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Speech Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <FileText className="w-3 h-3" />
                    Topic
                  </Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Speech topic"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Mic2 className="w-3 h-3" />
                    Key Message
                  </Label>
                  <Textarea
                    value={keyMessage}
                    onChange={(e) => setKeyMessage(e.target.value)}
                    placeholder="Key message (optional)"
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Users className="w-3 h-3" />
                    Audience
                  </Label>
                  <Textarea
                    value={audienceDemographics}
                    onChange={(e) => setAudienceDemographics(e.target.value)}
                    placeholder="Audience demographics"
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <User className="w-3 h-3" />
                    Speaker Background
                  </Label>
                  <Textarea
                    value={speakerBackground}
                    onChange={(e) => setSpeakerBackground(e.target.value)}
                    placeholder="Speaker background"
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Timer className="w-3 h-3" />
                    Tone
                  </Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-9 text-sm">
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
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3" />
                    Target Duration
                  </Label>
                  <Select
                    value={durationMinutes.toString()}
                    onValueChange={(v) => setDurationMinutes(parseInt(v))}
                  >
                    <SelectTrigger className="h-9 text-sm">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Re-generate Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Speech with AI?</AlertDialogTitle>
            <AlertDialogDescription>
              You've changed the speech details (topic, audience, duration, tone, etc.). 
              Would you like to regenerate the speech content with AI to match these new details?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={handleSaveWithoutRegenerate}
            >
              No, Save Changes Only
            </Button>
            <AlertDialogAction
              onClick={handleRegenerate}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Yes, Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
