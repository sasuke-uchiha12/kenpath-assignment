import { useEffect, useState, type FormEvent } from "react";
import {
  Navigate,
  Route,
  Routes,
  Link,
  useNavigate,
  useParams,
  useBlocker,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  FolderOpen,
  Languages,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { translate, type TextKey } from "./i18n";
import { changeLanguage, type Language } from "./state";

type Case = {
  id: number;
  reference: string;
  applicant: string;
  district: string;
  address: string;
  occupation: string;
  submitted: string;
  status: "pending" | "approved" | "rejected" | "returned";
  annual_income: number;
  attention: string[];
  revision: number;
  age: number;
  overdue: boolean;
  required_documents: string[];
  documents?: Doc[];
  ai_review?: Review | null;
  decision?: Decision | null;
};
type Doc = {
  id: number;
  kind: string;
  title: string;
  content: string;
  content_ta?: string | null;
};
type Translated = {
  summary: string;
  missing_documents: string[];
  inconsistencies: string[];
  reasons: string[];
  questions: string[];
};
type Review = {
  output: {
    suggested_action: "approved" | "rejected" | "returned";
    evidence_ids: number[];
    en: Translated;
    ta: Translated;
  };
  model: string;
  created_at: string;
};
type Decision = {
  application_id: number;
  reference: string;
  applicant: string;
  action: "approved" | "rejected" | "returned";
  reason: string;
  officer: string;
  created_at: string;
};
type T = (key: TextKey) => string;
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch("/api" + path, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const money = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);
function Badge({ status, t }: { status: Case["status"]; t: T }) {
  return (
    <span className={"badge " + status}>
      <span className="badge-dot" />
      {t(status)}
    </span>
  );
}
function LanguageToggle({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (v: Language) => void;
}) {
  return (
    <div className="language" aria-label="Language">
      <Languages size={16} />
      <button
        className={language === "en" ? "selected" : ""}
        onClick={() => setLanguage("en")}
        lang="en"
      >
        English
      </button>
      <span>/</span>
      <button
        className={language === "ta" ? "selected" : ""}
        onClick={() => setLanguage("ta")}
        lang="ta"
      >
        தமிழ்
      </button>
    </div>
  );
}
function Logo({ t }: { t: T }) {
  return (
    <div className="logo">
      <span className="logo-mark">
        <ShieldCheck size={21} />
      </span>
      <div>
        <strong>{t("brand")}</strong>
        <small>{t("subtitle")}</small>
      </div>
    </div>
  );
}
function Login({
  t,
  language,
  setLanguage,
  onLogin,
}: {
  t: T;
  language: Language;
  setLanguage: (v: Language) => void;
  onLogin: () => void;
}) {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onLogin();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <div className="login-top">
        <Logo t={t} />
        <LanguageToggle language={language} setLanguage={setLanguage} />
      </div>
      <div className="login-layout">
        <section className="login-message">
          <div className="login-icon">
            <FolderOpen size={30} />
          </div>
          <h1>{t("loginIntro")}</h1>
          <p>{t("loginDesc")}</p>
          <div className="login-note">
            <ShieldCheck size={19} />
            {t("footer")}
          </div>
        </section>
        <section className="login-box">
          <p className="muted">{t("workspace")}</p>
          <h2>{t("signIn")}</h2>
          <p className="muted">{t("loginHint")}</p>
          <form onSubmit={submit}>
            <label>
              {t("username")}
              <input
                value={username}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              {t("password")}
              <input
                type="password"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {t("loginError")}
              </p>
            )}
            <button className="primary full" disabled={busy}>
              {busy ? t("loading") : t("signInButton")}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="demo-note">{t("demoNote")}</p>
        </section>
      </div>
      <div className="login-footer">{t("sample")} · Tamil Nadu</div>
    </main>
  );
}
function Shell({
  t,
  language,
  setLanguage,
  onLogout,
}: {
  t: T;
  language: Language;
  setLanguage: (v: Language) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand-link">
            <Logo t={t} />
          </Link>
          <nav aria-label="Main navigation">
            <Link to="/">{t("applications")}</Link>
            <Link to="/history">{t("history")}</Link>
          </nav>
          <div className="header-right">
            <LanguageToggle language={language} setLanguage={setLanguage} />
            <button className="logout" onClick={onLogout}>
              <LogOut size={16} />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
      </header>
      <div className="demo-banner">{t("demoNote")}</div>
      <main className="container">
        <Routes>
          <Route path="/" element={<Queue t={t} />} />
          <Route
            path="/applications/:id"
            element={<CasePage t={t} language={language} />}
          />
          <Route path="/history" element={<History t={t} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>
          {t("brand")} · {t("sample")}
        </span>
        <span>{t("footer")}</span>
      </footer>
    </>
  );
}
function Queue({ t }: { t: T }) {
  const [items, setItems] = useState<Case[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    api<{ applications: Case[] }>("/applications")
      .then((r) => setItems(r.applications))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  const pending = items.filter((a) => a.status === "pending");
  const filtered = items.filter(
    (a) =>
      (status === "all" || a.status === status) &&
      `${a.applicant} ${a.reference}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">
            {t("workspace")} <ChevronRight size={14} /> {t("applications")}
          </p>
          <h1>{t("queue")}</h1>
          <p>{t("queueDesc")}</p>
        </div>
        <span className="sample-pill">
          <span /> {t("sample")}
        </span>
      </div>
      <section className="overview-strip">
        <div>
          <span className="overview-icon">
            <FolderOpen size={19} />
          </span>
          <div>
            <strong>{pending.length}</strong>
            <span>{t("pending")}</span>
          </div>
        </div>
        <div>
          <span className="overview-icon amber">
            <Clock3 size={19} />
          </span>
          <div>
            <strong>{pending.filter((a) => a.overdue).length}</strong>
            <span>{t("overdue")}</span>
          </div>
          <small>{t("overdueRule")}</small>
        </div>
        <div>
          <span className="overview-icon orange">
            <TriangleAlert size={19} />
          </span>
          <div>
            <strong>{pending.filter((a) => a.attention.length).length}</strong>
            <span>{t("attention")}</span>
          </div>
        </div>
      </section>
      <section className="table-area">
        <div className="section-head">
          <div>
            <h2>{t("applications")}</h2>
            <p>
              {filtered.length} {t("applications").toLowerCase()}
            </p>
          </div>
          <div className="filters">
            <label className="search">
              <Search size={17} />
              <input
                aria-label={t("search")}
                placeholder={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label={t("status")}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">{t("pending")}</option>
              <option value="all">{t("all")}</option>
              <option value="approved">{t("approved")}</option>
              <option value="rejected">{t("rejected")}</option>
              <option value="returned">{t("returned")}</option>
            </select>
          </div>
        </div>
        {loading ? (
          <p className="empty">{t("loading")}</p>
        ) : error ? (
          <p className="empty error">{t("error")}</p>
        ) : filtered.length === 0 ? (
          <p className="empty">{t("noResults")}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("applicant")}</th>
                  <th>{t("district")}</th>
                  <th>{t("submitted")}</th>
                  <th>{t("status")}</th>
                  <th>{t("attentionColumn")}</th>
                  <th>
                    <span className="sr-only">{t("action")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">
                          {a.applicant
                            .split(" ")
                            .map((x) => x[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <strong>{a.applicant}</strong>
                          <small>{a.reference}</small>
                        </div>
                      </div>
                    </td>
                    <td>{a.district}</td>
                    <td>
                      {date(a.submitted)}
                      <small className="subtext">
                        {a.age} {t("days")}
                      </small>
                    </td>
                    <td>
                      <Badge status={a.status} t={t} />
                    </td>
                    <td>
                      {a.attention.length ? (
                        <span className="attention-text">
                          <TriangleAlert size={14} />
                          {t(a.attention[0] as TextKey)}
                        </span>
                      ) : (
                        <span className="muted">{t("complete")}</span>
                      )}
                    </td>
                    <td>
                      <Link className="row-link" to={"/applications/" + a.id}>
                        {t("review")} <ArrowRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function CasePage({ t, language }: { t: T; language: Language }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [decision, setDecision] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const blocker = useBlocker(Boolean(reason.trim()));
  const load = () =>
    api<Case>("/applications/" + id)
      .then(setRecord)
      .catch(() => setError(t("error")))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, [id]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (reason.trim()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [reason, language]);
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm(t("unsavedWarning"))) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker, language]);
  async function aiReview() {
    setAiBusy(true);
    setAiError(false);
    try {
      const r = await api<Review>(`/applications/${id}/ai-review`, {
        method: "POST",
      });
      setRecord((a) => (a ? { ...a, ai_review: r } : a));
    } catch {
      setAiError(true);
    } finally {
      setAiBusy(false);
    }
  }
  async function save() {
    if (!record) return;
    setSaving(true);
    try {
      await api(`/applications/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({
          action: decision,
          reason,
          language,
          expected_revision: record.revision,
        }),
      });
      setReason("");
      setConfirm(false);
      await load();
    } catch {
      setError(t("saveError"));
      setConfirm(false);
    } finally {
      setSaving(false);
    }
  }
  function back() {
    navigate("/");
  }
  if (loading) return <p className="empty">{t("loading")}</p>;
  if (!record) return <p className="empty error">{error || t("error")}</p>;
  const translated = record.ai_review?.output[language];
  const docName = (kind: string) =>
    t(
      (
        {
          identity: "identity",
          address: "addressDoc",
          income: "incomeDoc",
        } as Record<string, TextKey>
      )[kind] || "evidence",
    );
  return (
    <>
      <button className="back" onClick={back}>
        <ArrowLeft size={16} />
        {t("back")}
      </button>
      <div className="case-title">
        <div>
          <p className="breadcrumb">
            {t("applications")} <ChevronRight size={14} /> {record.reference}
          </p>
          <h1>{record.applicant}</h1>
          <p>
            {record.reference} <span className="dot-separator">·</span>{" "}
            {record.district} <span className="dot-separator">·</span>{" "}
            {date(record.submitted)}
          </p>
        </div>
        <Badge status={record.status} t={t} />
      </div>
      <div className="review-grid">
        <div className="review-main">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t("overview")}</h2>
                <p>{t("sample")}</p>
              </div>
              <FileText size={19} />
            </div>
            <dl className="details">
              <div>
                <dt>{t("applicant")}</dt>
                <dd>{record.applicant}</dd>
              </div>
              <div>
                <dt>{t("income")}</dt>
                <dd className="income">{money(record.annual_income)}</dd>
              </div>
              <div>
                <dt>{t("occupation")}</dt>
                <dd>{record.occupation}</dd>
              </div>
              <div>
                <dt>{t("address")}</dt>
                <dd>{record.address}</dd>
              </div>
            </dl>
          </section>
          <section className="panel documents">
            <div className="panel-heading">
              <div>
                <h2>{t("evidence")}</h2>
                <p>{t("evidenceNote")}</p>
              </div>
              <span className="count">
                {record.documents?.length || 0} /{" "}
                {record.required_documents.length}
              </span>
            </div>
            {record.required_documents.map((kind) => {
              const doc = record.documents?.find((d) => d.kind === kind);
              return (
                <div className="document" key={kind}>
                  <div className="doc-icon">
                    <FileText size={17} />
                  </div>
                  <div className="doc-body">
                    <strong>{docName(kind)}</strong>
                    {doc && (
                      <p>
                        {language === "ta" && doc.content_ta
                          ? doc.content_ta
                          : doc.content}
                      </p>
                    )}
                    {doc && (
                      <small>
                        #{doc.id} · {t("sample")}
                      </small>
                    )}
                  </div>
                  <span
                    className={"doc-status " + (doc ? "present" : "missing")}
                  >
                    {doc ? <Check size={13} /> : <TriangleAlert size={13} />}{" "}
                    {t(doc ? "present" : "missing")}
                  </span>
                </div>
              );
            })}
          </section>
        </div>
        <aside className="ai-panel">
          <div className="ai-head">
            <span className="sparkle">
              <Sparkles size={20} />
            </span>
            <div>
              <h2>{t("aiTitle")}</h2>
              <p>{t("aiAdvisory")}</p>
            </div>
          </div>
          {!translated ? (
            <div className="ai-empty">
              <p>{t("aiIntro")}</p>
              <button
                className="primary full"
                onClick={aiReview}
                disabled={aiBusy}
              >
                <Sparkles size={16} />
                {aiBusy ? t("generating") : t("generate")}
              </button>
              {aiError && (
                <p className="error" role="alert">
                  {t("aiUnavailable")}
                </p>
              )}
            </div>
          ) : (
            <div className="ai-result">
              <div className="ai-block">
                <h3>{t("summary")}</h3>
                <p>{translated.summary}</p>
              </div>
              <AiList
                title={t("missingDocs")}
                items={translated.missing_documents}
                empty={t("noIssues")}
              />
              <AiList
                title={t("inconsistencies")}
                items={translated.inconsistencies}
                empty={t("noIssues")}
              />
              <div className="suggestion">
                <span>{t("suggestion")}</span>
                <strong>{t(record.ai_review!.output.suggested_action)}</strong>
              </div>
              <AiList
                title={t("reasons")}
                items={translated.reasons}
                empty={t("noIssues")}
              />
              <AiList
                title={t("questions")}
                items={translated.questions}
                empty={t("noIssues")}
              />
              <p className="ai-meta">
                {t("evidenceRefs")}:{" "}
                {record
                  .ai_review!.output.evidence_ids.map((x) => "#" + x)
                  .join(", ") || "—"}
                <br />
                {t("model")}: {record.ai_review!.model}
              </p>
            </div>
          )}
        </aside>
      </div>
      <section className="panel decision-panel">
        <div className="panel-heading">
          <div>
            <h2>{t("decision")}</h2>
            <p>{t("decisionDesc")}</p>
          </div>
          <ShieldCheck size={20} />
        </div>
        {record.status !== "pending" ? (
          <div className="saved">
            <Badge status={record.status} t={t} />
            <p>
              <strong>{t("reasonLabel")}:</strong> {record.decision?.reason}
            </p>
            <small>{t("savedNote")}</small>
          </div>
        ) : (
          <>
            <div className="decision-options">
              {(["approved", "returned", "rejected"] as const).map((action) => (
                <button
                  key={action}
                  type="button"
                  className={"choice " + (decision === action ? "chosen" : "")}
                  onClick={() => setDecision(action)}
                >
                  <span className="radio-dot" />
                  {t(
                    action === "approved"
                      ? "approve"
                      : action === "rejected"
                        ? "reject"
                        : "return",
                  )}
                </button>
              ))}
            </div>
            <label className="reason-label">
              {t("reason")}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reasonHint")}
                rows={3}
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="decision-footer">
              <p>{t("aiAdvisory")}</p>
              <button
                className="primary"
                onClick={() =>
                  decision && reason.trim()
                    ? setConfirm(true)
                    : setError(t("reasonRequired"))
                }
              >
                {t("confirm")} <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </section>
      {confirm && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">{t("confirmTitle")}</h2>
            <p>
              {record.reference} · {record.applicant}
            </p>
            <Badge status={decision as Case["status"]} t={t} />
            <p className="confirm-reason">{reason}</p>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setConfirm(false)}>
                {t("cancel")}
              </button>
              <button className="primary" onClick={save} disabled={saving}>
                {saving ? t("processing") : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function AiList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="ai-block">
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </div>
  );
}
function History({ t }: { t: T }) {
  const [items, setItems] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Decision[]>("/decisions")
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">
            {t("workspace")} <ChevronRight size={14} /> {t("history")}
          </p>
          <h1>{t("history")}</h1>
          <p>{t("historyDesc")}</p>
        </div>
      </div>
      <section className="panel history-list">
        {loading ? (
          <p>{t("loading")}</p>
        ) : items.length === 0 ? (
          <p className="empty">{t("noHistory")}</p>
        ) : (
          items.map((item) => (
            <div className="history-row" key={item.application_id}>
              <div>
                <Link to={"/applications/" + item.application_id}>
                  <strong>{item.applicant}</strong>
                </Link>
                <small>
                  {item.reference} · {date(item.created_at)} · {item.officer}
                </small>
                <p>{item.reason}</p>
              </div>
              <Badge status={item.action} t={t} />
            </div>
          ))
        )}
      </section>
    </>
  );
}
export default function App() {
  const [session, setSession] = useState<"loading" | "in" | "out">("loading");
  const [langState, setLangState] = useState<{
    language: Language;
    reason: string;
  }>({
    language: localStorage.getItem("language") === "ta" ? "ta" : "en",
    reason: "",
  });
  const language = langState.language;
  const t: T = (key) => translate(language, key);
  function setLanguage(v: Language) {
    setLangState((s) => changeLanguage(s, v));
    localStorage.setItem("language", v);
    document.documentElement.lang = v;
  }
  useEffect(() => {
    document.documentElement.lang = language;
    api("/auth/me")
      .then(() => setSession("in"))
      .catch(() => setSession("out"));
  }, []);
  async function logout() {
    const draft = document.querySelector<HTMLTextAreaElement>(
      ".reason-label textarea",
    )?.value;
    if (draft?.trim() && !window.confirm(t("unsavedWarning"))) return;
    await api("/auth/logout", { method: "POST" });
    setSession("out");
  }
  if (session === "loading") return <p className="empty">{t("loading")}</p>;
  return session === "out" ? (
    <Login
      t={t}
      language={language}
      setLanguage={setLanguage}
      onLogin={() => setSession("in")}
    />
  ) : (
    <Shell
      t={t}
      language={language}
      setLanguage={setLanguage}
      onLogout={logout}
    />
  );
}
