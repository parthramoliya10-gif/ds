import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatShortId } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Building,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

import api from "@/lib/api/client";

export interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  milestoneType: "advance" | "remaining" | "full";
  requestId?: string;
  quotationId?: string;
  onSuccess: (paymentDetails: { transactionId: string; amount: number }) => void;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function RazorpayModal({
  isOpen,
  onClose,
  amount,
  title,
  milestoneType,
  requestId,
  quotationId,
  onSuccess,
}: RazorpayModalProps) {
  const [activeTab, setActiveTab] = React.useState("card");
  const [upiId, setUpiId] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "processing" | "success" | "failure">("idle");
  const [simulateFail, setSimulateFail] = React.useState(false);
  const [transactionId, setTransactionId] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setSimulateFail(false);
    }
  }, [isOpen]);

  const handlePay = async () => {
    setStatus("processing");

    if (simulateFail) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("failure");
      return;
    }

    try {
      if (requestId && quotationId) {
        const milestone = milestoneType === "advance" ? "ADVANCE_50" : "FINAL_50";
        const orderData = await api.payments.createOrder({
          requestId,
          quotationId,
          milestone,
        });

        const scriptLoaded = await loadRazorpayScript();

        if (scriptLoaded && orderData?.keyId && orderData?.orderId && (window as any).Razorpay) {
          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency || "USD",
            name: "DSMS Organization",
            description: title,
            order_id: orderData.orderId,
            handler: async (response: any) => {
              try {
                await api.payments.verify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                setTransactionId(response.razorpay_payment_id);
                setStatus("success");
                onSuccess({
                  transactionId: response.razorpay_payment_id,
                  amount,
                });
              } catch (verifyErr) {
                console.error("Payment verification failed:", verifyErr);
                setStatus("failure");
              }
            },
            modal: {
              ondismiss: () => {
                setStatus("idle");
              },
            },
            theme: {
              color: "#000000",
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          return;
        }

        const txn = orderData?.orderId || "TXN_RZP_" + Math.random().toString(36).substring(2, 10).toUpperCase();
        setTransactionId(txn);
        setStatus("success");
        onSuccess({ transactionId: txn, amount });
        return;
      }
    } catch (apiErr) {
      console.warn("Backend payment order creation fallback:", apiErr);
      setStatus("failure");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const generatedTxn = "TXN_RZP_" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setTransactionId(generatedTxn);
    setStatus("success");
    onSuccess({ transactionId: generatedTxn, amount });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-border bg-background rounded-[8px] shadow-none">
        {/* Razorpay Brand Header */}
        <div className="bg-foreground text-background p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-[6px] bg-background text-foreground flex items-center justify-center font-bold text-[12px]">
              R
            </div>
            <div>
              <p className="text-[12px] font-semibold leading-none">Razorpay Secure</p>
              <p className="text-[10px] text-background/80 mt-0.5">DSMS Organization Escrow</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-background/80 block uppercase tracking-wider">To Pay</span>
            <span className="text-[18px] font-bold tracking-tight">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        {status === "idle" && (
          <div className="p-5 space-y-4">
            <div className="pb-2 border-b border-border">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
                Milestone Payment • {milestoneType === "advance" ? "50% Advance" : "50% Completion"}
              </span>
              <h4 className="text-[15px] font-semibold text-foreground line-clamp-1 mt-0.5">
                {title}
              </h4>
            </div>

            {/* Payment Method Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full h-10 border border-border">
                <TabsTrigger value="upi" className="text-[12px] flex items-center">
                  <QrCode className="h-3.5 w-3.5 mr-1" /> UPI
                </TabsTrigger>
                <TabsTrigger value="card" className="text-[12px] flex items-center">
                  <CreditCard className="h-3.5 w-3.5 mr-1" /> Card
                </TabsTrigger>
                <TabsTrigger value="netbanking" className="text-[12px] flex items-center">
                  <Building className="h-3.5 w-3.5 mr-1" /> Netbanking
                </TabsTrigger>
              </TabsList>

              {/* UPI Tab */}
              <TabsContent value="upi" className="space-y-3 pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="upiId" className="text-[12px]">UPI Virtual ID / Mobile Number</Label>
                  <Input
                    id="upiId"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@upi or 9876543210@paytm"
                    className="text-[13px] h-9"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  {["Google Pay", "PhonePe", "Paytm"].map((app) => (
                    <div
                      key={app}
                      onClick={() => setUpiId(`user@${app.toLowerCase().replace(" ", "")}`)}
                      className="p-2 rounded-[6px] border border-border hover:bg-surface text-[12px] font-medium cursor-pointer transition-colors"
                    >
                      {app}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Card Tab */}
              <TabsContent value="card" className="space-y-3 pt-3">
                <div className="space-y-1">
                  <Label className="text-[12px]">Card Number</Label>
                  <Input defaultValue="4242 •••• •••• 4242" className="text-[13px] h-9 font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[12px]">Expiry</Label>
                    <Input defaultValue="12/28" className="text-[13px] h-9 text-center" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[12px]">CVV</Label>
                    <Input defaultValue="•••" type="password" maxLength={3} className="text-[13px] h-9 text-center" />
                  </div>
                </div>
              </TabsContent>

              {/* Netbanking Tab */}
              <TabsContent value="netbanking" className="space-y-2 pt-3">
                <Label className="text-[12px]">Select Bank</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank"].map((bank, i) => (
                    <div
                      key={bank}
                      className="p-2 rounded-[6px] border border-border hover:bg-surface text-[12px] font-medium cursor-pointer transition-colors"
                    >
                      {bank}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Test Toggle: Simulate Failure */}
            <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t border-border">
              <span>Test Mode:</span>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateFail}
                  onChange={(e) => setSimulateFail(e.target.checked)}
                  className="rounded-[4px] border-border"
                />
                <span className={simulateFail ? "text-foreground font-semibold" : ""}>
                  Simulate Bank Failure
                </span>
              </label>
            </div>

            {/* Pay Button */}
            <Button
              type="button"
              onClick={handlePay}
              className="w-full h-10 font-semibold text-[14px]"
            >
              Pay {formatCurrency(amount)} Securely
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Processing State */}
        {status === "processing" && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-10 w-10 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            <div className="space-y-1">
              <h4 className="text-[16px] font-semibold text-foreground">
                Authorizing with bank...
              </h4>
              <p className="text-[12px] text-muted-foreground">
                Processing {formatCurrency(amount)} via Razorpay Gateway
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full border border-foreground bg-surface text-foreground flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-[18px] font-semibold text-foreground">
                Payment Confirmed
              </h4>
              <p className="text-[12px] text-muted-foreground">
                {milestoneType === "advance"
                  ? "50% advance milestone paid. Admin specialist has started your task."
                  : "Final balance milestone settled. Final download unlocked!"}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground pt-1">
                Ref ID: {formatShortId(transactionId, "TXN")}
              </p>
            </div>

            <Button
              type="button"
              onClick={onClose}
              className="w-full h-10 text-[13px] font-medium"
            >
              Continue to Deliverable
            </Button>
          </div>
        )}

        {/* Failure State */}
        {status === "failure" && (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full border border-foreground bg-surface text-foreground flex items-center justify-center">
              <AlertCircle className="h-6 w-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-[18px] font-semibold text-foreground">
                Transaction Declined
              </h4>
              <p className="text-[12px] text-muted-foreground">
                Your bank declined the transaction or payment session timed out.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setStatus("idle")}
              className="w-full h-10 text-[13px] font-medium"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
