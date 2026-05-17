import Sidebar from "./Sidebar";
import { ToastProvider } from "./ToastProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-full min-h-screen">
        <Sidebar />
        <main className="lg:ml-56 flex-1 p-4 sm:p-6 lg:p-8 overflow-auto pb-20 lg:pb-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
