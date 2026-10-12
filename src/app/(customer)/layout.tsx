import { Suspense } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomerOrderNotifier from "@/components/CustomerOrderNotifier";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CustomerOrderNotifier />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
