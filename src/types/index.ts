export type AdmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';

export interface AdmissionApplication {
    id?: string;
    studentName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    previousQualification: string;
    percentage: number;
    courseId: string;
    courseName: string;
    status: AdmissionStatus;
    appliedAt: any; // Firestore Timestamp
    updatedAt: any;
    meritScore?: number;
    documents?: {
        tc: boolean; // Leaving Certificate (T.C.)
        sscMarksheet: boolean; // 10th (SSC) Marksheet
        aadharStudent: boolean; // Student Aadhar
        aadharParent: boolean; // Parent Aadhar
        migration: boolean; // Migration Cert
    };
    currentClass?: '11th' | '12th';
    className?: string; // e.g. "11th Science - Div A"
    classId?: string; // Division/Section ID
    rollNumber?: string;
    tenthBoard?: string;
    admissionDate?: string;
    marks?: Record<string, number>;
}

export interface Transaction {
    id?: string;
    studentId: string;
    studentName: string;
    amount: number;
    date: any;
    paymentMethod: 'MANUAL' | 'CASH' | 'UPI' | 'CARD';
    recordedBy: string;
    receiptNumber: string;
    installment?: 1 | 2 | 3;
    description?: string;
}

export interface Course {
    id: string;
    name: string;
    duration: string;
    description: string;
    fee: number;
}
