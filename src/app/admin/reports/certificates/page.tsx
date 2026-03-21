"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { AdmissionApplication } from "@/types";
import { ArrowLeft, Loader2, Printer, CheckCircle, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Four basic certificate types based on screenshots
type CertificateType = "ATTENDANCE" | "ATTEMPT" | "CHARACTER" | "BONAFIDE";

export default function CertificatesPage() {
    const [students, setStudents] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI selections
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [selectedType, setSelectedType] = useState<CertificateType>("ATTENDANCE");
    const [attendancePercent, setAttendancePercent] = useState("85");

    useEffect(() => {
        const q = query(collection(db, "admissions"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const apps = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as AdmissionApplication[];
            // Only APPROVED students normally
            setStudents(apps.filter(app => app.status === 'APPROVED'));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    // Helpers to populate text dynamically
    const boyOrGirl = selectedStudent?.gender === 'Female' ? 'Miss.' : 'Mr.';
    const hisHer = selectedStudent?.gender === 'Female' ? 'her' : 'his';
    const heShe = selectedStudent?.gender === 'Female' ? 'she' : 'he';
    const fullName = selectedStudent?.studentName || ".......................................................";
    
    // Splitting academic year safely
    const academicYearArray = (selectedStudent?.academicYear || "20__-20__").split("-");
    const yearStart = academicYearArray[0] || "20__";
    const yearEnd = academicYearArray[1] || "20__";

    const printCertificate = () => {
        window.print();
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 relative print:bg-white print:p-0">
            {/* NO PRINT REGION - Configuration UI */}
            <div className="p-6 md:p-10 print:hidden">
                <Link href="/admin/reports" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Reports
                </Link>

                <header className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Certificate Generator</h1>
                    <p className="text-slate-500">Select a student and certificate type to automatically populate data.</p>
                </header>

                <div className="glass-card bg-white rounded-[2.5rem] shadow-xl border border-white p-8 mb-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Find Student</label>
                            <select
                                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none font-bold text-slate-700"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                                <option value="">-- Choose a Student --</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id!}>{s.studentName} ({s.className || 'No Class'})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Certificate Type</label>
                            <select
                                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none font-bold text-slate-700"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as CertificateType)}
                            >
                                <option value="ATTENDANCE">Attendance Certificate</option>
                                <option value="ATTEMPT">Attempt Certificate</option>
                                <option value="CHARACTER">Character Certificate</option>
                                <option value="BONAFIDE">Bonafide Certificate</option>
                            </select>
                        </div>
                    </div>

                    {selectedType === "ATTENDANCE" && (
                        <div className="w-full md:w-1/2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Attendance Percentage (e.g. 85)</label>
                            <input 
                                type="text"
                                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700"
                                value={attendancePercent}
                                onChange={(e) => setAttendancePercent(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            onClick={printCertificate}
                            disabled={!selectedStudentId}
                            className="px-8 py-3 premium-gradient text-white font-black rounded-2xl shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            <Printer className="mr-2" size={20} />
                            Print Certificate
                        </button>
                    </div>
                </div>
            </div>

            {/* PRINT REGION - The Physical Certificate View */}
            {selectedStudentId && (
                <div className="print:block print:w-full print:h-screen print:flex print:items-center print:justify-center hidden md:flex w-full items-center justify-center py-10 print:py-0">
                    <div className={cn(
                        "bg-white text-black p-16 max-w-4xl w-full mx-auto relative",
                        // When NOT printing, show it styled visually like a piece of paper on screen
                        "print:shadow-none print:border-none print:m-0 print:p-8 border border-slate-200 shadow-2xl rounded-sm"
                    )}>

                        {/* ================== BONAFIDE CERTIFICATE ================== */}
                        {selectedType === "BONAFIDE" && (
                            <div className="border-[3px] border-black rounded-[2rem] p-12 text-center relative">
                                <div className="absolute top-12 left-12 text-lg font-bold">No. <span className="text-red-600">151</span></div>
                                <div className="absolute top-12 right-12 text-lg font-bold">Date : ______________</div>
                                
                                <h1 className="text-2xl font-black uppercase mb-2">Shree Sadguru Gajanan Bahuuddeshiya Sanstha's</h1>
                                <h2 className="text-4xl font-black uppercase mb-4 tracking-wide">Laxmilal Kanojiya</h2>
                                <h3 className="text-xl font-bold uppercase mb-10">Arts, Commerce & Science Jr. College<br/><span className="text-lg">Chankapur, Khaperkheda, Dist. Nagpur</span></h3>
                                
                                <div className="inline-block border-4 border-black border-double px-8 py-3 mb-12">
                                    <h4 className="text-3xl font-black uppercase tracking-widest">Bonafide Certificate</h4>
                                </div>

                                <div className="text-left text-xl font-medium leading-[3rem] tracking-wide px-8">
                                    This is to certify that Mr./Mrs./Miss. <span className="font-bold border-b-2 border-dashed border-black px-4">{fullName}</span><br/>
                                    is/was a bonafied student of this college studying in <span className="font-bold border-b-2 border-dashed border-black px-4">{selectedStudent?.className || '___________ '}</span><br/>
                                    class during the year 20<span className="font-bold border-b-2 border-dashed border-black px-2">{yearStart.slice(-2)}</span> - 20<span className="font-bold border-b-2 border-dashed border-black px-2">{yearEnd.slice(-2)}</span><br/><br/>
                                    <div className="pl-12">
                                        His/Her Date of Birth as per College record is <span className="font-bold border-b-2 border-dashed border-black px-4">{selectedStudent?.dateOfBirth || '___________'}</span>
                                    </div>
                                    <div className="mt-4">
                                        While {heShe} is/was in this college, {hisHer} conduct and character found to be good.
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-32 px-12 mb-8">
                                    <div className="text-xl font-bold">Seal</div>
                                    <div className="text-xl font-bold">Principal</div>
                                </div>
                            </div>
                        )}

                        {/* ================== CHARACTER CERTIFICATE ================== */}
                        {selectedType === "CHARACTER" && (
                            <div className="border-[3px] border-black rounded-[3rem] p-12 text-center relative max-w-3xl mx-auto h-[800px] flex flex-col justify-center">
                                <div className="absolute top-16 left-16 text-lg font-bold">No. ________</div>
                                <div className="absolute top-16 right-16 text-lg font-bold">Date : ______________</div>
                                
                                <h2 className="text-3xl font-black uppercase leading-tight mb-8">LATE LAXMILAL KANOJIYA ARTS, COMMERCE AND SCIENCE<br/>JUNIOR COLLEGE, CHANKAPUR.</h2>
                                
                                <h4 className="text-2xl font-bold uppercase tracking-widest underline underline-offset-8 mb-16">Character Certificate</h4>

                                <div className="text-left text-xl font-medium leading-[3rem] px-8">
                                    This is to certify that Master/Ms. <span className="font-bold border-b-2 border-dashed border-black px-4 w-1/2 inline-block text-center">{fullName}</span><br/>
                                    <span className="inline-block w-[30%] border-b-2 border-dashed border-black"></span> was a pupil of the LATE LAXMILAL KANOJIYA ARTS,<br/>
                                    COMMERCE AND SCIENCE JUNIOR COLLEGE, Chankapur and that {heShe} has passed H.S.S.C<br/>
                                    Examination of March/Oct <span className="font-bold border-b-2 border-dashed border-black px-4">{yearEnd}</span> .<br/><br/>
                                    <div className="pl-8 pt-4">
                                        He/She is a disciplined and obedient student and has a good moral character.
                                    </div>
                                    <div className="pl-8 pt-4">
                                        I wish him/her success in his/her future life.
                                    </div>
                                </div>

                                <div className="text-right mt-32 px-16">
                                    <div className="text-xl font-bold">PRINCIPAL</div>
                                </div>
                            </div>
                        )}

                        {/* ================== ATTEMPT CERTIFICATE ================== */}
                        {selectedType === "ATTEMPT" && (
                            <div className="border-[3px] border-black rounded-[3rem] p-12 text-center relative max-w-3xl mx-auto h-[800px] flex flex-col justify-center">
                                <div className="absolute top-16 left-16 text-lg font-bold">No. ________</div>
                                <div className="absolute top-16 right-16 text-lg font-bold">Date : ______________</div>
                                
                                <h2 className="text-3xl font-black uppercase leading-tight mb-8">LATE LAXMILAL KANOJIYA ARTS, COMMERCE AND SCIENCE<br/>JUNIOR COLLEGE, CHANKAPUR.</h2>
                                
                                <h4 className="text-2xl font-bold uppercase tracking-widest underline underline-offset-8 mb-16">Attempt Certificate</h4>

                                <div className="text-left text-xl font-medium leading-[3rem] px-8">
                                    This is to certify that Master/Ms. <span className="font-bold border-b-2 border-dashed border-black px-4 w-1/2 inline-block text-center">{fullName}</span><br/>
                                    <span className="inline-block w-[30%] border-b-2 border-dashed border-black"></span> was a pupil of the LATE LAXMILAL KANOJIYA ARTS,<br/>
                                    COMMERCE AND SCIENCE JUNIOR COLLEGE, Chankapur and that {heShe} has passed H.S.S.C<br/>
                                    Examination of March/Oct <span className="font-bold border-b-2 border-dashed border-black px-4">{yearEnd}</span> in FIRST ATTEMPT.<br/>
                                </div>

                                <div className="text-right mt-48 px-16">
                                    <div className="text-xl font-bold">PRINCIPAL</div>
                                </div>
                            </div>
                        )}

                        {/* ================== ATTENDANCE CERTIFICATE ================== */}
                        {selectedType === "ATTENDANCE" && (
                            <div className="p-16 text-center relative max-w-4xl mx-auto bg-white pt-24 text-slate-800">
                                <h4 className="text-3xl font-black uppercase tracking-widest underline underline-offset-[12px] decoration-4 mb-20">Attendance Certificate</h4>

                                <div className="text-left text-2xl font-medium leading-[4rem] px-8">
                                    This is to certify that Mr./Miss./Mrs. <span className="font-bold border-b focus:outline-none">{fullName}</span><br/>
                                    <span className="font-bold border-b focus:outline-none inline-block w-48 text-center">{selectedStudent?.tenthBoard || '____________________'}</span> with general register number <span className="font-bold border-b focus:outline-none inline-block w-48 text-center">{selectedStudent?.rollNumber || '_________________'}</span><br/>
                                    is/was a Bonafide student of this college studying in <span className="font-bold border-b focus:outline-none inline-block w-64 text-center">{selectedStudent?.className || '________________'}</span><br/>
                                    and {hisHer} attendance is/was <span className="font-bold border-b focus:outline-none px-4">{attendancePercent}</span> % for the academic year 20<span className="font-bold border-b focus:outline-none px-4">{yearStart.slice(-2)}</span> - 20<span className="font-bold border-b focus:outline-none px-4">{yearEnd.slice(-2)}</span> .
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            )}
            
        </div>
    );
}
