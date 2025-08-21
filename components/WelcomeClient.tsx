"use client";
export default function WelcomeClient({ userName }: { userName: string }) {
  return (
    <section className="grid min-h-[70vh] place-items-center">
      <div className="rounded-3xl border bg-white px-10 py-8 shadow text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Welcome {userName}</h1>
        <p className="mt-3 text-gray-600">Use the menu to get started.</p>
      </div>
    </section>
  );
}
