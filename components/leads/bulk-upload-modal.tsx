"use client";

import { useCallback, useState } from "react";
import { FileSpreadsheet, Loader2, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
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

type AssignmentMode = "none" | "single" | "round-robin";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: LeadRosterAgent[];
  onComplete: () => void;
}

export function BulkUploadModal({ open, onOpenChange, agents, onComplete }: BulkUploadModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("none");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null);

  const reset = () => {
    setStep("upload");
    setParsedLeads([]);
    setFileName("");
    setAssignmentMode("none");
    setSelectedAgentId("");
    setSelectedAgentIds([]);
    setResult(null);
  };

  const handleClose = (openState: boolean) => {
    if (!openState) reset();
    onOpenChange(openState);
  };

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      if (rows.length === 0) {
        toast.error("File is empty");
        return;
      }

      if (rows.length > 1000) {
        toast.error("Maximum 1000 leads per upload");
        return;
      }

      // Map columns (flexible matching)
      const mapped: ParsedLead[] = rows.map((row) => ({
        fullName: row["Name"] || row["name"] || row["Full Name"] || row["full_name"] || row["FullName"] || "",
        email: row["Email"] || row["email"] || row["Email Address"] || "",
        phone: row["Phone"] || row["phone"] || row["Mobile"] || row["Phone Number"] || "",
        company: row["Company"] || row["company"] || row["Company Name"] || "",
        source: row["Source"] || row["source"] || row["Lead Source"] || "",
        status: row["Status"] || row["status"] || "",
      }));

      setParsedLeads(mapped);
      setFileName(file.name);
      setStep("preview");
    } catch {
      toast.error("Failed to parse file");
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setResult(data);
      setStep("result");

      if (data.success > 0) {
        toast.success(`${data.success} leads imported successfully`);
        onComplete();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedLeads.filter((l) => l.fullName?.trim() && (l.email?.trim() || l.phone?.trim())).length;
  const invalidCount = parsedLeads.length - validCount;

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>
            {step === "upload" && "Bulk Upload Leads"}
            {step === "preview" && "Preview Import"}
            {step === "result" && "Import Complete"}
          </ModalTitle>
          <ModalDescription>
            {step === "upload" && "Upload a CSV or Excel file with lead data"}
            {step === "preview" && `${parsedLeads.length} rows found in ${fileName}`}
            {step === "result" && "Import results summary"}
          </ModalDescription>
        </ModalHeader>

        <ModalBody showClose={false}>
          {step === "upload" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 p-10 text-center transition-colors hover:border-primary/40"
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drag & drop your file here</p>
                <p className="mt-1 text-xs text-muted-foreground">CSV, XLSX, or XLS (max 1000 rows)</p>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleInputChange} className="hidden" />
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  Browse files
                </span>
              </label>
              <div className="mt-2 text-xs text-muted-foreground">
                <p className="font-medium">Required columns:</p>
                <p>Name, Phone or Email</p>
                <p className="mt-1">Optional: Company, Source, Status</p>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex gap-3 text-sm">
                <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400">
                  ✓ {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="rounded-lg bg-red-500/10 px-3 py-1.5 text-red-600 dark:text-red-400">
                    ✗ {invalidCount} invalid (will be skipped)
                  </span>
                )}
              </div>

              {/* Preview table */}
              <div className="max-h-48 overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-left">#</th>
                      <th className="px-2 py-1.5 text-left">Name</th>
                      <th className="px-2 py-1.5 text-left">Email</th>
                      <th className="px-2 py-1.5 text-left">Phone</th>
                      <th className="px-2 py-1.5 text-left">Company</th>
                      <th className="px-2 py-1.5 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {parsedLeads.slice(0, 10).map((lead, i) => (
                      <tr key={i} className={!lead.fullName?.trim() ? "bg-red-500/5" : ""}>
                        <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-1.5 font-medium">{lead.fullName || "—"}</td>
                        <td className="px-2 py-1.5">{lead.email || "—"}</td>
                        <td className="px-2 py-1.5">{lead.phone || "—"}</td>
                        <td className="px-2 py-1.5">{lead.company || "—"}</td>
                        <td className="px-2 py-1.5">{lead.source || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedLeads.length > 10 && (
                  <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                    ...and {parsedLeads.length - 10} more rows
                  </p>
                )}
              </div>

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
                    <p className="text-xs text-muted-foreground">Select agents for distribution:</p>
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
            </div>
          )}

          {step === "result" && result && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {result.failed === 0 ? (
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              ) : (
                <AlertCircle className="h-12 w-12 text-amber-500" />
              )}
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  {result.success} of {result.total} leads imported
                </p>
                {result.failed > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {result.failed} rows failed (invalid data or duplicates)
                  </p>
                )}
              </div>
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
