'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
  filename?: string;
}

export function CodeSnippet({ code, language = 'typescript', title, filename }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-[#070A0F] overflow-hidden my-3 shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border bg-slate-900/70 text-xs font-mono">
        <span className="text-slate-300 font-semibold">{title || filename || language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in duration-150" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto scrollbar-thin leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
