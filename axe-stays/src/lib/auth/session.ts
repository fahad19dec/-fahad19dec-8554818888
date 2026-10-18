// Passed to signIn/signUp.finalize(). It doesn't navigate: once the session is
// active, the root layout's guard moves the guest home. Session tasks are only
// logged, since none are enabled for this app.
export const finalizeOptions = {
  navigate: ({ session }: { session: { currentTask?: unknown } | null }) => {
    if (session?.currentTask) console.warn("Unhandled Clerk session task", session.currentTask);
  },
};
