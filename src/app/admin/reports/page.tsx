"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { BarChart3, PieChart, TrendingUp, Users, CreditCard, ClipboardList, ArrowLeft, Layers, Loader2 } from "lucide-react";
import Link from "next/link";
import { AdmissionApplication, Transaction } from "@/types";
import { COLLEGES_COURSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ClassInfo {
    id: string;
    name: string;
    standard: '11th' | '12th';
}

export default function AdminReportsPage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAdmissions: 0,
        approvedAdmissions: 0,
        totalRevenue: 0,
        avgAttendance: 0,
    });
    const [courseDistribution, setCourseDistribution] = useState<Record<string, number>>({});

    useEffect(() => {
        const q = query(collection(db, "classes"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const classData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ClassInfo[];
            setClasses(classData);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Fetch Admissions
            let admissionQuery = query(collection(db, "admissions"));
            if (selectedClassId !== "all") {
                admissionQuery = query(collection(db, "admissions"), where("classId", "==", selectedClassId));
            }
            const admissionSnap = await getDocs(admissionQuery);
            const admissions = admissionSnap.docs.map((doc: any) => doc.data()) as AdmissionApplication[];

            // Fetch Payments (Transactions) - Linked to admissions in that class
            let paymentsSnap;
            if (selectedClassId === "all") {
                paymentsSnap = await getDocs(collection(db, "payments"));
            } else {
                paymentsSnap = await getDocs(query(collection(db, "payments"), where("classId", "==", selectedClassId)));
            }
            const payments = paymentsSnap.docs.map((doc: any) => doc.data());

            // Fetch Attendance
            let attendanceSnap;
            if (selectedClassId === "all") {
                attendanceSnap = await getDocs(collection(db, "attendance"));
            } else {
                attendanceSnap = await getDocs(query(collection(db, "attendance"), where("classId", "==", selectedClassId)));
            }
            const attendance = attendanceSnap.docs.map((doc: any) => doc.data());

            // Calculate Stats
            const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            const approved = admissions.filter((a: any) => a.status === 'APPROVED').length;
            const avgAtt = attendance.length > 0
                ? (attendance.filter((a: any) => a.status === 'PRESENT').length / attendance.length) * 100
                : 0;

            // Course Distribution
            const distribution: Record<string, number> = {};
            admissions.forEach(a => {
                const course = COLLEGES_COURSES.find(c => c.id === a.courseId)?.name || "Other";
                distribution[course] = (distribution[course] || 0) + 1;
            });

            setStats({
                totalAdmissions: admissions.length,
                approvedAdmissions: approved,
                totalRevenue,
                avgAttendance: Math.round(avgAtt),
            });
            setCourseDistribution(distribution);
            setLoading(false);
        };
        fetchData();
    }, [selectedClassId]);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <Link href="/admin" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">System Reports</h1>
                    <p className="text-slate-500 font-medium">Key metrics and analytics for your college management.</p>
                </div>

                <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto">
                    <Layers className="text-slate-400 ml-3" size={18} />
                    <select
                        className="bg-transparent text-sm font-bold text-slate-900 outline-none pr-8 cursor-pointer flex-1"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                        <option value="all">All Divisions Combined</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.standard})</option>)}
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center p-40">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        <ReportCard title="Total Admissions" value={stats.totalAdmissions} icon={Users} color="text-blue-600" bg="bg-blue-50" />
                        <ReportCard title="Approved Students" value={stats.approvedAdmissions} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
                        <ReportCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={CreditCard} color="text-purple-600" bg="bg-purple-50" />
                        <ReportCard title="Avg Attendance" value={`${stats.avgAttendance}%`} icon={ClipboardList} color="text-orange-600" bg="bg-orange-50" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Course Distribution Chart */}
                        <div className="glass-card p-10 rounded-[3rem] bg-white shadow-xl border border-white">
                            <div className="flex items-center space-x-4 mb-8">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <PieChart size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Course Distribution</h3>
                                    <p className="text-slate-400 text-sm font-medium">Breakdown of applications across courses.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(courseDistribution).length === 0 ? (
                                    <p className="text-center py-10 text-slate-400 font-medium italic">No data available for this selection.</p>
                                ) : (
                                    Object.entries(courseDistribution).map(([course, count], idx) => {
                                        const percentage = (count / stats.totalAdmissions) * 100;
                                        const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500"];
                                        return (
                                            <div key={course} className="space-y-2">
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span className="text-slate-700">{course}</span>
                                                    <span className="text-slate-400">{count} students ({Math.round(percentage)}%)</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className={cn("h-full rounded-full transition-all duration-1000", colors[idx % colors.length])} style={{ width: `${percentage}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Efficiency Metric */}
                        <div className="glass-card p-10 rounded-[3rem] bg-white shadow-xl border border-white flex flex-col justify-center items-center text-center">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                                <BarChart3 size={48} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Admission Efficiency</h3>
                            <p className="text-slate-500 font-medium max-w-xs mb-8">
                                {stats.totalAdmissions > 0
                                    ? `${Math.round((stats.approvedAdmissions / stats.totalAdmissions) * 100)}% of all applications for this division have been approved.`
                                    : "No applications found to calculate efficiency."}
                            </p>
                            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm">
                                <TrendingUp size={16} />
                                <span>Target: 100% Approval</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function ReportCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <div className="glass-card p-8 rounded-[2.5rem] bg-white border border-white shadow-xl flex items-center space-x-6 hover:translate-y-[-4px] transition-all">
            <div className={`${bg} ${color} w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm`}>
                <Icon size={28} />
            </div>
            <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</h4>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
            </div>
        </div>
    );
}
