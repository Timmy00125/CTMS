'use client';

import { useState, useCallback, useRef, useEffect, startTransition } from 'react';
import { fetchStudents, fetchCourses, fetchAcademicSessions, Student, Course, AcademicSession } from '@/lib/api';

interface UseDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStudents(): UseDataResult<Student> {
  const [data, setData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    fetchStudents()
      .then((result) => {
        if (mountedRef.current) startTransition(() => setData(result));
      })
      .catch((err) => {
        if (mountedRef.current) startTransition(() => setError(err instanceof Error ? err.message : 'Failed to fetch students'));
      })
      .finally(() => {
        if (mountedRef.current) startTransition(() => setLoading(false));
      });
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(() => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    fetchStudents()
      .then((result) => {
        if (mountedRef.current) startTransition(() => setData(result));
      })
      .catch((err) => {
        if (mountedRef.current) startTransition(() => setError(err instanceof Error ? err.message : 'Failed to fetch students'));
      })
      .finally(() => {
        if (mountedRef.current) startTransition(() => setLoading(false));
      });
  }, []);

  return { data, loading, error, refetch };
}

export function useCourses(): UseDataResult<Course> {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    fetchCourses()
      .then((result) => {
        if (mountedRef.current) startTransition(() => setData(result));
      })
      .catch((err) => {
        if (mountedRef.current) startTransition(() => setError(err instanceof Error ? err.message : 'Failed to fetch courses'));
      })
      .finally(() => {
        if (mountedRef.current) startTransition(() => setLoading(false));
      });
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(() => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    fetchCourses()
      .then((result) => {
        if (mountedRef.current) startTransition(() => setData(result));
      })
      .catch((err) => {
        if (mountedRef.current) startTransition(() => setError(err instanceof Error ? err.message : 'Failed to fetch courses'));
      })
      .finally(() => {
        if (mountedRef.current) startTransition(() => setLoading(false));
      });
  }, []);

  return { data, loading, error, refetch };
}

export function useAcademicSessions(): UseDataResult<AcademicSession> {
  const [data, setData] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    fetchAcademicSessions()
      .then((result) => {
        if (mountedRef.current) startTransition(() => setData(result));
      })
      .catch((err) => {
        if (mountedRef.current) startTransition(() => setError(err instanceof Error ? err.message : 'Failed to fetch academic sessions'));
      })
      .finally(() => {
        if (mountedRef.current) startTransition(() => setLoading(false));
      });
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(() => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    fetchAcademicSessions()
      .then((result) => {
        if (mountedRef.current) startTransition(() => setData(result));
      })
      .catch((err) => {
        if (mountedRef.current) startTransition(() => setError(err instanceof Error ? err.message : 'Failed to fetch academic sessions'));
      })
      .finally(() => {
        if (mountedRef.current) startTransition(() => setLoading(false));
      });
  }, []);

  return { data, loading, error, refetch };
}
