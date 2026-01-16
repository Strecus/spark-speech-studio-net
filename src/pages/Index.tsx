import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src="/ReadySpeakerOne-logo.webp" 
            alt="Ready Speaker One" 
            className="h-10 w-auto"
          />
          <span className="font-display font-bold text-xl">Ready Speaker One Talk Studio</span>
        </div>
        <Button asChild>
          <Link to="/auth">Get Started</Link>
        </Button>
      </header>

      <main className="flex-1 container flex flex-col items-center justify-center text-center py-16">
        <div className="animate-fade-in max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Speech Writing</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
            Craft Speeches That <span className="text-primary">Inspire</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Transform your ideas into compelling, stage-ready presentations with AI assistance. From topic to polished script.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link to="/auth">
              Start Writing <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="container py-8 text-center text-sm text-muted-foreground">
        Ready to speak with confidence
      </footer>
    </div>
  );
}
