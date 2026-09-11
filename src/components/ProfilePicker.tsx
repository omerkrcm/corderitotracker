"use client";

import { useProfile } from "@/lib/profile-context";

export function ProfilePicker() {
  const { users, activeUser, loading, setActiveUserId } = useProfile();

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-black/10" />;
  }

  if (users.length === 0) {
    return <span className="text-sm text-red-600">No users found</span>;
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-black/5 p-1">
      {users.map((user) => {
        const isActive = user.id === activeUser?.id;
        return (
          <button
            key={user.id}
            onClick={() => setActiveUserId(user.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-black shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            {user.name}
          </button>
        );
      })}
    </div>
  );
}
