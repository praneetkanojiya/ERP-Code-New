"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { BarChart3, PieChart, TrendingUp, Users, CreditCard, ClipboardList, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdmissionApplication, Transaction } from "@/types";

export default function AdminReportsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAdmissions: 0,
        approvedAdmissions: 0,
        totalRevenue: 0,
        avgAttendance: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            const admissionSnap = await getDocs(collection(db, "admissions"));
            const admissions = admissionSnap.docs.map(doc => doc.data()) as AdmissionApplication[];

            const transactionSnap = await getDocs(collection(db, "transactions"));
            const transactions = transactionSnap.docs.map(doc => doc.data()) as Transaction[];

            const attendanceSnap = await getDocs(collection(db, "attendance"));
            const attendance = attendanceSnap.docs.map(doc => doc.data());

            const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const approved = admissions.filter(a => a.status === 'APPROVED').length;
            const avgAtt = attendance.length > 0
                ? (attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100
                : 0;

            setStats({
                totalAdmissions: admissions.length,
                approvedAdmissions: approved,
                totalRevenue,
                avgAttendance: Math.round(avgAtt),
            });
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
            </Link>

            <header className="mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">System Reports</h1>
                <p className="text-slate-500">Key metrics and analytics for your college management.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <ReportCard title="Total Admissions" value={stats.totalAdmissions} icon={Users} color="text-blue-600" bg="bg-blue-50" />
                <ReportCard title="Approved Students" value={stats.approvedAdmissions} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
                <ReportCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={CreditCard} color="text-purple-600" bg="bg-purple-50" />
                <ReportCard title="Avg Attendance" value={`${stats.avgAttendance}%`} icon={ClipboardList} color="text-orange-600" bg="bg-orange-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-10 rounded-[3rem] bg-white shadow-xl flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6 font-bold text-center">
                        <PieChart size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Admission Breakdown</h3>
                    <p className="text-slate-500 text-sm mb-6">Course-wise distribution of applications.</p>
                    <div className="w-full h-8 bg-slate-50 rounded-full overflow-hidden flex">
                        <div className="bg-blue-500 h-full w-[40%]" />
                        <div className="bg-emerald-400 h-full w-[30%]" />
                        <div className="bg-purple-400 h-full w-[20%]" />
                        <div className="bg-amber-300 h-full w-[10%]" />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2" /> BCA</span>
                        <span className="flex items-center"><div className="w-3 h-3 bg-emerald-400 rounded-full mr-2" /> BBA</span>
                        <span className="flex items-center"><div className="w-3 h-3 bg-purple-400 rounded-full mr-2" /> MCA</span>
                        <span className="flex items-center"><div className="w-3 h-3 bg-amber-300 rounded-full mr-2" /> B.Com</span>
                    </div>
                </div>

                <div className="glass-card p-10 rounded-[3rem] bg-white shadow-xl flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                        <BarChart3 size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Revenue Growth</h3>
                    <p className="text-slate-500 text-sm mb-6">Payment collection trends over time.</p>
                    <div className="flex items-end space-x-2 h-16 w-full max-w-[200px]">
                        <div className="bg-blue-600 w-full h-[40%] rounded-t-md" />
                        <div className="bg-blue-600 w-full h-[60%] rounded-t-md" />
                        <div className="bg-blue-600 w-full h-[30%] rounded-t-md" />
                        <div className="bg-blue-600 w-full h-[80%] rounded-t-md" />
                        <div className="bg-blue-600 w-full h-[100%] rounded-t-md" />
                    </div>
                    <p className="mt-6 text-sm font-bold text-blue-600">Stable growth (+8% monthly)</p>
                </div>
            </div>
        </div>
    );
}

function ReportCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <div className="glass-card p-8 rounded-[2.5rem] bg-white border border-white shadow-xl flex items-center space-x-6">
            <div className={`${bg} ${color} w-16 h-16 rounded-2xl flex items-center justify-center`}>
                <Icon size={28} />
            </div>
            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
            </div>
        </div>
    );
}
