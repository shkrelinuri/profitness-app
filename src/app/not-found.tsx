import Link from "next/link";
import { LocalizedText } from "@/components/language-provider";

export default function NotFound() {
  return (
    <main className="status-page">
      <div className="status-content">
        <p className="eyebrow"><span /><LocalizedText id="notFound.kicker" /></p>
        <h1>
          <LocalizedText id="notFound.first" />
          <br />
          <LocalizedText as="em" id="notFound.highlight" />
        </h1>
        <LocalizedText as="p" className="status-description" id="notFound.description" />
        <Link className="button button-lime" href="/">
          <LocalizedText id="notFound.home" /> <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
