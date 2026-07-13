import { AlertTriangle, Mail } from "lucide-react";

export default function AssociateDashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Not Provided</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          You don't have permission to access this page. Please contact your administrator to request access.
        </p>
        <button 
          onClick={() => window.location.href = "mailto:admin@capitalbridge.in"}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Contact Admin
        </button>
      </div>
    </div>
  );
}