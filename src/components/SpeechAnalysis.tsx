import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, Heart, Shield, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AnalysisData {
  id: string;
  logos: number;
  pathos: number;
  ethos: number;
  logos_description: string | null;
  pathos_description: string | null;
  ethos_description: string | null;
  overall_score: number;
}

interface SpeechAnalysisProps {
  speechId?: string;
  speechContent?: string | null;
}

export default function SpeechAnalysis({ speechId, speechContent }: SpeechAnalysisProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [reAnalyzeClicks, setReAnalyzeClicks] = useState(0);
  const MAX_RE_ANALYZE_CLICKS = 3;

  useEffect(() => {
    if (speechId && !speechId.startsWith("demo-speech-")) {
      fetchAnalysis();
    } else {
      setLoading(false);
    }
  }, [speechId]);

  const fetchAnalysis = async () => {
    if (!speechId) return;
    
    setLoading(true);
    const result = await (supabase
      .from("analyses" as any)
      .select("*")
      .eq("speech_id", speechId)
      .maybeSingle()) as { data: AnalysisData | null; error: any };

    if (!result.error) {
      setAnalysis(result.data);
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!speechId || !speechContent || !speechContent.trim()) {
      toast({
        title: "Cannot analyze",
        description: "Speech content is required for analysis.",
        variant: "destructive",
      });
      return;
    }
    
    setAnalyzing(true);
    try {
      // Call the AI analysis edge function
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            speechContent: speechContent,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to analyze speech");
      }

      const analysisResult = await response.json();

      // Save analysis to database
      const { error } = await (supabase
        .from("analyses" as any)
        .insert({
          speech_id: speechId,
          logos: analysisResult.logos,
          pathos: analysisResult.pathos,
          ethos: analysisResult.ethos,
          logos_description: analysisResult.logos_description || null,
          pathos_description: analysisResult.pathos_description || null,
          ethos_description: analysisResult.ethos_description || null,
        })) as { error: any };

      if (error) {
        // If analysis already exists, update it
        if (error.code === "23505") {
          const { error: updateError } = await (supabase
            .from("analyses" as any)
            .update({
              logos: analysisResult.logos,
              pathos: analysisResult.pathos,
              ethos: analysisResult.ethos,
              logos_description: analysisResult.logos_description || null,
              pathos_description: analysisResult.pathos_description || null,
              ethos_description: analysisResult.ethos_description || null,
            })
            .eq("speech_id", speechId)) as { error: any };

          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }

      // Refresh analysis data
      await fetchAnalysis();

      // Increment re-analyze click count if analysis already existed (re-analyzing)
      if (analysis) {
        setReAnalyzeClicks((prev) => prev + 1);
      }

      toast({
        title: "Analysis complete!",
        description: "Your speech has been analyzed successfully.",
      });
    } catch (error: any) {
      console.error("Error analyzing speech:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Rhetorical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show analyze button if no analysis exists
  if (!analysis) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Rhetorical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Analyze your speech to get insights on logos, pathos, and ethos.
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !speechId || !speechContent || !speechContent.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Rhetorical Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logos - Logical Appeal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Logos</span>
              <span className="text-xs text-muted-foreground">(Logic & Reasoning)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${getScoreColor(analysis.logos)}`}>
                {analysis.logos}%
              </span>
              <span className="text-xs text-muted-foreground">
                {getScoreLabel(analysis.logos)}
              </span>
            </div>
          </div>
          <Progress value={analysis.logos} className="h-2" />
          {analysis.logos_description && (
            <p className="text-xs text-muted-foreground">
              {analysis.logos_description}
            </p>
          )}
        </div>

        {/* Pathos - Emotional Appeal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Pathos</span>
              <span className="text-xs text-muted-foreground">(Emotion & Empathy)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${getScoreColor(analysis.pathos)}`}>
                {analysis.pathos}%
              </span>
              <span className="text-xs text-muted-foreground">
                {getScoreLabel(analysis.pathos)}
              </span>
            </div>
          </div>
          <Progress value={analysis.pathos} className="h-2" />
          {analysis.pathos_description && (
            <p className="text-xs text-muted-foreground">
              {analysis.pathos_description}
            </p>
          )}
        </div>

        {/* Ethos - Credibility Appeal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Ethos</span>
              <span className="text-xs text-muted-foreground">(Credibility & Authority)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${getScoreColor(analysis.ethos)}`}>
                {analysis.ethos}%
              </span>
              <span className="text-xs text-muted-foreground">
                {getScoreLabel(analysis.ethos)}
              </span>
            </div>
          </div>
          <Progress value={analysis.ethos} className="h-2" />
          {analysis.ethos_description && (
            <p className="text-xs text-muted-foreground">
              {analysis.ethos_description}
            </p>
          )}
        </div>

        {/* Overall Score */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Rhetorical Score</span>
            <span className="text-lg font-bold text-primary">
              {analysis.overall_score}%
            </span>
          </div>
          <Progress 
            value={analysis.overall_score} 
            className="h-3" 
          />
        </div>

        {/* Re-analyze Button */}
        {reAnalyzeClicks < MAX_RE_ANALYZE_CLICKS && (
          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !speechId || !speechContent || !speechContent.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Re-analyze with AI ({MAX_RE_ANALYZE_CLICKS - reAnalyzeClicks} remaining)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

