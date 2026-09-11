"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useProfile } from "@/lib/profile-context";
import { getUserColorClass, getInitial } from "@/lib/user-color";

export function ProfilePicker() {
  const { users, activeUser, loading, setActiveUserId } = useProfile();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-full bg-surface-muted" />
    );
  }

  if (users.length === 0) {
    return <span className="text-sm text-danger">No users found</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 shadow-sm"
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
            activeUser ? getUserColorClass(activeUser.id) : "bg-surface-muted"
          }`}
        >
          {activeUser ? getInitial(activeUser.name) : "?"}
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Logging as
          </span>
          <span className="text-sm font-semibold">
            {activeUser?.name ?? "Pick a profile"}
          </span>
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-t-3xl bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-3 text-center text-sm font-medium text-muted-foreground">
                Who&apos;s logging?
              </h2>
              <div className="flex flex-col gap-2">
                {users.map((user) => {
                  const isActive = user.id === activeUser?.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setActiveUserId(user.id);
                        setOpen(false);
                      }}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "border-accent bg-accent-soft"
                          : "border-border hover:bg-surface-muted"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold ${getUserColorClass(
                          user.id
                        )}`}
                      >
                        {getInitial(user.name)}
                      </span>
                      <span className="flex-1 text-base font-medium">
                        {user.name}
                      </span>
                      {isActive && (
                        <span className="text-sm font-medium text-accent-soft-foreground">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="mt-3 w-full rounded-xl py-2 text-center text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
