// import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
// import './globals.css';
// import Sidebar from '../components/Sidebar';
// import Navbar from '../components/Navbar';

// const inter = Inter({ subsets: ['latin'] });

// export const metadata: Metadata = {
//   title: 'CloudVault - Secure Cloud Storage',
//   description: 'Secure cloud file storage application',
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" className="dark">
//       <body className={`${inter.className} text-white min-h-screen flex overflow-hidden`}>
//         {/* Sidebar Component */}
//         <Sidebar />
        
//         {/* Main Content Area */}
//         <div className="flex-1 flex flex-col h-screen overflow-hidden">
//           {/* Navbar Component */}
//           <Navbar />
          
//           {/* Page Content */}
//           <main className="flex-1 overflow-y-auto p-6">
//             {children}
//           </main>
//         </div>
//       </body>
//     </html>
//   );
// }


import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}