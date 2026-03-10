export interface AttendanceRecord {
    id?: string;
    studentId: string;
    studentName: string;
    courseId: string;
    date: string; // YYYY-MM-DD
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    recordedAt: any;
}
