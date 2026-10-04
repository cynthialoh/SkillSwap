import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function AdminPage() {
  const { userId } = await auth();
  let email = "unknown";
  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? "unknown";
  }

  const cards = [
    { label: "Users", value: "1,240" },
    { label: "Pending verifications", value: "6" },
    { label: "Open reports", value: "3" },
    { label: "Completed exchanges", value: "312" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🔄 SkillSwap Admin</h1>
        <p className="text-sm text-zinc-500">Signed in as {email}</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border p-4">
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-4 text-sm space-y-1">
        <p className="font-medium">Queues (interactive demo)</p>
        <p>
          Full queues with live data live in the clickable prototype:{" "}
          <a
            className="underline text-blue-600"
            href="https://cynthialoh.github.io/SkillSwap/admin.html"
          >
            open prototype admin →
          </a>
        </p>
      </div>
    </main>
  );
}
