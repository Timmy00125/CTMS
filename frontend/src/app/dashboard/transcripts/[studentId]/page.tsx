import { fetchStudentTranscript } from '@/lib/api';
import { TranscriptView } from '@/components/transcript/transcript-view';
import { notFound } from 'next/navigation';

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
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Student Transcript</h1>
      <TranscriptView transcript={transcript} />
    </div>
  );
}
