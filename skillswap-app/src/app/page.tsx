import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center gap-8 py-24 px-8 bg-white text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          🔄 SkillSwap
        </h1>
        <p className="max-w-md text-lg text-zinc-600">
          Your skills are currency. Teach what you know, learn what you want.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Show when="signed-out">
            <SignInButton>
              <button className="h-12 px-6 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="h-12 px-6 rounded-full border border-black/10 font-medium hover:bg-black/5">
                Join SkillSwap
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
            <a
              href="/matches"
              className="h-12 px-6 rounded-full bg-blue-600 text-white font-medium inline-flex items-center hover:bg-blue-700"
            >
              See my matches →
            </a>
          </Show>
        </div>
        <p className="text-sm text-zinc-500">
          Prototype screens (no login needed):{" "}
          <a className="underline" href="https://cynthialoh.github.io/SkillSwap/">
            open the clickable prototype
          </a>
        </p>
      </main>
    </div>
  );
}
