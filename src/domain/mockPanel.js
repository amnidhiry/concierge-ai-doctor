/**
 * Static panel entries for the physician dashboard.
 *
 * These are scenery: they give the dashboard the density of a real panel so the
 * one live case doesn't sit alone on an empty screen. Only the live case
 * (Steps 1–4) carries real model output. Every name and detail here is invented.
 *
 * Cases are drawn from preventative cardiology — risk stratification, lipid and
 * Lp(a) questions, calcium scores, family history — rather than acute cardiology.
 * The product is asynchronous, so anything acute belongs in an emergency
 * department, and the panel should reflect that.
 */

export const MOCK_PANEL = [
  {
    id: 'pt-2291',
    name: 'D. Okafor',
    age: 52,
    sex: 'F',
    condition: 'Elevated Lp(a) — risk stratification',
    plan: 'Second Opinion',
    status: 'sent',
    waitingLabel: 'Answered 2h ago',
    summary:
      'Lp(a) 187 nmol/L found incidentally. Asking what it changes given an otherwise clean lipid panel.',
  },
  {
    id: 'pt-2284',
    name: 'R. Villanueva',
    age: 61,
    sex: 'M',
    condition: 'CAC score 240 — statin decision',
    plan: 'Async AI Concierge',
    status: 'awaiting_review',
    waitingLabel: 'Waiting 41m',
    summary:
      'Calcium score came back at 240 (78th percentile). Reluctant to start a statin, wants the reasoning.',
  },
  {
    id: 'pt-2277',
    name: 'K. Bergström',
    age: 44,
    sex: 'F',
    condition: 'Premature family history — first workup',
    plan: 'Navigation',
    status: 'awaiting_review',
    waitingLabel: 'Waiting 3h',
    summary:
      'Father had an MI at 49. No personal risk factors. Asking which tests are actually worth doing.',
  },
  {
    id: 'pt-2265',
    name: 'A. Haddad',
    age: 67,
    sex: 'M',
    condition: 'Post-stent secondary prevention',
    plan: 'Async AI Concierge',
    status: 'sent',
    waitingLabel: 'Answered yesterday',
    summary:
      'Two years post-PCI. LDL 78 on moderate-intensity statin; asking whether to intensify.',
  },
  {
    id: 'pt-2258',
    name: 'J. Whitfield',
    age: 38,
    sex: 'F',
    condition: 'Hypertension in pregnancy — follow-up',
    plan: 'Second Opinion',
    status: 'intake',
    waitingLabel: 'Intake incomplete',
    summary: 'History of pre-eclampsia, wants long-term cardiovascular risk plan. Records not yet uploaded.',
  },
  {
    id: 'pt-2249',
    name: 'M. Petrov',
    age: 55,
    sex: 'M',
    condition: 'Statin intolerance — alternatives',
    plan: 'Navigation',
    status: 'sent',
    waitingLabel: 'Answered 3d ago',
    summary: 'Myalgia on two statins. Wants a plain-language read on what else exists.',
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
