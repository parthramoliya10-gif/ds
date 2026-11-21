"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { FileDropzone, FileItem } from "@/components/shared/FileDropzone";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { formatDate, isDeadlineUrgent } from "@/lib/utils";
import { CalendarIcon, ArrowLeft, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

const newRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .min(5, "Task title must be at least 5 characters")
    .max(120, "Task title must not exceed 120 characters"),
  subject: z
    .string()
    .trim()
    .min(1, "Subject/course name is required")
    .min(2, "Subject name must be at least 2 characters"),
  pages: z
    .coerce
    .number({ invalid_type_error: "Page count must be a number" })
    .int("Page count must be a whole number")
    .min(1, "Page count must be at least 1")
    .max(500, "Page count cannot exceed 500"),
  format: z.enum(["typed", "handwritten"]),
  description: z.string().trim().optional(),
});

type NewRequestFormValues = z.infer<typeof newRequestSchema>;

export default function NewRequestPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = React.useState<Date>(
    new Date(Date.now() + 48 * 3600 * 1000)
  );
  const [uploadedFiles, setUploadedFiles] = React.useState<FileItem[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewRequestFormValues>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      title: "",
      subject: "",
      pages: 10,
      format: "typed",
      description: "",
    },
  });

  const formatValue = watch("format");

  // Determine if selected deadline is urgent (< 24h)
  const isUrgent = React.useMemo(() => {
    return isDeadlineUrgent(selectedDate.toISOString());
  }, [selectedDate]);

  const onSubmit = async (data: NewRequestFormValues) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      
      const fullDescription = [
        data.description || "Task specification details.",
        `\n\n[Academic Details] Subject: ${data.subject} | Format: ${data.format} | Target Pages: ${data.pages}`
      ].join(" ");
      formData.append("description", fullDescription);
      formData.append("category", data.subject);
      formData.append("priority", isUrgent ? "URGENT" : "NORMAL");

      uploadedFiles.forEach((f) => {
        if (f.file) {
          formData.append("referenceFiles", f.file);
        }
      });

      const result: any = await api.requests.create(formData);
      const newId = result?.id;

      toast.success("Task request submitted! Admin will issue a 50-50 quotation in chat.");
      if (newId) {
        router.push(`/user/chat/${newId}`);
      } else {
        router.push(`/user/requests`);
      }
    } catch (err: any) {
      console.error("Backend request creation error:", err);
      toast.error(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-[13px] text-muted-foreground mb-2">
        <Link href="/user/requests" className="hover:text-foreground inline-flex items-center">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Requests
        </Link>
      </div>

      <PageHeader
        title="Create New Task Request"
        description="Submit your assignment, practical file, or lab manual specifications. Our specialist will review and dispatch an official 50-50 milestone quotation."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Basic Task Information */}
        <Card className="border border-border bg-background rounded-[8px] p-6 shadow-none space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-[18px] font-semibold text-foreground">
              Task Details
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground">
              Specify the subject, assignment title, and organization guidelines
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[13px]">
                Assignment / Task Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. DBMS Assignment - Normalized Schema"
                {...register("title")}
                className={errors.title ? "border-foreground" : ""}
              />
              {errors.title && (
                <p className="text-[12px] font-medium text-foreground">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-[13px]">Subject / Course</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Database Management Systems (CS-302)"
                  {...register("subject")}
                  className={errors.subject ? "border-foreground" : ""}
                />
                {errors.subject && (
                  <p className="text-[12px] font-medium text-foreground">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pages" className="text-[13px]">Approximate Page Count</Label>
                <Input
                  id="pages"
                  type="number"
                  min={1}
                  placeholder="e.g. 10"
                  {...register("pages")}
                  className={errors.pages ? "border-foreground" : ""}
                />
                {errors.pages && (
                  <p className="text-[12px] font-medium text-foreground">{errors.pages.message}</p>
                )}
              </div>
            </div>

            {/* Format: Typed vs Handwritten Radio Group */}
            <div className="space-y-2 pt-2">
              <Label className="text-[13px]">Deliverable Format</Label>
              <RadioGroup
                value={formatValue}
                onValueChange={(val: "typed" | "handwritten") => setValue("format", val)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <div
                  className={`flex items-center space-x-3 p-3 rounded-[8px] border transition-colors cursor-pointer ${
                    formatValue === "typed" ? "border-foreground bg-surface" : "border-border"
                  }`}
                  onClick={() => setValue("format", "typed")}
                >
                  <RadioGroupItem value="typed" id="typed" />
                  <div>
                    <Label htmlFor="typed" className="text-[14px] font-semibold cursor-pointer">
                      Typed Document (PDF / DOCX)
                    </Label>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      Formatted in LaTeX / Word with diagrams & citations
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-center space-x-3 p-3 rounded-[8px] border transition-colors cursor-pointer ${
                    formatValue === "handwritten" ? "border-foreground bg-surface" : "border-border"
                  }`}
                  onClick={() => setValue("format", "handwritten")}
                >
                  <RadioGroupItem value="handwritten" id="handwritten" />
                  <div>
                    <Label htmlFor="handwritten" className="text-[14px] font-semibold cursor-pointer">
                      Handwritten Practical File
                    </Label>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      Clean ruled/plain A4 sheets with neat handwriting & pen sketches
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Deadline Date Picker with Urgent Badge */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Submission Deadline</Label>
                {isUrgent && (
                  <StatusBadge status="urgent" label="Urgent (<24h to deadline)" />
                )}
              </div>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 border-border text-[13px] font-normal"
                  >
                    <span className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatDate(selectedDate.toISOString())}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Click to change
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-border" align="start">
                  <Calendar
                    selected={selectedDate}
                    onSelect={(d) => {
                      setSelectedDate(d);
                      setCalendarOpen(false);
                    }}
                    minDate={new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Description */}
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="description" className="text-[13px]">
                Detailed Instructions & Question Prompts
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="List specific requirements, problem statements, output expectations, or preferred formatting guidelines..."
                {...register("description")}
                className="text-[13px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* File Attachments Dropzone */}
        <Card className="border border-border bg-background rounded-[8px] p-6 shadow-none space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-[18px] font-semibold text-foreground">
              Reference Files & Syllabus
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground">
              Attach organization question PDFs, lab manual index, experiment guidelines, or sample code
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <FileDropzone
              onFilesChange={setUploadedFiles}
              maxFiles={5}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link href="/user/requests">
            <Button variant="outline" type="button" className="h-10 border-border">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="h-10 px-8 text-[14px] font-semibold"
          >
            {submitting ? "Submitting Task..." : "Submit Task & Open Chat"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
