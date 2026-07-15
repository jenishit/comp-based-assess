"use client";

import { Brain } from "lucide-react";
import Link from "next/link";

const sections = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  return (
    <nav className="bg-espresso sticky top-0 z-100 px-7">
      <div className="max-w-content mx-auto flex items-center h-14.5 gap-7">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-[7px] bg-forest flex items-center justify-center">
            <Brain size={15} color="#fff" aria-hidden="true" />
          </div>
          <span className="font-medium text-base text-white tracking-tight">
            EduQuest
          </span>
        </div>
        <div className="flex gap-6 flex-1">
          {sections.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm text-[#A09488] hover:text-white transition-colors no-underline"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            className="px-4 py-1.75 rounded-lg border-[1.5px] border-sage bg-transparent
                       text-sage text-[13px] font-medium cursor-pointer hover:bg-sage/10
                       transition-colors"
          >
            Student join
          </button>
          <Link
            className="px-4 py-1.75 rounded-lg border-0 bg-forest text-white
                       text-[13px] font-medium cursor-pointer hover:bg-forest-dark
                       transition-colors"

                       href={"/login"}
          >
            Instructor login
          </Link>
        </div>
      </div>
    </nav>
  );
}
