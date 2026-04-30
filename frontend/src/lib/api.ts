import { TranscriptData } from '@/types/transcript';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchStudentTranscript(
  studentId: string,
): Promise<TranscriptData> {
  const response = await fetch(`${API_BASE_URL}/transcript/${studentId}`, {
    credentials: 'include',
    next: {
      revalidate: 3600, // Cache for 1 hour
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
  const response = await fetch(`${API_BASE_URL}/academic-sessions`, {
    credentials: 'include',
    next: {
      revalidate: 86400, // Cache for 24 hours (static institutional data)
      tags: ['academic-sessions'],
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch academic sessions');
  }

  return response.json();
}

export async function fetchStudents() {
  const response = await fetch(`${API_BASE_URL}/students`, {
    credentials: 'include',
    next: {
      revalidate: 300, // Cache for 5 minutes
      tags: ['students'],
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch students');
  }

  return response.json();
}
