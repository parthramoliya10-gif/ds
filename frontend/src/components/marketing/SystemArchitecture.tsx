"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Layers,
  Database,
  Radio,
  Lock,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  KeyRound,
  Zap,
} from "lucide-react";

export function SystemArchitecture() {
  const [selectedNode, setSelectedNode] = React.useState<"client" | "api" | "socket" | "db" | "vault">("api");

  const nodes = [
    {
      id: "client" as const,
      name: "Next.js 14 Client",
      port: "Port :3001",
      icon: <Layers className="h-5 w-5 text-foreground" />,
      tag: "App Router • SSR + Hydration",
      payload: `// Frontend Socket Listener (SocketContext.tsx)
const socket = io("http://localhost:5000", {
  auth: { token: supabaseSession.access_token },
  transports: ["websocket"]
});

socket.on("quotation_received", (quote) => {
  renderMilestoneCard(quote.advanceAmount, quote.remainingAmount);
});`,
    },
    {
      id: "socket" as const,
      name: "Socket.IO Gateway",
      port: "Port :5000 /socket.io",
      icon: <Radio className="h-5 w-5 text-foreground" />,
      tag: "Room-Isolated WebSockets",
      payload: `// Bi-Directional Room Pipeline (socket.ts)
io.on("connection", (socket) => {
  socket.on("join_request_room", ({ requestId }) => {
    socket.join(\`request_\${requestId}\`);
    socket.to(\`request_\${requestId}\`).emit("user_active");
  });
});`,
    },
    {
      id: "api" as const,
      name: "Express.js REST Engine",
      port: "Port :5000 /api/v1",
      icon: <Server className="h-5 w-5 text-foreground" />,
      tag: "TypeScript • RBAC • Zod",
      payload: `// Standardized Response Envelope
GET /api/v1/admin/dashboard/stats
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "requests": { "total": 12, "completed": 9, "inProgress": 3 },
    "finances": { "totalRevenue": { "dollars": 5400, "cents": 540000 } }
  }
}`,
    },
    {
      id: "db" as const,
      name: "Prisma PostgreSQL",
      port: "Direct Connection Pool",
      icon: <Database className="h-5 w-5 text-foreground" />,
      tag: "Relational Schema • Supabase Auth",
      payload: `// Schema Entity Model (schema.prisma)
model Quotation {
  id              String   @id @default(uuid())
  requestId       String
  totalAmount     Int      // Integer cents: $80 = 8000
  advanceAmount   Int      // 50% = 4000
  remainingAmount Int      // 50% = 4000
  currency        String   @default("USD")
}`,
    },
    {
      id: "vault" as const,
      name: "Cloudinary AES Vault",
      port: "Gatekeeper Pre-Signed CDN",
      icon: <Lock className="h-5 w-5 text-foreground" />,
      tag: "Encrypted Pre-Signed URLs",
      payload: `// Download Gatekeeper (documents.controller.ts)
if (!request.isDownloadUnlocked) {
  throw new ApiError(403, "Remaining 50% milestone payment required.");
}
const signedUrl = cloudinary.utils.private_download_url(
  file.publicId, "pdf", { expires_at: Math.floor(Date.now() / 1000) + 3600 }
);`,
    },
  ];

  const active = nodes.find((n) => n.id === selectedNode) || nodes[0];

  return (
    <section id="architecture" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-border">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface text-[12px] font-mono text-muted-foreground">
          <Cpu className="h-3.5 w-3.5 text-foreground" />
          <span>Interactive Topology &amp; System Flow</span>
        </div>
        <h2 className="text-[28px] sm:text-[38px] font-bold tracking-tight text-foreground">
          Full-Stack Architecture Map
        </h2>
        <p className="text-[15px] text-muted-foreground">
          Click any node below to inspect live connection protocols, ports, and JSON contracts.
        </p>
      </div>

      {/* Visual Interactive Architecture Topology */}
      <div className="rounded-[12px] border border-border bg-surface/50 p-4 sm:p-6 space-y-6">
        {/* Node Grid Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNode(node.id)}
                className={`p-3.5 rounded-[8px] border text-left transition-all space-y-2 ${
                  isSelected
                    ? "border-foreground bg-background shadow-md scale-[1.02]"
                    : "border-border bg-background/60 hover:bg-background hover:border-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-[6px] bg-surface border border-border flex items-center justify-center">
                    {node.icon}
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">{node.port}</span>
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-foreground line-clamp-1">{node.name}</h4>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5 line-clamp-1">{node.tag}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Connector Wire with Animated Data Pulse Packets */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2.5 rounded-[8px] bg-background border border-border text-[11px] font-mono text-muted-foreground">
          <span className="text-foreground font-semibold flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            Next.js Client
          </span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span>WebSocket JWT</span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="text-foreground font-semibold">Socket.IO Gateway</span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span>Express REST</span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="text-foreground font-semibold">Prisma PG</span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="text-foreground font-semibold flex items-center">
            Cloudinary Vault
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ml-1.5 animate-pulse" />
          </span>
        </div>

        {/* Interactive Live Inspector Terminal */}
        <div className="rounded-[10px] bg-[#111111] text-white p-4 sm:p-5 font-mono text-[12px] space-y-3 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-green-400" />
              <span className="text-[12px] font-bold text-white">
                Live Code &amp; Protocol Inspector: {active.name}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-white/60">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span>Active Port {active.port}</span>
            </div>
          </div>

          <pre className="text-white/90 overflow-x-auto text-[11px] sm:text-[12px] leading-relaxed p-2 rounded bg-black/40">
            {active.payload}
          </pre>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-white/50 border-t border-white/10 pt-2 gap-2">
            <span>Security: Bearer JWT • HMAC-SHA256 • Zod Strict Type Validation</span>
            <span className="text-white/80 font-semibold">Status: 100% Passing (8/8 Jest Tests)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
