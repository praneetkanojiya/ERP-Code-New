"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, setDoc, doc, onSnapshot } from "firebase/firestore";
import { GraduationCap, Save, Plus, Trash2, Loader2, ArrowLeft, Table as TableIcon, CheckSquare, Layers } from "lucide-react";
import { COLLEGES_COURSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ClassInfo {
    id: string;
    name: string;
    standard: '11th' | '12th';
}

interface RowData {
    id?: string;
    studentName: string;
    email: string;
    phone: string;
    courseId: string;
    percentage: string;
    status: 'APPROVED' | 'PENDING';
    rollNumber: string;
    tenthBoard: string;
    admissionDate: string;
    documents: {
        tc: boolean;
        sscMarksheet: boolean;
        aadharStudent: boolean;
        aadharParent: boolean;
        migration: boolean;
    };
}

export default function AdminBulkAdmissionsPage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [rows, setRows] = useState<RowData[]>([
        {
            studentName: "", email: "", phone: "", courseId: COLLEGES_COURSES[0].id, percentage: "", status: 'APPROVED',
            rollNumber: "", tenthBoard: "SSC State Board", admissionDate: new Date().toISOString().split('T')[0],
            documents: { tc: false, sscMarksheet: false, aadharStudent: false, aadharParent: false, migration: false }
        }
    ]);
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

    const addRow = () => {
        setRows([...rows, {
            studentName: "", email: "", phone: "", courseId: COLLEGES_COURSES[0].id, percentage: "", status: 'APPROVED',
            rollNumber: "", tenthBoard: "SSC State Board", admissionDate: new Date().toISOString().split('T')[0],
            documents: { tc: false, sscMarksheet: false, aadharStudent: false, aadharParent: false, migration: false }
        }]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        }
    };

    const handleChange = (index: number, field: keyof RowData, value: any) => {
        const updatedRows = [...rows];
        updatedRows[index] = { ...updatedRows[index], [field]: value };
        setRows(updatedRows);
    };

    const toggleDoc = (rowIndex: number, docId: keyof RowData['documents']) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex].documents[docId] = !updatedRows[rowIndex].documents[docId];
        setRows(updatedRows);
    };

    const handleSaveAll = async () => {
        if (!selectedClassId) {
            alert("Please select a Class/Division first.");
            return;
        }

        const validRows = rows.filter(r => r.studentName && r.email && r.courseId);
        if (validRows.length === 0) {
            alert("Please fill in at least one complete row.");
            return;
        }

        setSaving(true);
        try {
            const selectedClass = classes.find(c => c.id === selectedClassId);
            for (const row of validRows) {
                const course = COLLEGES_COURSES.find(c => c.id === row.courseId);
                await addDoc(collection(db, "admissions"), {
                    ...row,
                    email: row.email.toLowerCase().trim(),
                    percentage: parseFloat(row.percentage) || 0,
                    courseName: course?.name || "",
                    classId: selectedClassId,
                    className: selectedClass?.name || "",
                    currentClass: selectedClass?.standard || '11th',
                    appliedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    recordedByAdmin: true
                });
            }
            alert(`Successfully added ${validRows.length} students to ${selectedClass?.name}!`);
            setRows([{
                studentName: "", email: "", phone: "", courseId: COLLEGES_COURSES[0].id, percentage: "", status: 'APPROVED',
                rollNumber: "", tenthBoard: "SSC State Board", admissionDate: new Date().toISOString().split('T')[0],
                documents: { tc: false, sscMarksheet: false, aadharStudent: false, aadharParent: false, migration: false }
            }]);
        } catch (error) {
            console.error(error);
            alert("Error saving admissions data");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>;

    if (classes.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <div className="text-center bg-white p-12 rounded-[2.5rem] shadow-2xl border border-white max-w-md">
                    <Layers className="mx-auto text-slate-200 mb-6" size={64} />
                    <h2 className="text-2xl font-black text-slate-900 mb-4">No Divisions Found</h2>
                    <p className="text-slate-500 mb-8">You must create at least one Class/Division before you can add students.</p>
                    <Link href="/admin/classes" className="px-8 py-4 premium-gradient text-white rounded-2xl font-bold shadow-lg block">
                        Create Class Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">Mass Admission Entry</h1>
                    <p className="text-slate-500 font-medium">Step 1: Select Class &rarr; Step 2: Bulk Entry</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm w-full md:w-64">
                        <Layers className="text-slate-400 mr-3" size={18} />
                        <select
                            className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.standard})</option>)}
                        </select>
                    </div>
                    <button onClick={handleSaveAll} disabled={saving} className="w-full md:w-auto flex items-center px-8 py-3.5 premium-gradient text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                        Save All to Class
                    </button>
                </div>
            </header>

            <div className="glass-card bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center w-12 border-r border-white/10">#</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Enrollment Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Academic Info</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Document Checkpoints</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Delete</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, index) => (
                                <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-6 py-4 text-center font-bold text-slate-300 border-r border-slate-100">{index + 1}</td>

                                    {/* Student Info */}
                                    <td className="p-4 border-r border-slate-100 w-[300px]">
                                        <div className="space-y-3">
                                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-500/20 focus:bg-white transition-all" placeholder="Student Full Name" value={row.studentName} onChange={(e) => handleChange(index, 'studentName', e.target.value)} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" className="px-3 py-2 bg-slate-50/50 rounded-lg text-xs font-bold text-blue-600 outline-none" placeholder="Roll No" value={row.rollNumber} onChange={(e) => handleChange(index, 'rollNumber', e.target.value)} />
                                                <input type="date" className="px-3 py-2 bg-slate-50/50 rounded-lg text-xs outline-none" value={row.admissionDate} onChange={(e) => handleChange(index, 'admissionDate', e.target.value)} />
                                            </div>
                                            <input type="email" className="w-full px-4 py-2 bg-slate-50 rounded-xl text-xs outline-none" placeholder="Official Email" value={row.email} onChange={(e) => handleChange(index, 'email', e.target.value)} />
                                        </div>
                                    </td>

                                    {/* Course & Board */}
                                    <td className="p-4 border-r border-slate-100 w-[240px]">
                                        <div className="space-y-3">
                                            <select className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-blue-500/20 focus:bg-white transition-all" value={row.courseId} onChange={(e) => handleChange(index, 'courseId', e.target.value)}>
                                                {COLLEGES_COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <select className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={row.tenthBoard} onChange={(e) => handleChange(index, 'tenthBoard', e.target.value)}>
                                                <option value="SSC State Board">SSC State Board</option>
                                                <option value="CBSE">CBSE</option>
                                                <option value="ICSE">ICSE</option>
                                                <option value="Other Board">Other Board</option>
                                            </select>
                                            <div className="relative">
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">SSC %</span>
                                                <input type="number" className="w-full px-4 py-2 bg-slate-50 rounded-xl text-sm font-black text-blue-700 outline-none" placeholder="00.00" value={row.percentage} onChange={(e) => handleChange(index, 'percentage', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Documents */}
                                    <td className="px-6 py-4 border-r border-slate-100">
                                        <div className="grid grid-cols-5 gap-2">
                                            {[
                                                { id: 'tc', label: 'Leaving Cert (T.C.)' },
                                                { id: 'sscMarksheet', label: '10th (SSC) Marksheet' },
                                                { id: 'aadharStudent', label: 'Std Aadhar' },
                                                { id: 'aadharParent', label: 'Parent Aadhar' },
                                                { id: 'migration', label: 'Migration Cert' }
                                            ].map((doc) => (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => toggleDoc(index, doc.id as any)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all",
                                                        (row.documents as any)[doc.id]
                                                            ? "bg-emerald-500 border-emerald-600 text-white shadow-lg scale-110"
                                                            : "bg-white border-slate-100 text-slate-200 hover:border-slate-300"
                                                    )}
                                                    title={doc.label}
                                                >
                                                    {doc.id === 'tc' ? 'TC' : doc.id === 'sscMarksheet' ? 'SSC' : doc.id === 'aadharStudent' ? 'ADS' : doc.id === 'aadharParent' ? 'ADP' : 'MG'}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-medium text-slate-400 mt-4 italic text-center">Tap to mark as received</p>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => removeRow(index)} className="text-slate-200 hover:text-rose-500 transition-colors p-3 bg-slate-50 rounded-full group-hover:bg-white shadow-sm border border-transparent hover:border-rose-100">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-10 bg-slate-50/50 border-t border-slate-100 text-center flex flex-col items-center">
                    <button onClick={addRow} className="flex items-center space-x-2 text-sm font-black text-blue-600 hover:text-blue-700 transition-all uppercase tracking-widest group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        <span>Insert New Student Record</span>
                    </button>
                    <p className="text-[10px] font-medium text-slate-400 mt-4 uppercase tracking-[0.2em]">Always double check roll numbers before saving</p>
                </div>
            </div>
        </div>
    );
}
