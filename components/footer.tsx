import { loadPrimaryDao } from "@/lib/data-adapter";
import { FooterSyncProgress } from "./footer-sync-progress";

export async function Footer() {
  const primaryDao = await loadPrimaryDao();

  return (
    <footer className="shell footer">
      <FooterSyncProgress primaryDao={primaryDao} />
      <p className="footer-copy">
        <a href="https://tslo.labs.namefi.io" target="_blank" rel="noreferrer">
          TSLO (Tally Shall Live On)
        </a>{" "}
        is an Open-Source replacement for Tally prioritizing self-hosting, built and open sourced{" "}
        <a href="https://github.com/d3servelabs/labs-tslo" target="_blank" rel="noreferrer">
          on GitHub
        </a>{" "}
        with ❤️ at{" "}
        <a href="https://d3serve.xyz" target="_blank" rel="noreferrer">
          D3Serve Labs
        </a>
        , maker of{" "}
        <a href="https://namefi.io" target="_blank" rel="noreferrer">
          Namefi
        </a>
        .
      </p>
    </footer>
  );
}
