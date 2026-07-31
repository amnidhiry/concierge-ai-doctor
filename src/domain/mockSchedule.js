/**
 * Synthetic scheduled visits for the physician's day view.
 *
 * These give the schedule realistic density so the one live case doesn't sit
 * alone on an empty screen. Each one carries synthetic intake material, so a
 * sample visit can be opened read-only *and* pushed through a real care-packet
 * call on demand — the schedule is explorable rather than decorative, without any
 * of it pretending to be pre-computed model output.
 *
 * ── Why a schedule and not a panel ─────────────────────────────────────────
 * An earlier version of this file modelled a physician's *panel* — a roster of
 * patients under their ongoing care. That is the wrong shape for this product.
 * Each entry here is one bounded, scheduled, episodic visit that ends when the
 * documentation is approved. There is no continuing relationship to model, so
 * there is no roster: there is a day with calls in it.
 *
 * Cases are preventive cardiology — risk stratification, lipids and Lp(a),
 * calcium scores, family history. Nothing acute: an acute presentation belongs in
 * an emergency department, not on a call booked for Thursday, and the intake
 * agent routes those out before they get here.
 *
 * The names are the Beatles (including Pete Best and Stuart Sutcliffe), kept in
 * initial-surname form so the list still scans as a chart rather than a punchline.
 * All six are male and the clinical detail is written accordingly.
 *
 * EVERY VALUE HERE IS INVENTED. No real person's data appears in this file.
 */

/**
 * @typedef {'intake_open' | 'packet_ready' | 'documentation_pending' | 'approved'} VisitRowStatus
 */

export const SCHEDULED_VISITS = [
  {
    id: 'pt-2291',
    name: 'J. Lennon',
    age: 54,
    sex: 'M',
    reason: 'Elevated Lp(a) — what it changes',
    status: 'approved',
    slotLabel: 'Yesterday, 16:20',
    durationMinutes: 25,
    summary:
      'Lp(a) 187 nmol/L found incidentally. Wants to know what it changes given an otherwise clean panel.',
    intake: {
      patientMessage:
        "My physical came back mostly fine but there was one number flagged — something called Lp(a) at 187. My GP said it was 'genetic and there's not much to do about it' and moved on. That answer hasn't sat well with me. My cholesterol is apparently normal, my blood pressure is fine, I'm not diabetic. So is this number actually a problem or not? And if it is genetic, does that mean my kids should be tested?",
      chartText: `PREVENTIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
Patient: J. Lennon | 54M | BMI 24.1

LIPID PANEL (fasting, 3 weeks ago)
  Total cholesterol   184 mg/dL
  LDL-C               108 mg/dL
  HDL-C                54 mg/dL
  Triglycerides        96 mg/dL
  Lp(a)               187 nmol/L        [flagged high]
  ApoB                not ordered

OTHER LABS
  HbA1c               5.3 %
  hs-CRP              0.9 mg/L
  Creatinine          0.94 mg/dL
  TSH                 within range

VITALS
  BP 118/74 (office, single reading). No home readings recorded.
  Resting HR 66

HISTORY
  No prior cardiac events, no chest pain, no exertional symptoms.
  Never smoker. Alcohol ~4 units/week. Runs 3x/week, 5km.
  No diabetes, no hypertension diagnosis.

FAMILY HISTORY
  Mother — stroke, age unrecorded in chart.
  Father — "heart trouble," no further detail available.
  Note: ages at event not captured at intake.

MEDICATIONS
  None.

IMAGING
  No coronary calcium score. No prior echo or stress testing.

RISK SCORES
  None calculated or supplied.`,
    },
  },
  {
    id: 'pt-2284',
    name: 'P. McCartney',
    age: 61,
    sex: 'M',
    reason: 'Calcium score 240 — statin decision',
    status: 'packet_ready',
    slotLabel: 'Today, 14:00',
    durationMinutes: 30,
    summary:
      'Calcium score came back at 240 (78th percentile). Reluctant to start a statin, wants the reasoning.',
    intake: {
      patientMessage:
        "I paid out of pocket for a calcium scan because a friend recommended it. The result was 240 and the report says that's high for my age. My doctor now wants me on a statin. I'm 61, I feel completely well, I cycle most days, and I've read enough conflicting things about statins to be uneasy. I'm not refusing — I just want someone to actually explain what a 240 means for me specifically, and what happens if I don't take one.",
      chartText: `PREVENTIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
Patient: P. McCartney | 61M | BMI 25.8

CORONARY CALCIUM CT (6 weeks ago, outpatient imaging centre)
  Total Agatston score      240
  Report note: "elevated for age; 78th percentile"
  Per-vessel breakdown      NOT included in the report provided
  Age/sex percentile basis  not stated

LIPID PANEL (4 months ago)
  Total cholesterol   212 mg/dL
  LDL-C               141 mg/dL
  HDL-C                48 mg/dL
  Triglycerides       132 mg/dL
  Lp(a)               not ordered
  ApoB                not ordered

OTHER LABS
  HbA1c               5.8 %
  hs-CRP              not ordered

VITALS
  BP 134/82 and 131/79 (two office readings, 4 months apart)
  Resting HR 58

HISTORY
  Asymptomatic. No chest discomfort, no dyspnoea on exertion.
  Cycles 4–5x/week, 20–30km. Never smoker.
  No diabetes. No formal hypertension diagnosis.

FAMILY HISTORY
  Father — MI at 68, survived.
  Brother — "high cholesterol," on medication, no events.

MEDICATIONS
  None. Declined statin at last visit.

RISK SCORES
  No PREVENT or pooled-cohort score in the record.
  The Agatston score above is the only quantitative risk marker supplied.

PATIENT-STATED CONCERNS
  Muscle side effects; long-term dependence; whether lifestyle alone is enough.`,
    },
  },
  {
    id: 'pt-2277',
    name: 'G. Harrison',
    age: 47,
    sex: 'M',
    reason: 'Premature family history — where to start',
    status: 'packet_ready',
    slotLabel: 'Today, 15:30',
    durationMinutes: 25,
    summary:
      'Father had an MI at 49. No personal risk factors. Wants to know which tests are worth doing.',
    intake: {
      patientMessage:
        "My father had a heart attack at 49 and died of a second one at 58. I'm 47 next month and it's been on my mind constantly. I've had a basic cholesterol test and was told it was 'fine,' but nobody has looked at me properly given the family history. I don't want to be alarmist, but I also don't want to find out the hard way. What should I actually be tested for?",
      chartText: `PREVENTIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
Patient: G. Harrison | 47M | BMI 23.4

LIPID PANEL (14 months ago — only panel on file)
  Total cholesterol   196 mg/dL
  LDL-C               122 mg/dL
  HDL-C                51 mg/dL
  Triglycerides       114 mg/dL
  Lp(a)               not ordered
  ApoB                not ordered

OTHER LABS
  HbA1c               not ordered
  hs-CRP              not ordered

VITALS
  BP 126/80 (single office reading, 14 months ago)
  Resting HR 71

HISTORY
  Asymptomatic. No chest pain, no exertional limitation, no palpitations.
  Never smoker. Alcohol minimal. Walks daily; no structured exercise.
  No diabetes, no hypertension.

FAMILY HISTORY  [the reason for booking]
  Father — first MI at 49, fatal MI at 58.
  Paternal uncle — CABG in his early 50s (exact age not known to patient).
  Paternal grandfather — died suddenly, age ~60, cause never established.
  Mother — alive, 78, no cardiac history.

MEDICATIONS
  None.

IMAGING
  None. No calcium score, no stress test, no echo.

RISK SCORES
  None supplied. Note: no score in the record accounts for the family history.`,
    },
  },
  {
    id: 'pt-2265',
    name: 'R. Starr',
    age: 67,
    sex: 'M',
    reason: 'Post-stent — is LDL 78 low enough',
    status: 'documentation_pending',
    slotLabel: 'Today, 11:15',
    durationMinutes: 30,
    summary:
      'Two years post-PCI. LDL 78 on moderate-intensity statin; asking whether to intensify.',
    intake: {
      patientMessage:
        "I had a stent put in two years ago after an episode of chest pain. Since then I've been on a statin and my LDL is 78, which I was told was good. But I've been reading that people who've already had a stent should be aiming much lower than that. My cardiologist retired and the new one just said 'keep doing what you're doing.' I'd like a second view on whether 78 is actually good enough in my situation.",
      chartText: `PREVENTIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
Patient: R. Starr | 67M | BMI 27.2

CARDIAC HISTORY
  PCI with drug-eluting stent to mid-LAD, 2 years ago.
  Index presentation: exertional chest pain, troponin negative.
  No events since. No angina since the procedure.
  Most recent stress test: none since PCI.

LIPID PANEL (2 months ago, on treatment)
  Total cholesterol   152 mg/dL
  LDL-C                78 mg/dL
  HDL-C                44 mg/dL
  Triglycerides       148 mg/dL
  ApoB                not ordered
  Lp(a)               not ordered

OTHER LABS
  HbA1c               6.0 %
  Creatinine          1.02 mg/dL
  ALT                 within range

VITALS
  BP 128/78 (home average over 7 days, patient-recorded)
  Resting HR 62

MEDICATIONS
  Atorvastatin 20 mg daily        [moderate intensity]
  Aspirin 81 mg daily
  Metoprolol succinate 25 mg daily
  No ezetimibe. No PCSK9 inhibitor.

HISTORY
  Ex-smoker, quit 19 years ago, ~15 pack-years.
  Walks 30 min most days. No resistance training.
  No diabetes diagnosis; A1c in prediabetic range on last two checks.

FAMILY HISTORY
  Mother — MI at 71.
  No premature family history.

RISK SCORES
  Not applicable / none supplied — established disease, so primary-prevention
  scores were not calculated by the referring practice.

PATIENT-STATED CONCERNS
  Whether LDL 78 is adequate post-stent; whether to add a second agent.`,
    },
  },
  {
    id: 'pt-2258',
    name: 'P. Best',
    age: 58,
    sex: 'M',
    reason: 'Metabolic risk — first assessment',
    status: 'intake_open',
    slotLabel: 'Thursday, 09:00',
    durationMinutes: 25,
    summary:
      'A1c 6.1 with central adiposity. Intake started; records not yet uploaded.',
    intake: {
      patientMessage:
        "I was told at a work health screening that I'm 'pre-diabetic' and that my waist measurement puts me at risk. I've put on about 15kg over the last decade, mostly around the middle. Nobody has explained what this means for my heart specifically, which is what worries me — my weight I understand, but the cardiovascular part I don't. I haven't had a chance to get my old records together yet.",
      chartText: `PREVENTIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD (INCOMPLETE)
Patient: P. Best | 58M | BMI 31.4 | Waist 106 cm

WORKPLACE SCREENING PANEL (5 weeks ago — the only data on file)
  HbA1c               6.1 %
  Total cholesterol   208 mg/dL
  HDL-C                38 mg/dL
  Triglycerides       218 mg/dL
  LDL-C               not calculated on the report provided
  ApoB                not ordered
  Lp(a)               not ordered

VITALS (screening, single reading)
  BP 142/88
  Resting HR 78

HISTORY
  Asymptomatic per patient. Not formally assessed for exertional symptoms.
  Weight gain ~15 kg over 10 years, predominantly central.
  Sedentary; desk-based work, no structured exercise.
  Alcohol ~14 units/week. Never smoker.
  Sleep: patient reports snoring and daytime tiredness. Never assessed.

FAMILY HISTORY
  Not captured at screening. Patient has not yet supplied it.

MEDICATIONS
  None reported.

RISK SCORES
  None supplied. Insufficient inputs on file to support any validated score
  (no LDL-C, no smoking-status confirmation, no family history).

OUTSTANDING — patient has not yet uploaded:
  - Prior lipid panels or GP records
  - Any blood pressure readings outside the single screening value
  - Family history detail`,
    },
  },
  {
    id: 'pt-2249',
    name: 'S. Sutcliffe',
    age: 51,
    sex: 'M',
    reason: 'Statin intolerance — what else exists',
    status: 'approved',
    slotLabel: 'Monday, 08:40',
    durationMinutes: 25,
    summary: 'Myalgia on two statins. Wanted a plain-language read on the alternatives.',
    intake: {
      patientMessage:
        "I've tried two different statins and both gave me significant muscle aching — bad enough that I stopped exercising, which feels counterproductive. My doctor's suggestion was to 'try again in a few months.' I'd rather understand what the alternatives are. I'm not anti-medication, I just can't function on these two. Is there anything else, or am I stuck?",
      chartText: `PREVENTIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
Patient: S. Sutcliffe | 51M | BMI 26.0

STATIN TRIAL HISTORY
  Atorvastatin 40 mg   — 7 weeks. Bilateral thigh and shoulder myalgia. Stopped.
  Rosuvastatin 10 mg   — 5 weeks, started 4 months later. Similar myalgia, milder.
                          Stopped by patient without review.
  Creatine kinase during either trial: never measured.
  Rechallenge at lower dose or alternate-day dosing: not attempted.

LIPID PANEL (off treatment, 6 weeks ago)
  Total cholesterol   248 mg/dL
  LDL-C               168 mg/dL
  HDL-C                46 mg/dL
  Triglycerides       152 mg/dL
  ApoB                not ordered
  Lp(a)               not ordered

OTHER LABS
  HbA1c               5.6 %
  TSH                 not ordered
  Vitamin D           not ordered
  Creatine kinase     not ordered

VITALS
  BP 130/84 (office). No home readings.
  Resting HR 68

HISTORY
  No prior cardiac events. Asymptomatic cardiovascularly.
  Was cycling and lifting 4x/week before the myalgia; now largely inactive.
  Never smoker. Alcohol ~6 units/week.

FAMILY HISTORY
  Father — hypertension, alive at 79, no events.
  No premature coronary disease reported.

MEDICATIONS
  None currently. No ezetimibe trial. No bempedoic acid. No PCSK9 inhibitor.

RISK SCORES
  None supplied.`,
    },
  },
]

/** The synthetic identity attached to whatever case the reviewer books. */
export const LIVE_PATIENT = {
  id: 'pt-2302',
  name: 'New booking (this session)',
  age: null,
  sex: null,
  reason: 'Booked this session',
}

export const REVIEWING_PHYSICIAN = {
  name: 'Dr. Imani Reyes',
  credential: 'MD, Preventive Cardiology',
  npiLabel: 'NPI ····4417',
}

/**
 * An example synthetic visit transcript, offered as an explicit opt-in on the
 * documentation stage.
 *
 * ── Read this before changing it ───────────────────────────────────────────
 * Live transcription exists now (browser speech recognition), but it is
 * consumer-grade, needs a browser that supports it, and needs two people actually
 * talking. This text exists so the documentation stage is demonstrable without
 * either — and it is loaded ONLY when someone clicks the button that says so, into
 * a field labelled as synthetic, on a screen that distinguishes captured speech
 * from an authored example.
 *
 * It is deliberately NOT prefilled, NOT auto-inserted when the call ends, and
 * NOT presented as a record of the call that just happened. Any of those would
 * make the stage a demonstration of a capability that does not exist, which is
 * the specific failure this whole design avoids.
 *
 * It is written to be realistically imperfect — an inaudible stretch, a topic
 * dropped, a value the patient can't find — because a clean transcript would
 * make the model's gap-reporting look like padding when it is the point.
 */
export const EXAMPLE_SYNTHETIC_TRANSCRIPT = `SYNTHETIC EXAMPLE TRANSCRIPT — authored for this prototype.
Not a recording. Not produced by transcription. No real call took place.
Case: pt-2284 (P. McCartney, 61M) · scheduled 30 minutes · audio only

PHYSICIAN: Thanks for making the time. I've read through what you sent — the calcium
score from six weeks ago and the lipid panel from four months back. Before I give you
my read, tell me what you're most hoping to get out of the next twenty minutes.

PATIENT: Honestly? Whether I actually need this statin. My GP said 240 was high and
that was more or less the whole conversation.

PHYSICIAN: That's a fair thing to want. Let me start with what the 240 does and doesn't
tell us. A calcium score is a measure of plaque that has already calcified in your
coronary arteries. 240 is a real finding — it isn't zero and it isn't borderline. What
it doesn't tell us is how much of your overall risk it accounts for, because your report
gives a percentile without saying which reference population it used.

PATIENT: Does that matter?

PHYSICIAN: It can move you a fair way in either direction. "78th percentile" against one
cohort and against another are different statements. It's worth asking the imaging centre
which reference they used — it's usually on the full report rather than the summary.

PATIENT: I only got the one page.

PHYSICIAN: Then that's one thing to go back for. The second is that there are two numbers
I'd want that nobody has ordered: an ApoB and an Lp(a). ApoB counts the atherogenic
particles rather than the cholesterol inside them, and Lp(a) is largely genetic and
independent of everything else on your panel.

PATIENT: My brother is on a statin for high cholesterol. Is that relevant?

PHYSICIAN: It is, and it's part of why I'd want the Lp(a) specifically. Do you know
whether he was ever tested for it?

PATIENT: I don't. I could ask.

PHYSICIAN: Worth asking. And you mentioned your father had a heart attack at 68 —

PATIENT: Sixty-eight, yes. He survived it, lived another fifteen years.

PHYSICIAN: [inaudible — approximately 20 seconds]

PATIENT: — sorry, you cut out there.

PHYSICIAN: I was saying that 68 is late enough that it doesn't count as premature family
history, which is the category that would change my thinking most. So it's context rather
than a red flag on its own.

PATIENT: So do I take the statin or not?

PHYSICIAN: I'm going to be straight with you: I can't make that decision on this call, and
I can't prescribe through this service in any case. What I can tell you is my honest read —
which is that with a calcium score of 240 and an LDL of 141, most preventive cardiologists
would be recommending lipid-lowering therapy, and I don't think your GP is wrong to raise
it. Where I'd push back is on doing it before you have the ApoB and the Lp(a), because if
the Lp(a) is high that changes both the target and the urgency, and you'd rather know now
than in two years.

PATIENT: And the muscle aches everyone talks about?

PHYSICIAN: Genuinely much less common than the internet suggests, and when they do happen
there are several ways around them — a different agent, a lower dose, alternate-day dosing.
It's a problem to solve if it happens, not a reason not to start.

PATIENT: That's more than I got last time. What do I do now?

PHYSICIAN: Three things to take to your GP. Ask for an ApoB and an Lp(a). Ask the imaging
centre for the full calcium report with the reference population. And tell your GP you're
willing to discuss a statin once those two values are back. If your Lp(a) comes back high,
that's the point to ask about seeing a lipid specialist.

PATIENT: And the blood pressure? It was 134 over something.

PHYSICIAN: Two office readings four months apart isn't enough to act on. Home readings —
morning and evening for a week — would tell us whether that's real. We're nearly out of
time, so I'll put that in the summary rather than talk through the technique now.

PATIENT: Fine. Thank you — that was actually useful.

PHYSICIAN: Good. You'll get a written summary of this and a note you can hand to your GP.
Your GP stays in charge of your care; I'm one outside opinion.

[call ended — 27 minutes]`

export function findScheduledVisit(caseId) {
  return SCHEDULED_VISITS.find((v) => v.id === caseId) ?? null
}
