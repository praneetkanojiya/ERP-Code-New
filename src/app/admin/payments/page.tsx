"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, addDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { CreditCard, Search, Plus, Printer, CheckCircle2, DollarSign, User, Calendar } from "lucide-react";
import { AdmissionApplication, Transaction } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminPaymentsPage() {
    const [students, setStudents] = useState<AdmissionApplication[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<AdmissionApplication | null>(null);
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState<Transaction['paymentMethod']>("MANUAL");
    const [search, setSearch] = useState("");

    useEffect(() => {
        // Only fetch APPROVED students for payments
        const q = query(collection(db, "admissions"), where("status", "==", "APPROVED"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdmissionApplication[]);
        });

        const tQ = query(collection(db, "transactions"), serverTimestamp() !== null ? serverTimestamp() : serverTimestamp());
        const unsubscribe2 = onSnapshot(collection(db, "transactions"), (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]);
            setLoading(false);
        });

        return () => { unsubscribe(); unsubscribe2(); };
    }, []);

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !amount) return;

        try {
            const receiptNum = "RCP-" + Math.floor(100000 + Math.random() * 900000);
            await addDoc(collection(db, "transactions"), {
                studentId: selectedStudent.id,
                studentName: selectedStudent.studentName,
                amount: parseFloat(amount),
                paymentMethod: method,
                date: serverTimestamp(),
                recordedBy: "Administrator",
                receiptNumber: receiptNum,
            });

            setSelectedStudent(null);
            setAmount("");
            alert("Payment recorded successfully! Receipt " + receiptNum + " generated.");
        } catch (error) {
            console.error(error);
            alert("Error recording payment");
        }
    };

    const filteredStudents = students.filter(s => s.studentName.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold tracking-tight">Fees & Payments</h1>
                <p className="text-slate-500">Record payments manually and manage student financial records.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Record New Payment */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-8 rounded-[2rem] shadow-xl border border-white">
                        <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                            <Plus className="text-blue-600" size={24} />
                            <span>Record Payment</span>
                        </h2>

                        <form onSubmit={handleRecordPayment} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Student</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search student..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                                            {filteredStudents.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => { setSelectedStudent(s); setSearch(s.studentName); }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                                                >
                                                    {s.studentName} ({s.courseName})
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedStudent && (
                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                                        <span className="text-xs font-medium text-blue-600">{selectedStudent.studentName}</span>
                                        <button onClick={() => setSelectedStudent(null)} className="text-blue-400 hover:text-blue-600">×</button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount (₹)</label>
                                <input
                                    required
                                    type="number"
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-blue-500/20"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['MANUAL', 'CASH', 'UPI', 'CARD'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMethod(m as any)}
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                                                method === m ? "premium-gradient text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 premium-gradient text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                            >
                                Confirm & Generate Receipt
                            </button>
                        </form>
                    </div>
                </div>

                {/* Recent Transactions List */}
                <div className="lg:col-span-2">
                    <div className="glass-card rounded-[2rem] shadow-xl border border-white overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center space-x-2">
                                <CreditCard className="text-slate-400" size={24} />
                                <span>Recent Transactions</span>
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Receipt</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Student</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No transactions recorded yet.</td></tr>
                                    ) : (
                                        transactions.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{t.receiptNumber}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <User size={14} />
                                                        </div>
                                                        <span className="font-semibold text-slate-800">{t.studentName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900">₹{t.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar size={12} />
                                                        <span>{t.date?.toDate ? new Date(t.date.toDate()).toLocaleDateString() : "Just now"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => window.print()}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print Receipt">
                                                        <Printer size={18} />
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
            </div>
        </div>
    );
}
