import { Suspense } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
