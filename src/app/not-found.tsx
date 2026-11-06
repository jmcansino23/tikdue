import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="page-inner page-center">
        <h1 className="page-title">
          Not <em>found.</em>
        </h1>
        <p className="quiet-line">This page or item doesn&apos;t exist, or it was deleted.</p>
        <Link href="/home" className="btn-ink">
          Back to Tikdue
        </Link>
      </div>
    </main>
  );
}
