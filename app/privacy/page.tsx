"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Last updated: March 23, 2025
          </p>

          <div className="prose prose-slate max-w-none">
            <p>
              This Privacy Policy describes how Holistic Health Tracker ("we",
              "us", or "our") collects, uses, and discloses your information
              when you use our service. By using the service, you agree to the
              collection and use of information in accordance with this policy.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Information We Collect
            </h2>
            <p>
              We collect several different types of information for various
              purposes to provide and improve our service to you:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Account Information:</strong> When you register for an
                account, we collect your email address and a password.
              </li>
              <li>
                <strong>Health Data:</strong> We collect health-related
                information that you voluntarily provide, including conditions,
                treatments, medications, and effectiveness ratings.
              </li>
              <li>
                <strong>Usage Data:</strong> We collect information on how the
                service is accessed and used, including your device's IP
                address, browser type, pages visited, and the time and date of
                your visit.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              How We Use Your Information
            </h2>
            <p>We use the collected information for various purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support</li>
              <li>
                To gather analysis or valuable information so that we can
                improve our service
              </li>
              <li>To detect, prevent and address technical issues</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Data Storage and Security
            </h2>
            <p>
              We use Firebase, a platform developed by Google, for storing and
              processing your data. Your data is stored securely in Firebase's
              databases and authentication systems.
            </p>
            <p className="mt-2">
              We implement reasonable precautions and follow industry best
              practices to protect your personal information. However, no method
              of transmission over the internet or electronic storage is 100%
              secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Third-Party Services
            </h2>
            <p>
              Our service may contain links to other sites that are not operated
              by us. If you click on a third-party link, you will be directed to
              that third party's site. We strongly advise you to review the
              Privacy Policy of every site you visit.
            </p>
            <p className="mt-2">
              We have no control over and assume no responsibility for the
              content, privacy policies, or practices of any third-party sites
              or services.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Your Data Rights
            </h2>
            <p>You have the following data protection rights:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                The right to access, update, or delete the information we have
                on you
              </li>
              <li>
                The right of rectification - the right to have your information
                corrected if it is inaccurate or incomplete
              </li>
              <li>
                The right to object to our processing of your personal data
              </li>
              <li>
                The right to request that we restrict the processing of your
                personal information
              </li>
              <li>
                The right to data portability - the right to receive a copy of
                your information in a structured, machine-readable format
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Children's Privacy
            </h2>
            <p>
              Our service does not address anyone under the age of 18. We do not
              knowingly collect personally identifiable information from anyone
              under the age of 18. If you are a parent or guardian and you are
              aware that your child has provided us with personal data, please
              contact us.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date.
            </p>
            <p className="mt-2">
              You are advised to review this Privacy Policy periodically for any
              changes. Changes to this Privacy Policy are effective when they
              are posted on this page.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>By email: mthteo@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 border-t py-6 px-6">
        <div className="max-w-5xl mx-auto text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} Holistic Health Tracker. All rights
            reserved.
          </p>
          <div className="mt-2">
            <Link href="/" className="text-primary hover:underline mx-3">
              Home
            </Link>
            <Link href="/privacy" className="text-primary hover:underline mx-3">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-primary hover:underline mx-3">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
