import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SemesterCard } from './semester-card';
import { TranscriptData } from '@/types/transcript';

interface TranscriptViewProps {
  transcript: TranscriptData;
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const { student, academicSessions, cgpa, totalCreditUnits } = transcript;

  return (
    <div className="transcript-container space-y-6">
      {/* Transcript Header - visible in print */}
      <div className="transcript-header hidden print:block">
        <h1>Academic Transcript</h1>
        <p>Official Student Academic Record</p>
      </div>

      <Card className="page-break-avoid">
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="student-info grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="font-medium">{student.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Matriculation No</dt>
              <dd className="font-medium">{student.matriculationNo}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Department</dt>
              <dd className="font-medium">{student.departmentId}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Level</dt>
              <dd className="font-medium">{student.level}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {academicSessions.map((session) => (
        <div key={session.id} className="space-y-4 page-break-avoid">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              Academic Session: {session.name}
            </h2>
            <Separator className="flex-1" />
          </div>
          {session.semesters.map((semester) => (
            <SemesterCard key={semester.id} semester={semester} />
          ))}
        </div>
      ))}

      <Card className="summary-card bg-muted page-break-avoid">
        <CardHeader>
          <CardTitle>Cumulative Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Credit Units</p>
              <p className="text-2xl font-bold">{totalCreditUnits}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cumulative GPA</p>
              <p className="text-2xl font-bold">{cgpa?.toFixed(2) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Academic Sessions</p>
              <p className="text-2xl font-bold">{academicSessions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print button - hidden in print */}
      <div className="no-print flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Print Transcript
        </button>
      </div>
    </div>
  );
}
