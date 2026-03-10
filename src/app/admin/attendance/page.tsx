"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, doc, setDoc } from "firebase/firestore";
import { ClipboardList, Check, X, Clock, Calendar, Search, Loader2, Layers } from "lucide-react";
import { AdmissionApplication } from "@/types";
import { cn } from "@/lib/utils";

interface ClassInfo {
    id: string;
    name: string;
    standard: '11th' | '12th';
}

export default function AdminAttendancePage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [students, setStudents] = useState<AdmissionApplication[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "classes"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const classData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ClassInfo[];
            setClasses(classData);
            if (classData.length > 0 && !selectedClassId) {
                setSelectedClassId(classData[0].id);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedClassId) return;

        setLoading(true);
        const q = query(collection(db, "admissions"),
            where("status", "==", "APPROVED"),
            where("classId", "==", selectedClassId)
        );

        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            setStudents(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as AdmissionApplication[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [selectedClassId]);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!date || !selectedClassId) return;
            const q = query(collection(db, "attendance"),
                where("date", "==", date),
                where("classId", "==", selectedClassId)
            );
            const snapshot = await getDocs(q);
            const records: any = {};
            snapshot.docs.forEach((doc: any) => {
                records[doc.data().studentId] = doc.data().status;
            });
            setAttendance(records);
        };
        fetchAttendance();
    }, [date, selectedClassId]);

    const toggleStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
        setAttendance({ ...attendance, [studentId]: status });
    };

    const saveAttendance = async () => {
        if (!selectedClassId) return;
        setSaving(true);
        try {
            for (const studentId in attendance) {
                const compositeId = `${date}_${studentId}`;
                await setDoc(doc(db, "attendance", compositeId), {
                    studentId,
                    date,
                    classId: selectedClassId,
                    status: attendance[studentId],
                    updatedAt: serverTimestamp(),
                });
            }
            alert("Attendance saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Error saving attendance");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">Attendance Records</h1>
                    <p className="text-slate-500 font-medium">Manage daily attendance for each class division.</p>

                    <div className="flex flex-wrap items-center gap-4 mt-6">
                        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <Layers className="text-slate-400 ml-3" size={18} />
                            <select
                                className="bg-transparent text-sm font-bold text-slate-900 outline-none pr-8 cursor-pointer"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                <option value="">Select Division</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.standard})</option>)}
                            </select>
                        </div>

                        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <Calendar className="text-slate-400 ml-3" size={18} />
                            <input
                                type="date"
                                className="bg-transparent text-sm font-bold text-slate-900 outline-none pr-4 cursor-pointer"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex space-x-4 w-full lg:w-auto">
                    <button
                        onClick={saveAttendance}
                        disabled={saving || !selectedClassId}
                        className="flex-1 lg:flex-none px-8 py-3 premium-gradient text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center min-w-[180px]"
                    >
                        {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Check className="mr-2" size={18} />}
                        {saving ? "Saving..." : "Save Records"}
                    </button>
                </div>
            </header>

            {!selectedClassId ? (
                <div className="glass-card bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                    <Layers className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-bold italic">Select a division to start marking attendance.</p>
                </div>
            ) : loading && students.length === 0 ? (
                <div className="text-center p-20"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
            ) : students.length === 0 ? (
                <div className="glass-card bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                    <Search className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-bold italic">No approved students found in this division.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student) => (
                        <div key={student.id} className="glass-card bg-white rounded-[2rem] shadow-lg border border-white p-6 hover:border-blue-200 transition-all group">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">
                                    {student.studentName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-none mb-1 text-sm">{student.studentName}</h3>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none">{student.courseName}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {(['PRESENT', 'ABSENT', 'LATE'] as const).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => toggleStatus(student.id!, status)}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl font-bold text-[10px] tracking-tight transition-all border",
                                            attendance[student.id!] === status
                                                ? status === 'PRESENT' ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" :
                                                    status === 'ABSENT' ? "bg-rose-500 border-rose-500 text-white shadow-lg" :
                                                        "bg-amber-500 border-amber-500 text-white shadow-lg"
                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
