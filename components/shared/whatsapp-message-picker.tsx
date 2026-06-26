"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Edit2, Loader2, MessageCircle, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/components/design-system/modal";
import { FormInput } from "@/components/design-system/form-input";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface WaMessage {
  id: string;
  name: string;
  content: string;
}

interface WhatsAppMessagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  leadName?: string;
  leadStatus?: string;
  leadSource?: string;
}

function resolveVars(content: string, vars: { name?: string; phone?: string; status?: string; source?: string; agentName?: string }): string {
  return content
    .replace(/\{name\}/gi, vars.name ?? "")
    .replace(/\{phone\}/gi, vars.phone ?? "")
    .replace(/\{status\}/gi, vars.status ?? "")
    .replace(/\{source\}/gi, vars.source ?? "")
    .replace(/\{agent_name\}/gi, vars.agentName ?? "");
}

export function WhatsAppMessagePicker({ open, onOpenChange, phone, leadName, leadStatus, leadSource }: WhatsAppMessagePickerProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agent/whatsapp-messages");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {} finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (open) void load(); }, [open, load]);

  const selectedMsg = messages.find((m) => m.id === selectedId);

  const handleSelect = (msg: WaMessage) => {
    setSelectedId(msg.id);
    const resolved = resolveVars(msg.content, {
      name: leadName, phone, status: leadStatus, source: leadSource, agentName: user?.fullName,
    });
    setEditedContent(resolved);
  };

  const handleSend = () => {
    const url = buildWhatsAppUrl(phone, editedContent.trim());
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      onOpenChange(false);
      setSelectedId(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newContent.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/agent/whatsapp-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), content: newContent.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Message saved");
      setNewName(""); setNewContent(""); setShowCreate(false);
      void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/agent/whatsapp-messages/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) { setSelectedId(null); setEditedContent(""); }
      toast.success("Deleted");
    } catch { toast.error("Delete failed"); }
  };

  const handleDuplicate = async (msg: WaMessage) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/agent/whatsapp-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${msg.name} (Copy)`, content: msg.content }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Duplicated");
      void load();
    } catch { toast.error("Failed"); }
    finally { setIsSaving(false); }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md" scrollable>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            WhatsApp Messages
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3">
              {/* Message List */}
              {messages.length === 0 && !showCreate && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No saved messages. Click &quot;+ New Message&quot; to create one.
                </p>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-colors",
                    selectedId === msg.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{msg.name}</p>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => void handleDuplicate(msg)} className="rounded p-1 text-muted-foreground hover:text-foreground" title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => void handleDelete(msg.id)} className="rounded p-1 text-muted-foreground hover:text-destructive" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{msg.content}</p>
                </div>
              ))}

              {/* Selected message editor */}
              {selectedId && (
                <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/10">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Edit before sending:</p>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </div>
              )}

              {/* Create new message */}
              {showCreate && (
                <div className="space-y-2 rounded-lg border border-dashed border-primary/40 p-3">
                  <FormInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Message name..." maxLength={50} className="h-8 text-xs" />
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    placeholder="Message content... Use {name}, {phone}, {agent_name}"
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 gap-1 text-xs" disabled={!newName.trim() || !newContent.trim() || isSaving} onClick={() => void handleCreate()}>
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowCreate(false); setNewName(""); setNewContent(""); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowCreate(true)} disabled={showCreate}>
            <Plus className="h-3.5 w-3.5" /> New Message
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!selectedId || !editedContent.trim()}
            onClick={handleSend}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="h-4 w-4" /> Send via WhatsApp
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
