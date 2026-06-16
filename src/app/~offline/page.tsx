import Image from "next/image";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-sage-light">
        <Image
          src="/icons/apple-touch-icon.png"
          alt=""
          width={64}
          height={64}
          className="rounded-xl"
        />
      </div>
      <h1 className="text-xl font-semibold text-charcoal">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-warm-gray">
        Word of Mouth needs an internet connection for sign-in, friends, and
        recommendations. Reconnect and try again.
      </p>
    </div>
  );
}
