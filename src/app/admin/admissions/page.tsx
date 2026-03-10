"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { GraduationCap, Search, CheckCircle, XCircle, Clock, Filter, FileText, Loader2, Layers, Edit2 } from "lucide-react";
import { AdmissionApplication } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminAdmissionsPage() {
    const [applications, setApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
    const [editingApp, setEditingApp] = useState<AdmissionApplication | null>(null);
    const [editingDetails, setEditingDetails] = useState({
        rollNumber: "",
        admissionDate: "",
        tenthBoard: ""
    });

    useEffect(() => {
        console.log("AdminAdmissionsPage: Initializing data fetch...");
        const q = query(collection(db, "classes"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            setClasses(snapshot.docs.map((doc: any) => ({ id: doc.id, name: doc.data().name })));
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = query(collection(db, "admissions"), orderBy("appliedAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const apps = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as AdmissionApplication[];
            setApplications(apps);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        console.log(`DEBUG: Updating status for ADM-ID ${id} to ${status}...`);

        const timeout = setTimeout(() => {
            console.error("DEBUG: updateStatus timed out after 15s");
            alert("Update operation timed out. Check connection.");
            setUpdatingId(null);
        }, 15000);

        try {
            const appRef = doc(db, "admissions", id);
            await updateDoc(appRef, {
                status: status,
                updatedAt: new Date(),
            });
            console.log("DEBUG: Status update SUCCESS.");
            clearTimeout(timeout);
        } catch (error: any) {
            clearTimeout(timeout);
            console.error("DEBUG: updateStatus ERROR:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const saveDetails = async () => {
        if (!editingApp?.id) return;
        setUpdatingId(editingApp.id);
        console.log("DEBUG: Saving student details for:", editingApp.studentName);

        const timeout = setTimeout(() => {
            console.error("DEBUG: saveDetails timed out after 15s");
            alert("Save operation timed out.");
            setUpdatingId(null);
        }, 15000);

        try {
            const appRef = doc(db, "admissions", editingApp.id);
            await updateDoc(appRef, {
                ...editingDetails,
                updatedAt: new Date(),
            });
            console.log("DEBUG: saveDetails SUCCESS.");
            clearTimeout(timeout);
            setEditingApp(null);
        } catch (error: any) {
            clearTimeout(timeout);
            console.error("DEBUG: saveDetails ERROR:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const openEditModal = (app: AdmissionApplication) => {
        setEditingApp(app);
        setEditingDetails({
            rollNumber: app.rollNumber || "",
            admissionDate: app.admissionDate || "",
            tenthBoard: app.tenthBoard || "SSC State Board"
        });
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (app.rollNumber && app.rollNumber.includes(searchTerm));
        const matchesStatus = filterStatus === "ALL" || app.status === filterStatus;
        const matchesClass = selectedClassId === "ALL" || app.classId === selectedClassId;
        return matchesSearch && matchesStatus && matchesClass;
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* ... sidebar unchanged ... */}
            <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col space-y-8">
                <div className="flex items-center space-x-2 text-blue-500">
                    <GraduationCap size={32} />
                    <span className="font-bold text-white tracking-widest uppercase text-lg">Admin<span className="text-blue-400">Portal</span></span>
                </div>
                {/* Simplified Sidebar for Speed */}
                <nav className="flex-1 space-y-4">
                    <Link href="/admin" className="flex items-center space-x-3 text-slate-400 hover:text-white transition-colors">
                        <Layers size={18} />
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/admin/admissions" className="flex items-center space-x-3 text-blue-400 font-bold">
                        <FileText size={18} />
                        <span>Admissions</span>
                    </Link>
                    <Link href="/admin/classes" className="flex items-center space-x-3 text-slate-400 hover:text-white transition-colors">
                        <GraduationCap size={18} />
                        <span>Classes</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-auto relative">
                {/* ... existing header and filters ... */}

                {/* Edit Modal */}
                {editingApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                        <div className="glass-card bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-3xl space-y-8 border-4 border-blue-500/20">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black text-slate-900">Edit Student Details</h2>
                                <button onClick={() => setEditingApp(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XCircle size={24} /></button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Roll Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-blue-600"
                                        value={editingDetails.rollNumber}
                                        onChange={(e) => setEditingDetails({ ...editingDetails, rollNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Admission Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={editingDetails.admissionDate}
                                        onChange={(e) => setEditingDetails({ ...editingDetails, admissionDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">10th Board</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none"
                                        value={editingDetails.tenthBoard}
                                        onChange={(e) => setEditingDetails({ ...editingDetails, tenthBoard: e.target.value })}
                                    >
                                        <option value="SSC State Board">SSC State Board</option>
                                        <option value="CBSE">CBSE</option>
                                        <option value="ICSE">ICSE</option>
                                        <option value="Other Board">Other Board</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                disabled={updatingId === editingApp.id}
                                onClick={saveDetails}
                                className="w-full py-4 premium-gradient text-white font-black rounded-2xl shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center disabled:opacity-50"
                            >
                                {updatingId === editingApp.id ? <Loader2 className="animate-spin" /> : "Save Changes"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="glass-card rounded-[2rem] overflow-hidden shadow-xl border border-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Student</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Division</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Percentage</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                                ) : filteredApps.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No students found.</td></tr>
                                ) : (
                                    filteredApps.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{app.studentName}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Roll: {app.rollNumber || 'TBD'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{app.className || 'Unassigned'}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{app.courseName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">{app.percentage}%</span>
                                            </td>
                                            <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(app)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Details"><Edit2 size={18} /></button>
                                                    {app.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateStatus(app.id!, 'APPROVED')}
                                                                disabled={updatingId === app.id}
                                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50" title="Approve">
                                                                {updatingId === app.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(app.id!, 'REJECTED')}
                                                                disabled={updatingId === app.id}
                                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50" title="Reject">
                                                                {updatingId === app.id ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={18} />}
                                                            </button>
                                                        </>
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
