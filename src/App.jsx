import React, { useEffect, useRef, useState } from "react";

const copy = {
  en: {
    eyebrow: "Personal intelligence system",
    greeting: "Good to see you, Ahmad.",
    prompt: "What are we solving today?",
    placeholder: "Message Jarvis...",
    listening: "Listening...",
    thinking: "Jarvis is thinking",
    disclaimer: "Jarvis can make mistakes. Verify important information.",
    status: "Systems online",
    newChat: "New conversation",
    empty: "Ask anything, build a plan, write content, explain code, or explore an idea.",
    voiceUnavailable: "Voice input is not supported in this browser.",
    error: "I couldn't reach the AI service. Please try again in a moment.",
    suggestions: ["Plan my day", "Explain something simply", "Write a professional message"],
    createdBy: "Created by",
    online: "AI ONLINE",
    web: "WEB",
    webOn: "Web search on",
    webOff: "Web search off",
    clear: "Clear conversation",
  },
  ur: {
    eyebrow: "ذاتی ذہانت کا نظام",
    greeting: "احمد، آپ کو دیکھ کر خوشی ہوئی۔",
    prompt: "آج ہم کیا حل کر رہے ہیں؟",
    placeholder: "جاروس کو پیغام لکھیں...",
    listening: "سن رہا ہوں...",
    thinking: "جاروس سوچ رہا ہوں",
    disclaimer: "جاروس سے غلطی ہو سکتی ہے۔ اہم معلومات کی تصدیق کریں۔",
    status: "تمام نظام فعال ہیں",
    newChat: "نئی گفتگو",
    empty: "کوئی بھی سوال پوچھیں، منصوبہ بنائیں، مواد لکھیں، کوڈ سمجھائیں یا کسی خیال پر غور کریں۔",
    voiceUnavailable: "اس براؤزر میں آواز کی سہولت دستیاب نہیں۔",
    error: "AI سروس سے رابطہ نہیں ہو سکا۔ چند لمحوں بعد دوبارہ کوشش کریں۔",
    suggestions: ["میرا دن پلان کریں", "کسی چیز کو آسان الفاظ میں سمجھائیں", "پروفیشنل پیغام لکھیں"],
    createdBy: "تیار کردہ",
    online: "AI آن لائن",
    web: "ویب",
    webOn: "ویب سرچ آن",
    webOff: "ویب سرچ آف",
    clear: "گفتگو صاف کریں",
  },
};

const STORAGE_KEY = "jarvis-messages";
const LEGACY_STORAGE_KEY = "jarvis-groq-messages";
const CHAT_ENDPOINT = "/.netlify/functions/chat";

function Icon({ name, size = 20 }) {
  const paths = {
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    mic: <><rect width="8" height="13" x="8" y="2" rx="4"/><path d="M4 10a8 8 0 0 0 16 0M12 18v4M8 22h8"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.42"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>,
    volume: <><path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    stop: <rect width="12" height="12" x="6" y="6" rx="2"/>,
    copy: <><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 10v7M14 10v7"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
  );
}

function Orb({ compact = false, active = false }) {
  return (
    <div className={`orb ${compact ? "orb--compact" : ""} ${active ? "is-active" : ""}`} aria-hidden="true">
      <span className="orb__ring orb__ring--one" />
      <span className="orb__ring orb__ring--two" />
      <span className="orb__ring orb__ring--three" />
      <span className="orb__core"><span /></span>
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState(() => localStorage.getItem("jarvis-theme") || "dark");
  const [messages, setMessages] = useState(() => {
    try {
      const storedMessages = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      return JSON.parse(storedMessages || "[]");
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [notice, setNotice] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [webSearch, setWebSearch] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typewriterRef = useRef(null);
  const text = copy[language];
  const isUrdu = language === "ur";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("jarvis-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  useEffect(() => () => recognitionRef.current?.stop(), []);
  useEffect(() => () => clearInterval(typewriterRef.current), []);

  // Reveals the reply gradually instead of popping in all at once, since
  // the AI function below returns the full answer in one response rather
  // than a token stream. Purely cosmetic — the assistant message already
  // holds the full text; this just controls how much of it is shown.
  const revealText = (fullText, assistantIndex) => {
    clearInterval(typewriterRef.current);
    let shown = 0;
    const chunkSize = Math.max(1, Math.round(fullText.length / 120));
    typewriterRef.current = setInterval(() => {
      shown = Math.min(fullText.length, shown + chunkSize);
      setMessages(current => {
        const updated = [...current];
        if (!updated[assistantIndex]) return current;
        updated[assistantIndex] = { ...updated[assistantIndex], content: fullText.slice(0, shown) };
        return updated;
      });
      if (shown >= fullText.length) clearInterval(typewriterRef.current);
    }, 15);
  };

  const resetConversation = () => {
    setMessages([]);
    setInput("");
    setNotice("");
    setCopiedIndex(null);
    window.speechSynthesis?.cancel();
    localStorage.removeItem(STORAGE_KEY);
  };

  const speak = (content) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content.replace(/[*#`]/g, ""));
    utterance.lang = isUrdu ? "ur-PK" : "en-US";
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  };

  const copyMessage = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setNotice("Copy is not available in this browser.");
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice(text.voiceUnavailable);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = isUrdu ? "ur-PK" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => { setNotice(""); setIsListening(true); };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const submitMessage = async (messageText = input) => {
    const cleanInput = messageText.trim();
    if (!cleanInput || isLoading) return;

    const userMessage = { role: "user", content: cleanInput };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setNotice("");
    setIsLoading(true);

    const assistantIndex = nextMessages.length;
    setMessages(current => [...current, { role: "assistant", content: "" }]);

    try {
      const systemMessage = {
        role: "system",
        content: language === "ur"
          ? "آپ JARVIS ہیں، احمد نثار کے ذاتی AI معاون۔ درست، مفید، واضح اور عملی جواب دیں۔ اردو یا صارف کی زبان میں جواب دیں۔ جہاں فائدہ ہو headings اور bullets استعمال کریں۔ سوال کا براہ راست جواب پہلے دیں۔ کسی کام، ویب رسائی یا حقیقت کا جھوٹا دعویٰ نہ کریں۔"
          : "You are JARVIS, Ahmad Nisar's personal AI assistant. Give accurate, useful, clear and practical answers. Reply in the user's language. Use headings and bullets when useful. Answer directly first. Never claim an action or web access you did not actually perform.",
      };

      // Only role/content are sent to the API — strip out any local-only
      // fields like `error` that got attached to past assistant messages.
      const historyForApi = nextMessages
        .slice(-20)
        .map(({ role, content }) => ({ role, content }));

      const chatMessages = [systemMessage, ...historyForApi];

      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          mode: webSearch ? "search" : "smart",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `The AI service returned an error (${res.status}).`);
      }

      const fullText = (data?.content || "").trim();
      if (!fullText) {
        throw new Error("The AI returned an empty response. Please try again.");
      }

      revealText(fullText, assistantIndex);
    } catch (error) {
      setMessages(current => {
        const updated = [...current];
        updated[assistantIndex] = {
          role: "assistant",
          content: error?.message || text.error,
          error: true,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app-shell" dir={isUrdu ? "rtl" : "ltr"}>
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <div className="grid-plane" />

      <header className="topbar">
        <button className="brand" onClick={resetConversation} aria-label={text.newChat}>
          <Orb compact />
          <span><strong>JARVIS</strong><small>PRO / AHMAD</small></span>
        </button>

        <div className="topbar__actions">
          <span className="system-status"><i />{text.status}</span>
          <span className="provider-badge is-ready">{text.online}</span>

          <button className={`web-toggle ${webSearch ? "active" : ""}`} onClick={() => setWebSearch(v => !v)}
            title={webSearch ? text.webOn : text.webOff}>
            <Icon name="globe" size={15} /><span>{text.web}</span>
          </button>

          <div className="language-switch" aria-label="Language">
            <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
            <button className={language === "ur" ? "active" : ""} onClick={() => setLanguage("ur")}>اردو</button>
          </div>

          <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>

          <button className="icon-button new-chat" onClick={resetConversation} aria-label={text.newChat} title={text.newChat}>
            <Icon name="plus" />
          </button>
        </div>
      </header>

      <section className={`workspace ${messages.length ? "workspace--chat" : ""}`}>
        {!messages.length && (
          <div className="hero">
            <div className="hero__orb"><Orb active={isLoading || isListening} /></div>
            <p className="eyebrow">{text.eyebrow}</p>
            <h1>{text.greeting}</h1>
            <p className="hero__prompt">{text.prompt}</p>
            <p className="hero__description">{text.empty}</p>

            <div className="feature-strip">
              <span>AI CHAT</span><span>VOICE INPUT</span><span>VOICE OUTPUT</span>
              <span>WEB SEARCH</span><span>EN / اردو</span>
            </div>

            <div className="suggestions">
              {text.suggestions.map((suggestion, index) => (
                <button key={suggestion} onClick={() => submitMessage(suggestion)}>
                  <span>0{index + 1}</span>{suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {!!messages.length && (
          <div className="conversation" aria-live="polite">
            {messages.map((message, index) => (
              <article className={`message message--${message.role} ${message.error ? "message--error" : ""}`}
                key={`${message.role}-${index}`}>
                <div className="message__identity">
                  {message.role === "assistant" ? <Orb compact active={isLoading && index === messages.length - 1} /> : <span>AH</span>}
                </div>
                <div className="message__body">
                  <span className="message__label">{message.role === "assistant" ? "JARVIS" : "AHMAD"}</span>
                  <p>{message.content || text.thinking}</p>
                  {message.role === "assistant" && message.content && !message.error && (
                    <div className="message__tools">
                      <button className="speak-button" onClick={() => speak(message.content)} aria-label="Read response aloud" title="Read aloud">
                        <Icon name="volume" size={17} />
                      </button>
                      <button className="copy-button" onClick={() => copyMessage(message.content, index)} aria-label="Copy response" title="Copy response">
                        <Icon name="copy" size={16} /><span>{copiedIndex === index ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>

      <footer className="composer-wrap">
        {notice && <p className="notice">{notice}</p>}
        <form className={`composer ${isListening ? "is-listening" : ""}`} onSubmit={e => { e.preventDefault(); submitMessage(); }}>
          <button type="button" className="voice-button" onClick={toggleVoice} aria-label={isListening ? "Stop listening" : "Start voice input"}>
            <Icon name={isListening ? "stop" : "mic"} />
          </button>

          <textarea value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitMessage(); } }}
            placeholder={isListening ? text.listening : text.placeholder}
            rows="1" aria-label={text.placeholder} />

          <button className="send-button" type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
            <Icon name="send" />
          </button>
        </form>
        <p className="disclaimer">{text.disclaimer}</p>
      </footer>

      <div className="creator-badge"><span>{text.createdBy}</span><strong>AHMAD NISAR</strong></div>
      <a className="puter-footer" href="https://www.netlify.com/products/ai/" target="_blank" rel="noreferrer">Powered by Netlify AI</a>
    </main>
  );
}

export default App;
