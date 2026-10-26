import Link from "next/link";

type StatusPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  notice: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function StatusPage({
  eyebrow,
  title,
  description,
  notice,
  actionHref = "/contact",
  actionLabel = "Contact Lotus Gym",
}: StatusPageProps) {
  return (
    <main className="status-page">
      <div className="status-content">
        <p className="eyebrow"><span /> {eyebrow}</p>
        <h1>{title}</h1>
        <p className="status-description">{description}</p>
        <div className="status-notice">{notice}</div>
        <Link className="button button-lime" href={actionHref}>
          {actionLabel} <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
