"use client";

import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Last updated: March 23, 2025
        </p>

        <div className="prose prose-slate max-w-none">
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service")
            carefully before using the Holistic Health Tracker application
            operated by Holistic Health Tracker ("us", "we", or "our").
          </p>

          <p>
            Your access to and use of the Service is conditioned on your
            acceptance of and compliance with these Terms. These Terms apply to
            all visitors, users, and others who access or use the Service.
          </p>

          <p>
            By accessing or using the Service you agree to be bound by these
            Terms. If you disagree with any part of the terms, then you may not
            access the Service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Account Terms</h2>
          <p>
            When you create an account with us, you must provide accurate,
            complete, and current information at all times. Failure to do so
            constitutes a breach of the Terms, which may result in immediate
            termination of your account on our Service.
          </p>

          <p className="mt-2">
            You are responsible for safeguarding the password that you use to
            access the Service and for any activities or actions under your
            password.
          </p>

          <p className="mt-2">
            You agree not to disclose your password to any third party. You must
            notify us immediately upon becoming aware of any breach of security
            or unauthorized use of your account.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            User Content and Conduct
          </h2>
          <p>
            Our Service allows you to enter, store, and track health-related
            information. You are responsible for the accuracy of all data you
            input into the Service.
          </p>

          <p className="mt-2">You agree not to use the Service:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>In any way that violates any applicable law or regulation</li>
            <li>
              To transmit any material that is defamatory, offensive, or
              otherwise objectionable
            </li>
            <li>
              To impersonate or attempt to impersonate any person or entity
            </li>
            <li>
              To engage in any other conduct that restricts or inhibits anyone's
              use of the Service, or which may harm us or users of the Service
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            Service Availability and Changes
          </h2>
          <p>
            We reserve the right to withdraw or amend our Service, and any
            service or material we provide via the Service, in our sole
            discretion without notice. We will not be liable if for any reason
            all or any part of the Service is unavailable at any time or for any
            period.
          </p>

          <p className="mt-2">
            We may update the content on this Service from time to time, but its
            content is not necessarily complete or up-to-date. Any of the
            material on the Service may be out of date at any given time, and we
            are under no obligation to update such material.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            Health Information Disclaimer
          </h2>
          <p>
            The Service is not intended to provide medical advice, diagnosis, or
            treatment. All information provided by this Service is for
            informational and self-tracking purposes only.
          </p>

          <p className="mt-2">
            Always seek the advice of your physician or other qualified health
            provider with any questions you may have regarding a medical
            condition. Never disregard professional medical advice or delay in
            seeking it because of something you have read on this Service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            Intellectual Property
          </h2>
          <p>
            The Service and its original content, features, and functionality
            are and will remain the exclusive property of Holistic Health
            Tracker and its licensors. The Service is protected by copyright,
            trademark, and other laws of both the United States and foreign
            countries.
          </p>

          <p className="mt-2">
            Our trademarks and trade dress may not be used in connection with
            any product or service without the prior written consent of Holistic
            Health Tracker.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            Limitation of Liability
          </h2>
          <p>
            In no event shall Holistic Health Tracker, nor its directors,
            employees, partners, agents, suppliers, or affiliates, be liable for
            any indirect, incidental, special, consequential or punitive
            damages, including without limitation, loss of profits, data, use,
            goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              Your access to or use of or inability to access or use the Service
            </li>
            <li>Any conduct or content of any third party on the Service</li>
            <li>Any content obtained from the Service</li>
            <li>
              Unauthorized access, use, or alteration of your transmissions or
              content
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior
            notice or liability, for any reason whatsoever, including without
            limitation if you breach the Terms.
          </p>

          <p className="mt-2">
            Upon termination, your right to use the Service will immediately
            cease. If you wish to terminate your account, you may simply
            discontinue using the Service or request account deletion through
            the app settings.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the
            laws of the United States, without regard to its conflict of law
            provisions.
          </p>

          <p className="mt-2">
            Our failure to enforce any right or provision of these Terms will
            not be considered a waiver of those rights. If any provision of
            these Terms is held to be invalid or unenforceable by a court, the
            remaining provisions of these Terms will remain in effect.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. By continuing to access or use our Service
            after those revisions become effective, you agree to be bound by the
            revised terms. If you do not agree to the new terms, please stop
            using the Service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>By email: holistichealthtracker@gmail.com</li>
          </ul>
        </div>
      </div>

      <div className="text-center mb-8">
        <Link href="/" className="text-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
