"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/Navigation";

interface JobPosting {
  id: string;
  job_title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_range_min: number;
  salary_range_max: number;
  job_summary?: string;
  required_skills?: string[];
}

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    linkedinUrl: "",
    portfolioUrl: "",
    currentCompany: "",
    currentPosition: "",
    yearsOfExperience: "",
    education: "",
    university: "",
    graduationYear: "",
    coverLetter: "",
    howDidYouHear: "",
    availableStartDate: "",
    expectedSalary: "",
    willingToRelocate: "no",
    legallyAuthorized: "yes",
    requireSponsorship: "no",
  });

  const [resume, setResume] = useState<File | null>(null);

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    try {
      // Mock job data - in real app, fetch from API
      const mockJob: JobPosting = {
        id: jobId,
        job_title: "Senior Software Engineer",
        department: "Engineering",
        location: "New York, NY",
        employment_type: "full_time",
        salary_range_min: 120000,
        salary_range_max: 160000,
        job_summary: "We are seeking an experienced Senior Software Engineer to join our growing engineering team.",
        required_skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
      };
      setJob(mockJob);
    } catch (err) {
      console.error("Failed to load job data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
      if (errors.resume) {
        setErrors(prev => ({ ...prev, resume: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.yearsOfExperience) newErrors.yearsOfExperience = "Years of experience is required";
    if (!formData.education) newErrors.education = "Education level is required";
    if (!resume) newErrors.resume = "Resume is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // In real app, submit to API
      // const formDataToSend = new FormData();
      // formDataToSend.append('resume', resume!);
      // Object.keys(formData).forEach(key => {
      //   formDataToSend.append(key, formData[key]);
      // });
      // await fetch(`/api/jobs/${jobId}/apply`, { method: 'POST', body: formDataToSend });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit application", err);
      alert("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The job posting you're looking for doesn't exist or has been closed.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying for the {job.job_title} position. We have received your application and will review it shortly.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will receive a confirmation email at <strong>{formData.email}</strong> with next steps.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/recruitment/apply/${jobId}`)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Apply for Another Position
            </button>
            <Link
              href="/recruitment"
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              View All Openings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <header className="bg-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.job_title}</h1>
              <p className="text-sm text-gray-600">{job.department} • {job.location}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="capitalize">{job.employment_type.replace("_", " ")}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>${job.salary_range_min.toLocaleString()} - ${job.salary_range_max.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Application Form */}
      <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for this Position</h2>
          <p className="text-gray-600 mb-8">Please fill out the form below. Fields marked with * are required.</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio/Website</label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleInputChange}
                    placeholder="https://yourportfolio.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Professional Experience */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Professional Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Company</label>
                  <input
                    type="text"
                    name="currentCompany"
                    value={formData.currentCompany}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Position</label>
                  <input
                    type="text"
                    name="currentPosition"
                    value={formData.currentPosition}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.yearsOfExperience ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.yearsOfExperience && <p className="text-red-500 text-xs mt-1">{errors.yearsOfExperience}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Start Date
                  </label>
                  <input
                    type="date"
                    name="availableStartDate"
                    value={formData.availableStartDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Education</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Highest Education Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.education ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select...</option>
                    <option value="High School">High School</option>
                    <option value="Associate">Associate Degree</option>
                    <option value="Bachelor">Bachelor's Degree</option>
                    <option value="Master">Master's Degree</option>
                    <option value="PhD">PhD</option>
                  </select>
                  {errors.education && <p className="text-red-500 text-xs mt-1">{errors.education}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">University/College</label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    min="1950"
                    max="2030"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Documents</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume/CV <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${errors.resume ? 'border-red-500' : 'border-gray-300'}`}>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">Click to upload</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (MAX. 5MB)</p>
                  {resume && (
                    <p className="text-sm text-green-600 mt-2 flex items-center justify-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>{resume.name}</span>
                    </p>
                  )}
                </div>
                {errors.resume && <p className="text-red-500 text-xs mt-1">{errors.resume}</p>}
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Cover Letter</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you interested in this position?
                </label>
                <textarea
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us why you're a great fit for this role..."
                />
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Salary (Annual)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="expectedSalary"
                      value={formData.expectedSalary}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How did you hear about this position?
                  </label>
                  <select
                    name="howDidYouHear"
                    value={formData.howDidYouHear}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Company Website">Company Website</option>
                    <option value="Referral">Employee Referral</option>
                    <option value="Job Board">Job Board</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are you willing to relocate?
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="willingToRelocate"
                        value="yes"
                        checked={formData.willingToRelocate === "yes"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="willingToRelocate"
                        value="no"
                        checked={formData.willingToRelocate === "no"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are you legally authorized to work in the United States?
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="legallyAuthorized"
                        value="yes"
                        checked={formData.legallyAuthorized === "yes"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="legallyAuthorized"
                        value="no"
                        checked={formData.legallyAuthorized === "no"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Will you now or in the future require sponsorship for employment visa status?
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="requireSponsorship"
                        value="yes"
                        checked={formData.requireSponsorship === "yes"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="requireSponsorship"
                        value="no"
                        checked={formData.requireSponsorship === "no"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                By submitting this application, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
