const MODEL = process.env.LLM_MODEL || 'claude-sonnet-4-6';

async function callLLM(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return text || null;
  } catch (err) {
    console.error('LLM request failed:', err.message);
    return null;
  }
}

function extractJson(raw) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

async function generatePreVisitSummary(symptoms) {
  const prompt = `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Respond with only a JSON object using the keys urgency, chief_complaint and questions (an array of exactly 3 short strings). Symptoms: ${symptoms}`;

  const raw = await callLLM(prompt);
  if (raw) {
    try {
      const parsed = extractJson(raw);
      return {
        urgency: parsed.urgency || 'Medium',
        chiefComplaint: parsed.chief_complaint || symptoms.slice(0, 140),
        questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : []
      };
    } catch (err) {
      console.error('Could not parse pre-visit LLM output, using fallback');
    }
  }

  return {
    urgency: 'Medium',
    chiefComplaint: symptoms.slice(0, 140),
    questions: [
      'When did the symptoms start?',
      'Have the symptoms gotten worse over time?',
      'Are you currently taking any medication?'
    ]
  };
}

async function generatePostVisitSummary(notes, prescriptionList) {
  const medsText = (prescriptionList || [])
    .map((m) => `${m.medicine_name} - ${m.times_per_day}x/day for ${m.duration_days} days`)
    .join(', ');

  const prompt = `Convert these clinical notes into a patient-friendly summary with a medication schedule and follow-up steps. Respond with only a JSON object using the keys summary, medication_schedule and follow_up_steps (each a short string, medication_schedule can list items separated by newlines). Notes: ${notes}. Prescription: ${medsText}`;

  const raw = await callLLM(prompt);
  if (raw) {
    try {
      const parsed = extractJson(raw);
      return {
        summary: parsed.summary || notes,
        medicationSchedule: parsed.medication_schedule || medsText,
        followUpSteps: parsed.follow_up_steps || 'Please follow the instructions given by your doctor.'
      };
    } catch (err) {
      console.error('Could not parse post-visit LLM output, using fallback');
    }
  }

  return {
    summary: notes,
    medicationSchedule: medsText || 'No medication prescribed.',
    followUpSteps: 'Please follow the instructions given by your doctor and book a follow-up if symptoms persist.'
  };
}

module.exports = { generatePreVisitSummary, generatePostVisitSummary };
