"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Camera, Eye, EyeOff, Save, Loader2, GraduationCap, Briefcase, Tag, User, Github, Linkedin } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"profile"|"password">("profile");
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [skillInput, setSkillInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch("/api/users/me").then(r=>r.json()).then(d=>{setProfile(d);setLoading(false);}); }, []);
  const set = (k:string, v:any) => setProfile((p:any)=>({...p,[k]:v}));

  async function saveProfile(e:React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/users/me",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:profile.name,phone:profile.phone,bio:profile.bio,department:profile.department,linkedIn:profile.linkedIn,github:profile.github,college:profile.college,graduationYear:profile.graduationYear,specialization:profile.specialization,skills:profile.skills})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data); toast.success("Profile saved!");
    } catch(err:any){toast.error(err.message);} finally{setSaving(false);}
  }
  async function savePw(e:React.FormEvent) {
    e.preventDefault();
    if (pw.next!==pw.confirm){toast.error("Passwords don't match");return;}
    if (pw.next.length<8){toast.error("Min 8 characters");return;}
    setSaving(true);
    try {
      const res = await fetch("/api/users/me",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:pw.current,newPassword:pw.next})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Password updated!"); setPw({current:"",next:"",confirm:""});
    } catch(err:any){toast.error(err.message);} finally{setSaving(false);}
  }
  async function uploadAvatar(e:React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size>5*1024*1024){toast.error("Max 5MB");return;}
    setUploading(true);
    try {
      const sr = await fetch("/api/upload/sign"); const sd = await sr.json();
      const fd = new FormData(); fd.append("file",file); fd.append("signature",sd.signature); fd.append("timestamp",sd.timestamp); fd.append("api_key",sd.apiKey); fd.append("folder",sd.folder);
      const ur = await fetch(`https://api.cloudinary.com/v1_1/${sd.cloudName}/image/upload`,{method:"POST",body:fd});
      const ud = await ur.json(); if (!ur.ok) throw new Error(ud.error?.message||"Upload failed");
      await fetch("/api/users/me",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({avatarUrl:ud.secure_url})});
      set("avatarUrl",ud.secure_url); toast.success("Photo updated!");
    } catch(err:any){toast.error(err.message);} finally{setUploading(false);}
  }
  function addSkill(e:React.KeyboardEvent<HTMLInputElement>) {
    if((e.key==="Enter"||e.key===",")&&skillInput.trim()){e.preventDefault();const s=skillInput.trim().replace(/,$/,"");if(s&&!(profile.skills||[]).includes(s))set("skills",[...(profile.skills||[]),s]);setSkillInput("");}
  }

  const c:Record<string,string>={ADMIN:"#f5a623",MENTOR:"#6c77ff",INTERN:"#22c97b"};
  const cc=c[role]||"#6c77ff";
  const inp:React.CSSProperties={width:"100%",height:40,padding:"0 12px",borderRadius:"var(--radius-md)",border:"1px solid var(--border-default)",background:"var(--bg-quaternary)",color:"var(--text-primary)",fontFamily:"var(--font-sans)",fontSize:14,outline:"none"};
  const focusBorder=(e:any)=>(e.target.style.borderColor="var(--accent)");
  const blurBorder=(e:any)=>(e.target.style.borderColor="var(--border-default)");

  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:12}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:60}}/>)}</div>;

  return (
    <div style={{maxWidth:780}}>
      <div style={{marginBottom:28}}>
        <p className="section-label" style={{marginBottom:6}}>MY PROFILE</p>
        <h1 style={{fontFamily:"var(--font-serif)",fontSize:32,color:"var(--text-primary)",fontWeight:400}}>Profile Settings</h1>
        <p style={{color:"var(--text-secondary)",fontSize:14,marginTop:4}}>Update your photo, personal info and account security</p>
      </div>
      <hr className="divider" style={{marginBottom:24}}/>

      {/* Hero card */}
      <div className="card" style={{padding:24,marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{position:"relative",flexShrink:0}}>
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt={profile.name} style={{width:80,height:80,borderRadius:"var(--radius-lg)",objectFit:"cover",border:"2px solid var(--border-default)"}}/>
            : <div style={{width:80,height:80,borderRadius:"var(--radius-lg)",background:cc+"22",color:cc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:500}}>{getInitials(profile.name||"U")}</div>}
          <button type="button" onClick={()=>fileRef.current?.click()} disabled={uploading}
            style={{position:"absolute",bottom:-6,right:-6,width:28,height:28,borderRadius:"50%",background:"var(--accent)",border:"2px solid var(--bg-secondary)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {uploading?<Loader2 size={12} color="#fff" style={{animation:"spin 0.8s linear infinite"}}/>:<Camera size={12} color="#fff"/>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={uploadAvatar}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:20,fontWeight:500,color:"var(--text-primary)",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.name}</div>
          <div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:8}}>{profile.email}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,padding:"2px 8px",borderRadius:"var(--radius-pill)",background:cc+"22",color:cc,fontWeight:500}}>{role}</span>
            {profile.department&&<span style={{fontSize:12,color:"var(--text-tertiary)"}}>· {profile.department}</span>}
            {profile.college&&<span style={{fontSize:12,color:"var(--text-tertiary)"}}>· {profile.college}</span>}
          </div>
          {(profile.linkedIn||profile.github)&&(
            <div style={{display:"flex",gap:12,marginTop:8}}>
              {profile.linkedIn&&<a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"var(--accent)",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><Linkedin size={12}/>LinkedIn</a>}
              {profile.github&&<a href={profile.github} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"var(--accent)",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><Github size={12}/>GitHub</a>}
            </div>
          )}
        </div>
        {profile.bio&&<p style={{fontSize:13,color:"var(--text-secondary)",lineHeight:1.6,maxWidth:260,fontStyle:"italic",display:"-webkit-box",overflow:"hidden",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>{profile.bio}</p>}
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",background:"var(--bg-tertiary)",border:"1px solid var(--border-default)",borderRadius:"var(--radius-md)",padding:4,gap:2,marginBottom:20,width:"fit-content"}}>
        {(["profile","password"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 20px",borderRadius:"var(--radius-sm)",border:"none",cursor:"pointer",fontSize:13,fontFamily:"var(--font-sans)",fontWeight:500,transition:"all 150ms",background:tab===t?"var(--bg-secondary)":"transparent",color:tab===t?"var(--text-primary)":"var(--text-secondary)",boxShadow:tab===t?"var(--shadow-subtle)":"none"}}>
            {t==="profile"?"Profile Info":"Security"}
          </button>
        ))}
      </div>

      {tab==="profile"?(
        <form onSubmit={saveProfile}>
          {/* Personal */}
          <div className="card" style={{marginBottom:14}}>
            <div className="card-header"><div style={{display:"flex",alignItems:"center",gap:8}}><User size={15} color="var(--accent)"/><h2 style={{fontSize:14,fontWeight:500,color:"var(--text-primary)"}}>Personal Information</h2></div></div>
            <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
              <div><label className="label">Full Name *</label><input style={inp} value={profile.name||""} onChange={e=>set("name",e.target.value)} required onFocus={focusBorder} onBlur={blurBorder}/></div>
              <div><label className="label">Phone</label><input style={inp} type="tel" placeholder="+91 98765 43210" value={profile.phone||""} onChange={e=>set("phone",e.target.value)} onFocus={focusBorder} onBlur={blurBorder}/></div>
              <div><label className="label">Department</label><input style={inp} placeholder="Engineering / Design" value={profile.department||""} onChange={e=>set("department",e.target.value)} onFocus={focusBorder} onBlur={blurBorder}/></div>
              <div style={{gridColumn:"1/-1"}}><label className="label">Bio / About Me</label><textarea style={{...inp,height:"auto",minHeight:72,padding:"10px 12px",resize:"vertical"}} placeholder="Brief intro about yourself…" value={profile.bio||""} onChange={e=>set("bio",e.target.value)} onFocus={focusBorder} onBlur={blurBorder}/></div>
            </div>
          </div>
          {/* Education (intern only) */}
          {role==="INTERN"&&(
            <div className="card" style={{marginBottom:14}}>
              <div className="card-header"><div style={{display:"flex",alignItems:"center",gap:8}}><GraduationCap size={15} color="var(--success)"/><h2 style={{fontSize:14,fontWeight:500,color:"var(--text-primary)"}}>Education</h2></div></div>
              <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
                <div><label className="label">College / University</label><input style={inp} placeholder="IIT Bombay…" value={profile.college||""} onChange={e=>set("college",e.target.value)} onFocus={focusBorder} onBlur={blurBorder}/></div>
                <div><label className="label">Specialization / Branch</label><input style={inp} placeholder="Computer Science" value={profile.specialization||""} onChange={e=>set("specialization",e.target.value)} onFocus={focusBorder} onBlur={blurBorder}/></div>
                <div><label className="label">Graduation Year</label><input style={inp} type="number" placeholder="2026" min={2020} max={2032} value={profile.graduationYear||""} onChange={e=>set("graduationYear",parseInt(e.target.value)||undefined)} onFocus={focusBorder} onBlur={blurBorder}/></div>
              </div>
            </div>
          )}
          {/* Links */}
          <div className="card" style={{marginBottom:14}}>
            <div className="card-header"><div style={{display:"flex",alignItems:"center",gap:8}}><Briefcase size={15} color="var(--info)"/><h2 style={{fontSize:14,fontWeight:500,color:"var(--text-primary)"}}>Professional Links</h2></div></div>
            <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
              <div><label className="label">LinkedIn URL</label><div style={{position:"relative"}}><Linkedin size={13} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-tertiary)"}}/><input style={{...inp,paddingLeft:36}} type="url" placeholder="https://linkedin.com/in/…" value={profile.linkedIn||""} onChange={e=>set("linkedIn",e.target.value)} onFocus={focusBorder} onBlur={blurBorder}/></div></div>
              <div><label className="label">GitHub URL</label><div style={{position:"relative"}}><Github size={13} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-tertiary)"}}/><input style={{...inp,paddingLeft:36}} type="url" placeholder="https://github.com/…" value={profile.github||""} onChange={e=>set("github",e.target.value)} onFocus={focusBorder} onBlur={blurBorder}/></div></div>
            </div>
          </div>
          {/* Skills */}
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><div style={{display:"flex",alignItems:"center",gap:8}}><Tag size={15} color="var(--warning)"/><h2 style={{fontSize:14,fontWeight:500,color:"var(--text-primary)"}}>Skills</h2></div></div>
            <div className="card-body">
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10,minHeight:20}}>
                {(profile.skills||[]).map((s:string)=>(
                  <span key={s} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:"var(--radius-pill)",background:"var(--accent-10)",color:"var(--accent)",fontSize:12,fontWeight:500,border:"1px solid var(--accent-20)"}}>
                    {s}<button type="button" onClick={()=>set("skills",(profile.skills||[]).filter((x:string)=>x!==s))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",lineHeight:1,padding:0,fontSize:14}}>×</button>
                  </span>
                ))}
              </div>
              <input style={{...inp,maxWidth:300}} placeholder="Type skill + Enter (React, Python…)" value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={addSkill} onFocus={focusBorder} onBlur={blurBorder}/>
              <p style={{fontSize:12,color:"var(--text-tertiary)",marginTop:5}}>Press Enter or comma to add a skill</p>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{gap:8}}>
            {saving?<Loader2 size={14}/>:<Save size={14}/>} Save Profile
          </button>
        </form>
      ):(
        <form onSubmit={savePw}>
          <div className="card" style={{maxWidth:440}}>
            <div className="card-header"><h2 style={{fontSize:14,fontWeight:500,color:"var(--text-primary)"}}>Change Password</h2></div>
            <div className="card-body" style={{display:"flex",flexDirection:"column",gap:14}}>
              {([["Current Password","current"],["New Password","next"],["Confirm New Password","confirm"]] as [string,string][]).map(([label,key])=>(
                <div key={key}>
                  <label className="label">{label}</label>
                  <div style={{position:"relative"}}>
                    <input style={{...inp,paddingRight:44}} type={showPw?"text":"password"} placeholder="••••••••" value={pw[key as keyof typeof pw]} onChange={e=>setPw(p=>({...p,[key]:e.target.value}))} required onFocus={focusBorder} onBlur={blurBorder}/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-tertiary)"}}>
                      {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={saving} className="btn btn-primary" style={{marginTop:4}}>
                {saving?<Loader2 size={14}/>:"Update Password"}
              </button>
            </div>
          </div>
        </form>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
