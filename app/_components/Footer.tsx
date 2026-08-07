"use client"

import { Brain } from "lucide-react";

const COLUMNS = [
  {
    title: 'Platform',
    links: ['Features', 'How it works', 'Pricing', 'Changelog'],
  },
  {
    title: 'For educators',
    links: ['Instructor guide', 'Question library', 'Analytics', 'API docs'],
  },
  {
    title: 'Company',
    links: ['About', 'Privacy policy', 'Terms', 'Contact'],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#211E2B] px-6 md:px-8 pt-8 pb-4 border-t border-dark">
      <div className="max-w-265 mx-auto">
        <div className="flex flex-wrap justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-forest flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-medium text-sm text-white">PracticeHub</span>
            </div>
            <p className="text-xs text-[#726C7E] max-w-45 mt-1 leading-relaxed">
              AI‑powered assessment that actually measures understanding.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-medium text-[#726C7E] uppercase tracking-wider mb-2">{col.title}</p>
              <div className="space-y-1.5">
                {col.links.map((link) => (
                  <a key={link} className="block text-xs text-[#726C7E] hover:text-tan transition-colors cursor-pointer">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#211E2B] pt-4 flex flex-wrap justify-between text-[11.5px] text-[#2E2A3D]">
          <span>© 2025 PracticeHub. All rights reserved.</span>
          <span>Built with Next.js · NextAuth · Claude API</span>
        </div>
      </div>
    </footer>
  );
}