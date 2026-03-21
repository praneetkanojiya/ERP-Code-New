"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { GraduationCap, Save, Search, Loader2, Award, ArrowUpCircle, BookOpen, Layers } from "lucide-react";
import { AdmissionApplication } from "@/types";
import { COLLEGES_COURSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ClassInfo {
    id: string;
    name: string;
    standard: '11th' | '12th';
}

export default function AdminAcademicMarksPage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [students, setStudents] = useState<AdmissionApplication[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

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

    const handleMarkChange = (studentId: string, subject: string, marks: string) => {
        const updated = [...students];
        const index = updated.findIndex(s => s.id === studentId);
        if (index === -1) return;

        const currentMarks = updated[index].marks || {};
        updated[index].marks = { ...currentMarks, [subject]: parseInt(marks) || 0 };
        setStudents(updated);
    };

    const handleSubjectsChange = (studentId: string, newSubjectsStr: string) => {
        const updated = [...students];
        const index = updated.findIndex(s => s.id === studentId);
        if (index === -1) return;
        updated[index].subjectsOffered = newSubjectsStr;
        setStudents(updated);
    };

    const toggleHoldPromotion = (studentId: string) => {
        const updated = [...students];
        const index = updated.findIndex(s => s.id === studentId);
        if (index === -1) return;
        updated[index].holdPromotion = !updated[index].holdPromotion;
        setStudents(updated);
    };

    const handlePromoteClassChange = (studentId: string, newClassId: string) => {
        const updated = [...students];
        const index = updated.findIndex((s: any) => s.id === studentId);
        if (index === -1) return;
        updated[index].promoteToClassId = newClassId;
        setStudents(updated);
    };

    const getSubjectsForStudent = (student: any) => {
        if (student.subjectsOffered && student.subjectsOffered.trim().length > 0) {
            return student.subjectsOffered.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        const course = COLLEGES_COURSES.find(c => c.id === student.courseId);
        return course?.subjects || ["English", "Mathematics", "Science", "Social Studies"];
    };

    const saveMarks = async (student: any) => {
        setSavingId(student.id!);
        try {
            const subjects = getSubjectsForStudent(student);
            const isPassed = subjects.length > 0 ? subjects.every((sub: string) => (student.marks?.[sub] || 0) >= 35) : false; // 35 is passing
            
            let dataToUpdate: any = {
                ...student,
                updatedAt: serverTimestamp(),
            };

            let promoMessage = `Details and Marks updated for ${student.studentName}.`;

            if (isPassed && !student.holdPromotion && student.promoteToClassId) {
                const targetClass: any = classes.find(c => c.id === student.promoteToClassId);
                if (targetClass) {
                    dataToUpdate.classId = targetClass.id;
                    dataToUpdate.className = targetClass.name;
                    dataToUpdate.courseId = targetClass.courseId;
                    dataToUpdate.courseName = targetClass.courseName;
                    dataToUpdate.currentClass = targetClass.standard || '12th';
                    promoMessage = `${student.studentName} PASSED and has been PROMOTED to ${targetClass.name}!`;
                }
            } else if (isPassed && !student.holdPromotion && !student.promoteToClassId && student.currentClass === '11th') {
                dataToUpdate.currentClass = '12th';
            }

            delete dataToUpdate.promoteToClassId;

            await setDoc(doc(db, "admissions", student.id!), dataToUpdate);

            alert(promoMessage);
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
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">Academic Marks Portal</h1>
                    <p className="text-slate-500 font-medium">Record subject marks and promote students to the next standard.</p>

                    <div className="flex items-center space-x-3 mt-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        <Layers className="text-slate-400 ml-3" size={18} />
                        <select
                            className="bg-transparent text-sm font-bold text-slate-900 outline-none pr-8 cursor-pointer"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.standard})</option>)}
                        </select>
                    </div>
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

            {!selectedClassId ? (
                <div className="glass-card bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                    <Layers className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-bold">Please select a class to view and enter marks.</p>
                </div>
            ) : loading && students.length === 0 ? (
                <div className="text-center p-20"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
            ) : filtered.length === 0 ? (
                <div className="glass-card bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                    <Search className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-bold">No approved students found in this class.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {filtered.map((student: any) => {
                        const subjects = getSubjectsForStudent(student);
                        const isPassed = subjects.length > 0 ? subjects.every((sub: string) => (student.marks?.[sub] || 0) >= 35) : false;

                        return (
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
                                            className="px-6 py-2.5 premium-gradient text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center min-w-[160px] disabled:opacity-50"
                                        >
                                            {savingId === student.id ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                                            {savingId === student.id ? "Saving..." : "Update Marks"}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-700">Subjects Offered (Comma Separated)</label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={student.holdPromotion || false} 
                                                onChange={() => toggleHoldPromotion(student.id!)} 
                                                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer" 
                                            />
                                            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Hold Promotion</span>
                                        </label>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={student.subjectsOffered !== undefined ? student.subjectsOffered : getSubjectsForStudent(student).join(', ')} 
                                        onChange={(e) => handleSubjectsChange(student.id!, e.target.value)} 
                                        className="w-full px-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all"
                                        placeholder="e.g. English, Physics, Chemistry..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {subjects.map((sub: string) => (
                                        <div key={sub} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 leading-tight h-5 overflow-hidden">{sub}</label>
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

                                <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Award className={cn("inline-block", isPassed ? "text-emerald-500" : "text-slate-300")} size={20} />
                                            <span className="text-sm font-bold text-slate-500">
                                                Status: <span className={cn(isPassed ? "text-emerald-600" : "text-rose-500")}>
                                                    {isPassed ? (student.holdPromotion ? "QUALIFIED (HELD)" : "QUALIFIED FOR PROMOTION") : "REPEATER / INCOMPLETE"}
                                                </span>
                                            </span>
                                        </div>
                                        
                                        {isPassed && !student.holdPromotion && (
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                                <label className="text-xs font-bold text-emerald-800 whitespace-nowrap">Promote to Division:</label>
                                                <select 
                                                    className="px-3 py-2 rounded-lg border border-emerald-200 text-sm outline-none bg-white text-emerald-900 font-semibold w-full sm:w-auto"
                                                    value={student.promoteToClassId || ''}
                                                    onChange={(e) => handlePromoteClassChange(student.id!, e.target.value)}
                                                >
                                                    <option value="">-- Choose 12th Division --</option>
                                                    {classes.filter(c => c.standard === '12th' || c.name.includes('12')).map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 font-medium italic">Auto-promotes to 12th if all subjects {'>'}= 35</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
