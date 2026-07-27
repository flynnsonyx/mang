import { useState } from "react";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  className?: string;
  showLabel?: boolean;
}

const AuthButton = ({ className = "", showLabel = true }: Props) => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    const result = await signInWithGoogle();
    if (result?.error) {
      toast.error("Could not sign in. Please try again.");
      setBusy(false);
      return;
    }
    if (!result?.redirected) {
      toast.success("Signed in — your library will sync");
    }
    setBusy(false);
  };

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
    toast.success("Signed out");
  };

  if (loading) {
    return (
      <div className={`p-2 text-muted-foreground ${className}`} aria-hidden="true">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (user) {
    const label = user.email ?? "Account";
    const initial = label.slice(0, 1).toUpperCase();
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0"
          title={label}
          aria-label={`Signed in as ${label}`}
        >
          {initial}
        </div>
        <button
          onClick={handleSignOut}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          {showLabel && "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={busy}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold glow-sm hover:glow-md transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${className}`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogIn className="w-4 h-4" aria-hidden="true" />
      )}
      {showLabel && "Sign in"}
    </button>
  );
};

export default AuthButton;
