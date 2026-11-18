"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs = [
    {
      question: "How is the task price decided? Is there a rigid per-page rate?",
      answer:
        "No, there is no rigid per-page pricing. Your task price is decided via direct chat with our admin coordinator. We review your specific problem sheet, required diagrams, deadline, and college rubric to agree on a custom fair quote in USD ($).",
    },
    {
      question: "How does the 50/50 milestone escrow work?",
      answer:
        "When your specialist issues an agreed quotation in chat, you pay 50% upfront to initiate drafting. The remaining 50% balance is deposited into escrow and is only released after you inspect the watermarked deliverable and approve it.",
    },
    {
      question: "What is your cancellation and refund policy?",
      answer:
        "We offer a 100% Peace-of-Mind Guarantee. If our specialist fails to deliver by the agreed deadline or if the completed work violates your rubric specifications, you receive an immediate, 100% full refund of your 50% advance milestone without dispute.",
    },
    {
      question: "Can I request handwritten assignments on college-ruled sheets?",
      answer:
        "Yes! During request creation, choose 'Handwritten' format. You can specify standard college-ruled sheets or plain pages. Our writers draft with neat penmanship, hand-draw circuit diagrams, and provide clean 300 DPI multi-page PDFs ready for printout or LMS upload.",
    },
    {
      question: "How do I communicate with the specialist assigned to my task?",
      answer:
        "Once your request is submitted, an isolated real-time WebSocket room is provisioned. You can chat directly with your specialist, attach supplementary professor notes, request draft snapshots, and provide feedback instantaneously.",
    },
    {
      question: "Is my personal identity and university registration confidential?",
      answer:
        "Complete confidentiality is guaranteed. We never publish student work or share task materials with third parties. Your university name, student ID, and personal details are stripped from final document previews. All transactions are securely processed in USD.",
    },
  ];

  return (
    <section
      id="faq"
      className="w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:max-h-[920px] flex flex-col justify-between py-14 sm:py-20 lg:py-6 px-4 sm:px-8 max-w-6xl mx-auto border-t border-zinc-200 dark:border-zinc-800"
      aria-labelledby="faq-heading"
    >
      {/* Section Header */}
      <RevealOnScroll>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10 lg:mb-auto shrink-0">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
              FAQ &amp; Knowledge Base
            </div>
            <h2
              id="faq-heading"
              className="text-[24px] sm:text-[32px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight"
            >
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-[12px] sm:text-[13px] font-mono text-zinc-500 max-w-md text-left sm:text-right">
            Everything you need to know about chat pricing, escrow, and delivery.
          </p>
        </div>
      </RevealOnScroll>

      {/* 2-Column Accordion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 my-6 sm:my-8 lg:my-auto">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <RevealOnScroll key={idx} delayMs={idx * 60}>
              <div
                className={`rounded-[14px] border transition-all hover-lift ${
                  isOpen
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3"
                  aria-expanded={isOpen}
                >
                  <span className="text-[13px] sm:text-[14px] font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 mt-0.5 ${
                      isOpen ? "rotate-180 text-zinc-900 dark:text-zinc-100" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 pt-0 text-[12px] text-zinc-600 dark:text-zinc-400 font-light leading-relaxed border-t border-zinc-100 dark:border-zinc-900/50 mt-1">
                    {faq.answer}
                  </div>
                )}
              </div>
            </RevealOnScroll>
          );
        })}
      </div>

      {/* Bottom Help Text */}
      <RevealOnScroll delayMs={200}>
        <div className="flex flex-wrap items-center justify-between mt-8 sm:mt-10 lg:mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[12px] font-mono text-zinc-500 gap-2 shrink-0">
          <span>Have an unusual task requirement? Chat directly with an admin.</span>
          <Link
            href="/register"
            className="text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center font-semibold"
          >
            Get Started <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
