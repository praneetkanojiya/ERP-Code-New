"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp, setDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { GraduationCap, Save, Plus, Trash2, Loader2, Download, Table as TableIcon, Layers, Edit2, XCircle } from "lucide-react";
import { COLLEGES_COURSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AdmissionApplication } from "@/types";

interface ClassInfo {
    id: string;
    name: string;
    standard: '11th' | '12th';
}

export default function AdminBulkAdmissionsPage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    
    const getEmptyRow = (): Partial<AdmissionApplication> => ({
        studentName: "", email: "", phone: "", courseId: COLLEGES_COURSES[0].id, percentage: 0, status: 'APPROVED',
        rollNumber: "", tenthBoard: "SSC State Board", admissionDate: new Date().toISOString().split('T')[0],
        documents: { tc: false, sscMarksheet: false, aadharStudent: false, aadharParent: false, migration: false },
        gender: "MALE"
    });

    const [rows, setRows] = useState<Partial<AdmissionApplication>[]>([getEmptyRow()]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Edit Modal State
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

    // Clear table when class changes to prevent accidental cross-saving
    useEffect(() => {
        setRows([getEmptyRow()]);
    }, [selectedClassId]);

    const loadExistingStudents = async () => {
        if (!selectedClassId) {
            alert("Please select a Class/Division first.");
            return;
        }
        setLoading(true);
        try {
            const q = query(collection(db, "admissions"), where("classId", "==", selectedClassId));
            const snap = await getDocs(q);
            const loadedRows = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Partial<AdmissionApplication>));
            
            if (loadedRows.length > 0) {
                // ensure documents block exists for old records
                const formatted = loadedRows.map((r: any) => ({
                    ...r,
                    documents: r.documents || { tc: false, sscMarksheet: false, aadharStudent: false, aadharParent: false, migration: false }
                }));
                setRows(formatted);
            } else {
                alert("No students found in this class.");
                setRows([getEmptyRow()]);
            }
        } catch (error) {
            console.error(error);
            alert("Error loading students");
        } finally {
            setLoading(false);
        }
    };

    const addRow = () => {
        setRows([...rows, getEmptyRow()]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        }
    };

    const handleChange = (index: number, field: keyof AdmissionApplication | 'namePrefix', value: any) => {
        const updatedRows = [...rows];
        const row = { ...updatedRows[index], [field as any]: value };
        
        if (field === 'studentName' && value) {
            const parts = (value as string).split(' ').filter(Boolean);
            if (['Shri', 'Smt', 'Ku'].includes(parts[0])) {
                row.namePrefix = parts[0] as any;
                parts.shift();
            }
            if (parts.length > 0) row.firstName = parts[0] as any;
            if (parts.length > 2) {
                row.lastName = parts.pop() as any;
                row.middleName = parts.join(' ') as any;
            } else if (parts.length === 2) {
                row.lastName = parts[1] as any;
                row.middleName = '' as any;
            } else {
                row.lastName = '' as any;
                row.middleName = '' as any;
            }
        } else if (['namePrefix', 'firstName', 'middleName', 'lastName'].includes(field)) {
            const prefix = row.namePrefix ? row.namePrefix + ' ' : '';
            const first = row.firstName || '';
            const middle = row.middleName ? ' ' + row.middleName : '';
            const last = row.lastName ? ' ' + row.lastName : '';
            row.studentName = `${prefix}${first}${middle}${last}`.trim().replace(/\s+/g, ' ');
        }

        updatedRows[index] = row;
        setRows(updatedRows);
    };

    const toggleDoc = (rowIndex: number, docId: string) => {
        const updatedRows = [...rows];
        const currentDocs = updatedRows[rowIndex].documents || { tc: false, sscMarksheet: false, aadharStudent: false, aadharParent: false, migration: false };
        updatedRows[rowIndex].documents = {
            ...currentDocs,
            [docId]: !(currentDocs as any)[docId]
        };
        setRows(updatedRows);
    };

    const handleSaveSingle = async (index: number) => {
        const row = rows[index];
        if (!selectedClassId) {
            alert("Please select a Class/Division first.");
            return;
        }
        if (!row.studentName) {
            alert("Please provide the student's name before saving.");
            return;
        }

        setSaving(true);
        try {
            const selectedClass: any = classes.find(c => c.id === selectedClassId);
            const dataToSave: any = {
                ...row,
                classId: selectedClassId,
                className: selectedClass?.name || '',
                courseId: selectedClass?.courseId || '',
                courseName: selectedClass?.courseName || '',
                updatedAt: serverTimestamp(),
            };

            if (row.id) {
                await updateDoc(doc(db, "admissions", row.id), dataToSave);
                alert(`Successfully updated student ${row.studentName}.`);
            } else {
                dataToSave.status = 'APPROVED';
                dataToSave.createdAt = serverTimestamp();
                dataToSave.admissionDate = new Date().toISOString();
                const docRef = await addDoc(collection(db, "admissions"), dataToSave);
                
                const updatedRows = [...rows];
                updatedRows[index] = { ...updatedRows[index], id: docRef.id };
                setRows(updatedRows);
                alert(`Successfully added new student ${row.studentName}.`);
            }
        } catch (error) {
            console.error("Error uniquely saving:", error);
            alert("Error saving individual row.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAll = async () => {
        if (!selectedClassId) {
            alert("Please select a Class/Division first.");
            return;
        }

        const validRows = rows.filter(r => r.studentName && parseInt(String(r.percentage || 0)) >= 0);
        if (validRows.length === 0) {
            alert("Please fill in at least student name for the rows you want to save.");
            return;
        }

        setSaving(true);
        try {
            const selectedClass = classes.find(c => c.id === selectedClassId);
            let updatedCount = 0;
            let addedCount = 0;

            for (const row of validRows) {
                const course = COLLEGES_COURSES.find(c => c.id === row.courseId);
                const docData = {
                    ...row,
                    email: row.email ? row.email.toLowerCase().trim() : "",
                    percentage: parseFloat(String(row.percentage)) || 0,
                    courseName: course?.name || row.courseName || "",
                    classId: selectedClassId,
                    className: selectedClass?.name || "",
                    currentClass: selectedClass?.standard || '11th',
                    updatedAt: serverTimestamp(),
                    recordedByAdmin: true
                };

                if (row.id) {
                    await updateDoc(doc(db, "admissions", row.id), docData);
                    updatedCount++;
                } else {
                    await addDoc(collection(db, "admissions"), {
                        ...docData,
                        appliedAt: serverTimestamp(),
                    });
                    addedCount++;
                }
            }
            alert(`Successfully added ${addedCount} and updated ${updatedCount} students in ${selectedClass?.name}!`);
            // reload to get IDs for new rows
            await loadExistingStudents();
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

    const editingRow = editingIndex !== null ? rows[editingIndex] : null;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 relative">
            <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">Mass Edit & Entry</h1>
                    <p className="text-slate-500 font-medium">Step 1: Select Class &rarr; Step 2: Load/Bulk Entry</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-64">
                        <Layers className="text-slate-400 mr-3" size={18} />
                        <select
                            className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.standard})</option>)}
                        </select>
                    </div>
                    <button onClick={loadExistingStudents} disabled={loading} className="w-full sm:w-auto flex items-center px-6 py-3.5 bg-slate-200 text-slate-800 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-300 transition-all disabled:opacity-50">
                        <Download size={18} className="mr-2" />
                        Load Existing
                    </button>
                    <button onClick={handleSaveAll} disabled={saving} className="w-full sm:w-auto flex items-center px-8 py-3.5 premium-gradient text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
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
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, index) => (
                                <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-6 py-4 text-center font-bold text-slate-300 border-r border-slate-100">{index + 1}</td>

                                    <td className="p-4 border-r border-slate-100 w-[300px]">
                                        <div className="space-y-3">
                                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-500/20 focus:bg-white transition-all" placeholder="Student Full Name" value={row.studentName || ''} onChange={(e) => handleChange(index, 'studentName', e.target.value)} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" className="px-3 py-2 bg-slate-50/50 rounded-lg text-xs font-bold text-blue-600 outline-none" placeholder="Roll No" value={row.rollNumber || ''} onChange={(e) => handleChange(index, 'rollNumber', e.target.value)} />
                                                <input type="date" className="px-3 py-2 bg-slate-50/50 rounded-lg text-xs outline-none" value={row.admissionDate || ''} onChange={(e) => handleChange(index, 'admissionDate', e.target.value)} />
                                            </div>
                                            <input type="email" className="w-full px-4 py-2 bg-slate-50 rounded-xl text-xs outline-none" placeholder="Official Email" value={row.email || ''} onChange={(e) => handleChange(index, 'email', e.target.value)} />
                                        </div>
                                    </td>

                                    <td className="p-4 border-r border-slate-100 w-[240px]">
                                        <div className="space-y-3">
                                            <select className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-blue-500/20 focus:bg-white transition-all" value={row.courseId || ''} onChange={(e) => handleChange(index, 'courseId', e.target.value)}>
                                                {COLLEGES_COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <select className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={row.tenthBoard || ''} onChange={(e) => handleChange(index, 'tenthBoard', e.target.value)}>
                                                <option value="SSC State Board">SSC State Board</option>
                                                <option value="CBSE">CBSE</option>
                                                <option value="ICSE">ICSE</option>
                                                <option value="Other Board">Other Board</option>
                                            </select>
                                            <div className="relative">
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">SSC %</span>
                                                <input type="number" className="w-full px-4 py-2 bg-slate-50 rounded-xl text-sm font-black text-blue-700 outline-none" placeholder="00.00" value={row.percentage || 0} onChange={(e) => handleChange(index, 'percentage', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 border-r border-slate-100">
                                        <div className="grid grid-cols-5 gap-2">
                                            {[
                                                { id: 'tc', label: 'Leaving Cert (T.C.)' },
                                                { id: 'sscMarksheet', label: '10th (SSC) Marksheet' },
                                                { id: 'aadharStudent', label: 'Std Aadhar' },
                                                { id: 'aadharParent', label: 'Parent Aadhar' },
                                                { id: 'migration', label: 'Migration Cert' }
                                            ].map((docItem) => {
                                                const docs = row.documents || {} as any;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={docItem.id}
                                                        onClick={() => toggleDoc(index, docItem.id)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all",
                                                            docs[docItem.id]
                                                                ? "bg-emerald-500 border-emerald-600 text-white shadow-lg scale-110"
                                                                : "bg-white border-slate-100 text-slate-200 hover:border-slate-300"
                                                        )}
                                                        title={docItem.label}
                                                    >
                                                        {docItem.id === 'tc' ? 'TC' : docItem.id === 'sscMarksheet' ? 'SSC' : docItem.id === 'aadharStudent' ? 'ADS' : docItem.id === 'aadharParent' ? 'ADP' : 'MG'}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => handleSaveSingle(index)} disabled={saving} className="text-emerald-500 hover:text-emerald-700 transition-colors p-3 bg-slate-50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-emerald-100" title="Save Individual Row">
                                                <Save size={18} />
                                            </button>
                                            <button onClick={() => setEditingIndex(index)} disabled={saving} className="text-blue-500 hover:text-blue-700 transition-colors p-3 bg-slate-50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-blue-100" title="Full Form Edit (Options 1-12)">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => removeRow(index)} disabled={saving} className="text-slate-200 hover:text-rose-500 transition-colors p-3 bg-slate-50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-rose-100" title="Remove Row">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
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
                </div>
            </div>

            {/* FULL FORM EDIT MODAL */}
            {editingIndex !== null && editingRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-6xl h-[90vh] bg-white rounded-[2.5rem] shadow-3xl border-4 border-blue-500/20 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Application Form for Admission</h2>
                                <p className="text-sm font-medium text-slate-500">Edit exhaustive details (Options 1-12) for {editingRow.studentName || 'New Student'}</p>
                            </div>
                            <button onClick={() => setEditingIndex(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><XCircle size={28} className="text-slate-400 hover:text-rose-500" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-12">
                            {/* Office Use Section */}
                            <section className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50">
                                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-6">For Office Use Only</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    <InputBlock label="Roll No." val={editingRow.rollNumber} onChange={(v: string) => handleChange(editingIndex, 'rollNumber', v)} />
                                    <InputBlock label="Official Email" val={editingRow.email} onChange={(v: string) => handleChange(editingIndex, 'email', v)} type="email" />
                                    <InputBlock label="Form No." val={editingRow.formNo} onChange={(v: string) => handleChange(editingIndex, 'formNo', v)} />
                                    <InputBlock label="Amt. Paid Rs." val={editingRow.amountPaid} onChange={(v: string) => handleChange(editingIndex, 'amountPaid', parseFloat(v) || 0)} type="number" />
                                    <InputBlock label="Receipt No." val={editingRow.receiptNo} onChange={(v: string) => handleChange(editingIndex, 'receiptNo', v)} />
                                    <InputBlock label="Date" val={editingRow.paymentDate} onChange={(v: string) => handleChange(editingIndex, 'paymentDate', v)} type="date" />
                                    <InputBlock label="Fee Type Category" val={editingRow.feeTypeCategory} onChange={(v: string) => handleChange(editingIndex, 'feeTypeCategory', v)} />
                                    <InputBlock label="Caste Category" val={editingRow.casteCategory} onChange={(v: string) => handleChange(editingIndex, 'casteCategory', v)} />
                                    <InputBlock label="To Class" val={editingRow.className} disabled />
                                    <InputBlock label="Medium" val={editingRow.medium} onChange={(v: string) => handleChange(editingIndex, 'medium', v)} />
                                    <InputBlock label="Aadhar No." val={editingRow.aadharNo} onChange={(v: string) => handleChange(editingIndex, 'aadharNo', v)} />
                                    <InputBlock label="Udise No." val={editingRow.udiseNo} onChange={(v: string) => handleChange(editingIndex, 'udiseNo', v)} />
                                    <InputBlock label="Session" placeholder="20__ - 20__" val={editingRow.session} onChange={(v: string) => handleChange(editingIndex, 'session', v)} />
                                </div>
                            </section>

                            <div className="text-center">
                                <h2 className="text-xl font-black text-slate-800 tracking-widest uppercase">Particulars of Applicant</h2>
                                <div className="w-24 h-1 bg-blue-500 mx-auto mt-2 rounded-full"></div>
                            </div>

                            {/* 1. Name */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">1) Name in full</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 block mb-1">Prefix</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                                            value={editingRow.namePrefix || ''}
                                            onChange={(e) => handleChange(editingIndex, 'namePrefix' as any, e.target.value)}
                                        >
                                            <option value="">None</option>
                                            <option value="Shri">Shri</option>
                                            <option value="Smt">Smt</option>
                                            <option value="Ku">Ku</option>
                                        </select>
                                    </div>
                                    <InputBlock label="First Name" val={editingRow.firstName} onChange={(v: string) => handleChange(editingIndex, 'firstName', v)} />
                                    <InputBlock label="Middle Name" val={editingRow.middleName} onChange={(v: string) => handleChange(editingIndex, 'middleName', v)} />
                                    <InputBlock label="Surname" val={editingRow.lastName} onChange={(v: string) => handleChange(editingIndex, 'lastName', v)} />
                                    <div className="md:col-span-4">
                                        <InputBlock label="Mother's Name" val={editingRow.mothersName} onChange={(v: string) => handleChange(editingIndex, 'mothersName', v)} />
                                    </div>
                                </div>
                            </section>

                            {/* 2 & 3. DOB, Sex, Caste */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">2) Date of Birth</h3>
                                    <div className="space-y-4">
                                        <InputBlock label="i) In Words" val={editingRow.dobInWords} onChange={(v: string) => handleChange(editingIndex, 'dobInWords', v)} />
                                        <InputBlock label="ii) In Figure" val={editingRow.dateOfBirth} onChange={(v: string) => handleChange(editingIndex, 'dateOfBirth', v)} type="date" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">3) Social Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 block mb-1">Sex</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" value={editingRow.gender || 'MALE'} onChange={(e) => handleChange(editingIndex, 'gender', e.target.value)}>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <InputBlock label="Caste" val={editingRow.caste} onChange={(v: string) => handleChange(editingIndex, 'caste', v)} />
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 block mb-1">Category</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['SC','ST','NT','OBC','Open','SBC'].map(cat => (
                                                    <button type="button" key={cat} onClick={() => handleChange(editingIndex, 'category', cat)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all border", editingRow.category === cat ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300")}>{cat}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 4. Father & Address */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">4) Name of Father/ Guardian & Address</h3>
                                <div className="space-y-4">
                                    <InputBlock label="Name of Father/ Guardian" val={editingRow.fatherName} onChange={(v: string) => handleChange(editingIndex, 'fatherName', v)} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl">
                                            <InputBlock label="i) Postal Address (Local)" val={editingRow.localAddress} onChange={(v: string) => handleChange(editingIndex, 'localAddress', v)} textarea />
                                            <InputBlock label="Contact Phone/Mobile No." val={editingRow.localPhone} onChange={(v: string) => handleChange(editingIndex, 'localPhone', v)} />
                                        </div>
                                        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl">
                                            <InputBlock label="ii) Postal Address (Permanent)" val={editingRow.permanentAddress} onChange={(v: string) => handleChange(editingIndex, 'permanentAddress', v)} textarea />
                                            <InputBlock label="Contact Phone/Mobile No." val={editingRow.permanentPhone} onChange={(v: string) => handleChange(editingIndex, 'permanentPhone', v)} />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 5, 6, 7.  */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">5) Subject to be offered</h3>
                                    <InputBlock label="Subjects (Comma separated 1 to 9)" val={editingRow.subjectsOffered} onChange={(v: string) => handleChange(editingIndex, 'subjectsOffered', v)} textarea />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">6) Mother Tongue</h3>
                                    <InputBlock label="Mother Tongue" val={editingRow.motherTongue} onChange={(v: string) => handleChange(editingIndex, 'motherTongue', v)} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">7) Student's Bank Account No.</h3>
                                    <InputBlock label="(Nationalise Bank)" val={editingRow.bankAccountNo} onChange={(v: string) => handleChange(editingIndex, 'bankAccountNo', v)} />
                                </div>
                            </section>

                            {/* 8. Educational Details */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">8) Educational Details Section</h3>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                                            <tr>
                                                <th className="p-3 border-b border-r border-slate-200">Name of Examination</th>
                                                <th className="p-3 border-b border-r border-slate-200">Name of Board</th>
                                                <th className="p-3 border-b border-r border-slate-200">Name of School/College</th>
                                                <th className="p-3 border-b border-r border-slate-200">Date of Passing</th>
                                                <th className="p-3 border-b border-r border-slate-200">Seat No (Last)</th>
                                                <th className="p-3 border-b border-r border-slate-200">Total Marks / Grade</th>
                                                <th className="p-3 border-b">Out of</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="p-2 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none text-sm" value={editingRow.lastExamName || ''} onChange={(e) => handleChange(editingIndex, 'lastExamName', e.target.value)} /></td>
                                                <td className="p-2 border-r border-slate-200">
                                                    <select className="w-full p-2 bg-transparent outline-none text-sm" value={editingRow.tenthBoard || ''} onChange={(e) => handleChange(editingIndex, 'tenthBoard', e.target.value)}>
                                                        <option value="">-- Select Board --</option>
                                                        <option value="SSC State Board">SSC State Board</option>
                                                        <option value="CBSE">CBSE</option>
                                                        <option value="ICSE">ICSE</option>
                                                        <option value="Other Board">Other Board</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none text-sm" value={editingRow.lastExamSchool || ''} onChange={(e) => handleChange(editingIndex, 'lastExamSchool', e.target.value)} /></td>
                                                <td className="p-2 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none text-sm" placeholder="DD/MM/YYYY" value={editingRow.lastExamPassingDate || ''} onChange={(e) => handleChange(editingIndex, 'lastExamPassingDate', e.target.value)} /></td>
                                                <td className="p-2 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none text-sm" value={editingRow.lastExamSeatNo || ''} onChange={(e) => handleChange(editingIndex, 'lastExamSeatNo', e.target.value)} /></td>
                                                <td className="p-2 border-r border-slate-200"><input type="number" className="w-full p-2 bg-transparent outline-none text-sm" placeholder="%" value={editingRow.percentage || ''} onChange={(e) => handleChange(editingIndex, 'percentage', e.target.value)} /></td>
                                                <td className="p-2"><input className="w-full p-2 bg-transparent outline-none text-sm" value={editingRow.lastExamOutOf || '100'} onChange={(e) => handleChange(editingIndex, 'lastExamOutOf', e.target.value)} /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4">
                                    <InputBlock label="Subject offered at the Last Exam (1 to 9)" val={editingRow.lastExamSubjects} onChange={(v: string) => handleChange(editingIndex, 'lastExamSubjects', v)} textarea />
                                </div>
                            </section>

                            {/* 10, 11, 12 */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">10) Occupation</h3>
                                    <InputBlock label="Occupation of the Father/Guardian" val={editingRow.fatherOccupation} onChange={(v: string) => handleChange(editingIndex, 'fatherOccupation', v)} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">11) Income</h3>
                                    <InputBlock label="Annual Income in Rs." val={editingRow.annualIncome} onChange={(v: string) => handleChange(editingIndex, 'annualIncome', v)} type="number" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 bg-slate-100 px-4 py-2 rounded-lg inline-block">12) Extra Curricular</h3>
                                    <InputBlock label="Sports/Games Participated" val={editingRow.gamesOrSports} onChange={(v: string) => handleChange(editingIndex, 'gamesOrSports', v)} textarea />
                                </div>
                            </section>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4 shrink-0">
                            <button onClick={handleSaveAll} disabled={saving} className="px-6 py-3 rounded-2xl font-bold bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg disabled:opacity-50">
                                {saving ? <Loader2 className="animate-spin" /> : "Save All Application Changes"}
                            </button>
                            <button onClick={() => setEditingIndex(null)} className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200">Close Form Editor</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InputBlock({ label, placeholder, val, onChange, type = "text", disabled = false, textarea = false }: any) {
    return (
        <div className="w-full">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 block mb-1">{label}</label>
            {textarea ? (
                <textarea
                    disabled={disabled}
                    placeholder={placeholder || label}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm disabled:opacity-50"
                    value={val || ''}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                />
            ) : (
                <input
                    type={type}
                    disabled={disabled}
                    placeholder={placeholder || label}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm disabled:opacity-50"
                    value={val || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </div>
    );
}
