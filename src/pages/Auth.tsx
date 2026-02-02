import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

// Capture hash type immediately - Supabase clears it when parsing, so we must read before any auth calls
const getInitialHashType = () => {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.hash.substring(1)).get("type");
  } catch {
    return null;
  }
};

export default function Auth() {
  const hashTypeRef = useRef(getInitialHashType());
  const isPasswordRecovery = hashTypeRef.current === "recovery";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(isPasswordRecovery);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatePasswordLoading, setUpdatePasswordLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setShowPasswordUpdate(true);
        } else if (event === "SIGNED_IN" && session) {
          // Use captured hash type - URL hash may already be cleared by Supabase
          if (hashTypeRef.current === "recovery") {
            setShowPasswordUpdate(true);
            return;
          }
          if (hashTypeRef.current === "signup" || hashTypeRef.current === "email_change" || hashTypeRef.current === "invite") {
            toast({
              title: "Email verified!",
              description: "Your email has been confirmed. You're now logged in.",
            });
            window.history.replaceState(null, "", window.location.pathname);
          }
          navigate("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (hashTypeRef.current === "recovery") {
          setShowPasswordUpdate(true);
          return;
        }
        if (hashTypeRef.current === "signup" || hashTypeRef.current === "email_change" || hashTypeRef.current === "invite") {
          toast({
            title: "Email verified!",
            description: "Your email has been confirmed. Welcome!",
          });
          window.history.replaceState(null, "", window.location.pathname);
        }
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check for email verification errors
      if (error.message.includes("Email not confirmed") || error.message.includes("email_not_confirmed")) {
        toast({
          title: "Email not verified",
          description: "Please check your email and click the verification link before logging in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } else if (data.session) {
      // Login successful - navigation happens via auth state change
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/auth`;
    
    // Check if email already exists before attempting signup
    try {
      const { data: emailExists, error: functionError } = await supabase.rpc('check_email_exists', {
        check_email: email
      });
      
      if (!functionError && emailExists === true) {
        toast({
          title: "Email already registered",
          description: "An account with this email already exists. Please log in instead, or use the 'Forgot Password?' link to reset your password.",
          variant: "destructive",
        });
        setEmail("");
        setPassword("");
        setFirstName("");
        setLoading(false);
        return;
      }
    } catch (err) {
      // If function doesn't exist yet, continue with signup and check after
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
        },
      },
    });

    if (error) {
      console.error("❌ Sign-up error:", error);
      // Check for duplicate email errors
      const errorMessage = error.message.toLowerCase();
      const errorCode = error.code || "";
      
      const isDuplicateEmail = 
        errorMessage.includes("already registered") ||
        errorMessage.includes("user already registered") ||
        errorMessage.includes("email address has already been registered") ||
        errorCode === "user_already_registered" ||
        errorCode === "email_address_already_registered" ||
        error.status === 422;
      
      if (isDuplicateEmail) {
        toast({
          title: "Email already registered",
          description: "An account with this email already exists. Please log in instead, or use the 'Forgot Password?' link to reset your password.",
          variant: "destructive",
        });
        setEmail("");
        setPassword("");
        setFirstName("");
      } else {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } else if (data.user) {
      // Check if email already exists (double-check after signup)
      try {
        const { data: emailExists } = await supabase.rpc('check_email_exists', {
          check_email: email
        });
        
        // If email exists, check if it's a different user or already registered
        if (emailExists === true) {
          const { data: existingProfiles } = await supabase
            .from("profiles")
            .select("id, registered")
            .eq("email", email)
            .limit(1);
          
          if (existingProfiles && existingProfiles.length > 0) {
            const profile = existingProfiles[0];
            // If profile ID doesn't match OR profile is registered, it's a duplicate
            if (profile.id !== data.user.id || profile.registered === true) {
              toast({
                title: "Email already registered",
                description: "An account with this email already exists. Please log in instead, or use the 'Forgot Password?' link to reset your password.",
                variant: "destructive",
              });
              setEmail("");
              setPassword("");
              setFirstName("");
              setLoading(false);
              return;
            }
          }
        }
        
        // If email is already confirmed, user already exists
        if (data.user.email_confirmed_at) {
          toast({
            title: "Email already registered",
            description: "An account with this email already exists. Please log in instead.",
            variant: "destructive",
          });
          setEmail("");
          setPassword("");
          setFirstName("");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("❌ Error checking duplicate:", err);
      }
      
      // New user - send confirmation email
      if (!data.session) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation email. Please verify your email address before logging in. Check your spam folder if you don't see it.",
        });
      } else {
        // User created and logged in (email confirmation disabled)
        toast({
          title: "Welcome aboard!",
          description: "Your account has been created. You're now logged in.",
        });
        navigate("/dashboard");
      }
    } else {
      toast({
        title: "Sign up completed",
        description: "Please check your email for a confirmation link.",
      });
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log("🔄 Resending verification email to:", email);

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    console.log("📧 Resend response:", { data, error });

    if (error) {
      console.error("❌ Resend error:", error);
      toast({
        title: "Failed to resend email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent",
        description: "We've sent you a new confirmation email. Please check your inbox (and spam folder).",
      });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link. Please check your email inbox.",
      });
      setResetPasswordOpen(false);
      setResetEmail("");
    }
    setResetLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setUpdatePasswordLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You can now log in with your new password.",
      });
      setShowPasswordUpdate(false);
      setNewPassword("");
      setConfirmPassword("");
      // Clear the hash from URL
      window.history.replaceState(null, "", window.location.pathname);
      await supabase.auth.signOut();
    }
    setUpdatePasswordLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Header */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img 
            src="/ReadySpeakerOne-logo.webp" 
            alt="Ready Speaker One" 
            className="h-12 w-auto"
          />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Ready Speaker One Talk Studio
        </h1>
        <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1">
          <Sparkles className="w-4 h-4" />
          AI-powered speech writing for inspiring speakers
        </p>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md shadow-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {showPasswordUpdate ? (
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-center">Update Your Password</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Please enter your new password below.
                </p>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={updatePasswordLoading}>
                  {updatePasswordLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </div>
          </CardContent>
        ) : (
          <Tabs defaultValue="login" className="w-full">
          <CardHeader className="pb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="speaker@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setResetPasswordOpen(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">First Name</Label>
                  <Input
                    id="signup-firstname"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="speaker@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    disabled={loading || !email}
                  >
                    Didn't receive the email? Resend verification
                  </button>
                </div>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
        )}
      </Card>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
        Ready to speak with confidence
      </p>

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="speaker@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResetPasswordOpen(false);
                  setResetEmail("");
                }}
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
