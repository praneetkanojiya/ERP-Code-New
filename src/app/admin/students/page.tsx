"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDocs, where } from "firebase/firestore";
import { UserPlus, Search, Edit2, Trash2, Key, Loader2, User } from "lucide-react";
import { AdmissionApplication } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminStudentManagePage() {
    const [students, setStudents] = useState<AdmissionApplication[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only fetch APPROVED students for login management
        const q = query(collection(db, "admissions"), where("status", "==", "APPROVED"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdmissionApplication[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetPassword = (student: AdmissionApplication) => {
        // In a real app, this would use Firebase Auth. For now, we'll just log the action.
        alert(`Instructions for resetting password for ${student.studentName} (${student.email}) have been sent to their email.`);
    };

    const filtered = students.filter(s =>
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Student Login Management</h1>
                    <p className="text-slate-500">Manage student access and account details.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="glass-card bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-5">Student</th>
                                <th className="px-8 py-5">Login Email</th>
                                <th className="px-8 py-5">Course</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic">No students found.</td></tr>
                            ) : (
                                filtered.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase">
                                                    {s.studentName.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-900">{s.studentName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-slate-600 font-medium">{s.email}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">{s.courseId}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right space-x-2">
                                            <button
                                                onClick={() => resetPassword(s)}
                                                className="p-3 bg-white border border-slate-100 rounded-xl text-amber-500 hover:border-amber-500 transition-all shadow-sm"
                                                title="Reset Password"
                                            >
                                                <Key size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
