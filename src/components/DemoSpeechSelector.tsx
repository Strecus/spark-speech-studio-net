import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock } from "lucide-react";
import { DEMO_SPEECHES } from "@/lib/demoSpeech";

interface DemoSpeechSelectorProps {
  onSelect: (speechId: string) => void;
}

export default function DemoSpeechSelector({ onSelect }: DemoSpeechSelectorProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Demo Speech Analysis</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Select a Speech to Analyze
          </h1>
          <p className="text-muted-foreground">
            Choose from our curated collection of demo speeches to see rhetorical analysis in action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_SPEECHES.map((speech, index) => (
            <Card
              key={speech.id}
              className="shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in cursor-pointer group"
              style={{ animationDelay: `${0.05 * index}s` }}
              onClick={() => onSelect(speech.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-display truncate group-hover:text-primary transition-colors">
                      {speech.title}
                    </CardTitle>
                    <CardDescription className="truncate mt-1">
                      {speech.topic}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {speech.key_message && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {speech.key_message}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {speech.duration_minutes} min
                      </span>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {speech.tone}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

