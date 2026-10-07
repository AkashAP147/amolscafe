import AdminAuthProvider from "@/components/AdminAuthProvider";

export const metadata = {
  title: "Admin Portal | Amol's Cafe",
  description: "Management dashboard for Amol's Cafe",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}
