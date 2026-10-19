import { useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { SkillDetail } from "@/services/api/types";

const unique = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function SkillEditor({
  values,
  details,
  onChange,
}: {
  values: string[];
  details: SkillDetail[];
  onChange: (values: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [bulk, setBulk] = useState(values.join(", "));
  const [editing, setEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const update = (next: string[]) => {
    onChange(next);
    setBulk(next.join(", "));
    setError("");
  };
  const validate = (value: string, ignore?: number) => {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name) return "Enter a skill name.";
    if (name.length > 160) return "Use a skill name of at most 160 characters.";
    if (
      values.some((old, i) => i !== ignore && old.toLocaleLowerCase() === name.toLocaleLowerCase())
    )
      return "This skill is already in your profile.";
    return "";
  };
  const add = () => {
    const problem = validate(text);
    if (problem) {
      setError(problem);
      return;
    }
    if (values.length >= 100) {
      setError("You can save up to 100 skills.");
      return;
    }
    update([...values, text.trim().replace(/\s+/g, " ")]);
    setText("");
    input.current?.focus();
  };
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">Your skills</p>
        <button
          type="button"
          className="career-add"
          disabled={values.length >= 100}
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3" /> Add Skill
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Add skills you can support with your work. Changes are saved with your profile and need
        explicit confirmation.
      </p>
      {adding && (
        <div className="rounded-xl border border-accent/20 p-4">
          <label className="career-field">
            <span>Skill name</span>
            <input
              ref={input}
              autoFocus
              maxLength={160}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
            />
          </label>
          <div className="mt-3 flex gap-3">
            <button type="button" className="btn-ghost !text-xs" onClick={add}>
              Add
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground"
              onClick={() => {
                setAdding(false);
                setText("");
                setError("");
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-accent">
          {error}
        </p>
      )}
      {values.length === 0 ? (
        <p className="career-form-empty">No skills added yet. Use Add Skill to begin.</p>
      ) : (
        <ul aria-label="Editable profile skills" className="space-y-2">
          {values.map((skill, index) => {
            const detail = details.find((item) => item.name === skill);
            return (
              <li key={index} className="min-w-0 rounded-xl border border-border px-4 py-3">
                {editing === index ? (
                  <div className="space-y-3">
                    <label className="career-field">
                      <span>Edit skill name</span>
                      <input
                        autoFocus
                        maxLength={160}
                        value={editText}
                        onChange={(event) => setEditText(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            const problem = validate(editText, index);
                            if (problem) setError(problem);
                            else {
                              update(
                                values.map((name, i) => (i === index ? editText.trim() : name)),
                              );
                              setEditing(null);
                            }
                          }
                        }}
                      />
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="btn-ghost !text-xs"
                        onClick={() => {
                          const problem = validate(editText, index);
                          if (problem) {
                            setError(problem);
                            return;
                          }
                          update(values.map((name, i) => (i === index ? editText.trim() : name)));
                          setEditing(null);
                        }}
                      >
                        Save skill
                      </button>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground"
                        onClick={() => {
                          setEditing(null);
                          setError("");
                        }}
                      >
                        Cancel edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm">{skill}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {detail?.source === "resume" ? "Resume-derived" : "Manually added"} ·{" "}
                        {detail?.verified ? "Confirmed" : "Needs confirmation"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        aria-label={`Edit skill ${skill}`}
                        className="p-2 text-muted-foreground hover:text-accent"
                        onClick={() => {
                          setEditing(index);
                          setEditText(skill);
                          setError("");
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove skill ${skill}`}
                        className="p-2 text-muted-foreground hover:text-accent"
                        onClick={() => {
                          update(values.filter((_, i) => i !== index));
                          setEditing(null);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <label className="career-field">
        <span>Bulk edit skills</span>
        <input
          aria-label="Your skills"
          value={bulk}
          maxLength={16000}
          onChange={(event) => {
            setBulk(event.target.value);
            onChange(
              unique(
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              ),
            );
            setError("");
          }}
        />
        <small>
          Optional comma-separated editor. Each skill is stored as a separate list item.
        </small>
      </label>
    </div>
  );
}
