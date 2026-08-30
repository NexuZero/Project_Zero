import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";
import { Home } from "@/pages/Home";
import { Results } from "@/pages/Results";
import { ProjectDetail } from "@/pages/ProjectDetail";
import { Favorites } from "@/pages/Favorites";
import { NotFound } from "@/pages/NotFound";

export default function App() {
  return (
    <ToastProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </ToastProvider>
  );
}
