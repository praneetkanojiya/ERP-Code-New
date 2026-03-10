"use client";

import Link from "next/link";
import { GraduationCap, Users, CreditCard, ClipboardList, LayoutDashboard, Settings, LogOut, ArrowRight, TableIcon, BookOpen, Layers } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { AdmissionApplication } from "@/types";

export default function AdminDashboard() {
    const menuItems = [
        { title: "Admissions", icon: Users, href: "/admin/admissions", color: "bg-blue-500", desc: "Manage new registrations" },
        { title: "Bulk Admissions", icon: TableIcon, href: "/admin/admissions/table", color: "bg-indigo-500", desc: "Excel-like tabular entry" },
        { title: "Attendance", icon: ClipboardList, href: "/admin/attendance", color: "bg-emerald-500", desc: "Daily student logs" },
        { title: "Academic Marks", icon: BookOpen, href: "/admin/academic/marks", color: "bg-blue-600", desc: "Enter marks & promote" },
        { title: "Class Management", icon: Layers, href: "/admin/classes", color: "bg-indigo-500", desc: "Define divisions & sections" },
        { title: "Fees & Payments", icon: CreditCard, href: "/admin/payments", color: "bg-purple-500", desc: "Mark manual payments" },
        { title: "Fees Structure", icon: Settings, href: "/admin/fees/structure", color: "bg-rose-500", desc: "Set manual fee amounts" },
        { title: "Student Logins", icon: GraduationCap, href: "/admin/students", color: "bg-slate-900", desc: "Manage portal access" },
        { title: "Reports", icon: LayoutDashboard, href: "/admin/reports", color: "bg-orange-500", desc: "View payment status" },
    ];

    const exportToCSV = async () => {
        try {
            // Assuming 'db', 'collection', 'getDocs', and 'AdmissionApplication' are defined or imported elsewhere
            // For example:
            // import { db } from "@/lib/firebase";
            // import { collection, getDocs } from "firebase/firestore";
            // type AdmissionApplication = {
            //   studentName: string;
            //   email: string;
            //   phone: string;
            //   courseName: string;
            //   status: string;
            //   currentClass?: string;
            //   percentage: number;
            // };
            const snap = await getDocs(collection(db, "admissions"));
            const students = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as AdmissionApplication[];

            const headers = ["Student Name", "Email", "Phone", "Course", "Status", "Class", "Percentage"].join(",");
            const rows = students.map(s => [
                `"${s.studentName}"`,
                `"${s.email}"`,
                `"${s.phone}"`,
                `"${s.courseName}"`,
                `"${s.status}"`,
                `"${s.currentClass || '11th'}"`,
                `"${s.percentage}%"`
            ].join(",")).join("\n");

            const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "college_erp_master_data.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            alert("Error exporting data");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                        <GraduationCap size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">College<span className="text-blue-600">Admin</span></span>
                </div>
                <div className="flex items-center space-x-6">
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center"
                    >
                        <TableIcon size={16} className="mr-2" />
                        Export Master Excel
                    </button>
                    <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">View Website</Link>
                    <button className="text-slate-500 hover:text-rose-600 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <main className="container mx-auto px-8 py-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Dashboard Overview</h1>
                    <p className="text-slate-500">Welcome back, Administrator. Select an action below.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {menuItems.map((item) => (
                        <Link key={item.title} href={item.href} className="group p-1">
                            <div className="glass-card h-full p-8 rounded-[2.5rem] bg-white border border-transparent shadow-xl hover:shadow-2xl hover:border-slate-100 transition-all duration-300 transform hover:-translate-y-2">
                                <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                                    <item.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">{item.desc}</p>
                                <div className="flex items-center text-blue-600 font-bold text-sm tracking-wide">
                                    Explore Module
                                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Stats section could be added here */}
                <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute right-[-10%] top-[-10%] w-[40%] h-[120%] bg-blue-500/10 rounded-full blur-[60px]" />
                        <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Admission Velocity</h4>
                        <p className="text-3xl font-extrabold tracking-tight mb-2">+12% vs last week</p>
                        <p className="text-slate-400 text-sm">Growth in new application flow</p>
                    </div>
                    <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <h4 className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-4">Payment Recovery</h4>
                        <p className="text-3xl font-extrabold tracking-tight mb-2">₹1.2M Collected</p>
                        <p className="text-blue-100/70 text-sm">Revenue generated this month</p>
                    </div>
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
                        <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">System Status</h4>
                        <div className="flex items-center space-x-2 text-emerald-600">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-lg font-extrabold tracking-tight">Connected 24/7</p>
                        </div>
                        <p className="text-slate-500 text-sm mt-2">Firebase Cloud DB is healthy</p>
                    </div>
                </section>
            </main>
        </div>
    );
}
