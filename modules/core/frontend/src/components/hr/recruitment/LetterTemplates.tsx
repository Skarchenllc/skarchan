"use client";

import { FileText, Download, Eye, X } from "lucide-react";

export interface LetterData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  companyName?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewStage?: string;
  salaryOffered?: number;
  startDate?: string;
  expiryDate?: string;
}

export const generateInterviewLetter = (data: LetterData): string => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
${data.companyName || "Company Name"}
Human Resources Department
[Company Address]
[City, State ZIP Code]

${today}

${data.applicantName}
${data.applicantEmail}

Dear ${data.applicantName},

Subject: Invitation for Interview - ${data.jobTitle}

We are pleased to inform you that your application for the position of ${data.jobTitle} has been reviewed and we would like to invite you for an interview.

Interview Details:
• Date: ${data.interviewDate || "[Date]"}
• Time: ${data.interviewTime || "[Time]"}
• Location: ${data.interviewLocation || "[Location/Virtual Link]"}
• Interview Stage: ${data.interviewStage || "Interview"}

The interview will be approximately [duration] and will be conducted by [interviewer name/panel].

Please confirm your attendance by replying to this email at your earliest convenience. If the scheduled time is not convenient for you, please let us know so we can arrange an alternative time.

What to Bring:
• A copy of your resume
• Valid identification
• Any relevant certifications or portfolio work

If you have any questions or require any accommodations, please do not hesitate to contact us.

We look forward to meeting you and discussing this opportunity further.

Best regards,

[HR Manager Name]
Human Resources Department
${data.companyName || "Company Name"}
[Contact Information]
`.trim();
};

export const generateRegretLetter = (data: LetterData): string => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
${data.companyName || "Company Name"}
Human Resources Department
[Company Address]
[City, State ZIP Code]

${today}

${data.applicantName}
${data.applicantEmail}

Dear ${data.applicantName},

Subject: Application for ${data.jobTitle}

Thank you for your interest in the ${data.jobTitle} position at ${data.companyName || "our company"} and for taking the time to apply and interview with us.

After careful consideration of all candidates, we regret to inform you that we have decided to move forward with another candidate whose qualifications more closely match our current needs.

This was a difficult decision as we received applications from many qualified candidates. We were impressed by your background and experience, and we encourage you to apply for future openings that match your skills and career goals.

We will keep your resume on file for [X months] and will reach out if a suitable opportunity arises.

We wish you every success in your job search and future professional endeavors.

Thank you again for your interest in ${data.companyName || "our company"}.

Sincerely,

[HR Manager Name]
Human Resources Department
${data.companyName || "Company Name"}
[Contact Information]
`.trim();
};

export const generateOfferLetter = (data: LetterData): string => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
${data.companyName || "Company Name"}
Human Resources Department
[Company Address]
[City, State ZIP Code]

${today}

${data.applicantName}
${data.applicantEmail}

Dear ${data.applicantName},

Subject: Offer of Employment - ${data.jobTitle}

We are delighted to offer you the position of ${data.jobTitle} at ${data.companyName || "our company"}. We were impressed by your qualifications and believe you will make a valuable contribution to our team.

Position Details:
• Job Title: ${data.jobTitle}
• Start Date: ${data.startDate || "[Start Date]"}
• Annual Salary: $${data.salaryOffered?.toLocaleString() || "[Salary]"}
• Employment Type: [Full-time/Part-time]
• Reports To: [Manager Name/Title]

Compensation & Benefits:
• Annual Salary: $${data.salaryOffered?.toLocaleString() || "[Salary]"}, paid [bi-weekly/monthly]
• Health Insurance (Medical, Dental, Vision)
• 401(k) Retirement Plan with company match
• Paid Time Off (PTO)
• [Additional benefits]

Terms & Conditions:
This offer is contingent upon:
• Successful completion of background check
• Verification of employment eligibility
• [Any other conditions]

Please indicate your acceptance of this offer by signing and returning this letter by ${data.expiryDate || "[Expiry Date]"}.

We are excited about the possibility of you joining our team and look forward to your positive response.

If you have any questions, please don't hesitate to contact me.

Congratulations and welcome to ${data.companyName || "our company"}!

Sincerely,

[HR Manager Name]
[Title]
${data.companyName || "Company Name"}
[Contact Information]


ACCEPTANCE:

I, ${data.applicantName}, accept the above offer of employment.

Signature: _____________________     Date: _____________________
`.trim();
};

interface LetterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onDownload?: () => void;
}

export function LetterPreviewModal({ isOpen, onClose, title, content, onDownload }: LetterPreviewModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (onDownload) onDownload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 leading-relaxed">
              {content}
            </pre>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            You can edit this letter template before sending it to the candidate
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
