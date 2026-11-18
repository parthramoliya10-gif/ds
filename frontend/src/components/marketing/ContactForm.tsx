"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";

const contactSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  collegeEmail: z.string().email("Please provide a valid college or personal email address"),
  phone: z.string().min(10, "Valid 10-digit phone number required for WhatsApp coordination"),
  college: z.string().min(2, "College or university name is required"),
  taskType: z.enum([
    "assignment",
    "lab_manual",
    "practical_file",
    "internship_report",
    "project_report",
    "general",
  ]),
  urgency: z.enum(["standard", "urgent_24h", "urgent_12h"]),
  message: z.string().min(10, "Please enter at least 10 characters describing your inquiry"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      collegeEmail: "",
      phone: "",
      college: "",
      taskType: "assignment",
      urgency: "standard",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    // Simulate server processing
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Inquiry received! Our academic coordinator will contact you via WhatsApp shortly.");
    reset();
  };

  if (isSubmitted) {
    return (
      <div className="p-8 rounded-[8px] border border-border bg-surface text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-foreground mx-auto stroke-[1.5]" />
        <h3 className="text-[20px] font-bold text-foreground">
          Message Received!
        </h3>
        <p className="text-[14px] text-muted-foreground max-w-md mx-auto leading-relaxed">
          Thank you for reaching out. A DSMS academic specialist will review your request and reach out to your email or WhatsApp within 15 minutes.
        </p>
        <Button
          variant="outline"
          onClick={() => setIsSubmitted(false)}
          className="h-9 text-[13px] border-border"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-[13px]">
            Full Name <span className="text-foreground font-semibold">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            {...register("fullName")}
            className="h-10 text-[14px] bg-background border-border"
          />
          {errors.fullName && (
            <p className="text-[12px] text-foreground font-medium">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* College Email */}
        <div className="space-y-1.5">
          <Label htmlFor="collegeEmail" className="text-[13px]">
            College Email <span className="text-foreground font-semibold">*</span>
          </Label>
          <Input
            id="collegeEmail"
            type="email"
            placeholder="name@university.edu"
            {...register("collegeEmail")}
            className="h-10 text-[14px] bg-background border-border"
          />
          {errors.collegeEmail && (
            <p className="text-[12px] text-foreground font-medium">
              {errors.collegeEmail.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone / WhatsApp */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-[13px]">
            WhatsApp / Phone <span className="text-foreground font-semibold">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            {...register("phone")}
            className="h-10 text-[14px] bg-background border-border"
          />
          {errors.phone && (
            <p className="text-[12px] text-foreground font-medium">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* College / University */}
        <div className="space-y-1.5">
          <Label htmlFor="college" className="text-[13px]">
            College / Institute <span className="text-foreground font-semibold">*</span>
          </Label>
          <Input
            id="college"
            placeholder="e.g. Delhi Technological University"
            {...register("college")}
            className="h-10 text-[14px] bg-background border-border"
          />
          {errors.college && (
            <p className="text-[12px] text-foreground font-medium">
              {errors.college.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Task Type */}
        <div className="space-y-1.5">
          <Label className="text-[13px]">
            Task Type <span className="text-foreground font-semibold">*</span>
          </Label>
          <Select
            defaultValue="assignment"
            onValueChange={(val: any) => setValue("taskType", val)}
          >
            <SelectTrigger className="h-10 text-[13px] bg-background border-border">
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="assignment">Subject Assignment</SelectItem>
              <SelectItem value="lab_manual">Lab Manual (Code + Outputs)</SelectItem>
              <SelectItem value="practical_file">Practical File (Typed/Handwritten)</SelectItem>
              <SelectItem value="internship_report">Internship Report</SelectItem>
              <SelectItem value="project_report">Major/Minor Project Report</SelectItem>
              <SelectItem value="general">General Support / Custom Requirement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Urgency */}
        <div className="space-y-1.5">
          <Label className="text-[13px]">
            Urgency Level <span className="text-foreground font-semibold">*</span>
          </Label>
          <Select
            defaultValue="standard"
            onValueChange={(val: any) => setValue("urgency", val)}
          >
            <SelectTrigger className="h-10 text-[13px] bg-background border-border">
              <SelectValue placeholder="Select turnaround speed" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="standard">Standard (2 - 4 Days)</SelectItem>
              <SelectItem value="urgent_24h">Urgent (Within 24 Hours)</SelectItem>
              <SelectItem value="urgent_12h">Super Urgent (Within 12 Hours)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-[13px]">
          Describe Your Task & Requirements <span className="text-foreground font-semibold">*</span>
        </Label>
        <Textarea
          id="message"
          rows={4}
          placeholder="Mention subject name, number of questions or pages, format rules (e.g. IEEE format, handwritten ruled sheets), and college submission deadline..."
          {...register("message")}
          className="text-[13px] bg-background border-border resize-none"
        />
        {errors.message && (
          <p className="text-[12px] text-foreground font-medium">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 text-[14px] font-semibold"
      >
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting ? "Sending Inquiry..." : "Submit Inquiry to Academic Desk"}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center">
        Average specialist response time is under 15 minutes during operating hours (8:00 AM – 11:30 PM IST).
      </p>
    </form>
  );
}
