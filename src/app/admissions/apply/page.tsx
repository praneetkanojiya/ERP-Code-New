"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { GraduationCap, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { COLLEGES_COURSES } from "@/lib/constants";

const COURSES = COLLEGES_COURSES;

export default function AdmissionApplyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        studentName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "MALE",
        address: "",
        previousQualification: "",
        percentage: "",
        courseId: COURSES[0].id,
        classId: "11th",
        documents: {
            tc: false,
            sscMarksheet: false,
            aadharStudent: false,
            aadharParent: false,
            migration: false,
        }
    });

    const handleDocChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [name]: !((prev.documents as any)[name])
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const selectedCourse = COURSES.find(c => c.id === formData.courseId);

            const docRef = await addDoc(collection(db, "admissions"), {
                ...formData,
                percentage: parseFloat(formData.percentage),
                courseName: selectedCourse?.name || "",
                status: "PENDING",
                appliedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            console.log("Document written with ID: ", docRef.id);
            setLoading(false);
            setSubmitted(true);
            // Removed the delayed router.push to prevent confusion if user wants to see success message
        } catch (error) {
            console.error("Error submitting application:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
                <div className="glass-card max-w-md w-full p-10 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Application Submitted!</h1>
                    <p className="text-slate-600 leading-relaxed">
                        Thank you for applying. Your application has been received and is currently being reviewed. You can track your status in the student portal soon.
                    </p>
                    <div className="pt-4">
                        <Link href="/" className="inline-flex items-center text-blue-600 font-medium hover:underline">
                            <ArrowLeft className="mr-2" size={18} />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <header className="mb-12 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 premium-gradient rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <GraduationCap size={32} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-3">Admission Application</h1>
                    <p className="text-slate-500">Fill out the form below to start your journey with us.</p>
                </header>

                <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12 rounded-[2.5rem] shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Details */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b pb-2 text-slate-800">Personal Information</h2>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.studentName}
                                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="you@example.com"
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="+91 00000 00000"
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Gender</label>
                                    <select
                                        className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Academic Details */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b pb-2 text-slate-800">Academic Details</h2>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Previous Qualification</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Class 12th / Diploma"
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.previousQualification}
                                    onChange={(e) => setFormData({ ...formData, previousQualification: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Percentage / GPA</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.percentage}
                                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Course Selection</label>
                                <select
                                    required
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.courseId}
                                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                >
                                    {COURSES.map(course => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Added Class Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Apply for Class</label>
                                <select
                                    required
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={(formData as any).classId || "11th"}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                >
                                    <option value="11th">11th Standard</option>
                                    <option value="12th">12th Standard</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Address</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Full residental address"
                                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Documents Checklist */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Mandatory Documents Submitted</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            {[
                                { id: 'tc', label: 'Leaving Certificate (T.C.)' },
                                { id: 'sscMarksheet', label: '10th (SSC) Marksheet' },
                                { id: 'aadharStudent', label: 'Student Aadhar Card' },
                                { id: 'aadharParent', label: 'Parent Aadhar Card' },
                                { id: 'migration', label: 'Migration (Other Board)' },
                            ].map((doc) => (
                                <label key={doc.id} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:bg-blue-600 checked:border-blue-600"
                                            checked={(formData.documents as any)[doc.id]}
                                            onChange={() => handleDocChange(doc.id)}
                                        />
                                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{doc.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full py-5 premium-gradient text-white font-bold rounded-[2rem] shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 mt-8"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={20} />
                                Submitting Application...
                            </>
                        ) : (
                            "Submit Official Application"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
