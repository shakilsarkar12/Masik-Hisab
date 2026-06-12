import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Wallet } from 'lucide-react';

const Login = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center">
        {/* Brand logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/10 mb-4">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 tracking-wider">
            MasikHisab
          </h1>
          <p className="text-slate-400 text-sm mt-2">Manage your money like a professional</p>
        </div>

        <SignIn 
          appearance={{
            elements: {
              card: "bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-2xl",
              headerTitle: "text-slate-100",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-slate-800/50 border border-slate-700 text-slate-200 hover:bg-slate-800",
              socialButtonsBlockButtonText: "text-slate-200 font-semibold",
              dividerLine: "bg-slate-800",
              dividerText: "text-slate-500",
              formFieldLabel: "text-slate-400",
              formFieldInput: "bg-slate-800/50 border-slate-700 text-slate-200",
              formButtonPrimary: "bg-gradient-to-r from-sky-400 to-indigo-500 text-slate-950 font-bold border-none hover:opacity-90 transition-all",
              footerActionText: "text-slate-400",
              footerActionLink: "text-sky-400 hover:text-sky-300",
              identityPreviewText: "text-slate-200",
              identityPreviewEditButton: "text-sky-400",
              formFieldWarningText: "text-amber-400",
              formFieldErrorText: "text-rose-400",
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;
