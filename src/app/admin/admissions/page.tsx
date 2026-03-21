"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { GraduationCap, Search, CheckCircle, XCircle, Clock, Filter, FileText, Loader2, Layers, Edit2, Trash2 } from "lucide-react";
import { AdmissionApplication } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminAdmissionsPage() {
    const [applications, setApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
    const [editingApp, setEditingApp] = useState<AdmissionApplication | null>(null);
    const [editingDetails, setEditingDetails] = useState<any>({
        rollNumber: "",
        admissionDate: "",
        tenthBoard: ""
    });

    useEffect(() => {
        console.log("AdminAdmissionsPage: Initializing data fetch...");
        const q = query(collection(db, "classes"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            setClasses(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
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
        try {
            const appRef = doc(db, "admissions", id);
            await updateDoc(appRef, {
                status: status,
                updatedAt: new Date(),
            });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteApplication = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to completely delete the application for ${name}? This action cannot be undone.`)) return;
        
        setUpdatingId(id);
        try {
            await deleteDoc(doc(db, "admissions", id));
        } catch (error) {
            console.error("Error deleting application:", error);
            alert("Failed to delete application.");
        } finally {
            setUpdatingId(null);
        }
    };

    const saveDetails = async () => {
        if (!editingApp?.id) return;
        setUpdatingId(editingApp.id);
        try {
            const appRef = doc(db, "admissions", editingApp.id);
            await updateDoc(appRef, {
                ...editingDetails,
                updatedAt: new Date(),
            });
            setEditingApp(null);
        } catch (error) {
            console.error("Error saving details:", error);
            alert("Failed to save student details.");
        } finally {
            setUpdatingId(null);
        }
    };

    const openEditModal = (app: AdmissionApplication) => {
        setEditingApp(app);
        setEditingDetails({
            rollNumber: app.rollNumber || "",
            admissionDate: app.admissionDate || "",
            tenthBoard: app.tenthBoard || "",
            classId: app.classId || "",
            className: app.className || "",
            courseId: app.courseId || "",
            courseName: app.courseName || "",
            currentClass: app.currentClass || "",
        });
    };

    const handleClassChange = (newClassId: string) => {
        const foundClass = classes.find(c => c.id === newClassId);
        if (foundClass) {
            setEditingDetails({
                ...editingDetails,
                classId: foundClass.id,
                className: foundClass.name,
                courseId: foundClass.courseId || "",
                courseName: foundClass.courseName || "",
                currentClass: foundClass.standard || ""
            });
        } else {
            // If no class is selected or found, clear class-related details
            setEditingDetails({
                ...editingDetails,
                classId: "",
                className: "",
                courseId: "",
                courseName: "",
                currentClass: ""
            });
        }
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
                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">Admissions Pipeline</h1>
                        <p className="text-slate-500 font-medium">Review, approve, or reject student applications.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex-1 w-full sm:w-auto">
                            <Layers className="text-slate-400 ml-3 shrink-0" size={18} />
                            <select
                                className="bg-transparent text-sm font-bold text-slate-900 outline-none pr-4 py-1 w-full cursor-pointer"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                <option value="ALL">All Classes & Divisions</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex-1 w-full sm:w-auto">
                            <Filter className="text-slate-400 ml-3 shrink-0" size={18} />
                            <select
                                className="bg-transparent text-sm font-bold text-slate-900 outline-none pr-4 py-1 w-full cursor-pointer"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or roll no..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

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
                                        <option value="">-- Choose Board --</option>
                                        <option value="SSC State Board">SSC State Board</option>
                                        <option value="CBSE">CBSE</option>
                                        <option value="ICSE">ICSE</option>
                                        <option value="Other Board">Other Board</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Class/Division</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none"
                                        value={editingDetails.classId || ""}
                                        onChange={(e) => handleClassChange(e.target.value)}
                                    >
                                        <option value="">-- Assign a Class --</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
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
                                                    <button
                                                        onClick={() => deleteApplication(app.id!, app.studentName)}
                                                        disabled={updatingId === app.id}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50" title="Delete Student">
                                                        {updatingId === app.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={18} />}
                                                    </button>
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
