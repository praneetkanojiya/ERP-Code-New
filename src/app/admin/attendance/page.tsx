"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, doc, setDoc } from "firebase/firestore";
import { ClipboardList, Check, X, Clock, Calendar, Search } from "lucide-react";
import { AdmissionApplication } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminAttendancePage() {
    const [students, setStudents] = useState<AdmissionApplication[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch students
        const q = query(collection(db, "admissions"), where("status", "==", "APPROVED"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const apps = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as AdmissionApplication[];
            setStudents(apps);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch existing attendance for the selected date
    useEffect(() => {
        const fetchAttendance = async () => {
            const q = query(collection(db, "attendance"), where("date", "==", date));
            const snapshot = await getDocs(q);
            const records: Record<string, any> = {};
            snapshot.docs.forEach((doc: any) => {
                const data = doc.data();
                records[data.studentId] = data.status;
            });
            setAttendance(records);
        };
        fetchAttendance();
    }, [date]);

    const toggleStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const saveAttendance = async () => {
        setSaving(true);
        try {
            for (const student of students) {
                const status = attendance[student.id!] || 'ABSENT';
                const docId = `${date}_${student.id}`;
                await setDoc(doc(db, "attendance", docId), {
                    studentId: student.id,
                    studentName: student.studentName,
                    courseId: student.courseId,
                    date,
                    status,
                    recordedAt: serverTimestamp(),
                });
            }
            alert("Attendance saved successfully for " + date);
        } catch (error) {
            console.error(error);
            alert("Error saving attendance");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Attendance Management</h1>
                    <p className="text-slate-500">Log daily attendance for all registered students.</p>
                </div>
                <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <Calendar className="text-blue-500 ml-2" size={20} />
                    <input
                        type="date"
                        className="bg-transparent border-none outline-none font-bold text-slate-700 p-2"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </header>

            <div className="glass-card rounded-[2.5rem] shadow-2xl border border-white overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold flex items-center space-x-2">
                        <ClipboardList className="text-blue-600" size={24} />
                        <span>Student List</span>
                    </h2>
                    <button
                        onClick={saveAttendance}
                        disabled={saving}
                        className="px-6 py-2.5 premium-gradient text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Daily Records"}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Student Information</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Batch / Course</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Attendance Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{student.studentName}</span>
                                            <span className="text-xs text-slate-500">{student.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs uppercase">{student.courseId}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button
                                                onClick={() => toggleStatus(student.id!, 'PRESENT')}
                                                className={cn(
                                                    "p-3 rounded-xl transition-all border flex flex-col items-center space-y-1 w-20",
                                                    attendance[student.id!] === 'PRESENT'
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 ring-2 ring-emerald-500/20"
                                                        : "bg-white border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-400"
                                                )}
                                            >
                                                <Check size={18} />
                                                <span className="text-[10px] font-bold">Present</span>
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(student.id!, 'ABSENT')}
                                                className={cn(
                                                    "p-3 rounded-xl transition-all border flex flex-col items-center space-y-1 w-20",
                                                    attendance[student.id!] === 'ABSENT'
                                                        ? "bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-500/20"
                                                        : "bg-white border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-400"
                                                )}
                                            >
                                                <X size={18} />
                                                <span className="text-[10px] font-bold">Absent</span>
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(student.id!, 'LATE')}
                                                className={cn(
                                                    "p-3 rounded-xl transition-all border flex flex-col items-center space-y-1 w-20",
                                                    attendance[student.id!] === 'LATE'
                                                        ? "bg-amber-50 border-amber-200 text-amber-600 ring-2 ring-amber-500/20"
                                                        : "bg-white border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-400"
                                                )}
                                            >
                                                <Clock size={18} />
                                                <span className="text-[10px] font-bold">Late</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
