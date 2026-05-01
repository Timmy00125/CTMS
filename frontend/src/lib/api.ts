import { TranscriptData } from '@/types/transcript';

export async function fetchStudentTranscript(
  studentId: string,
): Promise<TranscriptData> {
  const response = await fetch(`/transcript/${studentId}`, {
    credentials: 'include',
    next: {
      revalidate: 3600,
      tags: [`transcript-${studentId}`],
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Student not found');
    }
    throw new Error('Failed to fetch transcript');
  }

  return response.json();
}

export async function fetchAcademicSessions() {
  const response = await fetch('/academic-sessions', {
    credentials: 'include',
    next: {
      revalidate: 86400,
      tags: ['academic-sessions'],
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch academic sessions');
  }

  return response.json();
}

export async function fetchStudents() {
  const response = await fetch('/students', {
    credentials: 'include',
    next: {
      revalidate: 300,
      tags: ['students'],
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch students');
  }

  return response.json();
}
