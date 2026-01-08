"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Fab,
  Grow,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

type RiskLevel = "green" | "yellow" | "red";
type CallState = "idle" | "incoming" | "active";

type Signal = {
  id: string;
  label: string;
  weight: number;
  reason: string;
  keywords: string[];
};

type EvidenceEvent = {
  id: string;
  time: string;
  message: string;
};

type DecoyPack = {
  caseId: string;
  canaryLink: string;
  decoyCode: string;
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1f7f7a" },
    secondary: { main: "#ff6b4a" },
    warning: { main: "#f3b640" },
    error: { main: "#ff4d3f" },
    success: { main: "#34d399" },
    background: { default: "#f7efe6", paper: "#fff7ef" },
    text: { primary: "#1d1814", secondary: "#6b4f40" },
  },
  typography: {
    fontFamily: "var(--font-body), sans-serif",
    h1: {
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 600,
    },
    h2: {
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 600,
    },
    h3: {
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 600,
    },
    h4: {
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 6,
  },
});

const signals: Signal[] = [
  {
    id: "urgent",
    label: "เขาเร่งด่วนมาก",
    weight: 2,
    reason: "เร่งด่วน",
    keywords: ["ด่วน", "เร่ง", "ทันที", "urgent"],
  },
  {
    id: "transfer",
    label: "ขอโอนเงิน",
    weight: 2,
    reason: "ขอโอนเงิน",
    keywords: ["โอน", "โอนเงิน", "ชำระ", "จ่าย"],
  },
  {
    id: "otp",
    label: "ขอ OTP/รหัส",
    weight: 3,
    reason: "ขอ OTP/รหัส",
    keywords: ["otp", "รหัส", "โค้ด", "code", "ยืนยัน"],
  },
  {
    id: "no-callback",
    label: "ห้ามโทรกลับ/ห้ามวางสาย",
    weight: 3,
    reason: "ห้ามโทรกลับ",
    keywords: ["ห้ามโทรกลับ", "ห้ามวางสาย", "อย่าวางสาย", "ห้ามตัดสาย"],
  },
  {
    id: "impersonate",
    label: "อ้างว่าเป็นตำรวจ/ธนาคาร",
    weight: 2,
    reason: "อ้างหน่วยงาน",
    keywords: ["ตำรวจ", "ธนาคาร", "หน่วยงาน", "เจ้าหน้าที่", "สายด่วน"],
  },
];

const responseScripts = [
  {
    id: "pause",
    text: "ขอทำขั้นตอนยืนยัน 30 วินาทีก่อนนะครับ เพื่อความปลอดภัย",
  },
  {
    id: "callback",
    text: "ผมจะโทรกลับเบอร์ทางการที่บันทึกไว้ในระบบนะครับ",
  },
  {
    id: "otp",
    text: "เรื่อง OTP/รหัส ผมไม่ให้ผ่านสายครับ เดี๋ยวผมยืนยันผ่านช่องทางทางการแทน",
  },
];

const quickScripts = responseScripts.slice(0, 2);

const challengePresets = [
  "พูดเลขสุ่ม 4 ตัวที่ขึ้นบนหน้าจอ",
  "อ่านประโยคสุ่ม: ‘วันนี้อากาศดี แต่เราต้องยืนยัน’",
  "หันซ้าย-ขวา + กระพริบตา 2 ครั้ง",
  "ยกมือแตะหูซ้ายแล้วพูดช้า ๆ ว่า ‘ยืนยันตัวตน’",
  "อ่านตัวอักษรสุ่ม: A-7-K-2",
];

const trustedDirectory = [
  { id: "bank", name: "ธนาคาร (ศูนย์ลูกค้า)", number: "02-123-4567" },
  { id: "police", name: "สายด่วนตำรวจ", number: "191" },
  { id: "manager", name: "หัวหน้า (ในระบบ)", number: "089-111-2233" },
];

const sampleVoice =
  "เขาบอกว่าเร่งด่วนมาก ห้ามโทรกลับ และให้โอนเงินทันทีเพื่อยืนยันบัญชี";

const riskPalette: Record<
  RiskLevel,
  { label: string; bg: string; text: string; dot: string }
> = {
  green: {
    label: "เขียว",
    bg: "#d1fae5",
    text: "#065f46",
    dot: "#34d399",
  },
  yellow: {
    label: "เหลือง",
    bg: "#fef3c7",
    text: "#92400e",
    dot: "#f3b640",
  },
  red: {
    label: "แดง",
    bg: "#fee2e2",
    text: "#b91c1c",
    dot: "#ff4d3f",
  },
};

const featureCards = [
  {
    title: "Risk Meter",
    body: "เหตุผลสั้น ๆ + สีเขียว/เหลือง/แดง แบบอ่านจบใน 3 วิ",
  },
  {
    title: "Next Actions",
    body: "Start Challenge, Call-back ทางการ, Stop & Report",
  },
  {
    title: "Script Library",
    body: "สคริปต์ตอบกลับสำเร็จรูป สำหรับสถานการณ์เร่งด่วน",
  },
  {
    title: "Evidence Log",
    body: "บันทึกการกดปุ่ม + เวลา + risk โดยไม่ต้องอัดเสียง",
  },
];

const randomSegment = (length: number, rng: () => number = Math.random) =>
  Array.from({ length })
    .map(() => Math.floor(rng() * 36).toString(36))
    .join("")
    .toUpperCase();

const formatTime = (date: Date) =>
  date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const initialEvidence: EvidenceEvent[] = [
  { id: "init", time: "--:--:--", message: "AI Guard พร้อมใช้งาน" },
];

const createSeededRng = (seed: string) => {
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
};

const generateDecoy = (rng: () => number = Math.random): DecoyPack => {
  const first = randomSegment(3, rng);
  const second = randomSegment(3, rng);
  const code = Array.from({ length: 6 })
    .map(() => Math.floor(rng() * 10))
    .join("");
  return {
    caseId: `DG-${first}-${second}`,
    canaryLink: `guard.link/${randomSegment(3, rng).toLowerCase()}`,
    decoyCode: `${code.slice(0, 2)} ${code.slice(2, 4)} ${code.slice(4, 6)}`,
  };
};

const getDetectedSignals = (text: string) => {
  if (!text.trim()) {
    return [];
  }
  const normalized = text.toLowerCase();
  return signals
    .filter((signal) =>
      signal.keywords.some((keyword) => normalized.includes(keyword))
    )
    .map((signal) => signal.id);
};

const copyText = async (value: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
  return false;
};

export default function Home() {
  const seedId = useId();
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>("active");
  const [callSeconds, setCallSeconds] = useState(48);
  const [callMuted, setCallMuted] = useState(false);
  const [callSpeaker, setCallSpeaker] = useState(false);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([
    "urgent",
    "transfer",
    "otp",
    "no-callback",
    "impersonate",
  ]);
  const [summaryText, setSummaryText] = useState(
    "หัวหน้าเร่งด่วน ขอ OTP และบอกห้ามโทรกลับ"
  );
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState<{
    prompt: string;
    seconds: number;
  } | null>(null);
  const [decoyPack] = useState<DecoyPack>(() =>
    generateDecoy(createSeededRng(seedId))
  );
  const [evidenceLog, setEvidenceLog] =
    useState<EvidenceEvent[]>(initialEvidence);
  const [caseStatus, setCaseStatus] = useState("กำลังประเมิน");
  const [exported, setExported] = useState(false);

  const detectedSignals = useMemo(
    () => getDetectedSignals(summaryText),
    [summaryText]
  );

  const detectedLabels = useMemo(
    () =>
      detectedSignals
        .map((id) => signals.find((signal) => signal.id === id)?.label ?? id)
        .join(" • "),
    [detectedSignals]
  );

  const appliedSignals = useMemo(() => {
    const applied = new Set([...selectedSignals, ...detectedSignals]);
    return Array.from(applied);
  }, [selectedSignals, detectedSignals]);

  const riskScore = useMemo(() => {
    return appliedSignals.reduce((score, id) => {
      const signal = signals.find((item) => item.id === id);
      return score + (signal?.weight ?? 0);
    }, 0);
  }, [appliedSignals]);

  const hasNoCallback = appliedSignals.includes("no-callback");
  const riskLevel: RiskLevel = hasNoCallback
    ? "red"
    : riskScore >= 6
      ? "red"
      : riskScore >= 3
        ? "yellow"
        : "green";

  const riskReasons = useMemo(() => {
    if (appliedSignals.length === 0) {
      return ["ยังไม่มีสัญญาณเสี่ยงชัด"];
    }
    return appliedSignals
      .map((id) => signals.find((signal) => signal.id === id)?.reason)
      .filter(Boolean)
      .slice(0, 3) as string[];
  }, [appliedSignals]);

  const urgencyActive = appliedSignals.includes("urgent");
  const riskTone = riskPalette[riskLevel];
  const callTime = formatDuration(callSeconds);
  const callBadge =
    callState === "incoming"
      ? "Incoming Call"
      : callState === "active"
        ? "Live Call"
        : "No Active Call";
  const callSubtext =
    callState === "active"
      ? `AI Guard Active · ${callTime} · ไม่บันทึกเสียง`
      : callState === "incoming"
        ? "สายเรียกเข้า · แตะรับสายเพื่อเริ่มการประเมิน"
        : "เริ่มเดโมคอลเพื่อเปิด Bubble";
  const callBadgeSx =
    callState === "incoming"
      ? { bgcolor: "#f3b640", color: "#3d2a05" }
      : callState === "active"
        ? { bgcolor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }
        : { bgcolor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" };
  const bubbleVisible = callState === "active";
  const assistantVisible = bubbleOpen && bubbleVisible;
  const bubbleLabel = bubbleOpen ? "แตะเพื่อย่อ" : "แตะเพื่อเปิด";

  useEffect(() => {
    if (pauseSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setPauseSeconds((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [pauseSeconds]);

  useEffect(() => {
    if (callState !== "active") return;
    const timer = window.setInterval(() => {
      setCallSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (!activeChallenge) return;
    if (activeChallenge.seconds <= 0) return;
    const timer = window.setTimeout(() => {
      setActiveChallenge((current) =>
        current
          ? {
              ...current,
              seconds: Math.max(current.seconds - 1, 0),
            }
          : null
      );
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [activeChallenge]);

  useEffect(() => {
    if (!copiedScriptId) return;
    const timer = window.setTimeout(() => setCopiedScriptId(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedScriptId]);

  const computeUrgency = (nextSignals: string[], nextText: string) => {
    const detected = getDetectedSignals(nextText);
    return new Set([...nextSignals, ...detected]).has("urgent");
  };

  const updateUrgencyCountdown = (nextUrgent: boolean) => {
    if (nextUrgent && !urgencyActive) {
      setPauseSeconds(30);
    }
    if (!nextUrgent && urgencyActive) {
      setPauseSeconds(0);
    }
  };

  const updateSummaryText = (nextText: string) => {
    updateUrgencyCountdown(computeUrgency(selectedSignals, nextText));
    setSummaryText(nextText);
  };

  const toggleSignal = (id: string) => {
    setSelectedSignals((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      updateUrgencyCountdown(computeUrgency(next, summaryText));
      return next;
    });
  };

  const logEvent = (message: string) => {
    const event: EvidenceEvent = {
      id: randomSegment(6),
      time: formatTime(new Date()),
      message,
    };
    setEvidenceLog((current) => [event, ...current].slice(0, 6));
  };

  const handleCopy = async (text: string, id: string) => {
    const success = await copyText(text);
    if (success) {
      setCopiedScriptId(id);
      logEvent(`คัดลอกสคริปต์: ${text}`);
    }
  };

  const handleVoiceDemo = () => {
    updateSummaryText(sampleVoice);
    logEvent("สรุปเสียงถูกถอดเป็นข้อความ");
  };

  const handleStartChallenge = () => {
    const prompt =
      challengePresets[Math.floor(Math.random() * challengePresets.length)];
    setActiveChallenge({ prompt, seconds: 30 });
    logEvent(`เริ่ม Challenge: ${prompt}`);
  };

  const handleStopChallenge = () => {
    setActiveChallenge(null);
    logEvent("หยุด Challenge");
  };

  const handleStartCall = () => {
    setCallState("active");
    setCallSeconds(0);
    setCallMuted(false);
    setCallSpeaker(false);
    setBubbleOpen(false);
    setCaseStatus("กำลังประเมิน");
    logEvent("เริ่มสายคอล");
  };

  const handleIncomingCall = () => {
    setCallState("incoming");
    setBubbleOpen(false);
    logEvent("สายเรียกเข้า (เดโม)");
  };

  const handleAcceptCall = () => {
    setCallState("active");
    setCallSeconds(0);
    setCallMuted(false);
    setCallSpeaker(false);
    setBubbleOpen(false);
    logEvent("รับสายจากหัวหน้า");
  };

  const handleDeclineCall = () => {
    setCallState("idle");
    setBubbleOpen(false);
    logEvent("ปฏิเสธสายเรียกเข้า");
  };

  const handleEndCall = () => {
    setCallState("idle");
    setBubbleOpen(false);
    logEvent("วางสาย");
  };

  const toggleMute = () => {
    setCallMuted((current) => {
      const next = !current;
      logEvent(next ? "ปิดไมค์ระหว่างสาย" : "เปิดไมค์ระหว่างสาย");
      return next;
    });
  };

  const toggleSpeaker = () => {
    setCallSpeaker((current) => {
      const next = !current;
      logEvent(next ? "เปิดลำโพง" : "ปิดลำโพง");
      return next;
    });
  };

  const handleCallBack = () => {
    const contact = trustedDirectory[0];
    if (contact) {
      logEvent(`โทรกลับทางการ: ${contact.name} (${contact.number})`);
    }
  };

  const handleStopReport = () => {
    setCaseStatus("หยุดธุรกรรมแล้ว");
    logEvent("Stop & Report ถูกเปิดใช้งาน");
  };

  const handleExportEvidence = async () => {
    const logText = evidenceLog
      .map((event) => `${event.time} • ${event.message}`)
      .join("\n");
    const payload = `Evidence Pack\nCase: ${decoyPack.caseId}\nRisk: ${riskTone.label}\nStatus: ${caseStatus}\n---\n${logText}`;
    const success = await copyText(payload);
    if (success) {
      setExported(true);
      logEvent("Export Evidence Pack สำเร็จ");
      window.setTimeout(() => setExported(false), 1800);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          bgcolor: "#f7efe6",
          color: "#1d1814",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -140,
            left: "50%",
            width: 460,
            height: 460,
            transform: "translateX(-50%)",
            bgcolor: "#ffd8b0",
            opacity: 0.7,
            filter: "blur(120px)",
            borderRadius: "25%",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 80,
            left: -120,
            width: 360,
            height: 360,
            bgcolor: "#c7d4ff",
            opacity: 0.5,
            filter: "blur(140px)",
            borderRadius: "25%",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -40,
            right: -160,
            width: 520,
            height: 520,
            bgcolor: "#a7e0d5",
            opacity: 0.7,
            filter: "blur(150px)",
            borderRadius: "25%",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 6, lg: 10 } }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 6, lg: 8 }}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack flex={1} spacing={3} alignItems={{ xs: "center", lg: "flex-start" }}>
              <Paper
                variant="outlined"
                sx={{
                  px: 2,
                  py: 0.8,
                  borderRadius: 999,
                  bgcolor: "rgba(255,255,255,0.7)",
                  borderColor: "rgba(0,0,0,0.08)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      bgcolor: "#ff6b4a",
                      borderRadius: "25%",
                    }}
                  />
                  <Typography
                    variant="overline"
                    sx={{ letterSpacing: "0.25em", color: "#805543" }}
                  >
                    Popup Assistant For Live Calls
                  </Typography>
                </Stack>
              </Paper>

              <Stack spacing={2} textAlign={{ xs: "center", lg: "left" }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: "var(--font-display)",
                    animation: "rise 0.8s ease-out both",
                    animationDelay: "60ms",
                  }}
                >
                  Deepfake Call Guard + Honeypot Mode
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    maxWidth: 520,
                    color: "#4b4037",
                    animation: "rise 0.8s ease-out both",
                    animationDelay: "140ms",
                  }}
                >
                  ผู้ช่วยลอยระหว่างคอลที่ให้ผู้ใช้ “ป้อนสัญญาณสำคัญ” แล้ว AI ประเมินความเสี่ยงแบบไฟจราจร
                  พร้อมแนะนำการตอบโต้ทันที และเก็บหลักฐานแบบ privacy-friendly โดยไม่ต้องอัดเสียงในสาย
                </Typography>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                useFlexGap
                flexWrap="wrap"
                sx={{ animation: "rise 0.8s ease-out both", animationDelay: "220ms" }}
              >
                {featureCards.map((card) => (
                  <Paper
                    key={card.title}
                    variant="outlined"
                    sx={{
                      flex: "1 1 220px",
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "rgba(255,255,255,0.7)",
                      borderColor: "rgba(0,0,0,0.08)",
                      boxShadow: "0 18px 40px rgba(23,18,14,0.08)",
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{ letterSpacing: "0.22em", color: "#9a6b55" }}
                    >
                      {card.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: "#4b4037" }}>
                      {card.body}
                    </Typography>
                  </Paper>
                ))}
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "center", lg: "flex-start" }}>
                <Chip
                  label="Privacy-first: ไม่อัดเสียงสายคอล"
                  size="small"
                  sx={{ bgcolor: "#fff4ec", color: "#6b4f40", border: "1px solid rgba(255,107,74,0.3)" }}
                />
                <Chip
                  label="AI ทำงานจากสรุปผู้ใช้เท่านั้น"
                  size="small"
                  sx={{ bgcolor: "#eef9f7", color: "#1f7f7a", border: "1px solid rgba(31,127,122,0.3)" }}
                />
                <Chip
                  label="MVP-ready workflow"
                  size="small"
                  sx={{ bgcolor: "rgba(255,255,255,0.7)", color: "#6b4f40", border: "1px solid rgba(0,0,0,0.1)" }}
                />
              </Stack>
            </Stack>

            <Box flex={1} display="flex" justifyContent="center">
              <Box
                sx={{
                  position: "relative",
                  width: { xs: 320, sm: 380 },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: -24,
                    borderRadius: 7,
                    bgcolor: "rgba(0,0,0,0.1)",
                    filter: "blur(24px)",
                  }}
                />
                <Box
                  sx={{
                    position: "relative",
                    height: { xs: 740, sm: 820 },
                    borderRadius: 6,
                    bgcolor: "#0b1220",
                    p: 1.5,
                    boxShadow: "0 30px 60px rgba(15,23,42,0.35)",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      height: "100%",
                      borderRadius: 5,
                      bgcolor: "#0b1220",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                          "radial-gradient(circle at 20% 20%, rgba(47, 178, 160, 0.45), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255, 127, 80, 0.35), transparent 40%), linear-gradient(160deg, #0b1220 10%, #0e2232 55%, #112f2d 100%)",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 45%, rgba(0,0,0,0.65) 100%)",
                      }}
                    />

                    <Stack
                      sx={{ position: "relative", zIndex: 2, height: "100%", px: 2, py: 2 }}
                      justifyContent="space-between"
                      spacing={3}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            09:41
                          </Typography>
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            <Box sx={{ width: 26, height: 4, borderRadius: 999, bgcolor: "rgba(255,255,255,0.35)" }} />
                            <Box sx={{ width: 18, height: 4, borderRadius: 999, bgcolor: "rgba(255,255,255,0.55)" }} />
                            <Box sx={{ width: 10, height: 4, borderRadius: 999, bgcolor: "#ffffff" }} />
                          </Stack>
                        </Stack>

                        <Stack spacing={1} alignItems="center">
                          <Chip
                            label={callBadge}
                            size="small"
                            sx={{
                              ...callBadgeSx,
                              letterSpacing: "0.28em",
                              textTransform: "uppercase",
                              fontSize: "0.55rem",
                              height: 22,
                            }}
                          />
                          <Typography variant="h6" sx={{ color: "white", fontFamily: "var(--font-display)" }}>
                            หัวหน้า • วิดีโอคอล
                          </Typography>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>
                            {callSubtext}
                          </Typography>
                          <Chip
                            label={
                              callState === "active"
                                ? "แตะบับเบิลเพื่อเปิด DeepGuard"
                                : callState === "incoming"
                                  ? "รับสายเพื่อเริ่มการประเมิน"
                                  : "เริ่มเดโมคอลเพื่อทดลอง"
                            }
                            size="small"
                            sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                          />
                        </Stack>

                        <Box
                          sx={{
                            width: 170,
                            height: 210,
                            borderRadius: 5,
                            border: "1px solid rgba(255,255,255,0.15)",
                            bgcolor: "rgba(255,255,255,0.08)",
                            boxShadow: "0 20px 40px rgba(5,10,20,0.35)",
                            position: "relative",
                          }}
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              top: 28,
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: 70,
                              height: 70,
                              borderRadius: "50%",
                              bgcolor: "rgba(255,255,255,0.2)",
                            }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 24,
                              left: 20,
                              right: 20,
                              height: 32,
                              borderRadius: 999,
                              bgcolor: "rgba(255,255,255,0.1)",
                            }}
                          />
                          {callState !== "active" && (
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 5,
                                bgcolor: "rgba(0,0,0,0.45)",
                                color: "rgba(255,255,255,0.8)",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                fontSize: "0.65rem",
                              }}
                            >
                              {callState === "incoming" ? "Ringing..." : "Call Idle"}
                            </Box>
                          )}
                        </Box>
                      </Stack>

                      <Box sx={{ pb: 8 }}>
                        {callState === "active" ? (
                          <Stack direction="row" spacing={2} justifyContent="center">
                            <Button
                              onClick={toggleMute}
                              size="small"
                              sx={{
                                width: 44,
                                height: 44,
                                minWidth: 0,
                                borderRadius: "50%",
                                bgcolor: callMuted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.75)",
                                fontSize: "0.6rem",
                              }}
                            >
                              Mic
                            </Button>
                            <Button
                              onClick={handleEndCall}
                              size="small"
                              sx={{
                                width: 52,
                                height: 52,
                                minWidth: 0,
                                borderRadius: "50%",
                                bgcolor: "#ff4d3f",
                                color: "white",
                                fontSize: "0.6rem",
                              }}
                            >
                              End
                            </Button>
                            <Button
                              onClick={toggleSpeaker}
                              size="small"
                              sx={{
                                width: 44,
                                height: 44,
                                minWidth: 0,
                                borderRadius: "50%",
                                bgcolor: callSpeaker ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.75)",
                                fontSize: "0.6rem",
                              }}
                            >
                              Spk
                            </Button>
                          </Stack>
                        ) : callState === "incoming" ? (
                          <Stack direction="row" spacing={2} justifyContent="center">
                            <Button
                              onClick={handleDeclineCall}
                              size="small"
                              sx={{
                                width: 48,
                                height: 48,
                                minWidth: 0,
                                borderRadius: "50%",
                                bgcolor: "#ff4d3f",
                                color: "white",
                                fontSize: "0.6rem",
                              }}
                            >
                              Decline
                            </Button>
                            <Button
                              onClick={handleAcceptCall}
                              size="small"
                              sx={{
                                width: 48,
                                height: 48,
                                minWidth: 0,
                                borderRadius: "50%",
                                bgcolor: "#34d399",
                                color: "#0b2b1f",
                                fontSize: "0.6rem",
                              }}
                            >
                              Answer
                            </Button>
                          </Stack>
                        ) : (
                          <Stack spacing={1} alignItems="center">
                            <Button
                              onClick={handleStartCall}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.75)",
                                px: 3,
                                borderRadius: 999,
                                fontSize: "0.65rem",
                              }}
                            >
                              Start Demo Call
                            </Button>
                            <Button
                              onClick={handleIncomingCall}
                              size="small"
                              sx={{
                                border: "1px solid rgba(255,255,255,0.3)",
                                color: "rgba(255,255,255,0.6)",
                                px: 2.5,
                                borderRadius: 999,
                                fontSize: "0.6rem",
                              }}
                            >
                              Simulate Incoming
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    </Stack>

                    {bubbleVisible && (
                      <Stack
                        spacing={1}
                        alignItems="center"
                        sx={{
                          position: "absolute",
                          right: 16,
                          top: 150,
                          zIndex: 10,
                        }}
                      >
                        <Box sx={{ animation: "float 6s ease-in-out infinite" }}>
                          <Fab
                            size="medium"
                            onClick={() => setBubbleOpen((current) => !current)}
                            sx={{
                              bgcolor: "#ff6b4a",
                              color: "white",
                              boxShadow: "0 14px 30px rgba(255,107,74,0.45)",
                              border: bubbleOpen
                                ? "2px solid rgba(255,255,255,0.6)"
                                : "none",
                            }}
                          >
                            DG
                          </Fab>
                        </Box>
                        <Chip
                          label={bubbleLabel}
                          size="small"
                          sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "white" }}
                        />
                      </Stack>
                    )}

                    {bubbleVisible && !assistantVisible && (
                      <Paper
                        sx={{
                          position: "absolute",
                          left: "50%",
                          bottom: 150,
                          transform: "translateX(-50%)",
                          width: 270,
                          bgcolor: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "white",
                          backdropFilter: "blur(12px)",
                          p: 1.5,
                          zIndex: 8,
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.6)" }}>
                              Quick Scripts
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => setBubbleOpen(true)}
                              sx={{
                                color: "white",
                                bgcolor: "rgba(255,255,255,0.18)",
                                borderRadius: 999,
                                px: 1.5,
                                fontSize: "0.6rem",
                              }}
                            >
                              Open
                            </Button>
                          </Stack>
                          <Stack spacing={1}>
                            {quickScripts.map((script) => (
                              <Button
                                key={script.id}
                                onClick={() => handleCopy(script.text, script.id)}
                                sx={{
                                  justifyContent: "flex-start",
                                  textAlign: "left",
                                  color: "white",
                                  bgcolor: "rgba(255,255,255,0.18)",
                                  borderRadius: 2,
                                  fontSize: "0.65rem",
                                }}
                              >
                                {script.text}
                              </Button>
                            ))}
                          </Stack>
                        </Stack>
                      </Paper>
                    )}

                    {bubbleVisible && (
                      <Box
                        sx={{
                          position: "absolute",
                          right: 16,
                          bottom: 120,
                          zIndex: 20,
                          pointerEvents: assistantVisible ? "auto" : "none",
                        }}
                      >
                        <Grow
                          in={assistantVisible}
                          mountOnEnter
                          unmountOnExit
                          style={{ transformOrigin: "bottom right" }}
                        >
                          <Paper
                            sx={{
                              width: { xs: 280, sm: 300 },
                              height: 420,
                              p: 1.5,
                              bgcolor: "rgba(255,247,239,0.97)",
                              border: "1px solid rgba(0,0,0,0.08)",
                              borderRadius: 4,
                              boxShadow: "0 30px 60px rgba(12,12,12,0.25)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="overline" sx={{ letterSpacing: "0.28em", color: "#b5684b" }}>
                                  Popup Assistant
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontFamily: "var(--font-display)" }}>
                                  DeepGuard
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#7a5645" }}>
                                  Status: {caseStatus}
                                </Typography>
                              </Box>
                              <Stack spacing={1} alignItems="flex-end">
                                <Chip
                                  label={`Risk: ${riskTone.label}`}
                                  size="small"
                                  sx={{ bgcolor: riskTone.bg, color: riskTone.text }}
                                />
                                <Button
                                  size="small"
                                  onClick={() => setBubbleOpen(false)}
                                  sx={{
                                    border: "1px solid rgba(181,104,75,0.3)",
                                    color: "#b5684b",
                                    fontSize: "0.65rem",
                                    px: 1.5,
                                    borderRadius: 999,
                                  }}
                                >
                                  Minimize
                                </Button>
                              </Stack>
                            </Stack>

                            <Divider />

                            <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
                              <Stack spacing={1.5}>
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 1.5,
                                    bgcolor: "#fffaf5",
                                    borderColor: "rgba(0,0,0,0.08)",
                                  }}
                                >
                                  <Typography variant="overline" sx={{ color: "#8c6953", letterSpacing: "0.2em" }}>
                                    Input (3 วิธี)
                                  </Typography>
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                    {signals.map((signal) => {
                                      const isSelected = selectedSignals.includes(signal.id);
                                      return (
                                        <Chip
                                          key={signal.id}
                                          label={signal.label}
                                          onClick={() => toggleSignal(signal.id)}
                                          size="small"
                                          sx={{
                                            bgcolor: isSelected ? "#ff6b4a" : "#ffe4d1",
                                            color: isSelected ? "white" : "#a24c32",
                                            fontSize: "0.65rem",
                                            height: 24,
                                          }}
                                        />
                                      );
                                    })}
                                  </Box>
                                  <TextField
                                    value={summaryText}
                                    onChange={(event) => updateSummaryText(event.target.value)}
                                    size="small"
                                    multiline
                                    rows={2}
                                    placeholder="พิมพ์สรุป 1–2 ประโยค..."
                                    sx={{ mt: 1.2, bgcolor: "white" }}
                                  />
                                  {detectedSignals.length > 0 && (
                                    <Typography variant="caption" sx={{ color: "#1f7f7a", mt: 0.5, display: "block" }}>
                                      AI detect: {detectedLabels}
                                    </Typography>
                                  )}
                                  <Button
                                    onClick={handleVoiceDemo}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 1, borderRadius: 999, fontSize: "0.65rem" }}
                                  >
                                    Push-to-talk (demo)
                                  </Button>
                                  <Typography variant="caption" sx={{ color: "#7a5645", mt: 0.6, display: "block" }}>
                                    ไมค์ใช้เพื่อเล่าให้ AI ฟัง ไม่ได้แอบอัดเสียงในสาย
                                  </Typography>
                                </Paper>

                                <Paper variant="outlined" sx={{ p: 1.5 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle2">Risk Meter</Typography>
                                    <Chip
                                      label={riskTone.label}
                                      size="small"
                                      sx={{ bgcolor: riskTone.bg, color: riskTone.text }}
                                    />
                                  </Stack>
                                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    {["green", "yellow", "red"].map((level) => (
                                      <Box
                                        key={level}
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: "50%",
                                          bgcolor: riskPalette[level as RiskLevel].dot,
                                          opacity: riskLevel === level ? 1 : 0.3,
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                  <Stack spacing={0.4} sx={{ mt: 1 }}>
                                    {riskReasons.map((reason) => (
                                      <Typography key={reason} variant="caption" sx={{ color: "#6b4f40" }}>
                                        • {reason}
                                      </Typography>
                                    ))}
                                  </Stack>
                                  {urgencyActive && (
                                    <Chip
                                      label={`Safety Pause เหลือ ${pauseSeconds}s`}
                                      size="small"
                                      sx={{ mt: 1, bgcolor: "#fff1ec", color: "#a2472e" }}
                                    />
                                  )}
                                </Paper>

                                <Paper variant="outlined" sx={{ p: 1.5 }}>
                                  <Typography variant="subtitle2">Next Action</Typography>
                                  <Typography variant="caption" sx={{ color: "#6b4f40" }}>
                                    กดทำทันทีเพื่อลดแรงกดดัน
                                  </Typography>
                                  <Stack spacing={1} sx={{ mt: 1 }}>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="secondary"
                                      onClick={handleStartChallenge}
                                    >
                                      Start Challenge (30s)
                                    </Button>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="primary"
                                      onClick={handleCallBack}
                                    >
                                      Call Back Official
                                    </Button>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="error"
                                      onClick={handleStopReport}
                                    >
                                      Stop & Report
                                    </Button>
                                  </Stack>
                                  {activeChallenge && (
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        mt: 1.2,
                                        p: 1,
                                        borderColor: "#ffb8a8",
                                        bgcolor: "#fff0e6",
                                      }}
                                    >
                                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                          <Typography variant="caption" sx={{ color: "#a2472e" }}>
                                            Challenge Active
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: "#6b4f40" }}>
                                            {activeChallenge.prompt}
                                          </Typography>
                                        </Box>
                                        <Chip
                                          label={`${activeChallenge.seconds}s`}
                                          size="small"
                                          sx={{ bgcolor: "#ff6b4a", color: "white" }}
                                        />
                                      </Stack>
                                      <Button
                                        size="small"
                                        onClick={handleStopChallenge}
                                        sx={{ mt: 1, fontSize: "0.65rem", color: "#a2472e" }}
                                      >
                                        End Challenge
                                      </Button>
                                    </Paper>
                                  )}
                                </Paper>

                                <Paper variant="outlined" sx={{ p: 1.5 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle2">Response Scripts</Typography>
                                    <Chip
                                      label="Tap to copy"
                                      size="small"
                                      sx={{ bgcolor: "#eef9f7", color: "#1f7f7a" }}
                                    />
                                  </Stack>
                                  <Stack spacing={1} sx={{ mt: 1 }}>
                                    {responseScripts.map((script) => (
                                      <Button
                                        key={script.id}
                                        onClick={() => handleCopy(script.text, script.id)}
                                        variant="outlined"
                                        sx={{
                                          justifyContent: "space-between",
                                          textAlign: "left",
                                          alignItems: "flex-start",
                                          borderColor: "rgba(31,127,122,0.2)",
                                          color: "#2b1f19",
                                          fontSize: "0.7rem",
                                        }}
                                      >
                                        <Box sx={{ flex: 1, textAlign: "left" }}>{script.text}</Box>
                                        <Chip
                                          label={copiedScriptId === script.id ? "Copied" : "Copy"}
                                          size="small"
                                          sx={{ ml: 1, bgcolor: "#eef9f7", color: "#1f7f7a" }}
                                        />
                                      </Button>
                                    ))}
                                  </Stack>
                                </Paper>

                                <Paper variant="outlined" sx={{ p: 1.5 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle2">Evidence Log</Typography>
                                    <Button
                                      size="small"
                                      onClick={handleExportEvidence}
                                      sx={{ fontSize: "0.65rem" }}
                                    >
                                      {exported ? "Copied" : "Export"}
                                    </Button>
                                  </Stack>
                                  <Typography variant="caption" sx={{ color: "#6b4f40" }}>
                                    Case {decoyPack.caseId} · {caseStatus}
                                  </Typography>
                                  <Stack spacing={0.6} sx={{ mt: 1 }}>
                                    {evidenceLog.slice(0, 3).map((event) => (
                                      <Paper
                                        key={event.id}
                                        variant="outlined"
                                        sx={{
                                          p: 0.8,
                                          borderColor: "rgba(0,0,0,0.08)",
                                          bgcolor: "white",
                                        }}
                                      >
                                        <Typography variant="caption" sx={{ color: "#58473c" }}>
                                          {event.message}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "#9a6b55", display: "block" }}>
                                          {event.time}
                                        </Typography>
                                      </Paper>
                                    ))}
                                  </Stack>
                                </Paper>
                              </Stack>
                            </Box>
                          </Paper>
                        </Grow>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
