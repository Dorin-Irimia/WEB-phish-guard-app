"use server";

import { auth } from "@phish-guard-app/auth";
import prisma from "@phish-guard-app/db";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth-helpers";

type AnalyzeInput = {
  url?: string;
  textContent?: string;
  imageUrl?: string;
};

type AnalysisResult = {
  textScore: number;
  urlScore: number;
  overallScore: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  isPhishing: boolean;
  confidence: number;
  detectedThreats: string[];
  analysis: string;
};

// Heuristic analysis for URLs
function analyzeURL(url: string): { score: number; threats: string[] } {
  const threats: string[] = [];
  let suspiciousCount = 0;

  try {
    const urlObj = new URL(url);

    // Check for IP address instead of domain
    if (/^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname)) {
      threats.push("Uses IP address instead of domain name");
      suspiciousCount += 2;
    }

    // Check for suspicious TLDs
    const suspiciousTLDs = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top"];
    if (suspiciousTLDs.some((tld) => urlObj.hostname.endsWith(tld))) {
      threats.push("Uses suspicious top-level domain");
      suspiciousCount += 1;
    }

    // Check for excessive subdomains
    const subdomains = urlObj.hostname.split(".");
    if (subdomains.length > 4) {
      threats.push("Contains excessive subdomains");
      suspiciousCount += 1;
    }

    // Check for common phishing keywords in domain
    const phishingKeywords = [
      "verify",
      "account",
      "update",
      "secure",
      "banking",
      "login",
      "signin",
      "confirm",
      "suspended",
    ];
    const hostname = urlObj.hostname.toLowerCase();
    const foundKeywords = phishingKeywords.filter((keyword) => hostname.includes(keyword));
    if (foundKeywords.length > 0) {
      threats.push(`Contains suspicious keywords: ${foundKeywords.join(", ")}`);
      suspiciousCount += foundKeywords.length;
    }

    // Check for @ symbol (can hide real domain)
    if (url.includes("@")) {
      threats.push("Contains @ symbol which can hide the real domain");
      suspiciousCount += 2;
    }

    // Check for URL shorteners
    const shorteners = ["bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly"];
    if (shorteners.some((shortener) => hostname.includes(shortener))) {
      threats.push("Uses URL shortener which can hide destination");
      suspiciousCount += 1;
    }

    // Check for HTTPS
    if (urlObj.protocol !== "https:") {
      threats.push("Does not use HTTPS encryption");
      suspiciousCount += 1;
    }

    // Check for suspicious port numbers
    if (urlObj.port && !["80", "443", "8080"].includes(urlObj.port)) {
      threats.push(`Uses non-standard port: ${urlObj.port}`);
      suspiciousCount += 1;
    }

  } catch (error) {
    threats.push("Invalid or malformed URL");
    suspiciousCount += 3;
  }

  const score = Math.min(suspiciousCount / 10, 1);
  return { score, threats };
}

// Heuristic analysis for text content
function analyzeText(text: string): { score: number; threats: string[] } {
  const threats: string[] = [];
  let suspiciousCount = 0;

  const lowerText = text.toLowerCase();

  // Check for urgency tactics
  const urgencyWords = [
    "urgent",
    "immediate",
    "immediately",
    "act now",
    "limited time",
    "expires",
    "suspended",
    "verify now",
    "confirm immediately",
    "24 hours",
    "48 hours",
    "action required",
    "respond now",
    "click here now",
  ];
  urgencyWords.forEach((word) => {
    if (lowerText.includes(word)) {
      threats.push(`Uses urgency tactic: "${word}"`);
      suspiciousCount += 1.5;
    }
  });

  // Check for threatening language
  const threats_words = [
    "account closed", 
    "account will be closed",
    "legal action", 
    "suspended", 
    "locked", 
    "blocked",
    "terminate",
    "deactivate",
    "unauthorized access",
    "unusual activity",
    "suspicious activity",
  ];
  threats_words.forEach((word) => {
    if (lowerText.includes(word)) {
      threats.push(`Contains threatening language: "${word}"`);
      suspiciousCount += 1.5;
    }
  });

  // Check for requests for sensitive information
  const sensitiveRequests = [
    "social security",
    "password",
    "pin",
    "credit card",
    "bank account",
    "ssn",
    "cvv",
    "verify your account",
    "verify your identity",
    "confirm your identity",
    "update your information",
    "update payment",
  ];
  sensitiveRequests.forEach((request) => {
    if (lowerText.includes(request)) {
      threats.push(`Requests sensitive information: "${request}"`);
      suspiciousCount += 2;
    }
  });

  // Check for generic greetings
  if (lowerText.includes("dear customer") || 
      lowerText.includes("dear user") ||
      lowerText.includes("dear member") ||
      lowerText.includes("valued customer")) {
    threats.push("Uses generic greeting instead of personal name");
    suspiciousCount += 1;
  }

  // Check for common phishing phrases
  const phishingPhrases = [
    "click here to",
    "click the link",
    "verify account",
    "confirm account",
    "update account",
    "reactivate",
    "re-activate",
    "validate",
    "unusual activity",
    "unusual sign-in",
    "suspicious sign-in",
  ];
  phishingPhrases.forEach((phrase) => {
    if (lowerText.includes(phrase)) {
      threats.push(`Contains phishing phrase: "${phrase}"`);
      suspiciousCount += 1;
    }
  });

  // Provider Mismatch Check - Corporate security alerts to personal emails
  if ((lowerText.includes("microsoft") || lowerText.includes("office 365") || lowerText.includes("account team")) &&
      (lowerText.includes("@gmail.com") || lowerText.includes("@yahoo.com") || lowerText.includes("@hotmail.com"))) {
    threats.push("HIGH RISK: Corporate security alert sent to personal email address");
    suspiciousCount += 3;
  }

  // Check for email masking patterns (ra**6@gmail.com)
  if (/[a-z]{1,3}\*+[0-9]@/i.test(text)) {
    threats.push("Uses masked email address pattern (e.g., ra**6@gmail.com)");
    suspiciousCount += 1.5;
  }

  // Check for IP address mentions (often in fake security alerts)
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(text)) {
    threats.push("Contains IP address (common in fake security alerts)");
    suspiciousCount += 0.5;
  }

  // Check for foreign language characters (Chinese, Cyrillic, Arabic)
  // These can indicate targeted phishing with wrong language
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const hasCyrillic = /[\u0400-\u04FF]/.test(text);
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  
  if (hasChinese || hasCyrillic || hasArabic) {
    const langName = hasChinese ? "Chinese" : hasCyrillic ? "Cyrillic" : "Arabic";
    threats.push(`Contains ${langName} characters - verify expected language`);
    suspiciousCount += 2;
  }

  // Check for forwarded message patterns
  if (lowerText.includes("forwarded message") || 
      lowerText.includes("---------- forwarded") ||
      text.includes("Fwd:") || 
      lowerText.includes("date:") && lowerText.includes("from:") && lowerText.includes("subject:")) {
    threats.push("Appears to be a forwarded message (verify sender authenticity)");
    suspiciousCount += 1.5;
  }

  // Check for password/security change notifications
  if ((lowerText.includes("password") || lowerText.includes("security")) &&
      (lowerText.includes("changed") || lowerText.includes("modified") || 
       lowerText.includes("updated") || lowerText.includes("reset"))) {
    threats.push("Contains password/security change notification");
    suspiciousCount += 1.5;
  }

  // Check for account recovery/lock mentions
  if (lowerText.includes("account recovery") || 
      lowerText.includes("recover account") ||
      lowerText.includes("lock account") ||
      lowerText.includes("restore access")) {
    threats.push("Mentions account recovery (verify authenticity)");
    suspiciousCount += 1;
  }

  // Check for misspellings of common brands
  const brands = ["paypal", "amazon", "microsoft", "apple", "google", "facebook"];
  const misspellings: Record<string, string[]> = {
    paypal: ["paypai", "paypa1", "paypa"],
    amazon: ["arnazon", "arnazon", "amazom"],
    microsoft: ["rnicrosoft", "microsft"],
  };

  Object.entries(misspellings).forEach(([brand, variants]) => {
    variants.forEach((variant) => {
      if (lowerText.includes(variant)) {
        threats.push(`Possible brand impersonation: "${variant}" (${brand})`);
        suspiciousCount += 2;
      }
    });
  });

  // Calculate score with better scaling
  const score = Math.min(suspiciousCount / 6, 1); // Reduced denominator for higher sensitivity
  return { score, threats };
}

function calculateRiskLevel(score: number): "safe" | "low" | "medium" | "high" | "critical" {
  if (score < 0.15) return "safe";
  if (score < 0.3) return "low";
  if (score < 0.5) return "medium";
  if (score < 0.7) return "high";
  return "critical";
}

export async function analyzePhishing(input: AnalyzeInput): Promise<AnalysisResult> {
  const session = await requireAuth();

  let urlScore = 0;
  let textScore = 0;
  const allThreats: string[] = [];

  // Analyze URL if provided
  if (input.url) {
    const urlAnalysis = analyzeURL(input.url);
    urlScore = urlAnalysis.score;
    allThreats.push(...urlAnalysis.threats);
  }

  // Analyze text if provided
  if (input.textContent) {
    const textAnalysis = analyzeText(input.textContent);
    textScore = textAnalysis.score;
    allThreats.push(...textAnalysis.threats);
  }

  // Calculate overall score
  const overallScore = input.url && input.textContent 
    ? (urlScore + textScore) / 2 
    : urlScore || textScore;

  const riskLevel = calculateRiskLevel(overallScore);
  const isPhishing = overallScore > 0.5;
  
  // Confidence should reflect how certain we are of the result
  // More threats detected = higher confidence in our assessment
  const confidence = allThreats.length > 0 
    ? Math.min(0.7 + (allThreats.length * 0.05), 0.98)
    : 0.5; // Low confidence if no threats detected

  const analysis = isPhishing
    ? `This ${input.url ? "URL" : input.imageUrl ? "image" : "content"} shows ${allThreats.length} suspicious indicator${allThreats.length !== 1 ? 's' : ''} commonly associated with phishing attempts. Risk score: ${(overallScore * 100).toFixed(1)}%. Exercise caution and verify the source before proceeding.`
    : `No significant threats detected in this ${input.url ? "URL" : input.imageUrl ? "image" : "content"}. Risk score: ${(overallScore * 100).toFixed(1)}%. However, always verify the sender's identity and be cautious with personal information.`;

  // Save to database
  await prisma.scan.create({
    data: {
      userId: session.user.id,
      url: input.url,
      textContent: input.textContent,
      imageUrl: input.imageUrl,
      textScore,
      urlScore,
      overallScore,
      riskLevel,
      isPhishing,
      confidence,
      detectedThreats: allThreats,
      analysis,
    },
  });

  // Update user stats
  await prisma.dashboardStats.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      totalScans: 1,
      threatsBlocked: isPhishing ? 1 : 0,
      safeSites: isPhishing ? 0 : 1,
      scansThisWeek: 1,
      scansThisMonth: 1,
      lastScanAt: new Date(),
    },
    update: {
      totalScans: { increment: 1 },
      threatsBlocked: { increment: isPhishing ? 1 : 0 },
      safeSites: { increment: isPhishing ? 0 : 1 },
      scansThisWeek: { increment: 1 },
      scansThisMonth: { increment: 1 },
      lastScanAt: new Date(),
    },
  });

  return {
    textScore,
    urlScore,
    overallScore,
    riskLevel,
    isPhishing,
    confidence,
    detectedThreats: allThreats,
    analysis,
  };
}
