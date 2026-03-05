import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function TeacherDashboardPage() {
    const user = await getUser();
    if (!user) redirect("/auth");

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="border-b border-border p-4">
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                    ← Dashboard
                </Link>
            </div>
            <div className="flex flex-1 items-center justify-center p-4">
                <div className="max-w-md space-y-4 text-center">
                    <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                    <p className="text-muted-foreground">
                        View student progress, manage classes, and track school-wide performance. Access restricted to teacher accounts.
                    </p>
                </div>
            </div>
        </div>
    );
}
