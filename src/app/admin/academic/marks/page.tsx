"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { GraduationCap, Save, Search, Loader2, Award, ArrowUpCircle, BookOpen } from "lucide-react";
import { AdmissionApplication } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminAcademicMarksPage() {
    const [students, setStudents] = useState<AdmissionApplication[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    // Example subjects - in a real app, these would follow the stream
    const subjects = ["English", "Physics", "Chemistry", "Mathematics", "Biology", "Marathi/Hindi"];

    useEffect(() => {
        const q = query(collection(db, "admissions"), where("status", "==", "APPROVED"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdmissionApplication[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleMarkChange = (studentId: string, subject: string, marks: string) => {
        const updated = [...students];
        const index = updated.findIndex(s => s.id === studentId);
        if (index === -1) return;

        const currentMarks = updated[index].marks || {};
        updated[index].marks = { ...currentMarks, [subject]: parseInt(marks) || 0 };
        setStudents(updated);
    };

    const saveMarks = async (student: AdmissionApplication) => {
        setSavingId(student.id!);
        try {
            const isPassed = subjects.every(sub => (student.marks?.[sub] || 0) >= 35); // 35 is passing
            const nextClass = (isPassed && student.currentClass === '11th') ? '12th' : (student.currentClass || '11th');

            await setDoc(doc(db, "admissions", student.id!), {
                ...student,
                currentClass: nextClass,
                updatedAt: serverTimestamp(),
            });

            if (isPassed && student.currentClass === '11th') {
                alert(`${student.studentName} PASSED and has been PROMOTED to 12th Standard!`);
            } else {
                alert(`Marks updated for ${student.studentName}.`);
            }
        } catch (error) {
            console.error(error);
            alert("Error updating marks");
        } finally {
            setSavingId(null);
        }
    };

    const filtered = students.filter(s => s.studentName.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Academic Marks Portal</h1>
                    <p className="text-slate-500">Record subject marks and promote students to the next standard.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search student..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="space-y-8">
                {filtered.map((student) => (
                    <div key={student.id} className="glass-card bg-white rounded-[2.5rem] shadow-xl border border-white p-8 overflow-hidden group hover:border-blue-200 transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                                    {student.studentName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{student.studentName}</h3>
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{student.courseName}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 mt-4 md:mt-0">
                                <div className={cn(
                                    "px-4 py-2 rounded-xl border font-black text-sm flex items-center space-x-2",
                                    student.currentClass === '12th' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-blue-50 border-blue-200 text-blue-600"
                                )}>
                                    <GraduationCap size={16} />
                                    <span>{student.currentClass || '11th'} Standard</span>
                                </div>
                                <button
                                    onClick={() => saveMarks(student)}
                                    disabled={savingId === student.id}
                                    className="px-6 py-2.5 premium-gradient text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center"
                                >
                                    {savingId === student.id ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                                    Update Marks & Status
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {subjects.map(sub => (
                                <div key={sub} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{sub}</label>
                                    <input
                                        type="number"
                                        max="100"
                                        className="w-full bg-white border-none rounded-lg p-2 font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/10"
                                        value={student.marks?.[sub] || ""}
                                        onChange={(e) => handleMarkChange(student.id!, sub, e.target.value)}
                                    />
                                    <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-500", (student.marks?.[sub] || 0) >= 35 ? "bg-emerald-500" : "bg-rose-500")}
                                            style={{ width: `${student.marks?.[sub] || 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Award className={cn("inline-block", subjects.every(sub => (student.marks?.[sub] || 0) >= 35) ? "text-emerald-500" : "text-slate-300")} size={20} />
                                <span className="text-sm font-bold text-slate-500">
                                    Status: <span className={cn(subjects.every(sub => (student.marks?.[sub] || 0) >= 35) ? "text-emerald-600" : "text-rose-500")}>
                                        {subjects.every(sub => (student.marks?.[sub] || 0) >= 35) ? "QUALIFIED FOR PROMOTION" : "REPEATER / INCOMPLETE"}
                                    </span>
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 font-medium">Auto-promotes to 12th if all subjects {'>'}= 35</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
