import * as React from "react";
import { ChevronDown } from "lucide-react";

export function FaqAccordion() {
  const faqs = [
    {
      question: "How does the 50/50 milestone payment model work?",
      answer:
        "When an academic specialist creates a quotation for your task, you only pay 50% upfront as an advance milestone. This immediately begins work on your task. The remaining 50% balance is only paid once the document is finalized and you inspect the preview. Once the balance is paid, the final deliverable download is instantly unlocked.",
    },
    {
      question: "Can I request handwritten practical files or assignments?",
      answer:
        "Yes! During task submission, select 'Handwritten' format. You can even choose ruled sheets or plain white pages. Our team writes out the assignment with neat penmanship, draws accurate hand-drawn diagrams, and uploads high-resolution 300 DPI scanned PDFs ready for printout or direct portal upload.",
    },
    {
      question: "What if my college lab requires specific compiler outputs or screenshots?",
      answer:
        "You can attach your laboratory manual guidelines or problem sheet during task submission. Our specialists will write the exact code (C, C++, Java, Python, SQL, MATLAB, Assembly 8086), execute it in standard environments (Linux/Windows terminal, Wireshark, Cisco Packet Tracer), and embed genuine execution screenshots into the document.",
    },
    {
      question: "What if I need a revision after receiving the final document?",
      answer:
        "Every delivered task includes complimentary revision support. After delivery, simply click 'Request Revision' on the task page or message the specialist in the live chat to request adjustments to calculations, formatting, or missing experiments.",
    },
    {
      question: "How is my identity and academic integrity protected?",
      answer:
        "We never publish student tasks publicly. Your college name, registration number, and contact details are kept strictly confidential. Payment receipts and invoices are generated through Razorpay with standard privacy encryption.",
    },
    {
      question: "How quickly can an urgent college task be completed?",
      answer:
        "We offer express turnarounds under 24 hours (and as fast as 12 hours for assignments under 15 pages). When creating your request, selecting a deadline within 24 hours triggers our Urgent Priority Queue for immediate specialist assignment.",
    },
  ];

  return (
    <section
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-border"
      aria-labelledby="faq-heading"
    >
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <h2
          id="faq-heading"
          className="text-[28px] sm:text-[36px] font-bold tracking-tight text-foreground"
        >
          Frequently Asked Questions
        </h2>
        <p className="text-[15px] text-muted-foreground">
          Everything you need to know about college task orders, milestone payments, and deliverables.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <details
            key={idx}
            className="group rounded-[8px] border border-border bg-background overflow-hidden transition-colors hover:border-foreground/40"
          >
            <summary className="flex items-center justify-between p-4 sm:p-5 text-[15px] font-semibold text-foreground cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <span className="pr-4">{faq.question}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 sm:px-5 pb-5 pt-1 text-[14px] leading-relaxed text-muted-foreground border-t border-border/50">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
