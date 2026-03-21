"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Plus, Trash2, Loader2, ArrowLeft, Layers, GraduationCap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ClassInfo {
    id?: string;
    name: string; // e.g. Division A
    standard: '11th' | '12th';
    academicYear?: string;
    createdAt?: any;
}

export default function AdminClassesPage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newClass, setNewClass] = useState({ name: "", standard: '11th' as '11th' | '12th', academicYear: "2024-2025" });

    useEffect(() => {
        const q = query(collection(db, "classes"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const classData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ClassInfo[];
            setClasses(classData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClass.name) return;

        setSaving(true);
        try {
            await addDoc(collection(db, "classes"), {
                ...newClass,
                createdAt: serverTimestamp(),
            });
            setNewClass({ name: "", standard: '11th', academicYear: "2024-2025" });
        } catch (error) {
            console.error("Error adding class:", error);
            alert("Error adding class");
        } finally {
            setSaving(false);
        }
    };

    const deleteClass = async (id: string) => {
        if (!confirm("Are you sure? This will not delete students but they will lose their class association.")) return;
        try {
            await deleteDoc(doc(db, "classes", id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
            </Link>

            <header className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Class & Section Management</h1>
                <p className="text-slate-500">Define divisions for 11th and 12th standards.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Create Class Form */}
                <div className="lg:col-span-1">
                    <div className="glass-card bg-white rounded-[2.5rem] shadow-xl border border-white p-8 sticky top-24">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <Plus className="mr-2 text-blue-600" size={20} />
                            Add New Division
                        </h2>
                        <form onSubmit={handleAddClass} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Division Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Division A"
                                    className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/10 outline-none font-medium"
                                    value={newClass.name}
                                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Standard</label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    {['11th', '12th'].map((std) => (
                                        <button
                                            key={std}
                                            type="button"
                                            onClick={() => setNewClass({ ...newClass, standard: std as any })}
                                            className={cn(
                                                "py-3 rounded-2xl font-bold text-sm transition-all border",
                                                newClass.standard === std
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                                            )}
                                        >
                                            {std} Std
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Academic Year</label>
                                <select
                                    className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/10 outline-none font-medium text-slate-700"
                                    value={newClass.academicYear}
                                    onChange={(e) => setNewClass({ ...newClass, academicYear: e.target.value })}
                                >
                                    <option value="2023-2024">2023-2024</option>
                                    <option value="2024-2025">2024-2025</option>
                                    <option value="2025-2026">2025-2026</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 premium-gradient text-white font-bold rounded-2xl shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : "Create Division"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Classes List */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
                    ) : classes.length === 0 ? (
                        <div className="glass-card bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-slate-300">
                            <Layers className="mx-auto text-slate-200 mb-4" size={48} />
                            <p className="text-slate-400 font-medium italic">No divisions created yet. Start by adding one to the left.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {classes.map((cls) => (
                                <div key={cls.id} className="glass-card bg-white rounded-[2.5rem] shadow-lg border border-white p-8 hover:border-blue-200 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md",
                                            cls.standard === '11th' ? "bg-blue-500" : "bg-indigo-600"
                                        )}>
                                            {cls.standard === '11th' ? '11' : '12'}
                                        </div>
                                        <button
                                            onClick={() => deleteClass(cls.id!)}
                                            className="text-slate-200 hover:text-rose-500 transition-colors p-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{cls.name}</h3>
                                    <p className="text-sm font-medium text-slate-400 mb-6">{cls.standard} Standard Division {cls.academicYear ? `(${cls.academicYear})` : ''}</p>

                                    <div className="flex items-center text-blue-600 space-x-2 text-xs font-bold uppercase tracking-widest">
                                        <GraduationCap size={14} />
                                        <span>Ready for Enrollment</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
