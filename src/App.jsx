import React, { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Terminal, Download, Trash2, FileCode2, ChevronDown, AlertCircle, Users } from "lucide-react";
import { supabase } from "./supabaseClient";

const TOTAL_DAYS = 20;
const COHORT = "Data Science Advanced · Cohort Delta";
const INSTRUCTOR_PASSCODE = "delta2026"; // change this to whatever you like

function useLog(max = 40) {
  const [lines, setLines] = useState([
    { t: "boot", msg: `delta-submit v2.0 :: ${COHORT} :: ready` },
  ]);
  const push = useCallback((msg, kind = "ok") => {
    setLines((prev) => [...prev.slice(-(max - 1)), { t: kind, msg }]);
  }, [max]);
  return [lines, push];
}

function TermLog({ lines }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);
  return (
    <div
      ref={ref}
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12.5,
        lineHeight: 1.7,
        background: "#eefaf7",
        border: "1px solid #b6e5da",
        borderRadius: 6,
        padding: "10px 12px",
        height: 92,
        overflowY: "auto",
        color: "#0d7a6e",
      }}
    >
      {lines.map((l, i) => (
        <div key={i} style={{ color: l.t === "err" ? "#c2650a" : l.t === "boot" ? "#7fb3a8" : "#0891b2" }}>
          <span style={{ color: "#8fc7bc" }}>{"> "}</span>
          {l.msg}
        </div>
      ))}
    </div>
  );
}

function DayPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          border: "1px solid #cbe8e0",
          borderRadius: 6,
          padding: "10px 12px",
          color: "#0f2e2b",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13.5,
          cursor: "pointer",
        }}
      >
        <span>{value ? `day_${String(value).padStart(2, "0")}` : "select day..."}</span>
        <ChevronDown size={15} style={{ color: "#0d9488", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: 220,
            overflowY: "auto",
            background: "#ffffff",
            border: "1px solid #cbe8e0",
            borderRadius: 6,
            zIndex: 20,
            boxShadow: "0 8px 24px rgba(15,46,43,0.12)",
          }}
        >
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => (
            <div
              key={d}
              onClick={() => {
                onChange(d);
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: value === d ? "#0d9488" : "#3a5a55",
                background: value === d ? "#e6f7f3" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e6f7f3")}
              onMouseLeave={(e) => (e.currentTarget.style.background = value === d ? "#e6f7f3" : "transparent")}
            >
              day_{String(d).padStart(2, "0")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function SubmitView() {
  const [name, setName] = useState("");
  const [day, setDay] = useState(null);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failedOnce, setFailedOnce] = useState(false);
  const [lines, push] = useLog();
  const fileInputRef = useRef(null);

  const canSubmit = name.trim() && day && file && !busy;

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".ipynb")) {
      push(`rejected ${f.name} :: expected .ipynb`, "err");
      return;
    }
    if (f.size > 5_000_000) {
      push(`rejected ${f.name} :: exceeds 5MB limit`, "err");
      return;
    }
    setFile(f);
    setFailedOnce(false);
    push(`staged ${f.name} (${(f.size / 1024).toFixed(0)}kb)`);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setFailedOnce(false);
    push(`uploading ${file.name}...`);

    const attempts = 3;
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        const b64 = await fileToBase64(file);
        const { error } = await supabase.from("submissions").insert({
          name: name.trim(),
          day,
          notes: notes.trim(),
          filename: file.name,
          size: file.size,
          content: b64,
        });
        if (error) throw error;

        push(`uploaded ${file.name} -> day_${String(day).padStart(2, "0")}/${name.trim().toLowerCase().replace(/\s+/g, "_")} ... ok`);
        setFile(null);
        setNotes("");
        setFailedOnce(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setBusy(false);
        return;
      } catch (e) {
        lastErr = e;
        if (i < attempts - 1) {
          push(`retrying (${i + 2}/${attempts})...`, "err");
          await sleep(600 * (i + 1));
        }
      }
    }
    push(`upload failed after retries :: ${lastErr?.message || "server error"}`, "err");
    push(`your name, day, and file are still filled in — tap retry when ready`, "err");
    setFailedOnce(true);
    setBusy(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chidinma Okoro"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>assignment</label>
        <DayPicker value={day} onChange={setDay} />
      </div>

      <div>
        <label style={labelStyle}>notebook file (.ipynb)</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
          style={{
            border: `1.5px dashed ${file ? "#0d9488" : "#cbe8e0"}`,
            borderRadius: 6,
            padding: "18px 14px",
            textAlign: "center",
            cursor: "pointer",
            background: file ? "#e6f7f3" : "#f7fbf9",
            transition: "border-color .15s",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".ipynb"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: "none" }}
          />
          {file ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#0d9488", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              <FileCode2 size={16} />
              {file.name}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#6b8f88", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              <Upload size={16} />
              drop .ipynb here, or click to browse
            </div>
          )}
        </div>
      </div>

      <div>
        <label style={labelStyle}>notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="anything you want Bernard to know about this submission..."
          rows={3}
          style={{ ...inputStyle, fontFamily: "'Inter', sans-serif", resize: "vertical" }}
        />
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit}
        style={{
          background: !canSubmit ? "#dcefe9" : failedOnce ? "#d97706" : "#0d9488",
          color: canSubmit ? "#ffffff" : "#94b8b1",
          border: "none",
          borderRadius: 6,
          padding: "11px 16px",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          fontSize: 13.5,
          cursor: canSubmit ? "pointer" : "not-allowed",
          transition: "background .15s",
        }}
      >
        {busy ? "uploading..." : failedOnce ? "retry submission" : "submit notebook"}
      </button>
      {failedOnce && (
        <div style={{ color: "#c2650a", fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, marginTop: -6 }}>
          upload didn't go through — your details are saved above, just tap retry
        </div>
      )}

      <TermLog lines={lines} />
    </div>
  );
}

function InstructorView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDay, setFilterDay] = useState("all");
  const [lines, push] = useLog();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, name, day, filename, notes, submitted_at")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
      push(`loaded ${data?.length || 0} submission${data?.length === 1 ? "" : "s"}`);
    } catch (e) {
      setRows([]);
      push(`load failed :: ${e.message}`, "err");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadOne = async (item) => {
    try {
      const { data, error } = await supabase.from("submissions").select("content, filename, day, name").eq("id", item.id).single();
      if (error) throw error;
      const bytes = atob(data.content);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: "application/x-ipynb+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `day${String(data.day).padStart(2, "0")}_${data.name.replace(/\s+/g, "_")}.ipynb`;
      a.click();
      URL.revokeObjectURL(url);
      push(`downloaded ${a.download}`);
    } catch (e) {
      push(`download failed :: ${e.message}`, "err");
    }
  };

  const deleteOne = async (item) => {
    try {
      const { error } = await supabase.from("submissions").delete().eq("id", item.id);
      if (error) throw error;
      setRows((prev) => prev.filter((x) => x.id !== item.id));
      push(`deleted ${item.filename}`);
    } catch (e) {
      push(`delete failed :: ${e.message}`, "err");
    }
  };

  const escapeCsv = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;

  const exportCsv = () => {
    const header = "name,day,filename,submitted_at,notes\n";
    const csvRows = rows
      .map((r) => [escapeCsv(r.name), r.day, escapeCsv(r.filename), escapeCsv(r.submitted_at), escapeCsv(r.notes)].join(","))
      .join("\n");
    const blob = new Blob([header + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cohort_delta_submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push(`exported ${rows.length} rows (with notes) -> csv`);
  };

  const filtered = filterDay === "all" ? rows : rows.filter((r) => r.day === Number(filterDay));
  const dayCounts = {};
  rows.forEach((r) => (dayCounts[r.day] = (dayCounts[r.day] || 0) + 1));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0d7a6e", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>
          <Users size={14} />
          {rows.length} total
        </div>
        <select
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
          style={{
            marginLeft: "auto",
            background: "#ffffff",
            border: "1px solid #cbe8e0",
            borderRadius: 6,
            color: "#0f2e2b",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12.5,
            padding: "6px 8px",
          }}
        >
          <option value="all">all days</option>
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              day_{String(d).padStart(2, "0")} ({dayCounts[d] || 0})
            </option>
          ))}
        </select>
        <button onClick={load} style={smallBtnStyle}>
          refresh
        </button>
        <button onClick={exportCsv} disabled={!rows.length} style={{ ...smallBtnStyle, opacity: rows.length ? 1 : 0.4 }}>
          <Download size={13} style={{ marginRight: 5 }} />
          export csv
        </button>
      </div>

      <div style={{ border: "1px solid #cbe8e0", borderRadius: 6, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "#6b8f88", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>
            loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#6b8f88", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>
            no submissions yet — share the submit link with students
          </div>
        ) : (
          filtered.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderTop: i === 0 ? "none" : "1px solid #cbe8e0",
                background: i % 2 ? "#ffffff" : "#f2faf8",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "#ffffff",
                  background: "#0d9488",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                D{String(item.day).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#0f2e2b", fontSize: 13.5, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{item.name}</div>
                <div style={{ color: "#6b8f88", fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.filename} · {new Date(item.submitted_at).toLocaleString()}
                </div>
                {item.notes && (
                  <div style={{ color: "#3a5a55", fontSize: 11.5, fontFamily: "'Inter', sans-serif", marginTop: 2, fontStyle: "italic" }}>
                    "{item.notes}"
                  </div>
                )}
              </div>
              <button onClick={() => downloadOne(item)} style={iconBtnStyle} title="Download">
                <Download size={14} />
              </button>
              <button onClick={() => deleteOne(item)} style={{ ...iconBtnStyle, color: "#d97706" }} title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <TermLog lines={lines} />
    </div>
  );
}

function PasscodeGate({ onUnlock }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const tryUnlock = () => {
    if (value === INSTRUCTOR_PASSCODE) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "24px 4px" }}>
      <div style={{ color: "#3a5a55", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>
        instructor access requires a passcode
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
        placeholder="enter passcode"
        autoFocus
        style={{ ...inputStyle, borderColor: error ? "#d97706" : "#cbe8e0" }}
      />
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#c2650a", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          <AlertCircle size={13} />
          incorrect passcode
        </div>
      )}
      <button
        onClick={tryUnlock}
        style={{
          background: "#0d9488",
          color: "#ffffff",
          border: "none",
          borderRadius: 6,
          padding: "10px 16px",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        unlock
      </button>
    </div>
  );
}

const labelStyle = {
  display: "block",
  color: "#6b8f88",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11.5,
  marginBottom: 6,
  letterSpacing: "0.03em",
};

const inputStyle = {
  width: "100%",
  background: "#ffffff",
  border: "1px solid #cbe8e0",
  borderRadius: 6,
  padding: "10px 12px",
  color: "#0f2e2b",
  fontSize: 13.5,
  outline: "none",
  boxSizing: "border-box",
};

const smallBtnStyle = {
  display: "flex",
  alignItems: "center",
  background: "#ffffff",
  border: "1px solid #cbe8e0",
  borderRadius: 6,
  color: "#0d9488",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11.5,
  padding: "6px 10px",
  cursor: "pointer",
};

const iconBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#6b8f88",
  cursor: "pointer",
  padding: 4,
  display: "flex",
  flexShrink: 0,
};

export default function App() {
  const [tab, setTab] = useState("submit");
  const [instructorUnlocked, setInstructorUnlocked] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7fbf9",
        fontFamily: "'Inter', sans-serif",
        padding: "28px 16px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Terminal size={18} style={{ color: "#0d9488" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#0f2e2b", fontSize: 15, fontWeight: 600 }}>
            delta-submit
          </span>
        </div>
        <div style={{ color: "#6b8f88", fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", marginBottom: 18 }}>
          {COHORT} · assignment notebooks
        </div>

        <div style={{ display: "flex", marginBottom: 16, borderBottom: "1px solid #cbe8e0" }}>
          {[
            { id: "submit", label: "submit" },
            { id: "instructor", label: "instructor@delta:~$" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #0d9488" : "2px solid transparent",
                color: tab === t.id ? "#0d9488" : "#6b8f88",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12.5,
                padding: "8px 14px 10px",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              [ {t.label} ]
            </button>
          ))}
        </div>

        {tab === "submit" ? (
          <SubmitView />
        ) : instructorUnlocked ? (
          <InstructorView />
        ) : (
          <PasscodeGate onUnlock={() => setInstructorUnlocked(true)} />
        )}
      </div>
    </div>
  );
}
