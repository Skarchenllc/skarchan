"use client";

import { useState } from "react";
import {
  Building2,
  CreditCard,
  Shield,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface BankingInformationTabProps {
  employee: any;
}

export default function BankingInformationTab({ employee }: BankingInformationTabProps) {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showRoutingNumber, setShowRoutingNumber] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Mock banking data - In production, fetch from API
  const bankingInfo = {
    bank_name: employee?.bank_name || "Chase Bank",
    account_holder_name: `${employee?.first_name} ${employee?.last_name}`,
    account_number: employee?.bank_account_number || "****6789",
    routing_number: employee?.bank_routing_number || "****4321",
    account_type: employee?.bank_account_type || "Checking",
    swift_code: "CHASUS33",
    branch_name: "New York Main Branch",
    branch_address: "270 Park Avenue, New York, NY 10017",
    currency: "USD",
    is_verified: true,
    verified_date: "2026-01-15",
  };

  const maskAccountNumber = (accountNum: string) => {
    if (!accountNum) return "Not provided";
    if (showAccountNumber) return accountNum;
    return `****${accountNum.slice(-4)}`;
  };

  const maskRoutingNumber = (routingNum: string) => {
    if (!routingNum) return "Not provided";
    if (showRoutingNumber) return routingNum;
    return `****${routingNum.slice(-4)}`;
  };

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getAccountTypeIcon = () => {
    switch (bankingInfo.account_type?.toLowerCase()) {
      case "checking":
        return "💳";
      case "savings":
        return "💰";
      default:
        return "🏦";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banking Information</h2>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Edit className="w-4 h-4" />
          <span className="text-sm font-medium">Edit Details</span>
        </button>
      </div>

      {/* Verification Status Banner */}
      {bankingInfo.is_verified ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 text-sm">Verified Account</h4>
              <p className="text-sm text-green-700 mt-1">
                Your bank account was verified on {new Date(bankingInfo.verified_date).toLocaleDateString()}.
                All salary payments will be deposited to this account.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 text-sm">Verification Pending</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please verify your bank account details with HR to enable direct deposits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Banking Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Account Details</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Bank Name
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {bankingInfo.bank_name}
                </span>
              </div>
            </div>

            {/* Account Holder */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Account Holder Name
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-900">
                  {bankingInfo.account_holder_name}
                </span>
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Account Number
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-mono font-semibold text-gray-900">
                    {maskAccountNumber(bankingInfo.account_number)}
                  </span>
                </div>
                <button
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title={showAccountNumber ? "Hide" : "Show"}
                >
                  {showAccountNumber ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleCopy("account", bankingInfo.account_number)}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Copy"
                >
                  {copiedField === "account" ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Routing Number */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Routing Number
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-mono font-semibold text-gray-900">
                    {maskRoutingNumber(bankingInfo.routing_number)}
                  </span>
                </div>
                <button
                  onClick={() => setShowRoutingNumber(!showRoutingNumber)}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title={showRoutingNumber ? "Hide" : "Show"}
                >
                  {showRoutingNumber ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleCopy("routing", bankingInfo.routing_number)}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Copy"
                >
                  {copiedField === "routing" ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Account Type
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xl">{getAccountTypeIcon()}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {bankingInfo.account_type}
                </span>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Currency
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-900">
                  {bankingInfo.currency}
                </span>
              </div>
            </div>

            {/* SWIFT Code */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                SWIFT Code
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {bankingInfo.swift_code}
                </span>
              </div>
            </div>

            {/* Branch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Branch Name
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-900">
                  {bankingInfo.branch_name}
                </span>
              </div>
            </div>

            {/* Branch Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Branch Address
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-900">
                  {bankingInfo.branch_address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 text-sm">Security Notice</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Your banking information is encrypted and stored securely</li>
              <li>• Only authorized HR personnel can view your full account details</li>
              <li>• Any changes require verification through our secure process</li>
              <li>• If you suspect unauthorized access, contact HR immediately</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Direct Deposit Information */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Direct Deposit Schedule</h3>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900">Pay Frequency</p>
                <p className="text-sm text-gray-600 mt-1">Bi-weekly (Every 2 weeks)</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900">Next Pay Date</p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900">Deposit Method</p>
                <p className="text-sm text-gray-600 mt-1">Direct Deposit (Electronic Transfer)</p>
              </div>
            </div>

            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900">Processing Time</p>
                <p className="text-sm text-gray-600 mt-1">Funds available on pay date by 9:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowEditModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Edit Banking Information</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 text-sm">Important Notice</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Changes to banking information require HR verification. Please contact HR to update your bank details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    To update your banking information, please:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 ml-4">
                    <li>1. Contact the HR department via email or phone</li>
                    <li>2. Provide a voided check or bank letter for verification</li>
                    <li>3. Fill out the Direct Deposit Authorization form</li>
                    <li>4. Wait for HR approval (typically 2-3 business days)</li>
                  </ul>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">HR Contact Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📧 Email: hr@company.com</p>
                      <p>📞 Phone: (555) 123-4567</p>
                      <p>🕐 Hours: Monday - Friday, 9:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.location.href = 'mailto:hr@company.com?subject=Banking Information Update Request';
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  Contact HR
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
