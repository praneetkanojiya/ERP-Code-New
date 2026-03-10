"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { GraduationCap, Search, CheckCircle, XCircle, Clock, Filter, FileText } from "lucide-react";
import { AdmissionApplication } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminAdmissionsPage() {
    const [applications, setApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");

    useEffect(() => {
        const q = query(collection(db, "admissions"), orderBy("appliedAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AdmissionApplication[];
            setApplications(apps);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        try {
            const appRef = doc(db, "admissions", id);
            await updateDoc(appRef, {
                status: status,
                updatedAt: new Date(),
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "ALL" || app.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col space-y-8">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <GraduationCap size={20} />
                    </div>
                    <span className="font-bold text-lg">Admin<span className="text-blue-400">ERP</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Management</div>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-blue-600/20 text-blue-400 font-medium border border-blue-600/20">
                        <FileText size={18} />
                        <span>Admissions</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
                        <Clock size={18} />
                        <span>Attendance</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
                        <CheckCircle size={18} />
                        <span>Fees</span>
                    </button>
                </nav>

                <div className="pt-6 border-t border-slate-800">
                    <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Back to Website</Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admission Applications</h1>
                        <p className="text-slate-500">Review and manage student registrations for the current session.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Simple Stats */}
                        <div className="glass-card px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Total: {applications.length}</span>
                        </div>
                    </div>
                </header>

                {/* Filters */}
                <div className="mb-8 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by student name or email..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="text-slate-400" size={18} />
                        <select
                            className="px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:outline-none shadow-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card rounded-[2rem] overflow-hidden shadow-xl border border-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Student</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Course</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Percentage</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center space-y-2 text-slate-400">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                                <span className="text-sm">Loading applications...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredApps.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                                            No applications found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApps.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{app.studentName}</span>
                                                    <span className="text-xs text-slate-500">{app.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{app.courseName}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">{app.percentage}%</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={app.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {app.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateStatus(app.id!, 'APPROVED')}
                                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(app.id!, 'REJECTED')}
                                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Reject">
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {app.status !== 'PENDING' && (
                                                        <button
                                                            onClick={() => updateStatus(app.id!, 'PENDING')}
                                                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Move to Pending">
                                                            <Clock size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
        REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
        WAITLISTED: "bg-blue-100 text-blue-700 border-blue-200",
    };

    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border",
            styles[status as keyof typeof styles] || styles.PENDING
        )}>
            {status}
        </span>
    );
}

import Link from "next/link";
