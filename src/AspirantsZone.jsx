import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";


const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON   = import.meta.env.VITE_SUPABASE_ANON;
const CLOUD_NAME      = import.meta.env.VITE_CLOUD_NAME;
const UPLOAD_PRESET   = "aspirants_zone";
// ──────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Device Identity ──────────────────────────────────────────────────────────
function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem("az_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      localStorage.setItem("az_device_id", id);
    }
    return id;
  } catch { return "dev_fallback_" + Math.random().toString(36).slice(2); }
}
function getStoredBuyerName()  { try { return localStorage.getItem("az_buyer_name") || ""; } catch { return ""; } }
function storeBuyerName(name)  { try { localStorage.setItem("az_buyer_name", name); } catch {} }
function getStoredSellerName() { try { return localStorage.getItem("az_seller_name") || ""; } catch { return ""; } }
function storeSellerName(name) { try { localStorage.setItem("az_seller_name", name); } catch {} }
// ─────────────────────────────────────────────────────────────────────────────

async function uploadToCloudinary(file) {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", UPLOAD_PRESET);
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:"POST", body:data });
  const json = await res.json();
  if (!json.secure_url) throw new Error("Cloudinary upload failed");
  return json.secure_url;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SUBJECTS   = ["All","Physics","Chemistry","Maths","Biology"];
const CONDITIONS = ["Like New","Good","Fair","Worn"];
const CITIES     = ["Kota","Delhi","Jaipur","Hyderabad","Pune","Mumbai","Chennai","Bangalore","Chandigarh","Patna","Lucknow","Nagpur"];

const DELIVERY_OPTIONS = [
  { value:"local", label:"📍 Local Pickup Only",     desc:"Buyer meets you in your area" },
  { value:"post",  label:"📦 Delivery by Post",       desc:"You'll ship via India Post / courier" },
  { value:"both",  label:"✅ Both Options Available",  desc:"Buyer can choose pickup or delivery" },
];
const deliveryColors = {
  local:{ bg:"#FFF7ED", text:"#C2410C" },
  post: { bg:"#F0FDF4", text:"#15803D" },
  both: { bg:"#EFF6FF", text:"#1D4ED8" },
};
const deliveryLabel = { local:"📍 Local Only", post:"📦 Post Available", both:"✅ Pickup or Post" };

// ─── Theme ────────────────────────────────────────────────────────────────────
const BLUE  = "#1A56DB";
const DARK  = "#1E3A5F";
const LIGHT = "#EFF6FF";

const subjectColors = {
  Physics:   { bg:"#EFF6FF", text:"#1D4ED8" },
  Chemistry: { bg:"#F0FDF4", text:"#15803D" },
  Maths:     { bg:"#FDF4FF", text:"#9333EA" },
  Biology:   { bg:"#ECFDF5", text:"#065F46" },
};
const conditionColors = {
  "Like New":{ bg:"#F0FDF4", text:"#15803D" },
  "Good":    { bg:"#EFF6FF", text:"#1D4ED8" },
  "Fair":    { bg:"#FFFBEB", text:"#B45309" },
  "Worn":    { bg:"#FFF1F2", text:"#BE123C" },
};
const bookEmoji = { Physics:"⚡", Chemistry:"🧪", Maths:"📐", Biology:"🌿" };

// ─── Small reusable components ────────────────────────────────────────────────
const Tag = ({ label, colors }) => (
  <span style={{display:"inline-block",padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:600,background:colors.bg,color:colors.text,marginRight:"5px",marginBottom:"4px"}}>{label}</span>
);

const Avatar = ({ name, size=38, bg=DARK }) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:700,flexShrink:0}}>
    {(name||"?").charAt(0).toUpperCase()}
  </div>
);

const Spinner = ({ size=20, color=BLUE }) => (
  <div style={{width:size,height:size,border:`3px solid ${color}33`,borderTop:`3px solid ${color}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
);

// ─── Image Upload Box ─────────────────────────────────────────────────────────
const ImageUploadBox = ({ label, preview, onFile, inputRef }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onFile(url);
    } catch {
      setError("Upload failed. Check Cloudinary config.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{flex:1}}>
      <div style={{fontSize:"12px",fontWeight:700,color:"#555",marginBottom:"6px"}}>{label}</div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{border:"2px dashed "+(preview?BLUE:error?"#EF4444":"#C8D8EC"),borderRadius:"10px",height:"110px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:uploading?"wait":"pointer",overflow:"hidden",background:preview?"transparent":"#F7F9FF",position:"relative"}}
      >
        {uploading ? (
          <><Spinner /><div style={{fontSize:"11px",color:BLUE,marginTop:"8px",fontWeight:600}}>Uploading...</div></>
        ) : preview ? (
          <>
            <img src={preview} alt={label} style={{width:"100%",height:"100%",objectFit:"cover"}} />
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.45)",color:"#fff",fontSize:"11px",padding:"4px",textAlign:"center",fontWeight:600}}>✅ Uploaded · Tap to change</div>
          </>
        ) : (
          <><div style={{fontSize:"24px",marginBottom:"5px"}}>📷</div><div style={{fontSize:"11px",color:error?"#EF4444":"#7A9CC4",fontWeight:500}}>{error||"Tap to upload"}</div></>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleChange} />
    </div>
  );
};

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({ conv, currentRole, onSend, onShareNumber, onClose }) {
  const [text, setText]     = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef           = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [conv.messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSend(conv.id, text.trim());
    setText("");
    setSending(false);
  };

  const isBuyer = currentRole === "buyer";

  return (
    <div style={{position:"fixed",bottom:0,right:20,width:340,height:490,background:"#fff",borderRadius:"16px 16px 0 0",boxShadow:"0 -4px 30px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column",zIndex:1000,border:"1.5px solid #D0DCEA",borderBottom:"none"}}>
      <div style={{background:DARK,borderRadius:"16px 16px 0 0",padding:"12px 16px",display:"flex",alignItems:"center",gap:"10px"}}>
        <Avatar name={isBuyer ? conv.seller_name||"S" : conv.buyer_name} size={34} bg={BLUE} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:"#fff",fontWeight:700,fontSize:"14px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isBuyer ? conv.seller_name||"Seller" : conv.buyer_name}</div>
          <div style={{color:"#7AAAD4",fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>re: {conv.listing_title}</div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:"8px",background:"#F7FAFF"}}>
        <div style={{textAlign:"center",fontSize:"11px",color:"#B0C0D0",padding:"4px 10px",background:"#EDF2F8",borderRadius:"20px",alignSelf:"center"}}>
          🔒 Chat is private. Share your number only when comfortable.
        </div>
        {(conv.messages||[]).map(msg => {
          const isMe = (isBuyer && msg.sender==="buyer") || (!isBuyer && msg.sender==="seller");
          if (msg.type==="phone_share") {
            return (
              <div key={msg.id} style={{alignSelf:"center",background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:"12px",padding:"10px 14px",fontSize:"13px",color:"#15803D",textAlign:"center",maxWidth:"260px"}}>
                📱 <strong>{msg.seller_name}</strong> shared their number:<br/>
                <span style={{fontSize:"16px",fontWeight:800,letterSpacing:"1px"}}>{msg.phone}</span>
                <div style={{fontSize:"11px",color:"#6EE7B7",marginTop:"3px"}}>You can now contact them directly</div>
              </div>
            );
          }
          return (
            <div key={msg.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"78%",background:isMe?BLUE:"#fff",color:isMe?"#fff":"#1A1A2E",borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"9px 13px",fontSize:"14px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",border:isMe?"none":"1.5px solid #E0EAF4"}}>
                {msg.text}
                <div style={{fontSize:"10px",marginTop:"4px",opacity:0.65,textAlign:"right"}}>
                  {new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!isBuyer && !(conv.messages||[]).some(m=>m.type==="phone_share") && (
        <div style={{padding:"8px 12px",background:"#F0F4FF",borderTop:"1px solid #E0EAF4",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px"}}>
          <div style={{fontSize:"12px",color:"#4A6FA5"}}>Ready to meet? Share your number.</div>
          <button onClick={()=>onShareNumber(conv.id)} style={{background:BLUE,color:"#fff",border:"none",borderRadius:"8px",padding:"6px 12px",fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>📱 Share Number</button>
        </div>
      )}

      <div style={{padding:"10px 12px",borderTop:"1.5px solid #EDF2F8",display:"flex",gap:"8px",background:"#fff"}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Type a message..." style={{flex:1,padding:"9px 12px",borderRadius:"22px",border:"1.5px solid #D0DCEA",fontSize:"14px",outline:"none"}} />
        <button onClick={send} disabled={sending||!text.trim()}
          style={{background:text.trim()?BLUE:"#C8D8EC",border:"none",borderRadius:"50%",width:38,height:38,cursor:text.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0,transition:"background 0.15s"}}>
          {sending?<Spinner size={16} color="#fff"/>:"➤"}
        </button>
      </div>
    </div>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────
function NotificationsPanel({ convs, onOpenConv, onClose }) {
  const totalUnread = convs.reduce((s,c)=>s+(c.unread_by_seller||0),0);
  const grouped = {};
  convs.forEach(c => { (grouped[c.listing_title]=grouped[c.listing_title]||[]).push(c); });

  return (
    <div style={{position:"absolute",top:"62px",right:"16px",width:340,background:"#fff",borderRadius:"14px",boxShadow:"0 8px 40px rgba(0,0,0,0.18)",border:"1.5px solid #D0DCEA",zIndex:900,overflow:"hidden"}}>
      <div style={{padding:"14px 16px",background:DARK,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{color:"#fff",fontWeight:700,fontSize:"15px"}}>🔔 Messages</div>
          <div style={{color:"#7AAAD4",fontSize:"12px"}}>{totalUnread} unread · {convs.length} conversations</div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:"13px"}}>✕</button>
      </div>
      <div style={{maxHeight:400,overflowY:"auto"}}>
        {convs.length===0
          ? <div style={{textAlign:"center",padding:"36px 20px",color:"#93A8C0"}}><div style={{fontSize:"36px",marginBottom:"8px"}}>💬</div><div style={{fontWeight:600,fontSize:"14px"}}>No messages yet</div></div>
          : Object.entries(grouped).map(([title, cs])=>(
              <div key={title}>
                <div style={{padding:"8px 16px",background:"#F4F7FB",fontSize:"11px",fontWeight:700,color:"#5A7A9C",letterSpacing:"0.5px",display:"flex",alignItems:"center",gap:"6px"}}>
                  📚 {title}
                  <span style={{background:BLUE,color:"#fff",borderRadius:"10px",padding:"1px 7px",fontSize:"10px"}}>{cs.length} buyer{cs.length>1?"s":""}</span>
                </div>
                {cs.map(conv=>{
                  const last = (conv.messages||[])[conv.messages?.length-1];
                  return (
                    <div key={conv.id} onClick={()=>onOpenConv(conv)}
                      style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:"11px",cursor:"pointer",borderBottom:"1px solid #F0F5FA",background:"#fff"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#F7FAFF"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <Avatar name={conv.buyer_name} size={40} bg={conv.unread_by_seller>0?BLUE:DARK}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"3px"}}>
                          <div style={{fontWeight:conv.unread_by_seller>0?700:600,fontSize:"14px",color:"#1A1A2E"}}>{conv.buyer_name}</div>
                          {conv.unread_by_seller>0&&<span style={{background:BLUE,color:"#fff",borderRadius:"50%",minWidth:"20px",height:"20px",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700}}>{conv.unread_by_seller}</span>}
                        </div>
                        <div style={{fontSize:"13px",color:"#7A8EA8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?.text||"No messages yet"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { title:"",author:"",subject:"Physics",condition:"Good",price:"",city:"",area:"",phone:"",description:"",seller:"",coverPhoto:null,exercisePage:null,delivery:"local" };

export default function AspirantsZone() {
  // ── Device ID — MUST be first, everything else depends on it ──
  const MY_DEVICE_ID    = useRef(getOrCreateDeviceId()).current;
  const MY_SELLER_ID    = MY_DEVICE_ID;
  const MY_SELLER_NAME  = getStoredSellerName() || "Seller";
  const MY_SELLER_PHONE = (()=>{ try { return localStorage.getItem("az_seller_phone")||""; } catch { return ""; } })();

  // ── UI state ──
  const [view, setView]                       = useState("browse");
  const [selectedListing, setSelectedListing] = useState(null);
  const [activeSubject, setActiveSubject]     = useState("All");
  const [activeCity, setActiveCity]           = useState("All");
  const [searchQuery, setSearchQuery]         = useState("");
  const [detailTab, setDetailTab]             = useState("cover");
  const [role, setRole]                       = useState("buyer");
  const [showNotifications, setShowNotifications] = useState(false);

  // ── Data state ──
  const [listings, setListings]               = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [conversations, setConversations]     = useState([]);
  const [openConvId, setOpenConvId]           = useState(null);
  const [submitted, setSubmitted]             = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [form, setForm]                       = useState(EMPTY_FORM);

  // ── Buyer identity ──
  const [myBuyerName, setMyBuyerName]         = useState(getStoredBuyerName);
  const [buyerNameModal, setBuyerNameModal]   = useState(false);
  const [pendingListing, setPendingListing]   = useState(null);

  const coverRef    = useRef();
  const exerciseRef = useRef();

  // ── Load listings ──
  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    const { data, error } = await supabase.from("listings").select("*").order("posted_at", {ascending:false});
    if (!error && data) setListings(data);
    setLoadingListings(false);
  }, []);

  // ── Load seller conversations with messages ──
  const fetchConversations = useCallback(async () => {
    const { data: convData } = await supabase.from("conversations").select("*").eq("seller_id", MY_SELLER_ID).order("created_at", {ascending:false});
    if (!convData) return;
    const withMessages = await Promise.all(convData.map(async conv => {
      const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", conv.id).order("created_at", {ascending:true});
      return { ...conv, messages: msgs||[] };
    }));
    setConversations(withMessages);
  }, []);

  // ── Load open conversation messages (real-time) ──
  const fetchOpenConvMessages = useCallback(async (convId) => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at", {ascending:true});
    if (data) {
      setConversations(prev => prev.map(c => c.id===convId ? {...c, messages:data} : c));
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { if (role==="seller") fetchConversations(); }, [role, fetchConversations]);

  // ── Real-time: new messages in open conversation ──
  useEffect(() => {
    if (!openConvId) return;
    const sub = supabase.channel("messages_"+openConvId)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages", filter:`conversation_id=eq.${openConvId}` },
        () => fetchOpenConvMessages(openConvId))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [openConvId, fetchOpenConvMessages]);

  // ── Real-time: new conversations for seller ──
  useEffect(() => {
    if (role!=="seller") return;
    const sub = supabase.channel("conversations_seller")
      .on("postgres_changes", { event:"*", schema:"public", table:"conversations", filter:`seller_id=eq.${MY_SELLER_ID}` },
        () => fetchConversations())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [role, fetchConversations]);

  // ── Derived ──
  const openConv     = conversations.find(c=>c.id===openConvId)||null;
  const totalUnread  = conversations.reduce((s,c)=>s+(c.unread_by_seller||0),0);

  const filtered = listings.filter(l => {
    const matchSub    = activeSubject==="All" || l.subject===activeSubject;
    const matchCity   = activeCity==="All" || l.city.toLowerCase()===activeCity.toLowerCase();
    const q           = searchQuery.toLowerCase();
    const matchSearch = !q || l.title.toLowerCase().includes(q) || (l.author||"").toLowerCase().includes(q);
    return matchSub && matchCity && matchSearch;
  });

  // ── Start chat as buyer ──
  const startChat = (listing) => {
    if (!myBuyerName.trim()) { setPendingListing(listing); setBuyerNameModal(true); return; }
    openOrCreateChat(listing);
  };

  const openOrCreateChat = async (listing) => {
    // Each buyer+listing pair gets exactly ONE conversation — identified by device ID
    const { data: existing } = await supabase.from("conversations")
      .select("*").eq("listing_id", listing.id).eq("buyer_id", MY_DEVICE_ID).maybeSingle();

    if (existing) {
      const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", existing.id).order("created_at");
      const conv = { ...existing, seller_name: listing.seller_name, messages: msgs||[] };
      setConversations(prev => prev.find(c=>c.id===existing.id) ? prev.map(c=>c.id===existing.id?conv:c) : [...prev, conv]);
      setOpenConvId(existing.id);
      return;
    }

    // Create new conversation — buyer_id is this device's unique ID
    const { data: newConv } = await supabase.from("conversations").insert({
      buyer_name: myBuyerName, buyer_id: MY_DEVICE_ID,
      seller_id: listing.seller_id, listing_id: listing.id,
      listing_title: listing.title, unread_by_seller: 0,
    }).select().single();

    if (newConv) {
      setConversations(prev => [...prev, { ...newConv, seller_name: listing.seller_name, messages:[] }]);
      setOpenConvId(newConv.id);
    }
  };

  // ── Send message ──
  const handleSend = async (convId, text) => {
    const sender = role==="buyer" ? "buyer" : "seller";
    await supabase.from("messages").insert({ conversation_id:convId, sender, text, type:"text" });
    if (role==="buyer") {
      await supabase.from("conversations").update({ unread_by_seller: (openConv?.unread_by_seller||0)+1 }).eq("id", convId);
    }
    await fetchOpenConvMessages(convId);
    if (role==="seller") fetchConversations();
  };

  // ── Share number ──
  const handleShareNumber = async (convId) => {
    await supabase.from("messages").insert({ conversation_id:convId, sender:"seller", type:"phone_share", phone:MY_SELLER_PHONE, seller_name:MY_SELLER_NAME, text:"" });
    await fetchOpenConvMessages(convId);
  };

  // ── Open from notifications ──
  const openFromNotifications = async (conv) => {
    await supabase.from("conversations").update({ unread_by_seller:0 }).eq("id", conv.id);
    setConversations(prev => prev.map(c=>c.id===conv.id?{...c,unread_by_seller:0}:c));
    setOpenConvId(conv.id);
    setShowNotifications(false);
  };

  // ── Submit listing ──
  const handleSubmit = async () => {
    if (!form.title||!form.price||!form.phone||!form.seller||!form.city) {
      alert("Please fill in: Name, Book Title, Price, City and Phone");
      return;
    }
    setSubmitting(true);
    storeSellerName(form.seller);
    try { localStorage.setItem("az_seller_phone", form.phone); } catch {}
    const { error } = await supabase.from("listings").insert({
      title:       form.title,
      author:      form.author,
      subject:     form.subject,
      condition:   form.condition,
      price:       parseInt(form.price),
      city:        form.city,
      area:        form.area,
      delivery:    form.delivery,
      seller_name: form.seller,
      seller_id:   MY_DEVICE_ID,  // ← this device's unique ID
      phone:       form.phone,
      description: form.description,
      cover_photo:    form.coverPhoto,
      exercise_page:  form.exercisePage,
    });
    setSubmitting(false);
    if (error) { alert("Something went wrong. Please try again."); return; }
    await fetchListings();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setView("browse"); setForm(EMPTY_FORM); }, 2500);
  };

  // ── Shared styles ──
  const inp     = {width:"100%",padding:"10px 13px",borderRadius:"9px",border:"1.5px solid #C8D8EC",fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"14px",background:"#fff"};
  const divider = {border:"none",borderTop:"1px solid #EDF2F8",margin:"16px 0"};
  const sLabel  = {fontSize:"11px",fontWeight:700,color:"#93A8C0",letterSpacing:"0.7px",textTransform:"uppercase",marginBottom:"12px"};
  const lbl     = {display:"block",fontSize:"13px",fontWeight:700,color:"#555",marginBottom:"5px"};

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",minHeight:"100vh",background:"#F2F6FB",color:"#1A1A1A"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── NAVBAR ── */}
      <nav style={{background:DARK,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"58px",position:"sticky",top:0,zIndex:800}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{background:"#fff",color:DARK,width:"32px",height:"32px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"17px"}}>A</div>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:"17px",letterSpacing:"-0.3px",lineHeight:1.1}}>Aspirants Zone</div>
            <div style={{color:"#7AAAD4",fontSize:"10px",fontWeight:600,letterSpacing:"0.5px"}}>SECOND HAND JEE BOOKS</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{display:"flex",background:"rgba(255,255,255,0.12)",borderRadius:"8px",overflow:"hidden",marginRight:"4px"}}>
            <button onClick={()=>setRole("buyer")} style={{padding:"6px 12px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,background:role==="buyer"?"#fff":"transparent",color:role==="buyer"?DARK:"rgba(255,255,255,0.7)"}}>👤 Buyer</button>
            <button onClick={()=>{setRole("seller");fetchConversations();}} style={{padding:"6px 12px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,background:role==="seller"?"#fff":"transparent",color:role==="seller"?DARK:"rgba(255,255,255,0.7)"}}>🏷️ Seller</button>
          </div>
          {role==="seller" && (
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowNotifications(v=>!v)} style={{background:showNotifications?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.12)",border:"none",borderRadius:"9px",padding:"7px 11px",cursor:"pointer",color:"#fff",fontSize:"18px",position:"relative"}}>
                🔔
                {totalUnread>0&&<span style={{position:"absolute",top:"-3px",right:"-3px",background:"#EF4444",color:"#fff",borderRadius:"50%",minWidth:"18px",height:"18px",fontSize:"10px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+DARK}}>{totalUnread}</span>}
              </button>
              {showNotifications&&<NotificationsPanel convs={conversations} onOpenConv={openFromNotifications} onClose={()=>setShowNotifications(false)}/>}
            </div>
          )}
          <button onClick={()=>setView("browse")} style={{padding:"7px 13px",borderRadius:"8px",border:"1.5px solid "+(view!=="sell"?"#fff":"rgba(255,255,255,0.3)"),cursor:"pointer",fontSize:"13px",fontWeight:600,background:view!=="sell"?"#fff":"transparent",color:view!=="sell"?DARK:"#fff"}}>Browse</button>
          <button onClick={()=>setView("sell")} style={{padding:"7px 14px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:700,background:BLUE,color:"#fff"}}>+ Sell</button>
        </div>
      </nav>

      <div style={{maxWidth:"760px",margin:"0 auto",padding:"24px 16px 60px"}} onClick={()=>{if(showNotifications)setShowNotifications(false);}}>

        {/* ── BROWSE ── */}
        {view==="browse"&&<>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontWeight:800,fontSize:"22px",color:"#1A1A2E",marginBottom:"3px",letterSpacing:"-0.3px"}}>Find JEE Books Near You 📚</div>
            <div style={{fontSize:"14px",color:"#7A8EA8"}}>{listings.length} listings · Chat privately · No spam</div>
          </div>

          <input style={{width:"100%",padding:"11px 15px",borderRadius:"10px",border:"1.5px solid #C8D8EC",fontSize:"15px",background:"#fff",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}
            placeholder="🔍  Search by book title or author..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>

          <div style={{background:"#fff",border:"1.5px solid #C8D8EC",borderRadius:"12px",padding:"16px 18px",marginBottom:"20px"}}>
            <div style={sLabel}>Filter by Subject</div>
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:"14px"}}>
              {SUBJECTS.map(sub=>(
                <button key={sub} onClick={()=>setActiveSubject(sub)} style={{padding:"6px 14px",borderRadius:"20px",border:"1.5px solid "+(activeSubject===sub?DARK:"#C8D8EC"),background:activeSubject===sub?DARK:"#fff",color:activeSubject===sub?"#fff":"#555",cursor:"pointer",fontSize:"13px",fontWeight:activeSubject===sub?700:500}}>
                  {sub==="All"?"All Subjects":sub}
                </button>
              ))}
            </div>
            <hr style={{border:"none",borderTop:"1px solid #EDF2F8",margin:"0 0 14px"}}/>
            <div style={sLabel}>Filter by City</div>
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
              {["All",...CITIES].map(city=>(
                <button key={city} onClick={()=>setActiveCity(city)} style={{padding:"6px 14px",borderRadius:"20px",border:"1.5px solid "+(activeCity===city?BLUE:"#C8D8EC"),background:activeCity===city?BLUE:"#fff",color:activeCity===city?"#fff":"#555",cursor:"pointer",fontSize:"13px",fontWeight:activeCity===city?700:500}}>
                  {city==="All"?"All Cities":city}
                </button>
              ))}
            </div>
          </div>

          <div style={{fontSize:"13px",color:"#93A8C0",marginBottom:"14px"}}>{filtered.length} book{filtered.length!==1?"s":""} found{activeCity!=="All"?` in ${activeCity}`:""}{activeSubject!=="All"?` · ${activeSubject}`:""}</div>

          {loadingListings
            ? <div style={{textAlign:"center",padding:"56px",color:"#93A8C0"}}><Spinner size={36}/><div style={{marginTop:"16px",fontSize:"14px"}}>Loading listings...</div></div>
            : filtered.length===0
              ? <div style={{textAlign:"center",padding:"56px 20px",color:"#93A8C0"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>🔍</div><div style={{fontWeight:700,fontSize:"16px",color:"#555",marginBottom:"6px"}}>No books found</div><div style={{fontSize:"14px"}}>Try a different filter or be the first to list!</div></div>
              : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"14px"}}>
                  {filtered.map(l=>(
                    <div key={l.id} style={{background:"#fff",border:"1.5px solid #D0DCEA",borderRadius:"14px",padding:"18px",cursor:"pointer"}}
                      onClick={()=>{setSelectedListing(l);setDetailTab("cover");setView("detail");}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:"12px",marginBottom:"12px"}}>
                        <div style={{width:"56px",height:"56px",borderRadius:"10px",background:l.cover_photo?"transparent":LIGHT,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px"}}>
                          {l.cover_photo?<img src={l.cover_photo} alt="cover" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:bookEmoji[l.subject]}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:"15px",color:"#1A1A2E",lineHeight:1.3,marginBottom:"3px"}}>{l.title}</div>
                          <div style={{color:"#93A8C0",fontSize:"13px"}}>by {l.author}</div>
                        </div>
                      </div>
                      <div>
                        <Tag label={l.subject} colors={subjectColors[l.subject]||{bg:"#F4F7FB",text:"#555"}}/>
                        <Tag label={l.condition} colors={conditionColors[l.condition]||{bg:"#F4F7FB",text:"#555"}}/>
                        <Tag label={"📍 "+l.city} colors={{bg:"#F0F4FF",text:"#3B5FA0"}}/>
                        {l.delivery&&<Tag label={deliveryLabel[l.delivery]||""} colors={deliveryColors[l.delivery]||{bg:"#F4F7FB",text:"#555"}}/>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"12px",paddingTop:"12px",borderTop:"1px solid #EDF2F8"}}>
                        <div><div style={{fontWeight:800,fontSize:"19px",color:BLUE}}>₹{l.price}</div><div style={{fontSize:"12px",color:"#93A8C0"}}>{l.area}</div></div>
                        <div style={{fontSize:"11px",color:"#C8D5E0"}}>{new Date(l.posted_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                      </div>
                    </div>
                  ))}
                </div>
          }
        </>}

        {/* ── DETAIL ── */}
        {view==="detail"&&selectedListing&&<>
          <button onClick={()=>setView("browse")} style={{display:"inline-flex",alignItems:"center",gap:"6px",cursor:"pointer",color:BLUE,marginBottom:"18px",fontSize:"14px",fontWeight:600,background:"none",border:"none",padding:0}}>← Back</button>
          <div style={{background:"#fff",border:"1.5px solid #C8D8EC",borderRadius:"16px",overflow:"hidden"}}>
            <div style={{display:"flex",borderBottom:"1.5px solid #EDF2F8"}}>
              {[["cover","📷 Cover Photo"],["exercise","📄 Exercise Page"]].map(([key,label])=>(
                <button key={key} onClick={()=>setDetailTab(key)} style={{flex:1,padding:"13px",textAlign:"center",fontSize:"13px",fontWeight:700,cursor:"pointer",color:detailTab===key?BLUE:"#93A8C0",background:"#fff",border:"none",borderBottom:detailTab===key?"2.5px solid "+BLUE:"2.5px solid transparent"}}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{height:"230px",background:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
              {detailTab==="cover"
                ? selectedListing.cover_photo
                  ? <img src={selectedListing.cover_photo} alt="Cover" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                  : <div style={{textAlign:"center",color:"#93A8C0"}}><div style={{fontSize:"72px"}}>{bookEmoji[selectedListing.subject]}</div><div style={{fontSize:"13px",marginTop:"8px"}}>No cover photo</div></div>
                : selectedListing.exercise_page
                  ? <img src={selectedListing.exercise_page} alt="Exercise" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                  : <div style={{textAlign:"center",color:"#93A8C0"}}><div style={{fontSize:"52px"}}>📄</div><div style={{fontSize:"13px",marginTop:"8px"}}>No exercise page</div></div>
              }
            </div>
            <div style={{padding:"22px"}}>
              <div style={{fontWeight:800,fontSize:"21px",color:"#1A1A2E",marginBottom:"3px",letterSpacing:"-0.2px"}}>{selectedListing.title}</div>
              <div style={{color:"#93A8C0",fontSize:"14px",marginBottom:"14px"}}>by {selectedListing.author}</div>
              <div style={{fontWeight:800,fontSize:"30px",color:BLUE,marginBottom:"14px"}}>₹{selectedListing.price}</div>
              <div style={{marginBottom:"16px"}}>
                <Tag label={selectedListing.subject} colors={subjectColors[selectedListing.subject]||{bg:"#F4F7FB",text:"#555"}}/>
                <Tag label={selectedListing.condition} colors={conditionColors[selectedListing.condition]||{bg:"#F4F7FB",text:"#555"}}/>
                <Tag label={"📍 "+selectedListing.city+(selectedListing.area?" · "+selectedListing.area:"")} colors={{bg:"#F0F4FF",text:"#3B5FA0"}}/>
                {selectedListing.delivery&&<Tag label={deliveryLabel[selectedListing.delivery]||""} colors={deliveryColors[selectedListing.delivery]||{bg:"#F4F7FB",text:"#555"}}/>}
              </div>
              <hr style={divider}/>
              <div style={sLabel}>About this book</div>
              <div style={{background:"#F4F7FB",borderRadius:"10px",padding:"14px",fontSize:"14px",color:"#444",lineHeight:1.65,marginBottom:"18px"}}>{selectedListing.description||"No description provided."}</div>
              {selectedListing.delivery&&(()=>{
                const opt=DELIVERY_OPTIONS.find(o=>o.value===selectedListing.delivery);
                const dc=deliveryColors[selectedListing.delivery]||{bg:"#F4F7FB",text:"#555"};
                return opt?<div style={{background:dc.bg,border:"1.5px solid "+dc.text+"33",borderRadius:"10px",padding:"12px 14px",marginBottom:"18px",display:"flex",alignItems:"center",gap:"10px"}}><div style={{fontSize:"22px"}}>{opt.label.split(" ")[0]}</div><div><div style={{fontWeight:700,fontSize:"14px",color:dc.text}}>{opt.label.substring(opt.label.indexOf(" ")+1)}</div><div style={{fontSize:"12px",color:dc.text,opacity:0.75,marginTop:"2px"}}>{opt.desc}</div></div></div>:null;
              })()}
              <div style={sLabel}>Seller</div>
              <div style={{background:LIGHT,borderRadius:"10px",padding:"14px 16px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px"}}>
                <Avatar name={selectedListing.seller_name} size={42}/>
                <div>
                  <div style={{fontWeight:700,fontSize:"15px",color:DARK}}>{selectedListing.seller_name}</div>
                  <div style={{fontSize:"13px",color:"#4A6FA5"}}>{selectedListing.city}, India · Verified Seller</div>
                </div>
              </div>
              <div style={{background:"#F0F4FF",border:"1.5px solid #C0D0F0",borderRadius:"12px",padding:"16px",marginBottom:"6px"}}>
                <div style={{fontWeight:700,fontSize:"15px",color:DARK,marginBottom:"4px"}}>💬 Chat with Seller</div>
                <div style={{fontSize:"13px",color:"#4A6FA5",marginBottom:"12px"}}>Your contact info stays private. Seller shares their number only when comfortable.</div>
                <button onClick={()=>startChat(selectedListing)} style={{background:BLUE,color:"#fff",border:"none",borderRadius:"9px",padding:"12px 20px",fontSize:"15px",fontWeight:700,cursor:"pointer",width:"100%"}}>
                  💬  Message Seller
                </button>
              </div>
              <div style={{textAlign:"center",fontSize:"12px",color:"#B0C4D8",marginTop:"8px"}}>🔒 Privacy protected · Meet in person to pay cash</div>
            </div>
          </div>
        </>}

        {/* ── SELL ── */}
        {view==="sell"&&<>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontWeight:800,fontSize:"22px",color:"#1A1A2E",marginBottom:"3px",letterSpacing:"-0.3px"}}>List a Book for Sale</div>
            <div style={{fontSize:"14px",color:"#7A8EA8"}}>Free · Buyers message you privately · Zero commission</div>
          </div>
          {submitted
            ? <div style={{background:LIGHT,border:"1.5px solid #BFDBFE",borderRadius:"12px",padding:"36px 28px",textAlign:"center"}}><div style={{fontSize:"44px",marginBottom:"10px"}}>🎉</div><div style={{fontWeight:800,fontSize:"18px",color:BLUE,marginBottom:"6px"}}>Your book is now live!</div><div style={{fontSize:"14px",color:"#4A6FA5"}}>Students across India can now see and message you.</div></div>
            : <div style={{background:"#fff",border:"1.5px solid #C8D8EC",borderRadius:"16px",padding:"22px"}}>
                <div style={sLabel}>Your Details</div>
                <label style={lbl}>Your Name <span style={{color:BLUE}}>*</span></label>
                <input style={inp} placeholder="e.g. Rahul Sharma" value={form.seller} onChange={e=>setForm(f=>({...f,seller:e.target.value}))}/>
                <label style={lbl}>Phone (private — only shared if you choose to) <span style={{color:BLUE}}>*</span></label>
                <input style={inp} placeholder="10-digit number" maxLength={10} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
                <div style={{fontSize:"12px",color:"#4A6FA5",background:"#F0F4FF",borderRadius:"8px",padding:"9px 12px",marginTop:"-8px",marginBottom:"14px"}}>🔒 Your number is NOT visible to buyers unless you share it in chat.</div>

                <hr style={divider}/>
                <div style={sLabel}>Book Details</div>
                <label style={lbl}>Book Title <span style={{color:BLUE}}>*</span></label>
                <input style={inp} placeholder="e.g. HC Verma Concepts of Physics Vol 1" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
                <label style={lbl}>Author</label>
                <input style={inp} placeholder="e.g. H.C. Verma" value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <div><label style={lbl}>Subject <span style={{color:BLUE}}>*</span></label><select style={inp} value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}>{["Physics","Chemistry","Maths","Biology"].map(s=><option key={s}>{s}</option>)}</select></div>
                  <div><label style={lbl}>Condition <span style={{color:BLUE}}>*</span></label><select style={inp} value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))}>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
                  <div><label style={lbl}>Price (₹) <span style={{color:BLUE}}>*</span></label><input style={inp} type="number" placeholder="200" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
                  <div><label style={lbl}>Your City <span style={{color:BLUE}}>*</span></label><input style={inp} placeholder="e.g. Kota, Patna, Mumbai…" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></div>
                </div>
                <label style={lbl}>Your Area / Locality</label>
                <input style={inp} placeholder="e.g. Talwandi, Rajinder Nagar…" value={form.area} onChange={e=>setForm(f=>({...f,area:e.target.value}))}/>

                <hr style={divider}/>
                <div style={sLabel}>Delivery Preference <span style={{color:BLUE}}>*</span></div>
                <div style={{display:"flex",flexDirection:"column",gap:"9px",marginBottom:"16px"}}>
                  {DELIVERY_OPTIONS.map(opt=>{
                    const sel=form.delivery===opt.value;
                    const dc=deliveryColors[opt.value];
                    return(
                      <div key={opt.value} onClick={()=>setForm(f=>({...f,delivery:opt.value}))} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"10px",border:"2px solid "+(sel?dc.text:"#D0DCEA"),background:sel?dc.bg:"#fff",cursor:"pointer"}}>
                        <div style={{width:20,height:20,borderRadius:"50%",border:"2px solid "+(sel?dc.text:"#C0D0E0"),background:sel?dc.text:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {sel&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
                        </div>
                        <div><div style={{fontWeight:700,fontSize:"14px",color:sel?dc.text:"#1A1A2E"}}>{opt.label}</div><div style={{fontSize:"12px",color:sel?dc.text:"#93A8C0",marginTop:"2px"}}>{opt.desc}</div></div>
                      </div>
                    );
                  })}
                </div>

                <hr style={divider}/>
                <div style={sLabel}>Upload Book Photos (Recommended)</div>
                <div style={{display:"flex",gap:"12px",marginBottom:"8px"}}>
                  <ImageUploadBox label="📷 Cover Photo" preview={form.coverPhoto} onFile={url=>setForm(f=>({...f,coverPhoto:url}))} inputRef={coverRef}/>
                  <ImageUploadBox label="📄 Exercise Page" preview={form.exercisePage} onFile={url=>setForm(f=>({...f,exercisePage:url}))} inputRef={exerciseRef}/>
                </div>
                <div style={{fontSize:"12px",color:"#93A8C0",marginBottom:"14px"}}>💡 Photos increase buyer trust and reduce unnecessary messages.</div>

                <hr style={divider}/>
                <label style={lbl}>Description</label>
                <textarea style={{...inp,minHeight:"88px",resize:"vertical",fontFamily:"inherit"}} placeholder="e.g. Minor pencil marks, binding perfect. Selling because I got into IIT!" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
                <button style={{background:submitting?"#93A8C0":BLUE,color:"#fff",border:"none",borderRadius:"10px",padding:"14px",fontSize:"15px",fontWeight:700,cursor:submitting?"wait":"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}} onClick={handleSubmit} disabled={submitting}>
                  {submitting?<><Spinner size={18} color="#fff"/><span>Saving...</span></>:"List My Book for Free →"}
                </button>
                <div style={{textAlign:"center",fontSize:"12px",color:"#B0C4D8",marginTop:"10px"}}>Free · Private · Zero commission</div>
              </div>
          }
        </>}
      </div>

      {/* ── BUYER NAME MODAL ── */}
      {buyerNameModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#fff",borderRadius:"16px",padding:"28px",width:"100%",maxWidth:"340px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{fontWeight:800,fontSize:"18px",color:"#1A1A2E",marginBottom:"6px"}}>👋 What's your name?</div>
            <div style={{fontSize:"14px",color:"#7A8EA8",marginBottom:"20px"}}>So the seller knows who's messaging them.</div>
            <input style={{...({width:"100%",padding:"10px 13px",borderRadius:"9px",border:"1.5px solid #C8D8EC",fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"14px",background:"#fff"}),fontSize:"15px"}}
              placeholder="e.g. Arjun Mehta" value={myBuyerName} onChange={e=>setMyBuyerName(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&myBuyerName.trim()){storeBuyerName(myBuyerName);setBuyerNameModal(false);if(pendingListing){const l=pendingListing;setPendingListing(null);openOrCreateChat(l);}}}} autoFocus/>
            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>{setBuyerNameModal(false);setPendingListing(null);}} style={{flex:1,padding:"12px",borderRadius:"9px",border:"1.5px solid #C8D8EC",background:"#fff",color:"#555",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{if(!myBuyerName.trim())return;storeBuyerName(myBuyerName);setBuyerNameModal(false);if(pendingListing){const l=pendingListing;setPendingListing(null);openOrCreateChat(l);}}} style={{flex:2,padding:"12px",borderRadius:"9px",border:"none",background:BLUE,color:"#fff",fontSize:"14px",fontWeight:700,cursor:"pointer"}}>Start Chatting →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT WINDOW ── */}
      {openConv&&(
        <ChatWindow conv={openConv} currentRole={role} onSend={handleSend} onShareNumber={handleShareNumber} onClose={()=>setOpenConvId(null)}/>
      )}
    </div>
  );
}
