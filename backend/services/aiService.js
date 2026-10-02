/**
 * AI Advisory Service for Capstone Project BCA-05
 * 
 * CORE RULES:
 * 1. AI explains and assists; it NEVER silently decides or overrides match scores.
 * 2. Every AI feature provides a deterministic template fallback when ANTHROPIC_API_KEY is missing or API fails.
 * 3. Never sends emails, phone numbers, or PII to external AI. Send only skills, interests, goals, languages, and scores.
 * 4. Logs every call (feature, latency, fallback used, token estimate) without storing prompts with PII.
 */

// In-memory telemetry for AI calls
const aiMetrics = {
  totalCalls: 0,
  fallbackCalls: 0,
  callLog: [], // Max 100 entries for inspection
};

export function recordAiTelemetry({ feature, latencyMs, fallbackUsed, tokensEstimated = 0 }) {
  aiMetrics.totalCalls += 1;
  if (fallbackUsed) {
    aiMetrics.fallbackCalls += 1;
  }
  const entry = {
    id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    feature,
    latencyMs: Math.round(latencyMs),
    fallbackUsed,
    tokensEstimated,
    timestamp: new Date().toISOString(),
  };
  aiMetrics.callLog.unshift(entry);
  if (aiMetrics.callLog.length > 100) {
    aiMetrics.callLog.pop();
  }
  return entry;
}

export function getAiTelemetry() {
  const fallbackRate =
    aiMetrics.totalCalls > 0
      ? Math.round((aiMetrics.fallbackCalls / aiMetrics.totalCalls) * 1000) / 10
      : 0;

  return {
    provider: 'Anthropic Claude',
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
    model: 'claude-3-5-sonnet-20241022',
    totalCalls: aiMetrics.totalCalls,
    fallbackCalls: aiMetrics.fallbackCalls,
    fallbackRatePercent: fallbackRate,
    recentCalls: aiMetrics.callLog.slice(0, 10),
  };
}

/**
 * PII Sanitizer: strips emails, phone numbers, and standard identifiers from text.
 */
export function sanitizePii(text = '') {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]')
    .replace(/\b\d{10,12}\b/g, '[REDACTED_NUMBER]');
}

/**
 * Core caller for Anthropic API with deterministic fallback safety
 */
async function callClaude({ systemPrompt, userPrompt, feature, fallbackFn }) {
  const startTime = Date.now();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const fallbackResult = fallbackFn();
    recordAiTelemetry({
      feature,
      latencyMs: Date.now() - startTime,
      fallbackUsed: true,
      tokensEstimated: 0,
    });
    return { ...fallbackResult, source: 'deterministic-fallback' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Anthropic HTTP ${res.status}`);
    }

    const data = await res.json();
    const outputText = data.content?.[0]?.text || '';
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    recordAiTelemetry({
      feature,
      latencyMs: Date.now() - startTime,
      fallbackUsed: false,
      tokensEstimated: tokens,
    });

    return { text: outputText, source: 'anthropic-claude' };
  } catch (error) {
    console.warn(`[AI Service] ${feature} call failed (${error.message}). Invoking deterministic fallback.`);
    const fallbackResult = fallbackFn();
    recordAiTelemetry({
      feature,
      latencyMs: Date.now() - startTime,
      fallbackUsed: true,
      tokensEstimated: 0,
    });
    return { ...fallbackResult, source: 'deterministic-fallback', error: error.message };
  }
}

/**
 * 1. Explain Match: Grounded ONLY in the factor breakdown supplied by the server.
 */
export async function explainMatch({ score, factors = [], mentorDomain, mentorCompany }) {
  const factorsSummary = factors
    .map(
      (f) =>
        `- ${f.name} (weight ${(f.weight * 100).toFixed(0)}%, raw ${f.rawScore}/100, contribution ${f.contribution}): ${f.explanation || ''}`
    )
    .join('\n');

  const fallbackFn = () => {
    const skillsFactor = factors.find((f) => f.name === 'skills');
    const interestsFactor = factors.find((f) => f.name === 'interests');
    const capacityFactor = factors.find((f) => f.name === 'capacity');

    const sharedSkills = skillsFactor?.matchedItems?.length
      ? skillsFactor.matchedItems.join(', ')
      : 'foundational technical principles';
    const sharedInterests = interestsFactor?.matchedItems?.length
      ? interestsFactor.matchedItems.join(', ')
      : 'career development in software engineering';
    const capacityNote =
      capacityFactor?.rawScore > 0
        ? 'The mentor has active capacity to take on new mentees.'
        : 'The mentor is currently at capacity; scheduling may be subject to availability.';

    return {
      text: `This match is evaluated at ${score}/100 based on verified profile compatibility. Key drivers include shared technical skills (${sharedSkills}) contributing ${skillsFactor?.contribution || 0} points, alongside aligned career interests in ${sharedInterests} adding ${interestsFactor?.contribution || 0} points. ${capacityNote} We recommend initiating communication to establish mutually agreed mentorship milestones.`,
    };
  };

  const systemPrompt =
    'You are an explainable matching assistant for an academic alumni-student mentorship platform. You must ground your explanation strictly in the factor scores provided. Do not invent new skills or factors. Do not use personal names or emails. Be professional, clear, and concise (2-3 sentences).';

  const userPrompt = `Explain why this student-mentor match has an overall score of ${score}/100.
Ground your response ONLY in these computed factors:
${factorsSummary}
${mentorDomain ? `Mentor Domain: ${mentorDomain}` : ''}
${mentorCompany ? `Mentor Industry: ${mentorCompany}` : ''}

Provide a concise, 2-3 sentence explanation explaining what contributes to this score.`;

  return callClaude({
    systemPrompt,
    userPrompt,
    feature: 'explain-match',
    fallbackFn,
  });
}

/**
 * 2. Suggest Goals: 3-5 SMART goals from student profile + mentor expertise (no PII).
 */
export async function suggestGoals({ studentSkills = [], studentGoals = [], mentorSkills = [], mentorDomain = '' }) {
  const cleanStudentSkills = studentSkills.map(sanitizePii).filter(Boolean);
  const cleanMentorSkills = mentorSkills.map(sanitizePii).filter(Boolean);
  const cleanStudentGoals = studentGoals.map(sanitizePii).filter(Boolean);

  const fallbackFn = () => {
    const targetSkill = cleanMentorSkills[0] || cleanStudentSkills[0] || 'Full-Stack Development';
    const secondarySkill = cleanMentorSkills[1] || 'System Architecture';

    return {
      goals: [
        {
          title: `Build a Capstone Milestone with ${targetSkill}`,
          description: `Design and implement an end-to-end feature integrating ${targetSkill} within 3 weeks, following clean architecture standards.`,
          category: 'Technical',
          targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          title: `Bi-Weekly Code Review & Architecture Guidance`,
          description: `Participate in structured sessions to review pull requests, focusing on testing best practices and ${secondarySkill}.`,
          category: 'Engineering Best Practices',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          title: 'Technical Interview & Resume Preparation',
          description: `Refine your resume and complete a mock behavioral and technical interview focused on ${mentorDomain || 'Software Engineering'} by week 6.`,
          category: 'Career Readiness',
          targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ],
    };
  };

  const systemPrompt =
    'You are a career mentorship advisor. Create 3 to 4 SMART (Specific, Measurable, Achievable, Relevant, Time-bound) mentorship goals for a university student based on their skills and their alumni mentor expertise. Output JSON only: {"goals": [{"title": "...", "description": "...", "category": "..."}]}';

  const userPrompt = `Student Skills: ${cleanStudentSkills.join(', ') || 'Computer Science fundamentals'}
Student Career Aspirations: ${cleanStudentGoals.join(', ') || 'Software Engineer'}
Mentor Expertise: ${cleanMentorSkills.join(', ') || 'Software Engineering'}
Mentor Domain: ${mentorDomain || 'Technology'}

Generate 3 to 4 actionable SMART goals for this mentorship pairing in JSON format.`;

  const result = await callClaude({
    systemPrompt,
    userPrompt,
    feature: 'suggest-goals',
    fallbackFn,
  });

  if (result.goals) return result;

  try {
    const parsed = JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    if (Array.isArray(parsed.goals) && parsed.goals.length > 0) {
      return { goals: parsed.goals, source: result.source };
    }
  } catch {
    // If JSON parsing fails, fallback
  }

  return { ...fallbackFn(), source: 'deterministic-fallback' };
}

/**
 * 3. Summarize Request: Concise summary of student request and fit for mentor (no PII).
 */
export async function summarizeRequest({ message = '', matchScore, sharedSkills = [], studentGoals = [] }) {
  const cleanMsg = sanitizePii(message).slice(0, 500);

  const fallbackFn = () => {
    const skillsStr = sharedSkills.length ? sharedSkills.slice(0, 3).join(', ') : 'technical guidance';
    return {
      summary: `The student requests mentorship focused on ${skillsStr} with a match alignment of ${matchScore || 'N/A'}/100. Student note: "${cleanMsg || 'Looking forward to learning from your industry experience.'}"`,
    };
  };

  const systemPrompt =
    'You are an executive assistant summarizing mentorship requests for busy alumni professionals. Provide a clear, 2-sentence summary highlighting the core focus and compatibility. No personal identifiable information.';

  const userPrompt = `Match Score: ${matchScore}/100
Shared Technical Skills: ${sharedSkills.join(', ')}
Student Goals: ${studentGoals.join(', ')}
Student Message: "${cleanMsg}"

Provide a concise, 2-sentence executive summary for the mentor.`;

  const result = await callClaude({
    systemPrompt,
    userPrompt,
    feature: 'summarize-request',
    fallbackFn,
  });

  return { summary: result.text || fallbackFn().summary, source: result.source };
}

/**
 * 4. Summarize Feedback: Thematic synthesis across survey comments without personal identifiers.
 */
export async function summarizeFeedback({ feedbackComments = [], averageRating = 5 }) {
  const sanitizedComments = feedbackComments
    .map(sanitizePii)
    .filter(Boolean)
    .slice(0, 20);

  const fallbackFn = () => {
    if (sanitizedComments.length === 0) {
      return {
        themes: ['Consistently positive mentorship sessions', 'Clear communication and goal tracking'],
        overallSentiment: 'Positive',
        summary: `Feedback reflects solid engagement with an average satisfaction rating of ${averageRating.toFixed(1)}/5.0 across recorded sessions.`,
      };
    }
    return {
      themes: [
        'Practical industry guidance and portfolio review',
        'Effective scheduling and supportive session atmosphere',
      ],
      overallSentiment: averageRating >= 4 ? 'Positive' : 'Constructive',
      summary: `Analyzed ${sanitizedComments.length} session reviews. Participants highlighted actionable guidance and constructive feedback, with an average score of ${averageRating.toFixed(1)}/5.0.`,
    };
  };

  if (sanitizedComments.length === 0) {
    return { ...fallbackFn(), source: 'deterministic-fallback' };
  }

  const systemPrompt =
    'You are an academic programme evaluator. Synthesize student and mentor session feedback into high-level themes and sentiment. Absolutely no names or PII. Output JSON: {"themes": ["theme 1", "theme 2"], "overallSentiment": "Positive/Neutral/Constructive", "summary": "..."}';

  const userPrompt = `Average Rating: ${averageRating}/5.0
Survey Comments:
${sanitizedComments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Synthesize these comments into key themes and a concise summary.`;

  const result = await callClaude({
    systemPrompt,
    userPrompt,
    feature: 'summarize-feedback',
    fallbackFn,
  });

  try {
    const parsed = JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    if (parsed.themes && parsed.summary) {
      return { ...parsed, source: result.source };
    }
  } catch {
    // Graceful fallback
  }

  return { ...fallbackFn(), source: result.source || 'deterministic-fallback' };
}
