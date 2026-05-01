import { fetchStudentTranscript } from '@/lib/api';
import { TranscriptView } from '@/components/transcript/transcript-view';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';

interface TranscriptPageProps {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function TranscriptPage({ params }: TranscriptPageProps) {
  const { studentId } = await params;

  let transcript;
  try {
    transcript = await fetchStudentTranscript(studentId);
  } catch (error) {
    if (error instanceof Error && error.message === 'Student not found') {
      notFound();
    }
    throw error;
  }

  return (
    <AppShell>
      <TranscriptView transcript={transcript} />
    </AppShell>
  );
}
