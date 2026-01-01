import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic2, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Clock,
  FileText,
  Users,
  User,
  Timer
} from "lucide-react";

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
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (id) fetchSpeech();
  }, [id]);

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
    }
    setLoading(false);
  };

  const handleSave = async (markComplete = false) => {
    if (!speech) return;
    setSaving(true);

    const { error } = await supabase
      .from("speeches")
      .update({
        title,
        content,
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
    }
    setSaving(false);
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
                  <span className="font-medium">{speech.duration_minutes} min</span>
                </div>
              </CardContent>
            </Card>

            {/* Speech Details */}
            <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Speech Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="w-3 h-3" />
                    Topic
                  </div>
                  <p>{speech.topic}</p>
                </div>
                {speech.key_message && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Mic2 className="w-3 h-3" />
                      Key Message
                    </div>
                    <p>{speech.key_message}</p>
                  </div>
                )}
                {speech.audience_demographics && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-3 h-3" />
                      Audience
                    </div>
                    <p className="line-clamp-3">{speech.audience_demographics}</p>
                  </div>
                )}
                {speech.speaker_background && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <User className="w-3 h-3" />
                      Speaker Background
                    </div>
                    <p className="line-clamp-3">{speech.speaker_background}</p>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Timer className="w-3 h-3" />
                    Tone
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {speech.tone}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
