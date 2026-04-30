import { revalidateTag } from 'next/cache';

export function invalidateTranscriptCache(studentId: string) {
  revalidateTag(`transcript-${studentId}`);
}

export function invalidateStudentsCache() {
  revalidateTag('students');
}

export function invalidateAcademicSessionsCache() {
  revalidateTag('academic-sessions');
}
