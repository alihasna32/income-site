export function SectionHeader({ eyebrow, title, description, align = "center" }) {
  return (
    <div className={align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-2xl"}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-content/70">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm sm:text-base text-muted">{description}</p>
      )}
    </div>
  );
}