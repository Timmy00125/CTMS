'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { TranscriptView } from '@/components/transcript/transcript-view';
import { TranscriptData } from '@/types/transcript';
import { fetchStudentTranscriptMe } from '@/lib/api';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function StudentTranscriptPage() {
  const [transcript, setTranscript] = React.useState<TranscriptData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const data = await fetchStudentTranscriptMe();
        if (!cancelled) setTranscript(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load transcript');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading your transcript...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !transcript) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error || 'Unable to load your transcript'}</p>
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors no-print"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          My Dashboard
        </Link>
      </div>
      <TranscriptView transcript={transcript} />
    </AppShell>
  );
}
