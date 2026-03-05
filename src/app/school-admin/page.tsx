"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Building2,
    Users,
    Crown,
    Sparkles,
    Loader2,
    Settings,
    Plus,
    Trash2,
    Check,
    AlertCircle,
    BarChart3,
    GraduationCap,
    Mail,
} from "lucide-react";

interface SchoolData {
    id: string;
    name: string;
    tier: "pro" | "premium";
    subscription_status: string;
    total_seats: number;
    used_seats: number;
    domains: { domain: string; verified: boolean }[];
}

interface Student {
    id: string;
    email: string;
    display_name: string | null;
    created_at: string;
}

export default function SchoolAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [school, setSchool] = useState<SchoolData | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "students" | "settings">("overview");
    const [newDomain, setNewDomain] = useState("");
    const [addingDomain, setAddingDomain] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth?redirect=/school-admin");
    }, [authLoading, user, router]);

    const fetchSchool = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch school where user is admin
            const { data: schoolData } = await supabase
                .from("schools")
                .select("id, name, tier, subscription_status, total_seats, used_seats")
                .eq("admin_id", user.id)
                .maybeSingle();

            if (!schoolData) {
                router.replace("/school-signup");
                return;
            }

            // Fetch domains
            const { data: domainData } = await supabase
                .from("school_domains")
                .select("domain, verified")
                .eq("school_id", schoolData.id);

            setSchool({
                ...schoolData,
                domains: domainData || [],
            });

            // Fetch students
            const { data: studentData } = await supabase
                .from("profiles")
                .select("id, email, display_name, created_at")
                .eq("school_id", schoolData.id)
                .order("created_at", { ascending: false });

            setStudents(studentData || []);
        } catch (err) {
            console.error("Failed to load school:", err);
        } finally {
            setLoading(false);
        }
    }, [user, supabase, router]);

    useEffect(() => {
        if (user) fetchSchool();
    }, [user, fetchSchool]);

    const handleAddDomain = async () => {
        if (!newDomain.trim() || !school) return;
        setAddingDomain(true);
        try {
            const { error } = await supabase
                .from("school_domains")
                .insert({
                    school_id: school.id,
                    domain: newDomain.toLowerCase().trim(),
                    verified: false,
                });

            if (error) {
                if (error.code === "23505") {
                    toast.error("Domain already registered");
                } else {
                    toast.error("Failed to add domain");
                }
            } else {
                toast.success("Domain added");
                setNewDomain("");
                fetchSchool();
            }
        } finally {
            setAddingDomain(false);
        }
    };

    const handleRemoveDomain = async (domain: string) => {
        if (!school) return;
        const { error } = await supabase
            .from("school_domains")
            .delete()
            .eq("school_id", school.id)
            .eq("domain", domain);

        if (error) {
            toast.error("Failed to remove domain");
        } else {
            toast.success("Domain removed");
            fetchSchool();
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!school) return null;

    const seatsPercent = Math.round((school.used_seats / school.total_seats) * 100);
    const isActive = school.subscription_status === "active";

    return (
        <div className="min-h-screen bg-background pb-16">
            {/* Breadcrumb */}
            <div className="border-b bg-muted/30">
                <div className="container mx-auto flex items-center justify-between px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground">Home</Link>
                        <span>/</span>
                        <Link href="/schools" className="hover:text-foreground">Schools</Link>
                        <span>/</span>
                        <span className="text-foreground">Admin</span>
                    </nav>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-primary" />
                            <h1 className="text-3xl font-bold">{school.name}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${isActive
                                        ? "bg-green-500/10 text-green-600"
                                        : "bg-red-500/10 text-red-600"
                                    }`}
                            >
                                {school.subscription_status}
                            </span>
                            <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium">
                                {school.tier === "premium" ? (
                                    <Crown className="h-3 w-3" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                {school.tier} Plan
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
                    {(["overview", "students", "settings"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Overview */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Stat Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-border bg-card p-5">
                                <p className="mb-1 text-sm text-muted-foreground">Seat Usage</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">{school.used_seats}</span>
                                    <span className="text-muted-foreground">/ {school.total_seats}</span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`h-full transition-all ${seatsPercent >= 90 ? "bg-red-500" : "bg-primary"
                                            }`}
                                        style={{ width: `${Math.min(seatsPercent, 100)}%` }}
                                    />
                                </div>
                                {seatsPercent >= 90 && (
                                    <p className="mt-2 flex items-center gap-1 text-xs text-red-500">
                                        <AlertCircle className="h-3 w-3" /> Running low on seats
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-border bg-card p-5">
                                <p className="mb-1 text-sm text-muted-foreground">Active Students</p>
                                <div className="flex items-baseline gap-2">
                                    <Users className="h-6 w-6 text-primary" />
                                    <span className="text-3xl font-bold">{students.length}</span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-5">
                                <p className="mb-1 text-sm text-muted-foreground">Monthly Cost</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold">
                                        £{(school.total_seats * (school.tier === "premium" ? 10.49 : 6.99)).toFixed(2)}
                                    </span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {school.total_seats} seats × £{school.tier === "premium" ? "10.49" : "6.99"}
                                </p>
                            </div>
                        </div>

                        {/* Domains summary */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <h3 className="mb-3 flex items-center gap-2 font-semibold">
                                <Mail className="h-4 w-4" /> Licensed Domains
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {school.domains.map((d) => (
                                    <span
                                        key={d.domain}
                                        className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm"
                                    >
                                        @{d.domain}
                                        {d.verified && <Check className="h-3 w-3 text-green-500" />}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Students */}
                {activeTab === "students" && (
                    <div className="rounded-xl border border-border bg-card">
                        <div className="border-b border-border p-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <Users className="h-5 w-5" /> Licensed Students
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Students with active school licenses
                            </p>
                        </div>
                        {students.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                                <p>No students yet</p>
                                <p className="text-sm">
                                    Students will appear when they sign up with your school domain
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-muted/50">
                                        <tr className="text-left text-sm text-muted-foreground">
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s) => (
                                            <tr key={s.id} className="border-t border-border">
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    {s.display_name || "No name"}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                    {s.email}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {new Date(s.created_at).toLocaleDateString("en-GB", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings */}
                {activeTab === "settings" && (
                    <div className="space-y-6">
                        {/* Domain Management */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <h3 className="mb-1 font-semibold">Email Domains</h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Students signing up with these domains get automatic licenses
                            </p>

                            <div className="mb-4 flex gap-2">
                                <div className="flex flex-1 items-center">
                                    <span className="rounded-l-lg border border-r-0 border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                                        @
                                    </span>
                                    <input
                                        type="text"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                                        placeholder="school.edu"
                                        className="h-11 w-full rounded-r-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <button
                                    onClick={handleAddDomain}
                                    disabled={addingDomain || !newDomain.trim()}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {addingDomain ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {school.domains.map((d) => (
                                    <div
                                        key={d.domain}
                                        className="flex items-center justify-between rounded-lg bg-muted p-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>@{d.domain}</span>
                                            {d.verified && (
                                                <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-green-600">
                                                    <Check className="h-3 w-3" /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveDomain(d.domain)}
                                            disabled={school.domains.length === 1}
                                            className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-red-500 disabled:opacity-30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
