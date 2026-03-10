"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { GraduationCap, User, CreditCard, ClipboardList, LogOut, CheckCircle, Clock, XCircle, FileText, ChevronRight, CheckSquare, IndianRupee, Loader2 } from "lucide-react";
import { AdmissionApplication, Transaction } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function StudentPortalPage() {
    const [authEmail, setAuthEmail] = useState("");
    const [student, setStudent] = useState<AdmissionApplication | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [feeStructure, setFeeStructure] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        // Also fetch the fee structure for everyone to use
        const fetchStructure = async () => {
            const snap = await getDocs(collection(db, "feeStructure"));
            const data: Record<string, any> = {};
            snap.docs.forEach((d: any) => data[d.id] = d.data());
            setFeeStructure(data);
        };
        fetchStructure();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const emailLower = authEmail.trim().toLowerCase();
            const q = query(collection(db, "admissions"), where("email", "==", emailLower));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("This record does not exist. Please check your email or contact the college administration for more info.");
            } else {
                const studentDoc = snapshot.docs[0];
                const studentData = { id: studentDoc.id, ...studentDoc.data() } as AdmissionApplication;

                if (studentData.status !== 'APPROVED') {
                    alert("Your application is still PENDING. Full portal access is granted once your admission is APPROVED.");
                    setLoading(false);
                    return;
                }

                setStudent(studentData);

                // Fetch transactions
                const transQuery = query(collection(db, "payments"), where("studentId", "==", studentData.id));
                const transSnap = await getDocs(transQuery);
                const transList = transSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Transaction[];
                setTransactions(transList);

                // Fetch student's specific fee structure
                if (studentData.classId && studentData.courseId) {
                    const feeDocId = `${studentData.classId}_${studentData.courseId}`;
                    const feeSnap = await getDocs(query(collection(db, "feeStructure")));
                    const feeData = feeSnap.docs.find((d: any) => d.id === feeDocId)?.data();
                    if (feeData) {
                        setFeeStructure({
                            total: feeData.total || 0,
                            inst1: feeData.inst1 || 0,
                            inst2: feeData.inst2 || 0,
                            inst3: feeData.inst3 || 0,
                        });
                    }
                }

                // Fetch attendance
                const aQ = query(collection(db, "attendance"), where("studentId", "==", studentData.id));
                const aSnapshot = await getDocs(aQ);
                setAttendance(aSnapshot.docs.map((doc: any) => doc.data()));

                setLoggedIn(true);
            }
        } catch (error) {
            console.error(error);
            alert("Login failed");
        } finally {
            setLoading(false);
        }
    };

    if (!loggedIn) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
                <div className="glass-card max-w-md w-full p-10 rounded-[2.5rem] shadow-2xl border border-white">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 premium-gradient rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-6">
                            <User size={32} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Student Portal</h1>
                        <p className="text-slate-500 mt-2">Enter your registered email to access your dashboard.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Registered Email</label>
                            <input
                                required
                                type="email"
                                placeholder="you@example.com"
                                className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-4 premium-gradient text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                            {loading ? "Verifying..." : "Access My Dashboard"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/" className="text-sm text-slate-400 hover:text-blue-600 transition-colors">Back to Website</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <nav className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center text-white shadow-md">
                            <GraduationCap size={18} />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Student<span className="text-blue-600">Portal</span></span>
                    </div>
                    <button
                        onClick={() => setLoggedIn(false)}
                        className="flex items-center space-x-2 text-slate-500 hover:text-rose-600 transition-colors bg-slate-50 px-4 py-2 rounded-xl"
                    >
                        <LogOut size={16} />
                        <span className="text-sm font-bold">Logout</span>
                    </button>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-10">
                {/* Welcome Section */}
                <div className="glass-card premium-gradient p-10 rounded-[3rem] text-white shadow-2xl mb-10 overflow-hidden relative">
                    <div className="absolute right-[-5%] top-[-10%] w-[30%] h-[120%] bg-blue-400/10 rounded-full blur-[80px]" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <span className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-2 block">Welcome Back,</span>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-2">{student?.studentName}</h1>
                            <p className="text-slate-300 font-medium">{student?.courseName} • Roll No: {student?.rollNumber || 'Not Assigned'}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                                <span className="text-[10px] uppercase font-bold text-blue-200 block mb-1">Status</span>
                                <div className="flex items-center space-x-2">
                                    {student?.status === 'APPROVED' ? <CheckCircle size={16} className="text-emerald-400" /> : <Clock size={16} className="text-amber-400" />}
                                    <span className="font-bold">{student?.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Payments */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Division</p>
                                <p className="text-xl font-black text-slate-900">{student?.className || student?.currentClass || '11th'}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Roll No</p>
                                <p className="text-xl font-black text-blue-600">{student?.rollNumber || 'N/A'}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admission Date</p>
                                <p className="text-sm font-black text-slate-900">{student?.admissionDate || 'N/A'}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">10th Board</p>
                                <p className="text-xl font-black text-slate-900">{student?.tenthBoard || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div className="glass-card bg-white rounded-[2.5rem] p-8 shadow-xl border border-white">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold flex items-center space-x-3">
                                    <CreditCard className="text-blue-600" size={24} />
                                    <span>Fee Payments</span>
                                </h2>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="bg-slate-50 p-10 rounded-3xl text-center border-2 border-dashed border-slate-100">
                                    <div className="text-slate-300 mb-4 flex justify-center"><CreditCard size={48} /></div>
                                    <p className="text-slate-500 font-medium">No payment records found.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">Receipt #{t.receiptNumber}</p>
                                                    <p className="text-xs text-slate-500">{t.date?.toDate ? new Date(t.date.toDate()).toLocaleDateString() : 'Just now'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-extrabold text-slate-900">₹{t.amount.toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Paid via {t.paymentMethod}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar Info */}
                    <div className="space-y-8">
                        {/* Fee Progress Card */}
                        <div className="glass-card bg-white rounded-[2.5rem] p-8 shadow-xl border border-white relative overflow-hidden group">
                            <div className="absolute right-[-10%] bottom-[-10%] text-blue-500 opacity-[0.05] group-hover:scale-110 transition-transform">
                                <CreditCard size={160} />
                            </div>
                            <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
                                <CreditCard className="text-blue-500" size={24} />
                                <span>Fee Summary</span>
                            </h2>
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <span className="text-4xl font-extrabold tracking-tighter">
                                        ₹{(feeStructure.total || 0).toLocaleString()}
                                    </span>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Course Fee</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-rose-600">
                                        ₹{((feeStructure.total || 0) - transactions.reduce((s: number, t: any) => s + t.amount, 0)).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-400">Balance Due</p>
                                </div>
                            </div>
                        </div>

                        {/* Document Checklist */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                            <h3 className="text-xl font-bold mb-6 flex items-center">
                                <CheckSquare className="mr-3 text-blue-400" size={20} />
                                Document Status
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { id: 'tc', label: 'Leaving Cert (T.C.)' },
                                    { id: 'sscMarksheet', label: '10th (SSC) Marksheet' },
                                    { id: 'aadharStudent', label: 'Student Aadhar' },
                                    { id: 'aadharParent', label: 'Parent Aadhar' },
                                    { id: 'migration', label: 'Migration Certificate' }
                                ].map((docItem: any) => {
                                    const isVerified = student?.documents?.[docItem.id as keyof typeof student.documents];
                                    return (
                                        <div key={docItem.id} className={cn(
                                            "p-4 rounded-2xl flex items-center justify-between border transition-all",
                                            isVerified
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                : "bg-white/5 border-white/10 text-slate-500"
                                        )}>
                                            <span className="text-xs font-bold uppercase tracking-widest">{docItem.label}</span>
                                            {isVerified ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
