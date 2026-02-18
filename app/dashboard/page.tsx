import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading dashboard...</p>}>
      <DashboardClient />
    </Suspense>
  );
}
