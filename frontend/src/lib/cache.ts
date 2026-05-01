import { revalidateTag } from 'next/cache';

export function invalidateTranscriptCache(studentId: string) {
  revalidateTag(`transcript-${studentId}`, 'max');
}

export function invalidateStudentsCache() {
  revalidateTag('students', 'max');
}

export function invalidateAcademicSessionsCache() {
  revalidateTag('academic-sessions', 'max');
}
