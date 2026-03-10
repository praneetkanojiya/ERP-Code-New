"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CreditCard, Save, Loader2, IndianRupee, Layers, Search } from "lucide-react";
import { COLLEGES_COURSES, COLLEGES_CLASSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CourseFee {
    total: number;
    inst1: number;
    inst2: number;
    inst3: number;
}

export default function AdminFeeStructurePage() {
    const [selectedClassId, setSelectedClassId] = useState(COLLEGES_CLASSES[0].id);
    const [fees, setFees] = useState<Record<string, CourseFee>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchFees = async () => {
            setLoading(true);
            const q = query(collection(db, "feeStructure"));
            const snapshot = await getDocs(q);
            const feeData: Record<string, CourseFee> = {};

            snapshot.docs.forEach(doc => {
                if (doc.id.startsWith(selectedClassId + "_")) {
                    const courseId = doc.id.replace(selectedClassId + "_", "");
                    const data = doc.data();
                    feeData[courseId] = {
                        total: data.total || 0,
                        inst1: data.inst1 || 0,
                        inst2: data.inst2 || 0,
                        inst3: data.inst3 || 0,
                    };
                }
            });
            setFees(feeData);
            setLoading(false);
        };
        fetchFees();
    }, [selectedClassId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const courseId in fees) {
                const compositeId = `${selectedClassId}_${courseId}`;
                await setDoc(doc(db, "feeStructure", compositeId), {
                    ...fees[courseId],
                    classId: selectedClassId,
                    courseId: courseId,
                    updatedAt: serverTimestamp(),
                });
            }
            alert(`Fee structure for ${COLLEGES_CLASSES.find(c => c.id === selectedClassId)?.name} updated!`);
        } catch (error) {
            console.error(error);
            alert("Error saving fee structure");
        } finally {
            setSaving(false);
        }
    };

    const updateFee = (courseId: string, field: keyof CourseFee, value: string) => {
        const numValue = parseFloat(value) || 0;
        setFees(prev => ({
            ...prev,
            [courseId]: {
                ...(prev[courseId] || { total: 0, inst1: 0, inst2: 0, inst3: 0 }),
                [field]: numValue
            }
        }));
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">Class-Wise Fee Structure</h1>
                    <p className="text-slate-500 font-medium italic mt-2">Differentiate fees across divisions & sections.</p>

                    <div className="flex items-center space-x-3 mt-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        <Layers className="text-slate-400 ml-3" size={18} />
                        <select
                            className="bg-transparent text-sm font-bold text-slate-900 outline-none pr-8 cursor-pointer"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            {COLLEGES_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto px-10 py-4 premium-gradient text-white rounded-[2rem] font-bold shadow-xl hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                    {saving ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                    Save {COLLEGES_CLASSES.find(c => c.id === selectedClassId)?.name} Fees
                </button>
            </header>

            {loading ? (
                <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
            ) : (
                <div className="space-y-8">
                    {COLLEGES_COURSES.map((course) => (
                        <div key={course.id} className="glass-card bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden p-8 hover:border-blue-100 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-1">{course.faculty}</span>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{course.name}</h3>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center space-x-4 bg-slate-900 px-8 py-4 rounded-[2rem] shadow-xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Course Fee</span>
                                    <div className="flex items-center font-black text-xl text-white">
                                        <IndianRupee size={18} className="mr-1 text-blue-400" />
                                        <input
                                            type="number"
                                            className="bg-transparent w-32 outline-none border-b border-white/20 focus:border-blue-400 transition-colors"
                                            value={fees[course.id]?.total || ""}
                                            onChange={(e) => updateFee(course.id, 'total', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { id: 'inst1', label: '1st Installment', color: 'text-emerald-600', bg: 'bg-emerald-50/30' },
                                    { id: 'inst2', label: '2nd Installment', color: 'text-amber-600', bg: 'bg-amber-50/30' },
                                    { id: 'inst3', label: '3rd Installment', color: 'text-rose-600', bg: 'bg-rose-50/30' },
                                ].map((inst) => (
                                    <div key={inst.id} className={cn("p-8 rounded-[2rem] border border-slate-100 relative group transition-all hover:bg-white hover:shadow-lg", inst.bg)}>
                                        <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] block mb-4", inst.color)}>{inst.label}</label>
                                        <div className="relative">
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300">
                                                <IndianRupee size={18} />
                                            </div>
                                            <input
                                                type="number"
                                                className="w-full pl-8 bg-transparent border-none outline-none font-black text-2xl text-slate-800"
                                                placeholder="0.00"
                                                value={fees[course.id]?.[inst.id as keyof CourseFee] || ""}
                                                onChange={(e) => updateFee(course.id, inst.id as keyof CourseFee, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex items-center justify-end">
                                <div className={cn(
                                    "px-6 py-2 rounded-full flex items-center space-x-2 text-[10px] font-black tracking-widest uppercase",
                                    (fees[course.id]?.inst1 + fees[course.id]?.inst2 + fees[course.id]?.inst3) === (fees[course.id]?.total)
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-rose-100 text-rose-700"
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", (fees[course.id]?.inst1 + fees[course.id]?.inst2 + fees[course.id]?.inst3) === (fees[course.id]?.total) ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                    <span>
                                        {(fees[course.id]?.inst1 + fees[course.id]?.inst2 + fees[course.id]?.inst3) === (fees[course.id]?.total)
                                            ? "Installment Match Verified"
                                            : "Balance Mismatch: Check Installments"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
