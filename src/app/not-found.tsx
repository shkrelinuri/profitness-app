import Link from "next/link";

export default function NotFound() {
  return (
    <main className="status-page">
      <div className="status-content">
        <p className="eyebrow"><span /> 404 · PAGE NOT FOUND</p>
        <h1>
          Let&apos;s get
          <br />
          <em>you back.</em>
        </h1>
        <p className="status-description">
          That page is not here. Head back to the Lotus Gym home page.
        </p>
        <Link className="button button-lime" href="/">
          Back to home <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
