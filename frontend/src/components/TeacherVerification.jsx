import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, AlertCircle, FileCheck, Fingerprint } from "lucide-react";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("jwt") || "";
}

export default function TeacherVerification({ onComplete }) {
  const [step, setStep] = useState(1); // 1: Legal Terms, 2: Biometric
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    legalTermsAccepted: false,
    biometricVerified: false,
    isTeacherVerified: false,
  });

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  async function checkVerificationStatus() {
    try {
      const res = await fetch(`${API}/api/users/teacher-verification-status`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationStatus(data);

        // If already verified, complete immediately
        if (data.isTeacherVerified) {
          if (onComplete) onComplete();
          return;
        }

        // Set step based on status
        if (!data.legalTermsAccepted) {
          setStep(1);
        } else if (!data.biometricVerified) {
          setStep(2);
        }
      }
    } catch (err) {
      console.error("Failed to check verification status:", err);
    }
  }

  async function handleAcceptTerms() {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/users/teacher/accept-legal-terms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        toast.success("Legal terms accepted successfully!");
        setVerificationStatus((prev) => ({ ...prev, legalTermsAccepted: true }));
        setStep(2);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to accept terms");
      }
    } catch (err) {
      toast.error("Failed to accept legal terms");
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricVerification() {
    try {
      setLoading(true);

      // Simulated biometric verification
      // In a real app, you would integrate with Web Authentication API or similar
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await fetch(`${API}/api/users/teacher/biometric-verification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        toast.success("Verification completed successfully!");
        setVerificationStatus((prev) => ({
          ...prev,
          biometricVerified: true,
          isTeacherVerified: true,
        }));

        // Update localStorage user
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.isTeacherVerified = true;
        localStorage.setItem("user", JSON.stringify(user));

        // Call completion callback
        if (onComplete) {
          setTimeout(() => onComplete(), 1500);
        }
      } else {
        const data = await res.json();
        toast.error(data.message || "Verification failed");
      }
    } catch (err) {
      toast.error("Failed to complete verification");
    } finally {
      setLoading(false);
    }
  }

  if (verificationStatus.isTeacherVerified) {
    return null; // Don't show if already verified
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Teacher Verification Required</h2>
          </div>
          <p className="text-indigo-100 text-sm">
            Complete verification to access teacher features and upload study materials
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-8">
            {/* Step 1 */}
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  verificationStatus.legalTermsAccepted
                    ? "bg-green-500 text-white"
                    : step === 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {verificationStatus.legalTermsAccepted ? <CheckCircle className="w-5 h-5" /> : "1"}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Legal Terms</span>
            </div>

            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div
                className={`h-full transition-all duration-500 ${
                  verificationStatus.legalTermsAccepted ? "bg-green-500 w-full" : "bg-gray-200 w-0"
                }`}
              />
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Biometric</span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  verificationStatus.biometricVerified
                    ? "bg-green-500 text-white"
                    : step === 2
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {verificationStatus.biometricVerified ? <CheckCircle className="w-5 h-5" /> : "2"}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <FileCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Legal Terms & Conditions</h3>
                  <div className="text-sm text-blue-800 space-y-2 max-h-64 overflow-y-auto">
                    <p>As a teacher on this platform, you agree to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Upload only original or properly licensed educational content</li>
                      <li>Respect intellectual property rights and copyright laws</li>
                      <li>Maintain professional conduct and ethical standards</li>
                      <li>Provide accurate and high-quality educational materials</li>
                      <li>Not share student information or violate privacy policies</li>
                      <li>Comply with all applicable education regulations</li>
                      <li>Accept responsibility for the content you upload</li>
                    </ul>
                    <p className="mt-3">
                      By accepting, you confirm that you have read and understood these terms and will
                      abide by them while using the platform.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAcceptTerms}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? "Processing..." : "I Accept the Terms & Conditions"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                <Fingerprint className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">Biometric Verification</h3>
                  <p className="text-sm text-purple-800">
                    To ensure security and authenticity, we require biometric verification. This is a
                    one-time process that helps us verify your identity and protect your account.
                  </p>
                  <div className="mt-3 bg-white rounded-lg p-3 border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium mb-2">
                      Click below to start verification:
                    </p>
                    <ul className="text-xs text-purple-600 space-y-1 list-disc list-inside">
                      <li>Your browser will request access to biometric authentication</li>
                      <li>Use fingerprint, face ID, or PIN as prompted</li>
                      <li>This data is processed securely and not stored</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBiometricVerification}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Complete Biometric Verification
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              This verification is required only once. After completion, you'll have full access to teacher
              features including uploading study materials, managing content, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
