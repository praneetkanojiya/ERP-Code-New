import { COLLEGES_COURSES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <nav className="flex justify-between items-center px-10 py-6 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">L</div>
          <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">LK <span className="text-blue-600">ERP</span></span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="/admissions/apply" className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Apply Now</a>
          <a href="/student/portal" className="px-6 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-800">Student Login</a>
        </div>
      </nav>

      <main>
        <section className="py-24 px-10 text-center max-w-5xl mx-auto">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            Next-Gen College Management
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9]">
            Empowering <span className="text-blue-600">Education</span> through Technology.
          </h1>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            A comprehensive ERP solution for Late Laxmilal Kanojiya Junior College. Manage Admissions, Attendance, and Fees with ease.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="/admissions/apply" className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-lg shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98]">
              Start Admission Form
            </a>
            <a href="/admin" className="w-full md:w-auto px-10 py-5 bg-white border-2 border-slate-100 rounded-[2rem] font-bold text-lg text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all">
              Staff Dashboard
            </a>
          </div>
        </section>

        <section id="features" className="py-24 bg-slate-50 rounded-[5rem] mx-6 mb-24 p-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl font-black text-blue-600 mb-4">01</div>
              <h3 className="text-2xl font-bold mb-4">Admissions</h3>
              <p className="text-slate-500 font-medium">Fully digital registration process with real-time tracking for applicants.</p>
            </div>
            <div>
              <div className="text-4xl font-black text-blue-600 mb-4">02</div>
              <h3 className="text-2xl font-bold mb-4">Attendance</h3>
              <p className="text-slate-500 font-medium">Daily attendance monitoring and reporting for students and staff.</p>
            </div>
            <div>
              <div className="text-4xl font-black text-blue-600 mb-4">03</div>
              <h3 className="text-2xl font-bold mb-4">Fees</h3>
              <p className="text-slate-500 font-medium">Automated fee structures and instant e-receipt generation for payments.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
