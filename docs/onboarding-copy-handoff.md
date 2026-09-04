# Onboarding copy handoff

The final onboarding story is: **keep therapy with you between sessions**.

Plastic Brains helps someone capture what mattered in five minutes, revisit it at useful moments, and bring a clear thread back to their next session. The experience should feel like one continuous loop rather than a collection of notes and notifications.

The implementation source of truth is `src/features/onboarding/onboardingCopy.ts`. Timeline copy lives beside its scheduling logic in `src/features/onboarding/planTimeline.ts` so the words cannot promise moments the scheduler does not create.

## Message order

1. Continuity: keep therapy with you between sessions.
2. Ease: capture what mattered in five focused questions.
3. Personalisation: build the plan around the person's real session cadence and preferred times.
4. Payoff: choose a clear thread to bring back to the next session.
5. Trust: note contents are encrypted and stay on the iPhone.

## Screen-by-screen copy

| Screen         | Headline                                             | Supporting copy                                                                                                                 | Primary action               |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Welcome        | Keep therapy with you between sessions               | Capture what mattered in five minutes, revisit it at useful moments, and bring a clear thread back to your next session.        | Build my plan                |
| Goal           | What would help you get more from therapy?           | Choose the outcome that matters most to you.                                                                                     | Continue                     |
| Next session   | When is your next session?                           | We'll use it to time your first note and shape the reviews that follow.                                                         | Continue / I haven't booked it yet |
| Cadence        | How often are your sessions usually?                 | This helps us space reviews across the real gap between sessions. The chosen option then explains exactly which sessions will be added. | Choose reminder times        |
| Reminder times | Choose times that fit your routine                   | We'll choose the useful days between sessions. You choose when morning and evening reviews feel manageable.                     | See my plan                  |
| Plan           | Your plan starts after your `[weekday]` session      | Capture what mattered, revisit it through the gap, then choose what to bring back. Each review reminder links to its own research. | See the five-minute note     |
| Note preview   | Capture what mattered in five minutes                | Five focused questions turn a session into something you can revisit and bring back. “Why these five questions?” opens the supporting research here, after the questions are visible. | See plans                    |
| Subscription   | Personalised to the selected goal                    | Keep the plan you just built—capture, revisit and prepare—around every therapy session. The user's session, first note and selected review times are repeated here. | Start my `[duration]` free trial / continue with annual or monthly |
| Account        | Save your between-session plan / Continue with your account | Signed-out users are asked to create an account. Signed-in users are told their plan will be connected to their existing account. | Continue or account method   |
| Notifications  | Get your first note reminder `[weekday]` at `[time]` | Turn on notifications so your plan can reach you at the times you chose.                                                        | Turn on notifications        |
| Success        | Your between-session plan is ready                   | Save it now and your first note reminder will arrive `[weekday]` at `[time]`.                                                   | Save and see my plan         |

When cadence varies, the plan preview says: “Your first note is timed. Add your following session later to place reviews in the gap.” It must not imply that review dates exist before the next session is known.

For a booked session, the cadence screen says that weekly, fortnightly or monthly sessions will be added at the same time for the next six months and that individual dates can be edited. A variable cadence adds only the date entered. If the date was skipped, the screen explicitly says no sessions will be added yet.

When someone has not booked a session, the preview is explicitly labelled “Illustrative plan — these dates will not be saved”. For a variable cadence, that preview says it uses a one-week example. The example date never enters the stored session answer, notification flow or calendar; after subscribing, the user goes to Calendar to add the real booking.

The plan preview uses Sarah's testimonial to validate reviewing previous notes. The subscription screen uses Catherine's testimonial immediately before the plan choices, where feeling ready for therapy supports the purchase decision. Both are verbatim website testimonials and sit apart from the evidence statement, which says the reminder timings draw on memory research.

## Goal options and paywall follow-through

| Goal option                  | Subscription headline                |
| ---------------------------- | ------------------------------------ |
| Put therapy insights into practice throughout the week             | Put therapy insights into practice      |
| Be better prepared for my next session                             | Feel prepared for your next session     |
| Gain insight into areas I can improve across my therapy sessions   | See where you can improve over time     |

## Copy guardrails

- Describe the continuity loop before individual features.
- Use “note”, “review” and “session”; avoid internal terms such as reactivation or scheduler in the main flow.
- Do not claim that the app improves therapy outcomes. Research explains why the methods shaped the product, not what the product guarantees.
- Say that **note contents** are encrypted and device-only. Schedule, account and notification metadata are not described as device-only.
- Never invent a price, trial or eligibility. StoreKit supplies all commercial details.
- Keep the selected plan's full billing amount and renewal timing visible beside the pinned purchase action.
- Keep lock-screen notification titles and bodies discreet by default. They must not mention therapy, sessions, appointments or other wording that reveals health information.
- Keep the tester quote verbatim and label it as a tester quote, not clinical evidence.
- Use British English, sentence case and no exclamation marks.
