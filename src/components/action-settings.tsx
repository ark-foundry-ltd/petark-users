"use client";

import { Bell, ChevronRight, Headphones } from "lucide-react";
import Link from "next/link";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { toast } from "sonner";

export default function Actions() {
    const { isSubscribed, loading, subscribe, unsubscribe } = usePushSubscription();

    const handlePushToggle = async () => {
        try {
            if (isSubscribed) {
                await unsubscribe();
                toast.success("Notifications turned off");
            } else {
                await subscribe();
                toast.success("Notifications turned on");
            }
        } catch {
            toast.error("Could not update notification settings");
        }
    };

    return (
        <section>
            <h2 className="text-xl font-semibold text-sec-clr mb-3">
                Actions
            </h2>

            <div className="flex flex-col gap-5">
                {/* Push Notifications */}
                <div className="flex items-center justify-between bg-pry-clr rounded-2xl px-4 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-clr text-acc-clr">
                            <Bell size={20} />
                        </span>

                        <div>
                            <p className="text-sm font-semibold text-sec-clr">
                                Push Notifications
                            </p>
                            <p className="text-sm text-gray-500">
                                Receive appointment reminders
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={isSubscribed}
                        disabled={loading}
                        onClick={handlePushToggle}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                            isSubscribed ? "bg-acc-clr" : "bg-bg-clr"
                        }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-pry-clr shadow transition-transform ${
                                isSubscribed ? "translate-x-5" : "translate-x-0.5"
                            }`}
                        />
                    </button>
                </div>

                {/* Contact Support */}
                <Link
                    href="/dashboard/settings/support"
                    className="flex items-center justify-between bg-pry-clr rounded-2xl px-4 py-4 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-clr text-acc-clr">
                            <Headphones size={20} />
                        </span>

                        <div>
                            <p className="text-sm font-semibold text-sec-clr">
                                Contact Support
                            </p>
                            <p className="text-sm text-gray-500">
                                Get help from our team
                            </p>
                        </div>
                    </div>

                    <ChevronRight size={18} className="text-gray-400" />
                </Link>
            </div>
        </section>
    );
}