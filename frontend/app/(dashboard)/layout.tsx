import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col justify-between">
          <div className="mx-auto max-w-7xl w-full flex-1">
            {children}
          </div>
          <div className="pt-8">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}