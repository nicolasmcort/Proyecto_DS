import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Github } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  title: string;
  rightContent?: ReactNode;
}

export default function Layout({ children, title, rightContent }: LayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0F0F23" }}>
      <div
        className="flex flex-col w-[280px] justify-between border-r border-[#374151] min-h-screen"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <div className="flex-1 flex flex-col">
          <Sidebar />
        </div>
        <div>
          <a
            href="https://github.com/nicolasmcort/Proyecto_DS.git"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            style={{
              marginTop: "4px",
              padding: "0 16px 16px",
            }}
          >
            <Github size={16} />
            v.1.0 - Academic Edition
          </a>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-[60px] px-4 flex items-center justify-between"
          style={{
            backgroundColor: "#1A1A2E",
            borderBottom: "1px solid #16213E",
          }}
        >
          <h2
            className="text-lg font-bold truncate"
            style={{ color: "#E5E7EB", fontFamily: "Inter" }}
          >
            {title}
          </h2>
          {rightContent && (
            <div className="flex items-center gap-2 shrink-0">
              {rightContent}
            </div>
          )}
        </header>
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div >
  );
}