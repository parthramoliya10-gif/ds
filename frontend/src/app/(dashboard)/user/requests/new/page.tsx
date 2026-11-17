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
import { mockRequests } from "@/lib/mock-data";
import { Request } from "@/types";
import { formatDate, isDeadlineUrgent } from "@/lib/utils";
import { CalendarIcon, ArrowLeft, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

const newRequestSchema = z.object({
  title: z.string().min(5, "Task title must be at least 5 characters"),
  subject: z.string().min(2, "Subject is required"),
  college: z.string().min(2, "College name is required"),
  semester: z.string().min(1, "Semester is required"),
  pages: z.coerce.number().min(1, "Pages must be at least 1"),
  format: z.enum(["typed", "handwritten"]),
  description: z.string().optional(),
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
      title: "Distributed Systems - Raft Consensus Lab Manual",
      subject: "Distributed Systems",
      college: "Delhi Technological University",
      semester: "6",
      pages: 24,
      format: "typed",
      description: "Need full state machine implementation, leader election diagrams, and Wireshark trace analysis.",
    },
  });

  const formatValue = watch("format");

  // Determine if selected deadline is urgent (< 24h)
  const isUrgent = React.useMemo(() => {
    return isDeadlineUrgent(selectedDate.toISOString());
  }, [selectedDate]);

  const onSubmit = async (data: NewRequestFormValues) => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const newId = "REQ-" + (1000 + mockRequests.length + 1);
    const newRequest: Request = {
      id: newId,
      title: data.title,
      subject: data.subject,
      college: data.college,
      semester: data.semester,
      pages: data.pages,
      format: data.format,
      deadline: selectedDate.toISOString(),
      status: "pending",
      urgent: isUrgent,
      advancePaid: false,
      balancePaid: false,
      studentId: "usr_aarav_01",
      studentName: "Aarav Sharma",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: uploadedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
      })),
    };

    // Prepend to mock data array
    mockRequests.unshift(newRequest);

    toast.success("Task request submitted! Admin will issue a 50-50 quotation in chat.");
    setSubmitting(false);
    router.push(`/user/chat/${newId}`);
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
              Specify the subject, assignment title, and university guidelines
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[13px]">
                Assignment / Lab Manual Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. Computer Networks Socket Programming Lab Manual"
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
                  placeholder="e.g. Operating Systems"
                  {...register("subject")}
                  className={errors.subject ? "border-foreground" : ""}
                />
                {errors.subject && (
                  <p className="text-[12px] font-medium text-foreground">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="college" className="text-[13px]">College / University</Label>
                <Input
                  id="college"
                  placeholder="e.g. Delhi Technological University"
                  {...register("college")}
                  className={errors.college ? "border-foreground" : ""}
                />
                {errors.college && (
                  <p className="text-[12px] font-medium text-foreground">{errors.college.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="semester" className="text-[13px]">Semester (1-10)</Label>
                <Input
                  id="semester"
                  type="number"
                  min={1}
                  max={10}
                  {...register("semester")}
                  className={errors.semester ? "border-foreground" : ""}
                />
                {errors.semester && (
                  <p className="text-[12px] font-medium text-foreground">{errors.semester.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pages" className="text-[13px]">Approximate Page Count</Label>
                <Input
                  id="pages"
                  type="number"
                  min={1}
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
                placeholder="List specific experiment numbers, problem statements, output expectations, or preferred formatting guidelines..."
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
              Attach university question PDFs, lab manual index, experiment guidelines, or sample code
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
