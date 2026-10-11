"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, Upload, CheckCircle2, Loader2, ImageIcon, FileText, PenTool, Layout } from "lucide-react";

type AssetKey = "hrSignatureUrl" | "companyStampUrl" | "logoUrl" | "certificateTemplateUrl";

function UploadBlock({
  label, icon: Icon, desc, value, accept,
  assetKey, onSave,
}: {
  label: string; icon: any; desc: string; value: string;
  accept?: string; assetKey: AssetKey;
  onSave: (key: AssetKey, url: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    setUploading(true);
    try {
      const sr  = await fetch("/api/upload/sign");
      const sd  = await sr.json();
      const fd  = new FormData();
      fd.append("file",      file);
      fd.append("signature", sd.signature);
      fd.append("timestamp", sd.timestamp);
      fd.append("api_key",   sd.apiKey);
      fd.append("folder",    sd.folder);
      const ur  = await fetch(
        `https://api.cloudinary.com/v1_1/${sd.cloudName}/image/upload`,
        { method: "POST", body: fd }
      );
      const ud  = await ur.json();
      if (!ur.ok) throw new Error(ud.error?.message || "Upload failed");
      await onSave(assetKey, ud.secure_url);
      toast.success(`${label} uploaded!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: value ? 14 : 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "var(--radius-md)",
          background: "var(--accent-10)", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={18} color="var(--accent)" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>{label}</h3>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</p>
        </div>
        {value && <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 4 }} />}
      </div>

      {value && (
        <div style={{
          marginBottom: 12, padding: 10,
          background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          display: "flex", justifyContent: "center", alignItems: "center",
        }}>
          <img
            src={value} alt={label}
            style={{ maxHeight: 80, maxWidth: "100%", objectFit: "contain" }}
          />
        </div>
      )}

      <label style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        height: 34, padding: "0 14px",
        background: value ? "var(--bg-tertiary)" : "var(--accent)",
        color: value ? "var(--text-secondary)" : "#fff",
        border: `1px solid ${value ? "var(--border-default)" : "var(--accent)"}`,
        borderRadius: "var(--radius-md)",
        cursor: uploading ? "not-allowed" : "pointer",
        fontSize: 13, fontWeight: 500, transition: "all 150ms",
      }}>
        {uploading
          ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
          : <Upload size={13} />
        }
        {value ? "Replace" : "Upload"}
        <input
          type="file" accept={accept || "image/*"}
          style={{ display: "none" }}
          onChange={handleFile}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

export default function CertificateSettingsPage() {
  const [company, setCompany]         = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [footerText, setFooterText]   = useState("");
  const [savingFooter, setSavingFooter] = useState(false);

  useEffect(() => {
    fetch("/api/company/assets")
      .then(r => r.json())
      .then(d => {
        setCompany(d);
        setFooterText(d.certificateFooterText || "");
        setLoading(false);
      });
  }, []);

  async function saveAsset(key: AssetKey, url: string) {
    const res  = await fetch("/api/company/assets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setCompany(data);
  }

  async function saveFooter(e: React.FormEvent) {
    e.preventDefault();
    setSavingFooter(true);
    try {
      const res = await fetch("/api/company/assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateFooterText: footerText }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Footer text saved!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingFooter(false);
    }
  }

  if (loading) return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>ADMIN · CERTIFICATES</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Certificate Assets</h1>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>ADMIN · CERTIFICATES</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>
          Certificate Assets
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
          Upload your company's branding assets and certificate template used on intern completion certificates.
        </p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Info banner */}
        <div style={{
          padding: "12px 16px",
          background: "var(--accent-10)",
          border: "1px solid var(--accent-20)",
          borderRadius: "var(--radius-md)",
          fontSize: 13, color: "var(--accent)", lineHeight: 1.6,
        }}>
          💡 Once all assets are uploaded, go to <strong>Evaluations</strong>, mark an intern as complete — the intern
          will see a <strong>Download Certificate</strong> button with these assets embedded.
        </div>

        {/* HR Signature */}
        <UploadBlock
          label="HR Signature"
          icon={PenTool}
          desc="Signing authority's signature. Appears at the bottom of every certificate. PNG with transparent background recommended."
          value={company?.hrSignatureUrl || ""}
          assetKey="hrSignatureUrl"
          onSave={saveAsset}
        />

        {/* Company Stamp */}
        <UploadBlock
          label="Company Stamp / Seal"
          icon={Award}
          desc="Official company seal or stamp. Appears top-right of the certificate. PNG with transparent background recommended."
          value={company?.companyStampUrl || ""}
          assetKey="companyStampUrl"
          onSave={saveAsset}
        />

        {/* Company Logo */}
        <UploadBlock
          label="Company Logo"
          icon={ImageIcon}
          desc="Your company logo. Shown top-left on every certificate. PNG or SVG with transparent background preferred."
          value={company?.logoUrl || ""}
          assetKey="logoUrl"
          onSave={saveAsset}
        />

        {/* Certificate Template */}
        <UploadBlock
          label="Certificate Template (Background)"
          icon={Layout}
          desc="Optional custom background image for the certificate. Upload a landscape A4 PNG or JPG (2480×1754 px recommended). If not set, the default clean white template is used."
          value={company?.certificateTemplateUrl || ""}
          accept="image/png,image/jpeg,image/jpg"
          assetKey="certificateTemplateUrl"
          onSave={saveAsset}
        />

        {/* Footer text */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "var(--radius-md)",
              background: "var(--info-10)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FileText size={18} color="var(--info)" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                Certificate Footer Text
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Custom disclaimer or validation text shown at the bottom of every certificate. Max 300 characters.
              </p>
            </div>
          </div>
          <form onSubmit={saveFooter}>
            <textarea
              className="textarea"
              style={{ minHeight: 80, marginBottom: 12, width: "100%" }}
              placeholder="e.g. This certificate is issued by XYZ Pvt Ltd as an official recognition of successful internship completion."
              maxLength={300}
              value={footerText}
              onChange={e => setFooterText(e.target.value)}
            />
            <button type="submit" disabled={savingFooter} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
              {savingFooter && <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />}
              Save Footer Text
            </button>
          </form>
        </div>

        {/* Configured assets preview */}
        {(company?.hrSignatureUrl || company?.companyStampUrl || company?.logoUrl || company?.certificateTemplateUrl) && (
          <div className="card" style={{ padding: 20, border: "1px solid var(--success-10)", background: "var(--success-10)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Configured Assets</h3>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
              {([
                ["Logo",        company.logoUrl],
                ["HR Signature", company.hrSignatureUrl],
                ["Stamp",       company.companyStampUrl],
                ["Template",    company.certificateTemplateUrl],
              ] as [string, string][]).map(([lbl, url]) => url ? (
                <div key={lbl} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{lbl}</p>
                  <img src={url} alt={lbl} style={{ maxHeight: 52, maxWidth: 100, objectFit: "contain", display: "block" }} />
                </div>
              ) : null)}
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
