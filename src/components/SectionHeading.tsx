interface Props {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ title, subtitle, className = '' }: Props) {
  return (
    <div className={`reveal gsap-init ${className}`}>
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-sub">{subtitle}</p>}
      <div className="title-rule" />
    </div>
  );
}
