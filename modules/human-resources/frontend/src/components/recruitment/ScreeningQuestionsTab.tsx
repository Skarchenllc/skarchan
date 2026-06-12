"use client";

import { ClipboardList, CheckCircle, XCircle, AlertCircle, Eye, Plus, Edit } from "lucide-react";
import { useState } from "react";

interface ScreeningAnswer {
  id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  question_id: string;
  question_text: string;
  question_type: "text" | "yes_no" | "multiple_choice" | "rating" | "number";
  required: boolean;
  answer: string | number | boolean;
  answer_options?: string[];
  pass_criteria?: string | number | boolean;
  passed?: boolean;
  submitted_date: string;
}

interface ScreeningQuestion {
  id: string;
  question_text: string;
  question_type: "text" | "yes_no" | "multiple_choice" | "rating" | "number";
  required: boolean;
  options?: string[];
  pass_criteria?: string | number | boolean;
  order: number;
}

interface ScreeningQuestionsTabProps {
  questions: ScreeningQuestion[];
  answers: ScreeningAnswer[];
  onAddQuestion?: () => void;
  onEditQuestion?: (questionId: string) => void;
  onViewApplicantAnswers?: (applicantId: string) => void;
}

export function ScreeningQuestionsTab({
  questions,
  answers,
  onAddQuestion,
  onEditQuestion,
  onViewApplicantAnswers
}: ScreeningQuestionsTabProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  // Group answers by applicant
  const groupedAnswers = answers.reduce((acc, answer) => {
    if (!acc[answer.applicant_id]) {
      acc[answer.applicant_id] = {
        applicant_name: answer.applicant_name,
        applicant_email: answer.applicant_email,
        submitted_date: answer.submitted_date,
        answers: []
      };
    }
    acc[answer.applicant_id].answers.push(answer);
    return acc;
  }, {} as Record<string, { applicant_name: string; applicant_email: string; submitted_date: string; answers: ScreeningAnswer[] }>);

  // Calculate pass rate for each applicant
  const calculatePassRate = (applicantAnswers: ScreeningAnswer[]) => {
    const answersWithCriteria = applicantAnswers.filter(a => a.pass_criteria !== undefined && a.passed !== undefined);
    if (answersWithCriteria.length === 0) return null;
    const passedCount = answersWithCriteria.filter(a => a.passed).length;
    return Math.round((passedCount / answersWithCriteria.length) * 100);
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "yes_no": return "bg-blue-100 text-blue-800";
      case "multiple_choice": return "bg-purple-100 text-purple-800";
      case "rating": return "bg-yellow-100 text-yellow-800";
      case "number": return "bg-green-100 text-green-800";
      case "text": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatAnswer = (answer: ScreeningAnswer) => {
    if (answer.question_type === "yes_no") {
      return answer.answer ? "Yes" : "No";
    }
    if (answer.question_type === "rating") {
      return `${answer.answer} / 5`;
    }
    return answer.answer.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Screening Questions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Pre-screening questionnaire responses from applicants
          </p>
        </div>
        <button
          onClick={onAddQuestion}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-900">Configured Questions ({questions.length})</h3>
        </div>
        {questions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No screening questions configured</p>
          </div>
        ) : (
          <div className="divide-y">
            {questions
              .sort((a, b) => a.order - b.order)
              .map((question, index) => (
                <div key={question.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                          {index + 1}
                        </span>
                        <h4 className="font-medium text-gray-900">{question.question_text}</h4>
                        {question.required && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Required
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getQuestionTypeColor(question.question_type)}`}>
                          {question.question_type.replace("_", " ")}
                        </span>
                      </div>

                      {question.options && question.options.length > 0 && (
                        <div className="ml-9 text-sm text-gray-600">
                          <span className="font-medium">Options:</span> {question.options.join(", ")}
                        </div>
                      )}

                      {question.pass_criteria !== undefined && (
                        <div className="ml-9 text-sm text-green-700">
                          <span className="font-medium">Pass Criteria:</span> {question.pass_criteria.toString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {answers.filter(a => a.question_id === question.id).length} responses
                      </span>
                      <button
                        onClick={() => onEditQuestion?.(question.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Applicant Responses */}
      {Object.keys(groupedAnswers).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Applicant Responses</h3>

          {Object.entries(groupedAnswers).map(([applicantId, data]) => {
            const passRate = calculatePassRate(data.answers);
            const allRequiredAnswers = questions.every(q =>
              !q.required || data.answers.some(a => a.question_id === q.id)
            );

            return (
              <div key={applicantId} className="bg-white rounded-lg shadow">
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{data.applicant_name}</h4>
                      <p className="text-sm text-gray-600">{data.applicant_email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {passRate !== null && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Pass Rate</p>
                          <p className={`text-lg font-bold ${
                            passRate >= 80 ? "text-green-600" :
                            passRate >= 60 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {passRate}%
                          </p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(data.submitted_date).toLocaleDateString()}
                        </p>
                      </div>
                      {!allRequiredAnswers && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Incomplete
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                  {data.answers.map((answer) => (
                    <div key={answer.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-2">{answer.question_text}</p>
                          <div className="flex items-center space-x-3">
                            <p className="text-sm text-gray-700 font-medium">{formatAnswer(answer)}</p>
                            {answer.passed !== undefined && (
                              <div className="flex items-center space-x-1">
                                {answer.passed ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs text-green-600">Meets criteria</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-xs text-red-600">Does not meet criteria</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-gray-50 border-t">
                  <button
                    onClick={() => onViewApplicantAnswers?.(applicantId)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Application</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Cards */}
      {answers.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Responses</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {Object.keys(groupedAnswers).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Avg. Pass Rate</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {(() => {
                const passRates = Object.values(groupedAnswers)
                  .map(data => calculatePassRate(data.answers))
                  .filter(rate => rate !== null) as number[];
                if (passRates.length === 0) return "N/A";
                return Math.round(passRates.reduce((sum, rate) => sum + rate, 0) / passRates.length) + "%";
              })()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">All Passed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {Object.values(groupedAnswers).filter(data => {
                const rate = calculatePassRate(data.answers);
                return rate === 100;
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Questions</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{questions.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
