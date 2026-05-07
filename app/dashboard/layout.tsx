import Sidebar from "./Sidebar";
import { ToastProvider } from "./ToastProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-full min-h-screen">
        <Sidebar />
        <main className="ml-56 flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </ToastProvider>
  );
}
