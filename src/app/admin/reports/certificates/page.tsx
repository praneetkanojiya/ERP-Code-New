"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { AdmissionApplication } from "@/types";
import { ArrowLeft, Loader2, Printer, CheckCircle, FileText, Settings2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type CertificateType = "ATTENDANCE" | "ATTEMPT" | "CHARACTER" | "BONAFIDE";

export default function CertificatesPage() {
    const [students, setStudents] = useState<AdmissionApplication[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Cascading UI selections
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all");
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    
    const [selectedType, setSelectedType] = useState<CertificateType>("ATTENDANCE");
    
    // Editable certificate fields
    const [editableFields, setEditableFields] = useState({
        attendancePercent: "85",
        bonafideNo: "1",
        certificateDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        attemptNumber: "FIRST ATTEMPT",
        characterQuality: "good moral character"
    });

    useEffect(() => {
        const qClasses = query(collection(db, "classes"));
        const unsubClasses = onSnapshot(qClasses, (snap: any) => {
            setClasses(snap.docs.map((d: any) => ({id: d.id, ...d.data()})));
        });

        const qApps = query(collection(db, "admissions"));
        const unsubApps = onSnapshot(qApps, (snapshot: any) => {
            const apps = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as AdmissionApplication[];
            setStudents(apps.filter(app => app.status === 'APPROVED'));
            setLoading(false);
        });
        return () => { unsubApps(); unsubClasses(); };
    }, []);

    // Filter logic
    const uniqueYears = Array.from(new Set(classes.map(c => c.academicYear).filter(Boolean)));
    const filteredClasses = selectedAcademicYear === "all" ? classes : classes.filter(c => c.academicYear === selectedAcademicYear);
    
    const filteredStudents = students.filter(s => {
        let matchYear = selectedAcademicYear === "all" || s.academicYear === selectedAcademicYear;
        let matchClass = selectedClassId === "all" || s.classId === selectedClassId;
        return matchYear && matchClass;
    });

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    // Helpers to populate default text
    const hisHer = selectedStudent?.gender === 'Female' ? 'Her' : 'His';
    const heShe = selectedStudent?.gender === 'Female' ? 'She' : 'He';
    const boyOrGirl = selectedStudent?.gender === 'Female' ? 'Miss' : 'Master';

    const fullName = selectedStudent?.studentName || "";
    
    // Safely parse academic year from student
    const acYearSplit = (selectedStudent?.academicYear || "20__-20__").split("-");
    const yearStartShort = (acYearSplit[0] || "20__").slice(-2);
    const yearEndFull = acYearSplit[1] || "20__";
    const yearEndShort = yearEndFull.slice(-2);

    const updateField = (field: keyof typeof editableFields, value: string) => {
        setEditableFields(prev => ({ ...prev, [field]: value }));
    };

    const printCertificate = () => {
        window.print();
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 relative print:bg-white print:p-0">
            {/* NO PRINT REGION - Configuration UI */}
            <div className="p-6 md:p-10 print:hidden max-w-7xl mx-auto">
                <Link href="/admin/reports" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Reports
                </Link>

                <header className="mb-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileText size={24}/></div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Certificate Studio</h1>
                        <p className="text-slate-500 font-medium">Generate A4 print-ready certificates dynamically.</p>
                    </div>
                </header>

                <div className="glass-card bg-white rounded-[2.5rem] shadow-xl border border-white p-8 mb-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Filters */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Academic Year</label>
                            <select
                                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none font-bold text-slate-700 disabled:opacity-50"
                                value={selectedAcademicYear}
                                onChange={(e) => {
                                    setSelectedAcademicYear(e.target.value);
                                    setSelectedClassId("all");
                                    setSelectedStudentId("");
                                }}
                            >
                                <option value="all">All Years</option>
                                {uniqueYears.map(yr => <option key={yr as string} value={yr as string}>{yr as string}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Class / Division</label>
                            <select
                                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none font-bold text-slate-700 disabled:opacity-50"
                                value={selectedClassId}
                                onChange={(e) => {
                                    setSelectedClassId(e.target.value);
                                    setSelectedStudentId("");
                                }}
                            >
                                <option value="all">All Classes</option>
                                {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Active Student</label>
                            <select
                                className="w-full mt-2 px-4 py-3 bg-blue-50 border-2 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-300 font-black text-blue-700 transition-colors"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                                <option value="">-- Select a Student --</option>
                                {filteredStudents.map(s => (
                                    <option key={s.id} value={s.id!}>{s.studentName} ({s.className || 'No Class'})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Certificate Template</label>
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
                        <div className="flex items-end justify-end">
                            <button
                                onClick={printCertificate}
                                disabled={!selectedStudentId}
                                className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 focus:ring focus:ring-blue-200 transition-all flex items-center justify-center disabled:opacity-50 w-full md:w-auto"
                            >
                                <Printer className="mr-2" size={20} />
                                Print A4 Document
                            </button>
                        </div>
                    </div>

                    <p className="text-xs font-medium text-slate-400 text-center"><Settings2 size={12} className="inline mr-1" /> NOTE: Scroll down to the preview. You can click on dotted lines in the preview below to manually correct blank values before printing!</p>
                </div>
            </div>

            {/* PRINT REGION - A4 PAPER PREVIEW AND RENDER */}
            <div className={`w-full flex justify-center pb-20 print:p-0 print:block ${selectedStudentId ? 'block' : 'hidden md:flex'}`}>
                {/* 
                  A4 Paper Specifications:
                  Width: 210mm
                  Height: 297mm
                  Aspect Ratio strictly maintained on screen.
                */}
                <div className={cn(
                    "bg-white text-black relative mx-auto",
                    "w-[210mm] min-h-[297mm] h-[297mm] overflow-hidden",
                    "print:w-[210mm] print:h-[297mm] print:m-0 print:border-none print:shadow-none print:scale-100",
                    "shadow-2xl border border-slate-200 rounded-md scale-[0.6] sm:scale-75 lg:scale-100 origin-top flex flex-col items-center justify-center p-12"
                )}>
                    {!selectedStudentId ? (
                        <div className="text-center text-slate-300 font-bold flex flex-col items-center justify-center h-full gap-4">
                            <FileText size={64} className="opacity-20" />
                            <p className="text-xl">Select a student above to preview the A4 Certificate</p>
                        </div>
                    ) : (
                        <>
                            {/* ================== BONAFIDE CERTIFICATE ================== */}
                            {selectedType === "BONAFIDE" && (
                                <div className="border-[4px] border-black rounded-[2rem] p-12 text-center relative w-full h-full flex flex-col justify-start">
                                    <div className="flex justify-between items-center w-full mt-4 mb-10 px-4">
                                        <div className="text-lg font-bold flex items-center">
                                            No. <input type="text" value={editableFields.bonafideNo} onChange={(e) => updateField('bonafideNo', e.target.value)} className="w-16 ml-2 text-red-600 font-bold border-b border-dashed border-slate-300 outline-none print:border-none text-center bg-transparent" />
                                        </div>
                                        <div className="text-lg font-bold flex items-center">
                                            Date : <input type="text" value={editableFields.certificateDate} onChange={(e) => updateField('certificateDate', e.target.value)} className="w-28 ml-2 font-bold border-b border-dashed border-slate-300 outline-none print:border-none text-center bg-transparent" />
                                        </div>
                                    </div>
                                    
                                    <h1 className="text-[1.35rem] font-black uppercase mb-3">Shree Sadguru Gajanan Bahuuddeshiya Sanstha's</h1>
                                    <h2 className="text-[2.5rem] font-black uppercase mb-4 tracking-wide leading-none text-gray-900 border-b-2 border-black inline-block pb-2 mx-auto">Laxmilal Kanojiya</h2>
                                    <h3 className="text-[1.1rem] font-bold uppercase mb-16 leading-relaxed">Arts, Commerce & Science Jr. College<br/><span className="text-[0.95rem]">Chankapur, Khaperkheda, Dist. Nagpur</span></h3>
                                    
                                    <div className="inline-block border-[5px] border-black border-double px-10 py-4 mb-20 shadow-sm mx-auto">
                                        <h4 className="text-[2rem] font-black uppercase tracking-[0.2em]">Bonafide</h4>
                                    </div>

                                    <div className="text-justify text-xl font-medium leading-[3.5rem] tracking-wide px-8 mt-4 flex-1">
                                        This is to certify that {boyOrGirl}{" "} 
                                        <input type="text" value={fullName} onChange={() => {}} className="font-bold border-b-[2px] border-dashed border-black px-4 text-center outline-none bg-transparent min-w-[300px]" readOnly />
                                        <br/> is/was a bonafied student of this college studying in <input type="text" defaultValue={selectedStudent?.className || ''} className="font-bold border-b-[2px] border-dashed border-black px-2 text-center outline-none bg-transparent w-48" /> class during the year 20<input type="text" defaultValue={yearStartShort} className="font-bold border-b-[2px] border-dashed border-black px-1 text-center outline-none bg-transparent min-w-[30px] w-auto max-w-[40px]" /> - 20<input type="text" defaultValue={yearEndShort} className="font-bold border-b-[2px] border-dashed border-black px-1 text-center outline-none bg-transparent min-w-[30px] w-auto max-w-[40px]" />.
                                        
                                        <div className="mt-8 indent-12">
                                            {hisHer} Date of Birth as per College record is <input type="text" defaultValue={selectedStudent?.dateOfBirth || ''} className="font-bold border-b-[2px] border-dashed border-black px-2 text-center outline-none bg-transparent w-40" />.
                                        </div>
                                        <div className="mt-2 indent-12">
                                            While {heShe.toLowerCase()} is/was in this college, {hisHer.toLowerCase()} conduct and character found to be good.
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-auto px-12 mb-8">
                                        <div className="text-xl font-bold italic tracking-widest text-slate-700">Seal</div>
                                        <div className="text-xl font-bold uppercase tracking-widest border-t border-black pt-2 w-48 text-center mt-12">Principal</div>
                                    </div>
                                </div>
                            )}

                            {/* ================== CHARACTER CERTIFICATE ================== */}
                            {selectedType === "CHARACTER" && (
                                <div className="border-[4px] border-black rounded-[3rem] p-12 text-center relative w-full h-full flex flex-col justify-start">
                                    <div className="flex justify-between items-center w-full mt-6 mb-16 px-6">
                                        <div className="text-lg font-bold flex items-center">
                                            No. <input type="text" value={editableFields.bonafideNo} onChange={(e) => updateField('bonafideNo', e.target.value)} className="w-16 ml-2 font-bold border-b border-dashed border-slate-300 outline-none print:border-none text-center bg-transparent" />
                                        </div>
                                        <div className="text-lg font-bold flex items-center">
                                            Date : <input type="text" value={editableFields.certificateDate} onChange={(e) => updateField('certificateDate', e.target.value)} className="w-28 ml-2 font-bold border-b border-dashed border-slate-300 outline-none print:border-none text-center bg-transparent" />
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-[1.8rem] font-black uppercase leading-tight mb-20 tracking-wider">LATE LAXMILAL KANOJIYA ARTS, COMMERCE AND SCIENCE JUNIOR COLLEGE, CHANKAPUR.</h2>
                                    
                                    <h4 className="text-[1.8rem] font-bold uppercase tracking-[0.3em] underline underline-offset-[16px] decoration-4 mb-24">Character Certificate</h4>

                                    <div className="text-justify text-[1.3rem] font-medium leading-[4rem] px-8 flex-1">
                                        This is to certify that {boyOrGirl} <input type="text" value={fullName} onChange={() => {}} className="font-bold border-b-[2px] border-black px-4 text-center outline-none bg-transparent min-w-[300px]" readOnly /> was a pupil of the LATE LAXMILAL KANOJIYA ARTS, COMMERCE AND SCIENCE JUNIOR COLLEGE, Chankapur and that {heShe.toLowerCase()} has passed H.S.S.C Examination of March/Oct <input type="text" defaultValue={yearEndFull} className="font-bold border-b-[2px] border-black px-2 text-center outline-none bg-transparent w-24" />.
                                        
                                        <div className="mt-12 indent-12">
                                            {heShe} is a disciplined and obedient student and has a <input type="text" value={editableFields.characterQuality} onChange={(e) => updateField('characterQuality', e.target.value)} className="font-bold border-b-[2px] border-black px-2 text-center outline-none bg-transparent w-64" />.
                                        </div>
                                        <div className="mt-4 indent-12">
                                            I wish {hisHer.toLowerCase()} success in {hisHer.toLowerCase()} future life.
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-end mt-auto px-16 mb-8">
                                        <div className="text-xl font-bold uppercase tracking-widest border-t-2 border-black pt-2 w-64 text-center">Principal</div>
                                    </div>
                                </div>
                            )}

                            {/* ================== ATTEMPT CERTIFICATE ================== */}
                            {selectedType === "ATTEMPT" && (
                                <div className="border-[4px] border-black rounded-[3rem] p-12 text-center relative w-full h-full flex flex-col justify-start">
                                    <div className="flex justify-between items-center w-full mt-6 mb-16 px-6">
                                        <div className="text-lg font-bold flex items-center">
                                            No. <input type="text" value={editableFields.bonafideNo} onChange={(e) => updateField('bonafideNo', e.target.value)} className="w-16 ml-2 font-bold border-b border-dashed border-slate-300 outline-none print:border-none text-center bg-transparent" />
                                        </div>
                                        <div className="text-lg font-bold flex items-center">
                                            Date : <input type="text" value={editableFields.certificateDate} onChange={(e) => updateField('certificateDate', e.target.value)} className="w-28 ml-2 font-bold border-b border-dashed border-slate-300 outline-none print:border-none text-center bg-transparent" />
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-[1.8rem] font-black uppercase leading-tight mb-20 tracking-wider">LATE LAXMILAL KANOJIYA ARTS, COMMERCE AND SCIENCE JUNIOR COLLEGE, CHANKAPUR.</h2>
                                    
                                    <h4 className="text-[1.8rem] font-bold uppercase tracking-[0.3em] underline underline-offset-[16px] decoration-4 mb-24">Attempt Certificate</h4>

                                    <div className="text-justify text-[1.3rem] font-medium leading-[4rem] px-8 flex-1">
                                        This is to certify that {boyOrGirl} <input type="text" value={fullName} onChange={() => {}} className="font-bold border-b-[2px] border-black px-4 text-center outline-none bg-transparent min-w-[300px]" readOnly /> was a pupil of the LATE LAXMILAL KANOJIYA ARTS, COMMERCE AND SCIENCE JUNIOR COLLEGE, Chankapur and that {heShe.toLowerCase()} has passed H.S.S.C Examination of March/Oct <input type="text" defaultValue={yearEndFull} className="font-bold border-b-[2px] border-black px-2 text-center outline-none bg-transparent w-24" /> in <input type="text" value={editableFields.attemptNumber} onChange={(e) => updateField('attemptNumber', e.target.value)} className="font-black italic border-b-[2px] border-black px-2 text-center outline-none bg-transparent w-48" />.
                                    </div>

                                    <div className="flex justify-end items-end mt-auto px-16 mb-8">
                                        <div className="text-xl font-bold uppercase tracking-widest border-t-2 border-black pt-2 w-64 text-center">Principal</div>
                                    </div>
                                </div>
                            )}


                            {/* Fix typo switch case for ATTENDANCE since condition above said ATTANCE */}
                            {selectedType === "ATTENDANCE" && (
                                <div className="text-center relative w-full h-full flex flex-col justify-start pt-24 bg-white text-slate-900 border border-transparent">
                                    <h4 className="text-[2.2rem] font-black uppercase tracking-widest underline underline-offset-[16px] decoration-[5px] mb-32">Attendance Certificate</h4>

                                    <div className="text-justify text-[1.6rem] font-medium leading-[4.5rem] px-12 flex-1 mt-10">
                                        This is to certify that {boyOrGirl} <input type="text" value={fullName} onChange={() => {}} className="font-bold border-b-[3px] border-black focus:outline-none min-w-[400px] text-center bg-transparent" readOnly /><br/>
                                        <div className="mt-8"></div>
                                        with general register number <input type="text" defaultValue={selectedStudent?.rollNumber || ''} className="font-bold border-b-[3px] border-black focus:outline-none w-64 text-center bg-transparent" /><br/>
                                        <div className="mt-8"></div>
                                        is/was a Bonafide student of this college studying in <input type="text" defaultValue={selectedStudent?.className || ''} className="font-bold border-b-[3px] border-black focus:outline-none w-80 text-center bg-transparent" /><br/>
                                        <div className="mt-8"></div>
                                        and {hisHer.toLowerCase()} attendance is/was <input type="text" value={editableFields.attendancePercent} onChange={(e) => updateField('attendancePercent', e.target.value)} className="font-extrabold border-b-[3px] border-black focus:outline-none w-24 text-center text-[2rem] bg-transparent" /> % for the<br/>
                                        <div className="mt-8"></div> 
                                        academic year 20<input type="text" defaultValue={yearStartShort} className="font-bold border-b-[3px] border-black focus:outline-none w-16 text-center bg-transparent" /> - 20<input type="text" defaultValue={yearEndShort} className="font-bold border-b-[3px] border-black focus:outline-none w-16 text-center bg-transparent" />.
                                    </div>
                                    
                                    <div className="flex justify-end items-end mt-auto px-20 pb-16">
                                        <div className="text-2xl font-bold uppercase tracking-widest border-t-[3px] border-black pt-4 w-64 text-center">Principal</div>
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </div>
            </div>
            
        </div>
    );
}
