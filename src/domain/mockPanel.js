/**
 * Sample panel entries for the physician dashboard.
 *
 * These give the queue realistic density so the one live case doesn't sit alone
 * on an empty screen. Each one now carries synthetic intake material, so a sample
 * case can be opened read-only *and* pushed through a real synthesis call on
 * demand — the panel is explorable rather than decorative, without any of it
 * pretending to be pre-computed model output.
 *
 * Cases are preventative cardiology — risk stratification, lipids and Lp(a),
 * calcium scores, family history — rather than acute cardiology. The product is
 * asynchronous, so anything acute belongs in an emergency department and the
 * panel should reflect that.
 *
 * The names are the Beatles (including Pete Best and Stuart Sutcliffe), kept in
 * initial-surname form so the list still scans as a chart rather than a punchline.
 * All six are male and the clinical detail is written accordingly.
 *
 * EVERY VALUE HERE IS INVENTED. No real person's data appears in this file.
 */

export const MOCK_PANEL = [
  {
    id: 'pt-2291',
    name: 'J. Lennon',
    age: 54,
    sex: 'M',
    condition: 'Elevated Lp(a) — risk stratification',
    plan: 'Second Opinion',
    status: 'sent',
    waitingLabel: 'Answered 2h ago',
    summary:
      'Lp(a) 187 nmol/L found incidentally. Asking what it changes given an otherwise clean lipid panel.',
    intake: {
      patientMessage:
        "My physical came back mostly fine but there was one number flagged — something called Lp(a) at 187. My GP said it was 'genetic and there's not much to do about it' and moved on. That answer hasn't sat well with me. My cholesterol is apparently normal, my blood pressure is fine, I'm not diabetic. So is this number actually a problem or not? And if it is genetic, does that mean my kids should be tested?",
      chartText: `PREVENTATIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
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
  No coronary calcium score. No prior echo or stress testing.`,
    },
  },
  {
    id: 'pt-2284',
    name: 'P. McCartney',
    age: 61,
    sex: 'M',
    condition: 'CAC score 240 — statin decision',
    plan: 'Async AI Concierge',
    status: 'awaiting_review',
    waitingLabel: 'Waiting 41m',
    summary:
      'Calcium score came back at 240 (78th percentile). Reluctant to start a statin, wants the reasoning.',
    intake: {
      patientMessage:
        "I paid out of pocket for a calcium scan because a friend recommended it. The result was 240 and the report says that's high for my age. My doctor now wants me on a statin. I'm 61, I feel completely well, I cycle most days, and I've read enough conflicting things about statins to be uneasy. I'm not refusing — I just want someone to actually explain what a 240 means for me specifically, and what happens if I don't take one.",
      chartText: `PREVENTATIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
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

PATIENT-STATED CONCERNS
  Muscle side effects; long-term dependence; whether lifestyle alone is enough.`,
    },
  },
  {
    id: 'pt-2277',
    name: 'G. Harrison',
    age: 47,
    sex: 'M',
    condition: 'Premature family history — first workup',
    plan: 'Navigation',
    status: 'awaiting_review',
    waitingLabel: 'Waiting 3h',
    summary:
      'Father had an MI at 49. No personal risk factors. Asking which tests are actually worth doing.',
    intake: {
      patientMessage:
        "My father had a heart attack at 49 and died of a second one at 58. I'm 47 next month and it's been on my mind constantly. I've had a basic cholesterol test and was told it was 'fine,' but nobody has looked at me properly given the family history. I don't want to be alarmist, but I also don't want to find out the hard way. What should I actually be tested for?",
      chartText: `PREVENTATIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
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

FAMILY HISTORY  [the reason for referral]
  Father — first MI at 49, fatal MI at 58.
  Paternal uncle — CABG in his early 50s (exact age not known to patient).
  Paternal grandfather — died suddenly, age ~60, cause never established.
  Mother — alive, 78, no cardiac history.

MEDICATIONS
  None.

IMAGING
  None. No calcium score, no stress test, no echo.`,
    },
  },
  {
    id: 'pt-2265',
    name: 'R. Starr',
    age: 67,
    sex: 'M',
    condition: 'Post-stent secondary prevention',
    plan: 'Async AI Concierge',
    status: 'sent',
    waitingLabel: 'Answered yesterday',
    summary:
      'Two years post-PCI. LDL 78 on moderate-intensity statin; asking whether to intensify.',
    intake: {
      patientMessage:
        "I had a stent put in two years ago after an episode of chest pain. Since then I've been on a statin and my LDL is 78, which I was told was good. But I've been reading that people who've already had a stent should be aiming much lower than that. My cardiologist retired and the new one just said 'keep doing what you're doing.' I'd like a second view on whether 78 is actually good enough in my situation.",
      chartText: `PREVENTATIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
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

PATIENT-STATED CONCERNS
  Whether LDL 78 is adequate post-stent; whether to add a second agent.`,
    },
  },
  {
    id: 'pt-2258',
    name: 'P. Best',
    age: 58,
    sex: 'M',
    condition: 'Metabolic risk — first assessment',
    plan: 'Second Opinion',
    status: 'intake',
    waitingLabel: 'Intake incomplete',
    summary:
      'A1c 6.1 with central adiposity, wants a long-term cardiovascular plan. Records not yet uploaded.',
    intake: {
      patientMessage:
        "I was told at a work health screening that I'm 'pre-diabetic' and that my waist measurement puts me at risk. I've put on about 15kg over the last decade, mostly around the middle. Nobody has explained what this means for my heart specifically, which is what worries me — my weight I understand, but the cardiovascular part I don't. I haven't had a chance to get my old records together yet.",
      chartText: `PREVENTATIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD (INCOMPLETE)
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
    condition: 'Statin intolerance — alternatives',
    plan: 'Navigation',
    status: 'sent',
    waitingLabel: 'Answered 3d ago',
    summary: 'Myalgia on two statins. Wants a plain-language read on what else exists.',
    intake: {
      patientMessage:
        "I've tried two different statins and both gave me significant muscle aching — bad enough that I stopped exercising, which feels counterproductive. My doctor's suggestion was to 'try again in a few months.' I'd rather understand what the alternatives are. I'm not anti-medication, I just can't function on these two. Is there anything else, or am I stuck?",
      chartText: `PREVENTATIVE CARDIOLOGY INTAKE — SYNTHETIC RECORD
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
  None currently. No ezetimibe trial. No bempedoic acid. No PCSK9 inhibitor.`,
    },
  },
]

/** The synthetic identity attached to whatever case the reviewer submits. */
export const LIVE_PATIENT = {
  id: 'pt-2302',
  name: 'New case (this session)',
  age: null,
  sex: null,
  condition: 'Submitted this session',
  plan: 'Second Opinion',
}

export const REVIEWING_PHYSICIAN = {
  name: 'Dr. Imani Reyes',
  credential: 'MD, Preventative Cardiology',
  npiLabel: 'NPI ····4417',
}

export function findSampleCase(caseId) {
  return MOCK_PANEL.find((p) => p.id === caseId) ?? null
}
