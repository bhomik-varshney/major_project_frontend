import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageHeading, Panel } from "./shared";

export function SettingsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Your space, clearly explained"
        title="Workspace settings."
        description="How this local prototype handles your information."
      />
      <Panel className="max-w-3xl">
        <ShieldCheck className="h-6 w-6 text-accent" />
        <h2 className="mt-5 font-display text-2xl">Connected to this browser.</h2>
        <div className="mt-5 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            A signed browser session identifies your local workspace. This is not an account or a
            production login. Use the same browser and hostname to return to your saved data.
          </p>
          <p>
            Your profile and documents are saved in a local database. Local document extraction
            needs no external service. If you choose optional Groq enhancement for a document, its
            extracted text, including contact details, is sent to Groq. No job platform or external
            application service receives it.
          </p>
          <p>
            The session lasts up to 30 days. Clearing your cookies or changing browser creates a
            different workspace; previous local records remain in the database. Account recovery and
            complete workspace deletion are planned.
          </p>
          <p>
            Documents remain until you remove them from{" "}
            <Link to="/documents" className="text-accent underline underline-offset-4">
              your library
            </Link>
            . Removing a document deletes its contents from the active database; database backups
            and local disk copies require separate handling.
          </p>
          <p>
            Profile edits require a new confirmation. Nothing is submitted or approved
            automatically.
          </p>
        </div>
      </Panel>
    </>
  );
}
