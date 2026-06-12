"use client";

import { TrendingDown, Users, FileText, Video, Award, CheckCircle, XCircle, ArrowRight, Eye } from "lucide-react";
import { useState } from "react";

interface PipelineCandidate {
  id: string;
  name: string;
  email: string;
  current_stage: string;
  applied_date: string;
  days_in_stage: number;
  rating?: number;
  avatar?: string;
}

interface PipelineStage {
  stage_name: string;
  stage_order: number;
  candidates: PipelineCandidate[];
  icon: React.ReactNode;
  color: string;
}

interface PipelineViewProps {
  jobTitle: string;
  totalApplicants: number;
  onViewCandidate?: (candidateId: string) => void;
}

export function PipelineView({ jobTitle, totalApplicants, onViewCandidate }: PipelineViewProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Mock pipeline data - In real app, this would come from props
  const pipelineStages: PipelineStage[] = [
    {
      stage_name: "Applied",
      stage_order: 1,
      icon: <FileText className="w-6 h-6" />,
      color: "blue",
      candidates: [
        { id: "1", name: "Sarah Johnson", email: "sarah@email.com", current_stage: "Applied", applied_date: "2026-04-01", days_in_stage: 8, rating: 4 },
        { id: "2", name: "Michael Chen", email: "michael@email.com", current_stage: "Applied", applied_date: "2026-04-02", days_in_stage: 7, rating: 5 },
        { id: "3", name: "Emily Davis", email: "emily@email.com", current_stage: "Applied", applied_date: "2026-04-03", days_in_stage: 6 },
        { id: "4", name: "James Wilson", email: "james@email.com", current_stage: "Applied", applied_date: "2026-04-05", days_in_stage: 4 },
      ]
    },
    {
      stage_name: "Screening",
      stage_order: 2,
      icon: <Users className="w-6 h-6" />,
      color: "purple",
      candidates: [
        { id: "5", name: "Lisa Anderson", email: "lisa@email.com", current_stage: "Screening", applied_date: "2026-03-28", days_in_stage: 12, rating: 4 },
        { id: "6", name: "David Martinez", email: "david@email.com", current_stage: "Screening", applied_date: "2026-03-29", days_in_stage: 11, rating: 5 },
        { id: "7", name: "Jennifer Lee", email: "jennifer@email.com", current_stage: "Screening", applied_date: "2026-03-30", days_in_stage: 10 },
      ]
    },
    {
      stage_name: "Interview",
      stage_order: 3,
      icon: <Video className="w-6 h-6" />,
      color: "yellow",
      candidates: [
        { id: "8", name: "Robert Taylor", email: "robert@email.com", current_stage: "Interview", applied_date: "2026-03-20", days_in_stage: 20, rating: 5 },
        { id: "9", name: "Amanda White", email: "amanda@email.com", current_stage: "Interview", applied_date: "2026-03-22", days_in_stage: 18, rating: 4 },
      ]
    },
    {
      stage_name: "Assessment",
      stage_order: 4,
      icon: <Award className="w-6 h-6" />,
      color: "orange",
      candidates: [
        { id: "10", name: "Christopher Brown", email: "chris@email.com", current_stage: "Assessment", applied_date: "2026-03-15", days_in_stage: 25, rating: 5 },
      ]
    },
    {
      stage_name: "Offer",
      stage_order: 5,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "green",
      candidates: [
        { id: "11", name: "Jessica Garcia", email: "jessica@email.com", current_stage: "Offer", applied_date: "2026-03-10", days_in_stage: 30, rating: 5 },
      ]
    },
    {
      stage_name: "Rejected",
      stage_order: 6,
      icon: <XCircle className="w-6 h-6" />,
      color: "red",
      candidates: [
        { id: "12", name: "Daniel Moore", email: "daniel@email.com", current_stage: "Rejected", applied_date: "2026-03-25", days_in_stage: 15 },
        { id: "13", name: "Michelle Harris", email: "michelle@email.com", current_stage: "Rejected", applied_date: "2026-03-26", days_in_stage: 14 },
      ]
    },
  ];

  const getColorClasses = (color: string, type: "bg" | "text" | "border" = "bg") => {
    const colors = {
      blue: { bg: "bg-blue-500", text: "text-blue-600", border: "border-blue-500" },
      purple: { bg: "bg-purple-500", text: "text-purple-600", border: "border-purple-500" },
      yellow: { bg: "bg-yellow-500", text: "text-yellow-600", border: "border-yellow-500" },
      orange: { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-500" },
      green: { bg: "bg-green-500", text: "text-green-600", border: "border-green-500" },
      red: { bg: "bg-red-500", text: "text-red-600", border: "border-red-500" },
    };
    return colors[color as keyof typeof colors]?.[type] || colors.blue[type];
  };

  const calculateConversionRate = (currentStageIndex: number) => {
    if (currentStageIndex === 0) return 100;
    const previousStageCandidates = pipelineStages[currentStageIndex - 1].candidates.length;
    const currentStageCandidates = pipelineStages[currentStageIndex].candidates.length;
    if (previousStageCandidates === 0) return 0;
    return Math.round((currentStageCandidates / previousStageCandidates) * 100);
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${i < rating ? "bg-yellow-400" : "bg-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Hiring Pipeline</h2>
        <p className="text-sm text-gray-600 mt-1">
          Visual representation of candidate flow through recruitment stages
        </p>
      </div>

      {/* Pipeline Overview Cards */}
      <div className="grid grid-cols-6 gap-4">
        {pipelineStages.map((stage, index) => {
          const conversionRate = calculateConversionRate(index);
          const isSelected = selectedStage === stage.stage_name;

          return (
            <div key={stage.stage_name} className="relative">
              <button
                onClick={() => setSelectedStage(isSelected ? null : stage.stage_name)}
                className={`w-full bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition cursor-pointer border-2 ${
                  isSelected ? getColorClasses(stage.color, "border") : "border-transparent"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className={`p-3 rounded-full ${getColorClasses(stage.color, "bg")} bg-opacity-10 mb-3`}>
                    <div className={getColorClasses(stage.color, "text")}>
                      {stage.icon}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{stage.stage_name}</h3>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{stage.candidates.length}</p>
                  {index > 0 && index < pipelineStages.length - 1 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <TrendingDown className="w-3 h-3" />
                      <span>{conversionRate}%</span>
                    </div>
                  )}
                </div>
              </button>
              {index < pipelineStages.length - 1 && (
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Funnel Visualization</h3>
        <div className="space-y-2">
          {pipelineStages.slice(0, -1).map((stage, index) => {
            const percentage = totalApplicants > 0 ? (stage.candidates.length / totalApplicants) * 100 : 0;

            return (
              <div key={stage.stage_name} className="relative">
                <div className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium text-gray-700">{stage.stage_name}</div>
                  <div className="flex-1">
                    <div className="relative h-12 bg-gray-100 rounded">
                      <div
                        className={`h-full ${getColorClasses(stage.color, "bg")} rounded flex items-center justify-between px-4 transition-all duration-500`}
                        style={{ width: `${Math.max(percentage, 10)}%` }}
                      >
                        <span className="text-white font-semibold text-sm">{stage.candidates.length}</span>
                        <span className="text-white text-xs">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rejected Candidates */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Rejected Candidates</span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              {pipelineStages.find(s => s.stage_name === "Rejected")?.candidates.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Stage Details */}
      {selectedStage && (
        <div className="bg-white rounded-lg shadow">
          {(() => {
            const stage = pipelineStages.find(s => s.stage_name === selectedStage);
            if (!stage) return null;

            return (
              <>
                <div className={`p-4 border-b bg-gradient-to-r from-${stage.color}-50 to-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getColorClasses(stage.color, "bg")} bg-opacity-20`}>
                        <div className={getColorClasses(stage.color, "text")}>
                          {stage.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{stage.stage_name} Stage</h3>
                        <p className="text-sm text-gray-600">
                          {stage.candidates.length} candidate{stage.candidates.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStage(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="divide-y">
                  {stage.candidates.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No candidates in this stage
                    </div>
                  ) : (
                    stage.candidates.map(candidate => (
                      <div
                        key={candidate.id}
                        className="p-4 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => onViewCandidate?.(candidate.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-600">
                                {candidate.name.split(" ").map(n => n[0]).join("")}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                              <p className="text-sm text-gray-600">{candidate.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            {candidate.rating && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Rating</p>
                                {renderStarRating(candidate.rating)}
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Applied</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(candidate.applied_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Days in Stage</p>
                              <p className={`text-sm font-medium ${
                                candidate.days_in_stage > 30 ? "text-red-600" :
                                candidate.days_in_stage > 14 ? "text-yellow-600" :
                                "text-gray-900"
                              }`}>
                                {candidate.days_in_stage} days
                              </p>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                              <Eye className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Pipeline Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Applicants</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalApplicants}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active Candidates</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {pipelineStages.slice(0, -1).reduce((sum, stage) => sum + stage.candidates.length, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Offers Extended</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {pipelineStages.find(s => s.stage_name === "Offer")?.candidates.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Conversion Rate</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {totalApplicants > 0
              ? ((pipelineStages.find(s => s.stage_name === "Offer")?.candidates.length || 0) / totalApplicants * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
