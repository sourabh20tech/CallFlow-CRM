"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Download, FileSpreadsheet, Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LeadRosterAgent } from "@/types/lead";

interface ParsedLead {
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status?: string;
}

interface RowError {
  row: number;
  name: string;
  error: string;
  field?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  duplicates: number;
  total: number;
  errors: RowError[];
}

type AssignmentMode = "none" | "single" | "round-robin";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: LeadRosterAgent[];
  onComplete: () => void;
}

const REQUIRED_COLUMNS = ["Phone or Email (required — at least one)", "Name (optional)", "Company (optional)", "Source (optional)", "Status (optional)"];

export function BulkUploadModal({ open, onOpenChange, agents, onComplete }: BulkUploadModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("none");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [defaultStatus, setDefaultStatus] = useState("new");
  const [defaultForce, setDefaultForce] = useState("standard");
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([
    { value: "new", label: "New" },
    { value: "interested", label: "Interested" },
    { value: "follow_up", label: "Follow-Up" },
    { value: "converted", label: "Converted" },
    { value: "not_interested", label: "Not Interested" },
    { value: "closed", label: "Closed" },
    { value: "npc", label: "NPC" },
    { value: "switch_off", label: "Switch Off" },
    { value: "call_cut", label: "Call Cut" },
  ]);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [isCreatingStatus, setIsCreatingStatus] = useState(false);

  const reset = () => {
    setStep("upload");
    setParsedLeads([]);
    setFileName("");
    setAssignmentMode("none");
    setSelectedAgentId("");
    setSelectedAgentIds([]);
    setResult(null);
  };

  // Load custom statuses from API
  useEffect(() => {
    fetch("/api/lead-statuses")
      .then((res) => res.json())
      .then((data) => {
        if (data.statuses?.length) {
          setStatusOptions(data.statuses.map((s: { value: string; label: string }) => ({
            value: s.value,
            label: s.label,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateStatus = async () => {
    if (!newStatusLabel.trim() || isCreatingStatus) return;
    setIsCreatingStatus(true);
    try {
      const res = await fetch("/api/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newStatusLabel.trim(), color: "#8b5cf6" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Status "${newStatusLabel.trim()}" created`);
      setStatusOptions((prev) => [...prev, { value: data.value, label: data.label }]);
      setDefaultStatus(data.value);
      setNewStatusLabel("");
      setShowAddStatus(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setIsCreatingStatus(false);
    }
  };

  const handleClose = (openState: boolean) => {
    if (!openState) reset();
    onOpenChange(openState);
  };

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      toast.error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      if (rows.length === 0) {
        toast.error("File is empty — no data rows found");
        return;
      }

      if (rows.length > 1000) {
        toast.error("Maximum 1000 leads per upload. Please split your file.");
        return;
      }

      // Flexible column mapping (case-insensitive, multiple aliases)
      const mapped: ParsedLead[] = rows.map((row) => {
        const keys = Object.keys(row);
        const find = (aliases: string[]) =>
          keys.find((k) => aliases.some((a) => k.toLowerCase().trim() === a.toLowerCase()));

        const nameKey = find(["Name", "Full Name", "FullName", "full_name", "Lead Name", "Contact Name"]);
        const emailKey = find(["Email", "Email Address", "email_address", "E-mail"]);
        const phoneKey = find(["Phone", "Mobile", "Phone Number", "phone_number", "Contact Phone", "Tel"]);
        const companyKey = find(["Company", "Company Name", "company_name", "Organization"]);
        const sourceKey = find(["Source", "Lead Source", "lead_source", "Origin"]);
        const statusKey = find(["Status", "Lead Status", "lead_status"]);

        return {
          fullName: nameKey ? (row[nameKey] ?? "").toString().trim() : "",
          email: emailKey ? (row[emailKey] ?? "").toString().trim() : "",
          phone: phoneKey ? (row[phoneKey] ?? "").toString().trim() : "",
          company: companyKey ? (row[companyKey] ?? "").toString().trim() : "",
          source: sourceKey ? (row[sourceKey] ?? "").toString().trim() : "",
          status: statusKey ? (row[statusKey] ?? "").toString().trim() : "",
        };
      });

      setParsedLeads(mapped);
      setFileName(file.name);
      setStep("preview");
    } catch (e) {
      toast.error("Failed to parse file. Ensure it's a valid CSV or Excel file.");
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/leads/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: parsedLeads,
          assignmentMode,
          assignedAgentId: assignmentMode === "single" ? selectedAgentId : undefined,
          selectedAgentIds: assignmentMode === "round-robin" ? selectedAgentIds : undefined,
          defaultStatus,
          defaultForce,
        }),
      });

      const data = (await res.json()) as UploadResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setResult(data);
      setStep("result");

      if (data.success > 0) {
        toast.success(`${data.success} leads imported successfully`);
        onComplete();
      }
      if (data.success === 0) {
        toast.error("No leads were imported. Check the error details below.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!result?.errors.length) return;

    const csvRows = [
      "Row,Name,Error,Field",
      ...result.errors.map((e) =>
        `${e.row},"${(e.name ?? "").replace(/"/g, '""')}","${e.error.replace(/"/g, '""')}",${e.field ?? ""}`
      ),
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Client-side validation preview — only email/phone is required
  const validationResults = parsedLeads.map((lead, i) => {
    const issues: string[] = [];
    const hasEmail = Boolean(lead.email?.trim());
    const hasPhone = Boolean(lead.phone?.trim());
    if (!hasEmail && !hasPhone) issues.push("No email and no phone");
    if (!lead.fullName?.trim()) issues.push("Name missing (will use 'Unknown Lead')");
    return { index: i, valid: hasEmail || hasPhone, issues };
  });
  const validCount = validationResults.filter((r) => r.valid).length;
  const invalidCount = parsedLeads.length - validCount;

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>
            {step === "upload" && "Bulk Upload Leads"}
            {step === "preview" && "Preview & Validate Import"}
            {step === "result" && "Import Results"}
          </ModalTitle>
          <ModalDescription>
            {step === "upload" && "Upload a CSV or Excel file with lead data"}
            {step === "preview" && `${parsedLeads.length} rows found in ${fileName}`}
            {step === "result" && "Detailed import results"}
          </ModalDescription>
        </ModalHeader>

        <ModalBody showClose={false}>
          {/* STEP 1: FILE UPLOAD */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 p-10 text-center transition-colors hover:border-primary/40"
              >
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drag & drop your file here</p>
                  <p className="mt-1 text-xs text-muted-foreground">CSV, XLSX, or XLS — max 1000 rows</p>
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleInputChange} className="hidden" />
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    Browse files
                  </span>
                </label>
              </div>

              {/* Column guide */}
              <div className="rounded-lg border border-border/50 p-4">
                <p className="mb-2 text-sm font-medium">Required Columns</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  {REQUIRED_COLUMNS.map((col) => (
                    <span key={col} className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      {col}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Column names are matched flexibly: "Name", "Full Name", "FullName" etc. all work.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATE */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Validation summary */}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="rounded-lg bg-red-500/10 px-3 py-1.5 font-medium text-red-600 dark:text-red-400">
                    ✗ {invalidCount} will fail
                  </span>
                )}
                <span className="rounded-lg bg-muted px-3 py-1.5 text-muted-foreground">
                  {parsedLeads.length} total rows
                </span>
              </div>

              {/* Preview table */}
              <div className="max-h-52 overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="w-8 px-2 py-1.5 text-left">#</th>
                      <th className="px-2 py-1.5 text-left">Name</th>
                      <th className="px-2 py-1.5 text-left">Email</th>
                      <th className="px-2 py-1.5 text-left">Phone</th>
                      <th className="px-2 py-1.5 text-left">Company</th>
                      <th className="px-2 py-1.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {parsedLeads.slice(0, 15).map((lead, i) => {
                      const vr = validationResults[i];
                      return (
                        <tr key={i} className={!vr.valid ? "bg-red-500/5" : ""}>
                          <td className="px-2 py-1.5 text-muted-foreground">
                            {!vr.valid && <span className="text-red-500">⚠</span>} {i + 1}
                          </td>
                          <td className="px-2 py-1.5 font-medium">{lead.fullName || <span className="text-red-500">—</span>}</td>
                          <td className="px-2 py-1.5">{lead.email || "—"}</td>
                          <td className="px-2 py-1.5">{lead.phone || "—"}</td>
                          <td className="px-2 py-1.5">{lead.company || "—"}</td>
                          <td className="px-2 py-1.5">{lead.status || "new"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {parsedLeads.length > 15 && (
                  <p className="border-t border-border/30 px-3 py-2 text-center text-xs text-muted-foreground">
                    ...and {parsedLeads.length - 15} more rows
                  </p>
                )}
              </div>

              {/* Validation issues preview */}
              {invalidCount > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="mb-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    {invalidCount} rows will be skipped (no email or phone):
                  </p>
                  <ul className="max-h-20 overflow-y-auto text-xs text-muted-foreground">
                    {validationResults
                      .filter((r) => !r.valid)
                      .slice(0, 10)
                      .map((r) => (
                        <li key={r.index}>
                          Row {r.index + 1}: {r.issues.join(", ")}
                        </li>
                      ))}
                    {invalidCount > 10 && (
                      <li className="text-muted-foreground/60">...and {invalidCount - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Assignment options */}
              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="text-sm font-medium">Agent Assignment</p>
                <div className="flex flex-wrap gap-2">
                  {(["none", "single", "round-robin"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAssignmentMode(mode)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        assignmentMode === mode
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      {mode === "none" && "Leave Unassigned"}
                      {mode === "single" && "Assign to One Agent"}
                      {mode === "round-robin" && "Round Robin"}
                    </button>
                  ))}
                </div>

                {assignmentMode === "single" && (
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Select agent...</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}

                {assignmentMode === "round-robin" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Select agents for equal distribution ({selectedAgentIds.length} selected):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {agents.map((a) => (
                        <label key={a.id} className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={selectedAgentIds.includes(a.id)}
                            onChange={(e) => {
                              setSelectedAgentIds((prev) =>
                                e.target.checked
                                  ? [...prev, a.id]
                                  : prev.filter((id) => id !== a.id),
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-border"
                          />
                          {a.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Default Status & Tier dropdowns */}
              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="text-sm font-medium">Default Values (for rows without Status/Force)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Default Status</label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => setDefaultStatus(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {!showAddStatus ? (
                      <button
                        type="button"
                        onClick={() => setShowAddStatus(true)}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Plus className="h-3 w-3" />
                        Add New Status
                      </button>
                    ) : (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newStatusLabel}
                          onChange={(e) => setNewStatusLabel(e.target.value)}
                          placeholder="Status name..."
                          maxLength={30}
                          className="h-7 flex-1 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => void handleCreateStatus()}
                          disabled={!newStatusLabel.trim() || isCreatingStatus}
                          className="flex h-7 items-center gap-0.5 rounded bg-primary px-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
                        >
                          {isCreatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddStatus(false); setNewStatusLabel(""); }}
                          className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Default Force</label>
                    <select
                      value={defaultForce}
                      onChange={(e) => setDefaultForce(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS */}
          {step === "result" && result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                {result.failed === 0 && result.duplicates === 0 ? (
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                ) : result.success > 0 ? (
                  <AlertCircle className="h-12 w-12 text-amber-500" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-red-500" />
                )}
                <p className="text-lg font-semibold">
                  {result.success} of {result.total} leads imported
                </p>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{result.success}</p>
                  <p className="text-[11px] text-muted-foreground">Success</p>
                </div>
                <div className="rounded-lg bg-red-500/10 p-3 text-center">
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{result.failed}</p>
                  <p className="text-[11px] text-muted-foreground">Failed</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{result.duplicates}</p>
                  <p className="text-[11px] text-muted-foreground">Duplicates</p>
                </div>
              </div>

              {/* Error details */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Error Details ({result.errors.length})
                    </p>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadErrorReport}>
                      <Download className="h-3 w-3" />
                      Download Report
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="px-2 py-1.5 text-left">Row</th>
                          <th className="px-2 py-1.5 text-left">Name</th>
                          <th className="px-2 py-1.5 text-left">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {result.errors.map((err, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1.5 font-mono text-muted-foreground">{err.row}</td>
                            <td className="px-2 py-1.5 font-medium">{err.name}</td>
                            <td className="px-2 py-1.5 text-red-600 dark:text-red-400">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => { setStep("upload"); setParsedLeads([]); }}>
                Back
              </Button>
              <Button
                onClick={() => void handleUpload()}
                disabled={isUploading || validCount === 0}
                className="gap-1.5"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {validCount} leads
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={() => handleClose(false)}>Done</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
