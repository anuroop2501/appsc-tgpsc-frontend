import LegalLayout from '../components/LegalLayout'
import { FileText, AlertTriangle, CheckCircle, Scale, ShieldAlert, Cpu } from 'lucide-react'

export default function TermsConditionsPage() {
  return (
    <LegalLayout
      title="Terms and Conditions"
      subtitle="Terms of Service, user obligations, intellectual property rights, and AI platform usage rules."
      lastUpdated="August 21, 2026"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Highlight Alert Box */}
        <div
          style={{
            padding: '18px 22px',
            borderRadius: 12,
            background: 'var(--gold-dim)',
            border: '1px solid var(--gold-border)',
            color: 'var(--text-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, color: 'var(--gold-hi)', fontWeight: 650, fontSize: 15 }}>
            <AlertTriangle size={18} />
            <span>Important Notice &amp; Independent Entity Disclaimer</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <strong>APPSC AI</strong> is an independent educational platform operated to assist aspirants preparing for civil services exams. We are <strong>NOT affiliated with, authorized by, endorsed by, or in any way connected to</strong> the Andhra Pradesh Public Service Commission (APPSC), Telangana State Public Service Commission (TGPSC), or any Union or State Government Department.
          </p>
        </div>

        {/* Section 1 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            1. Acceptance of Terms
          </h2>
          <p>
            By registering an account, accessing, browsing, or utilizing any feature of <strong>APPSC AI</strong> ("Platform", "we", "us", or "our"), you ("User", "Candidate", or "Subscriber") agree to be bound by these Terms and Conditions ("Terms"), our Privacy Policy, and our Refund &amp; Cancellation Policy.
          </p>
          <p>
            If you do not agree to these Terms in their entirety, you must immediately discontinue use of the platform.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            2. Eligibility &amp; User Accounts
          </h2>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>
              <strong>Age &amp; Competence:</strong> You must be at least 18 years of age or possess legal parental/guardian consent under applicable Indian laws to register and execute financial transactions.
            </li>
            <li>
              <strong>Account Single-User License:</strong> Each user account is strictly personal and non-transferable. You agree not to share your login credentials, passkeys, or account access with any other person, coaching institute, or study group.
            </li>
            <li>
              <strong>Account Security:</strong> You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            3. AI Credits, Tokens &amp; Usage Quotas
          </h2>
          <p>
            The platform utilizes an AI Credit/Token metering architecture to manage computational server workloads across study modules:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, margin: '14px 0' }}>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--indigo)', marginBottom: 4, fontSize: 13.5 }}>MCQ Prelims Module</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Consumes <strong>10 Credits</strong> per 10-Question customized practice test generated.</div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--emerald)', marginBottom: 4, fontSize: 13.5 }}>Structured Study Notes</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Consumes <strong>10 Credits</strong> per detailed topic syllabus synthesis.</div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--gold-hi)', marginBottom: 4, fontSize: 13.5 }}>Mains Answer Evaluator</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Consumes <strong>20 Credits</strong> per descriptive evaluation &amp; rubric scoring.</div>
            </div>
          </div>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>
              <strong>Nature of Credits:</strong> Credits represent a limited, revocable, non-exclusive license to access computational AI inference for preparation purposes. Credits hold <em>no cash or monetary value</em> and cannot be redeemed for fiat currency.
            </li>
            <li>
              <strong>Validity &amp; Expiry:</strong> Credits provisioned with monthly or multi-month passes remain valid for the duration of the purchased subscription cycle.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            4. Payments, Subscriptions &amp; Strict Non-Refundable Policy
          </h2>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 10,
              background: 'var(--red-dim)',
              border: '1px solid rgba(239,68,68,0.35)',
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 6, fontSize: 14 }}>
              STRICT NON-REFUNDABLE PURCHASE TERM
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-1)', lineHeight: 1.6 }}>
              All purchases of AI credits, top-up booster packs, and monthly subscription passes are <strong>final, non-cancellable, non-exchangeable, and strictly non-refundable under any circumstances</strong> once the transaction is completed and credits are provisioned to the user account. For complete details, please refer to our <a href="/refund-policy" style={{ color: 'var(--indigo)', fontWeight: 600, textDecoration: 'underline' }}>Refund &amp; Cancellation Policy</a>.
            </p>
          </div>
          <p>
            All prices on the platform are listed in Indian Rupees (INR). Payments must be fulfilled through authorized gateways (PhonePe / Razorpay). You warrant that you are authorized to use the chosen payment method.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            5. Nature of AI Content &amp; Evaluation Disclaimer
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p>
              APPSC AI harnesses cutting-edge Artificial Intelligence to assist exam preparation. You acknowledge and accept the following pedagogical characteristics:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                <strong>Simulated Pedagogical Feedback:</strong> Mains answer evaluations, scores, and rubric benchmarks are generated algorithmically to simulate Bloom's taxonomy analytical standards. They do not constitute official commission evaluation sheets.
              </li>
              <li>
                <strong>No Examination Guarantee:</strong> While our questions and rubrics are aligned rigorously with the APPSC Group 1 &amp; Group 2 syllabus, we make <strong>no guarantee or warranty</strong> that identical questions will appear in actual official examinations or that use of the platform guarantees selection, ranking, or qualifying marks.
              </li>
              <li>
                <strong>Candidate Diligence:</strong> Candidates are encouraged to cross-reference AI-generated notes and factual data with standard government gazettes, statutory acts, and standard university textbooks.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            6. Intellectual Property &amp; User Conduct
          </h2>
          <p>
            All software code, user interface designs, logos, question bank synthesis algorithms, rubric evaluators, and system compilations are the proprietary intellectual property of APPSC AI.
          </p>
          <p><strong>Prohibited Actions:</strong> You agree NOT to:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Scrape, spider, crawl, or harvest questions, answer keys, or notes using automated tools or bots.</li>
            <li>Decompile, reverse-engineer, disassemble, or derive source code from any part of the platform.</li>
            <li>Resell, redistribute, rent, sub-license, or commercially exploit platform outputs or accounts.</li>
            <li>Bypass credit metering middleware, rate limiters, or authentication guards.</li>
            <li>Submit abusive, defamatory, obscene, or unlawful text into evaluation or prompt fields.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            7. Account Termination &amp; Suspension
          </h2>
          <p>
            We reserve the right to suspend or terminate your account without notice or liability if you violate these Terms, engage in payment fraud, attempt malicious attacks against the platform, or share account credentials. In such events, all accumulated credits will be forfeited without any monetary refund.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            8. Limitation of Liability &amp; Warranty Disclaimer
          </h2>
          <p>
            THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE INDIAN LAW:
          </p>
          <ul style={{ paddingLeft: 20, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>
              APPSC AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, EXAM ATTEMPTS, OR PREPARATION TIME.
            </li>
            <li>
              IN NO EVENT SHALL OUR TOTAL AGGREGATE LIABILITY EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO APPSC AI IN THE ONE (1) MONTH PRECEDING THE CLAIM.
            </li>
          </ul>
        </section>

        {/* Section 9 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            9. Governing Law &amp; Dispute Resolution
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal action, suit, or proceeding arising out of or relating to these Terms or platform usage shall be subject to the exclusive jurisdiction of the competent courts situated in <strong>Andhra Pradesh / Hyderabad, India</strong>.
          </p>
        </section>

        {/* Section 10 */}
        <section style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 8px' }}>
            10. Contact &amp; Inquiries
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)' }}>
            For inquiries regarding these Terms and Conditions, reach out to our legal compliance desk at <a href="mailto:support@appscai.in" style={{ color: 'var(--indigo)', textDecoration: 'none' }}>support@appscai.in</a>.
          </p>
        </section>

      </div>
    </LegalLayout>
  )
}
