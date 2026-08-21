import LegalLayout from '../components/LegalLayout'
import { Shield, Lock, Eye, Server, UserCheck, Bell, HelpCircle } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How APPSC AI collects, uses, protects, and handles your personal and academic preparation data."
      lastUpdated="August 21, 2026"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Highlight Box */}
        <div
          style={{
            padding: '18px 22px',
            borderRadius: 12,
            background: 'var(--indigo-dim)',
            border: '1px solid var(--indigo-border)',
            color: 'var(--text-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, color: 'var(--indigo)', fontWeight: 650, fontSize: 15 }}>
            <Shield size={18} />
            <span>Our Commitment to Candidate Privacy</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
            APPSC AI ("we", "us", or "our") respects your privacy and is committed to protecting the personal and academic data of all civil service aspirants. We do not sell your personal information or submitted answers to third-party data brokers or advertisers. All AI model interactions adhere to zero-training enterprise data protocols.
          </p>
        </div>

        {/* Section 1 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            1. Scope &amp; Applicability
          </h2>
          <p>
            This Privacy Policy applies to all services, features, websites, web applications, and mobile interfaces operated under the <strong>APPSC AI</strong> platform (accessible via our web portal and associated subdomains).
          </p>
          <p>
            By creating an account, accessing our study modules, generating practice tests, uploading or entering descriptive answers for evaluation, or purchasing AI credits, you consent to the data practices described in this policy pursuant to the <em>Information Technology Act, 2000</em>, the <em>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</em>, and the <em>Digital Personal Data Protection Act (DPDPA), 2023</em> of India.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            2. Information We Collect
          </h2>
          <p>We collect only the minimum necessary information required to deliver high-quality, customized AI test preparation and account management:</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 14 }}>
            <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 6, fontSize: 14 }}>
                A. Account &amp; Identity Data
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Hashed Password (bcrypt encryption)</li>
                <li>Target Exam (e.g. APPSC Group 1, Group 2)</li>
                <li>Selected Language Preference (English/Telugu)</li>
              </ul>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 6, fontSize: 14 }}>
                B. Study &amp; Academic Data
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>MCQ Test generation requests and choices</li>
                <li>Mains answer scripts submitted for evaluation</li>
                <li>AI evaluations, marks, rubrics, and feedback</li>
                <li>Generated syllabus study notes &amp; plans</li>
                <li>Session study history and streak metrics</li>
              </ul>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 6, fontSize: 14 }}>
                C. Transaction &amp; Payment Data
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Payment gateway Order IDs &amp; Transaction IDs</li>
                <li>UPI Virtual Payment Address (VPA) / PhonePe ID (for verification)</li>
                <li>Purchased credit pack details and timestamps</li>
                <li><em>Note: We NEVER store debit/credit card numbers or UPI MPINs.</em></li>
              </ul>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 6, fontSize: 14 }}>
                D. Technical &amp; Diagnostic Data
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>IP address and approximate geographic region</li>
                <li>Browser type, OS version, and device type</li>
                <li>Application performance metrics and error logs</li>
                <li>Session authentication tokens (JWT)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            3. AI Processing &amp; Large Language Model (LLM) Safeguards
          </h2>
          <p>
            Our platform utilizes advanced AI models (such as Anthropic Claude and proprietary Retrieval-Augmented Generation / RAG pipelines) to synthesize practice questions, generate study summaries, and evaluate candidate answers against Bloom's taxonomy criteria:
          </p>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>
              <strong>Zero-Training Enterprise Commitment:</strong> Prompts, questions, and uploaded candidate answer scripts sent to our AI API providers are processed strictly for real-time inference and are <em>not</em> used by our LLM providers to train or improve their foundation models.
            </li>
            <li>
              <strong>Isolated RAG Knowledge Base:</strong> Official APPSC syllabus documents and curated study references are indexed securely in isolated vector databases to ensure accuracy and prevent hallucination.
            </li>
            <li>
              <strong>Automated Ephemeral Processing:</strong> Answer evaluations and notes are synthesized dynamically in memory and stored securely within your private account history.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            4. Payment Gateway &amp; Financial Security
          </h2>
          <p>
            All financial transactions on APPSC AI are processed through RBI-authorized, PCI-DSS Level 1 compliant payment aggregators (PhonePe Payment Gateway and Razorpay):
          </p>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>
              <strong>No Financial Credential Storage:</strong> APPSC AI does not collect, capture, or store sensitive payment credentials such as credit/debit card numbers, CVVs, expiry dates, net banking passwords, or UPI MPINs.
            </li>
            <li>
              <strong>Secure Checkouts:</strong> Transactions are routed through encrypted payment tunnels with cryptographic HMAC SHA-256 signature verification to prevent tampering or interception.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            5. How We Use Your Information
          </h2>
          <p>Your information is used strictly for legitimate educational, operational, and billing purposes, including:</p>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Generating customized MCQ practice sets tailored to your specific APPSC exam syllabus.</li>
            <li>Evaluating Mains answers with detailed scoring rubrics, strengths, weaknesses, and benchmark model answers.</li>
            <li>Maintaining your real-time AI credit balance, study streak counters, and session history.</li>
            <li>Securing your account and authenticating your login sessions via encrypted JWT tokens.</li>
            <li>Monitoring platform stability, diagnosing server errors, and preventing abuse or unauthorized scraping.</li>
            <li>Communicating crucial system alerts, service updates, or responding to support inquiries.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            6. Information Sharing &amp; Third-Party Disclosures
          </h2>
          <p>
            We do not sell, rent, lease, or monetize your personal data. We disclose information only under the following limited conditions:
          </p>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>
              <strong>Infrastructure &amp; Service Providers:</strong> Trusted cloud infrastructure vendors (e.g. database hosting, AI inference APIs, payment gateways, Sentry error monitoring) operating under strict non-disclosure and security agreements.
            </li>
            <li>
              <strong>Legal &amp; Regulatory Compliance:</strong> If mandated by law, court order, or government authority pursuant to valid legal processes in the Republic of India.
            </li>
            <li>
              <strong>Protection of Rights:</strong> To enforce our Terms &amp; Conditions, investigate fraudulent transactions, or safeguard the security of our users and platform.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            7. Data Security &amp; Retention
          </h2>
          <p>
            We implement industry-standard administrative, physical, and technical safeguards:
          </p>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Encryption in Transit:</strong> All HTTP traffic is protected by HTTPS with TLS 1.3 / 256-bit SSL encryption.</li>
            <li><strong>Password Protection:</strong> Passwords are cryptographically salted and hashed using bcrypt before database insertion.</li>
            <li><strong>Database Isolation:</strong> Production databases are secured behind private subnets with strict role-based access control.</li>
            <li><strong>Retention Period:</strong> We retain your practice session history and account profile for as long as your account remains active. You may request account deletion at any time.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            8. Your Rights Under Digital Personal Data Protection Act (DPDPA) 2023
          </h2>
          <p>As a candidate registered on APPSC AI, you possess the following statutory rights:</p>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Right to Access:</strong> You can view all your session history, submitted tests, and account details in your dashboard.</li>
            <li><strong>Right to Correction:</strong> You can update your profile name, exam selection, or password at any time.</li>
            <li><strong>Right to Erasure:</strong> You may request permanent deletion of your account and associated session records by contacting our support team.</li>
            <li><strong>Right of Grievance Redressal:</strong> You have the right to register concerns or complaints regarding your data privacy.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            9. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time to reflect technological, operational, or legal developments. When significant revisions occur, we will update the "Last Updated" date at the top of this document and notify active users via platform banners or email notices.
          </p>
        </section>

        {/* Section 10 */}
        <section style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={18} style={{ color: 'var(--indigo)' }} />
            10. Grievance Redressal &amp; Contact Details
          </h2>
          <p style={{ margin: '0 0 12px', fontSize: 13.5 }}>
            In accordance with the <em>Information Technology Act, 2000</em> and DPDPA Rules, the designated Grievance Officer for APPSC AI is:
          </p>
          <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Grievance Officer:</strong> Data Protection &amp; Legal Compliance Desk</div>
            <div><strong>Entity:</strong> APPSC AI Educational Technologies</div>
            <div><strong>Email:</strong> <a href="mailto:support@appscai.in" style={{ color: 'var(--indigo)', textDecoration: 'none' }}>support@appscai.in</a> / <a href="mailto:privacy@appscai.com" style={{ color: 'var(--indigo)', textDecoration: 'none' }}>privacy@appscai.com</a></div>
            <div><strong>Response Window:</strong> Within 48 hours on working business days</div>
          </div>
        </section>

      </div>
    </LegalLayout>
  )
}
