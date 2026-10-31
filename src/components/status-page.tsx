import Link from "next/link";
import { LocalizedText } from "@/components/language-provider";

type StatusPageProps = {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  notice: React.ReactNode;
  actionHref?: string;
  actionLabel?: React.ReactNode;
};

export default function StatusPage({
  eyebrow,
  title,
  description,
  notice,
  actionHref = "/contact",
  actionLabel = <LocalizedText id="status.contact" />,
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
