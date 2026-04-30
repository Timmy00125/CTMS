import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function TranscriptsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Transcripts</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">View Student Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Search for a student by their ID to view their academic transcript.
            </p>
            <p className="text-sm">
              Use the API endpoint: <code className="bg-muted px-1 py-0.5 rounded">/transcript/:studentId</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
