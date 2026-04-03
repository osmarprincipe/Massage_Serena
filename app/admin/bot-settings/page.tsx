"use client";

import { useState, useEffect } from "react";
import { Bot, Save, MessageSquare, Settings, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const toneOptions = ["Professional", "Warm & Professional", "Casual", "Formal", "Empathetic"];
const styleOptions = ["Concise & Elegant", "Detailed", "Conversational", "Brief & Direct"];

export default function BotSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    tone: "Warm & Professional",
    personalityDesc: "",
    responseStyle: "Concise & Elegant",
    emojiUsage: false,
    greetingMessage: "",
    fallbackMessage: "",
  });

  useEffect(() => {
    fetch("/api/bot-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setForm({ ...form, ...data.data });
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/bot-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success("Bot settings saved");
      else toast.error("Failed to save settings");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  return (
    <div className="max-w-3xl space-y-8">
      <SectionHeader
        title="Bot Settings"
        description="Configure your AI assistant's personality and behavior"
        icon={Bot}
        actions={
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        }
      />

      {/* Persona */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-primary/8 text-primary">
            <Wand2 className="h-4 w-4" />
          </div>
          <h2 className="font-semibold font-display text-foreground">Persona</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Business Name</Label>
            <Input
              placeholder="How the bot refers to your studio"
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={form.tone} onValueChange={(v) => update("tone", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {toneOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Personality Description</Label>
            <Textarea
              placeholder="Describe how the bot should present itself and interact with clients..."
              rows={4}
              value={form.personalityDesc}
              onChange={(e) => update("personalityDesc", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Response Style */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-primary/8 text-primary">
            <Settings className="h-4 w-4" />
          </div>
          <h2 className="font-semibold font-display text-foreground">Response Settings</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Response Style</Label>
            <Select value={form.responseStyle} onValueChange={(v) => update("responseStyle", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {styleOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="mb-2 block">Emoji Usage</Label>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={form.emojiUsage}
                onCheckedChange={(v) => update("emojiUsage", v)}
              />
              <span className="text-sm text-muted-foreground">
                {form.emojiUsage ? "Enabled — bot will use emojis" : "Disabled — plain text only"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-primary/8 text-primary">
            <MessageSquare className="h-4 w-4" />
          </div>
          <h2 className="font-semibold font-display text-foreground">Custom Messages</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Greeting Message</Label>
            <p className="text-xs text-muted-foreground">Shown when a user first starts a conversation</p>
            <Textarea
              placeholder="Welcome to [Studio Name]! I'm here to help you..."
              rows={3}
              value={form.greetingMessage}
              onChange={(e) => update("greetingMessage", e.target.value)}
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label>Fallback Message</Label>
            <p className="text-xs text-muted-foreground">
              Sent when the bot cannot understand or handle a request
            </p>
            <Textarea
              placeholder="I'm sorry, I wasn't able to understand that. Please contact us at..."
              rows={3}
              value={form.fallbackMessage}
              onChange={(e) => update("fallbackMessage", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-mocha-700 to-mocha-900 p-6">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10">
              <Bot className="h-4 w-4 text-gold-300" />
            </div>
            <span className="text-sm font-medium text-white/80">Bot Preview</span>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/10">
            <p className="text-sm text-mocha-100/90 leading-relaxed">
              {form.greetingMessage || "Enter a greeting message to see a preview..."}
            </p>
          </div>
          <p className="text-xs text-mocha-300/60">
            Tone: {form.tone} · Style: {form.responseStyle}
            {form.emojiUsage && " · Emoji enabled"}
          </p>
        </div>
      </div>
    </div>
  );
}
