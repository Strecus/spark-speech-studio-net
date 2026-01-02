import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic2, 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  LogOut,
  MoreVertical,
  Trash2,
  Edit3,
  Upload
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Speech {
  id: string;
  title: string;
  topic: string;
  status: string;
  created_at: string;
  updated_at: string;
  duration_minutes: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "completed">("all");

  useEffect(() => {
    fetchSpeeches();
  }, []);

  const fetchSpeeches = async () => {
    const { data, error } = await supabase
      .from("speeches")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading speeches",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSpeeches(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("speeches").delete().eq("id", id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Speech deleted" });
      fetchSpeeches();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const filteredSpeeches = speeches.filter((speech) => {
    const matchesSearch = speech.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         speech.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || speech.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: speeches.length,
    drafts: speeches.filter((s) => s.status === "draft").length,
    completed: speeches.filter((s) => s.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Mic2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">TED Talk Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back, Speaker!
          </h1>
          <p className="text-muted-foreground">
            Craft compelling talks that inspire and transform your audience.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.05s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Speeches
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
              <Clock className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.drafts}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search speeches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("draft")}
            >
              Drafts
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/speech/demo">
                <Mic2 className="w-4 h-4" />
                View Demo Speech
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/speech/upload">
                <Upload className="w-4 h-4" />
                Upload Speech
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/speech/new">
                <Plus className="w-4 h-4" />
                New Speech
              </Link>
            </Button>
          </div>
        </div>

        {/* Speeches Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSpeeches.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                {searchQuery || filter !== "all" ? "No speeches found" : "No speeches yet"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || filter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start crafting your first inspiring talk"}
              </p>
              {!searchQuery && filter === "all" && (
                <Button asChild>
                  <Link to="/speech/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Speech
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpeeches.map((speech, index) => (
              <Card
                key={speech.id}
                className="shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in cursor-pointer group"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link to={`/speech/${speech.id}`}>
                        <CardTitle className="text-lg font-display truncate group-hover:text-primary transition-colors">
                          {speech.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="truncate mt-1">
                        {speech.topic}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/speech/${speech.id}`}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(speech.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
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
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(speech.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
