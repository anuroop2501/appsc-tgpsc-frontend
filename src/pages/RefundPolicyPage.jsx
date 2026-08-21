import LegalLayout from '../components/LegalLayout'
import { RotateCcw, AlertOctagon, CheckCircle2, HelpCircle, XCircle, CreditCard, RefreshCw } from 'lucide-react'

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle="Comprehensive policy regarding digital AI credits, tokens, subscriptions, and transaction reconciliation."
      lastUpdated="August 21, 2026"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Prominent Hero Non-Refundable Banner ── */}
        <div
          style={{
            padding: '24px 26px',
            borderRadius: 14,
            background: 'var(--red-dim)',
            border: '2px solid rgba(239, 68, 68, 0.45)',
            color: 'var(--text-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: 'var(--red)', fontWeight: 700, fontSize: 17 }}>
            <AlertOctagon size={22} />
            <span>STRICT NO-REFUND POLICY ON PURCHASED CREDITS &amp; TOKENS</span>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 14.5, color: 'var(--text-1)', lineHeight: 1.65, fontWeight: 500 }}>
            Once a user purchases AI credits, booster tokens, or subscription passes on APPSC AI, the transaction is final and <strong>will NOT be refunded under any circumstances</strong>.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
            Because AI credits provide immediate access to digital compute resources, proprietary LLM generation pipelines, and syllabus question synthesis upon allocation, purchases are strictly non-refundable, non-exchangeable, and non-convertible into cash.
          </p>
        </div>

        {/* Section 1 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            1. Digital Goods &amp; Immediate Provisioning Rationale
          </h2>
          <p>
            APPSC AI delivers digital educational technology services powered by high-performance cloud infrastructure and state-of-the-art AI inference APIs. When you purchase credits or a subscription pass:
          </p>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>
              <strong>Instant Digital Delivery:</strong> Your account balance is credited instantaneously upon payment gateway authorization.
            </li>
            <li>
              <strong>Irreversible Compute Costs:</strong> Incurred costs for API server capacity, vector database indexes, and dedicated Large Language Model inference are allocated dynamically for your account.
            </li>
            <li>
              <strong>Digital Services Exemption:</strong> In accordance with Indian e-commerce norms and Consumer Protection regulations governing immediate digital consumable access, digital goods and AI tokens are exempt from post-purchase return or refund windows.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            2. Purchase Rules Summary
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 14 }}>
            <div style={{ padding: '18px 20px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontWeight: 650, fontSize: 15, marginBottom: 8 }}>
                <XCircle size={17} />
                <span>Non-Refundable Scenarios</span>
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Change of mind or study plan after purchasing credits.</li>
                <li>Selection of wrong subscription plan or target exam.</li>
                <li>Unused or partially used credits remaining on the account.</li>
                <li>Account inactivity, exam postponement, or personal scheduling conflicts.</li>
                <li>Dissatisfaction with AI-simulated marks or practice question difficulty.</li>
                <li>Suspension of account due to violations of Terms &amp; Conditions.</li>
              </ul>
            </div>

            <div style={{ padding: '18px 20px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--emerald)', fontWeight: 650, fontSize: 15, marginBottom: 8 }}>
                <CheckCircle2 size={17} />
                <span>What We Guarantee</span>
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>100% accurate credit allocation matching your selected pack.</li>
                <li>Instant token top-up upon successful gateway payment.</li>
                <li>Auto-refund / bank reversal for dropped or incomplete payment sessions.</li>
                <li>Full technical support for payment reconciliation and credit disputes.</li>
                <li>256-bit SSL encrypted secure checkout via PhonePe &amp; Razorpay.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            3. No Cash Value &amp; Non-Transferability
          </h2>
          <ul style={{ paddingLeft: 20, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>
              <strong>No Monetary Encashment:</strong> AI credits, tokens, and subscription tiers have zero fiat cash value outside the APPSC AI platform and cannot be converted into, exchanged for, or redeemed as Indian Rupees (INR) or any currency.
            </li>
            <li>
              <strong>Non-Transferable:</strong> Credits cannot be transferred, sold, gifted, or assigned to any other user, candidate profile, email address, or third party.
            </li>
            <li>
              <strong>No Prorated Payouts:</strong> Terminating or deleting your account prior to consuming your credits will not entitle you to any prorated payout.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            4. Handling Failed Transactions &amp; Gateway Drops
          </h2>
          <p>
            In rare instances, network interruptions between your bank / UPI app (GPay, PhonePe, Paytm) and the payment gateway may cause a payment to be debited while the platform has not yet received confirmation:
          </p>
          <div style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)', margin: '14px 0' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} style={{ color: 'var(--indigo)' }} />
              Resolution Procedure for Bank Debits without Credit Allocation:
            </div>
            <ol style={{ paddingLeft: 20, margin: 0, fontSize: 13.5, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                <strong>Automatic Bank Reversal:</strong> If the payment aggregator fails to capture the payment, the transaction is marked as 'Dropped'. Your bank or UPI provider will automatically roll back and refund the full amount to your source bank account within <strong>5 to 7 business days</strong> as per Reserve Bank of India (RBI) mandates.
              </li>
              <li>
                <strong>Manual Credit Reconciliation:</strong> If your bank account was debited and you prefer receiving your credits immediately instead of a bank reversal, email your <strong>UTR Reference Number / Payment ID</strong> and screenshot to <a href="mailto:support@appscai.in" style={{ color: 'var(--indigo)', fontWeight: 600 }}>support@appscai.in</a>. Our billing team will verify with the gateway and manually provision your credits within <strong>24 hours</strong>.
              </li>
            </ol>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            5. Subscription Cancellation
          </h2>
          <p>
            Users who have active monthly or multi-month subscription passes may choose to not renew for subsequent billing cycles.
          </p>
          <ul style={{ paddingLeft: 20, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Canceling future renewals ensures no subsequent charges are made.</li>
            <li>The active pass and its associated credits remain fully functional until the end of the paid validity period.</li>
            <li>No refunds, full or partial, are issued for the remaining days of an active cycle.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 12px' }}>
            6. Prohibition of Fraudulent Chargebacks
          </h2>
          <p>
            We take fraud and unwarranted chargeback claims seriously. Initiating an unjustified chargeback or payment dispute with your bank for legitimately provisioned credits constitutes a material breach of our Terms.
          </p>
          <p>
            In the event of a fraudulent chargeback, APPSC AI reserves the right to immediately terminate the offending account, blacklist the associated email and mobile identifiers, and pursue recovery through available legal remedies.
          </p>
        </section>

        {/* Section 7 */}
        <section style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={18} style={{ color: 'var(--indigo)' }} />
            7. Billing Support &amp; Contact Desk
          </h2>
          <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--text-2)' }}>
            If you have questions about a payment, require a tax invoice, or need assistance reconciling a transaction reference, please contact our dedicated billing desk:
          </p>
          <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Billing Helpdesk:</strong> APPSC AI Payment Support Team</div>
            <div><strong>Email:</strong> <a href="mailto:support@appscai.in" style={{ color: 'var(--indigo)', textDecoration: 'none' }}>support@appscai.in</a></div>
            <div><strong>Subject Line:</strong> <code>[Payment Query] &lt;Your Registered Email&gt; - &lt;Order/UTR ID&gt;</code></div>
            <div><strong>Turnaround Time:</strong> Response and verification within 24 business hours</div>
          </div>
        </section>

      </div>
    </LegalLayout>
  )
}
