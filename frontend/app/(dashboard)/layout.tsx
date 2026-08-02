import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#12162A]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Dashboard Content */}
        <main
          className="flex-1 overflow-y-auto p-8"
          style={{
            background: `
              radial-gradient(circle at 15% 20%, rgba(139,92,246,.18), transparent 30%),
              radial-gradient(circle at 85% 80%, rgba(6,182,212,.15), transparent 35%),
              radial-gradient(circle at 60% 10%, rgba(99,102,241,.08), transparent 25%),
              #12162A
            `,
          }}
        >
          <div className="mx-auto max-w-screen-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}