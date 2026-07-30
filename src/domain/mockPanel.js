/**
 * Static panel entries for the physician dashboard.
 *
 * These are scenery: they give the dashboard the density of a real panel so the
 * one live case doesn't sit alone on an empty screen. Only the live case
 * (Steps 1–4) carries real model output. Every name and detail here is invented.
 */

export const MOCK_PANEL = [
  {
    id: 'pt-2291',
    name: 'D. Okafor',
    age: 58,
    sex: 'F',
    condition: 'Stage II breast cancer — adjuvant planning',
    plan: 'Second Opinion',
    status: 'sent',
    waitingLabel: 'Answered 2h ago',
    summary: 'Second opinion on adjuvant chemo vs endocrine-only after oncotype result.',
  },
  {
    id: 'pt-2284',
    name: 'R. Villanueva',
    age: 64,
    sex: 'M',
    condition: 'Prostate cancer — surveillance vs treatment',
    plan: 'Async AI Concierge',
    status: 'awaiting_review',
    waitingLabel: 'Waiting 41m',
    summary: 'Rising PSA on active surveillance; asking whether to move to treatment.',
  },
  {
    id: 'pt-2277',
    name: 'K. Bergström',
    age: 47,
    sex: 'F',
    condition: 'Thyroid nodule — indeterminate cytology',
    plan: 'Navigation',
    status: 'awaiting_review',
    waitingLabel: 'Waiting 3h',
    summary: 'Bethesda III result; wants help deciding between molecular testing and repeat FNA.',
  },
  {
    id: 'pt-2265',
    name: 'A. Haddad',
    age: 71,
    sex: 'M',
    condition: 'Colorectal cancer — post-op surveillance',
    plan: 'Async AI Concierge',
    status: 'sent',
    waitingLabel: 'Answered yesterday',
    summary: 'Question about CEA trend and surveillance imaging interval.',
  },
  {
    id: 'pt-2258',
    name: 'J. Whitfield',
    age: 39,
    sex: 'F',
    condition: 'Lymphoma — treatment sequencing',
    plan: 'Second Opinion',
    status: 'intake',
    waitingLabel: 'Intake incomplete',
    summary: 'Started intake, has not yet uploaded outside records.',
  },
  {
    id: 'pt-2249',
    name: 'M. Petrov',
    age: 55,
    sex: 'M',
    condition: 'Melanoma — sentinel node discussion',
    plan: 'Navigation',
    status: 'sent',
    waitingLabel: 'Answered 3d ago',
    summary: 'Wanted a plain-language read on the pathology report before surgical consult.',
  },
]

/** The synthetic identity attached to whatever case the reviewer pastes in. */
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
  credential: 'MD, Medical Oncology',
  npiLabel: 'NPI ····4417',
}
