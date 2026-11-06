import Link from "next/link";

/** Top bar for signed-in screens: logo + name, or a back link with a title. */
export function AppBar({
  back,
  title,
  right,
}: {
  back?: string;
  title?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="bar">
      {back ? (
        <Link href={back} className="bar-back" aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
      ) : (
        <Link href="/home" className="bar-brand">
          <img src="/icons/icon.svg" alt="" width={30} height={30} />
          <span>Tikdue</span>
        </Link>
      )}
      {title && <span className="bar-title">{title}</span>}
      <span className="bar-right">{right}</span>
    </header>
  );
}
