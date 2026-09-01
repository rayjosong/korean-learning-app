const links = [
  { href: "/", label: "Home" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" }
] as const;

const upcoming = ["Library", "Review"] as const;

export function PrimaryNavigation({ active }: { active: "home" | "progress" | "settings" }) {
  return (
    <nav className="mb-14 flex items-center justify-between border-b border-hairline pb-4" aria-label="Primary navigation">
      <a href="/" className="rounded text-sm font-semibold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Korean</a>
      <div className="flex items-center gap-5 text-sm">
        {links.map((link) => {
          const isActive = active === link.label.toLowerCase();
          return (
            <a key={link.href} href={link.href} aria-current={isActive ? "page" : undefined} className={`rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isActive ? "font-semibold text-ink underline decoration-primary decoration-2 underline-offset-8" : "text-ink-secondary hover:text-ink"}`}>
              {link.label}
            </a>
          );
        })}
        {upcoming.map((item) => <span key={item} aria-disabled="true" className="text-ink-muted">{item}</span>)}
      </div>
    </nav>
  );
}
