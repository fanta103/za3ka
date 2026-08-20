import React, { useState } from "react";
import { ApplicationStatus, IApplication, IInterviewSession } from "../../types";
import ApplicantCard from "./ApplicantCard";
import { Users, Filter, LayoutGrid, List, CheckCircle2 } from "lucide-react";

interface ApplicationPipelineProps {
	applications: IApplication[];
	isLoading: boolean;
	interviews?: IInterviewSession[];
}

const pipelineStages: { id: ApplicationStatus | "all"; label: string; badgeClass: string }[] = [
	{ id: "all", label: "All Applicants", badgeClass: "badge-neutral" },
	{ id: "applied", label: "Applied", badgeClass: "badge-info" },
	{ id: "screening", label: "Screening", badgeClass: "badge-warning" },
	{ id: "interview", label: "Interview", badgeClass: "badge-secondary" },
	{ id: "offered", label: "Offered", badgeClass: "badge-success" },
	{ id: "rejected", label: "Rejected", badgeClass: "badge-error" },
];

const ApplicationPipeline: React.FC<ApplicationPipelineProps> = ({
	applications,
	isLoading,
	interviews = [],
}) => {
	const [activeStage, setActiveStage] = useState<ApplicationStatus | "all">("all");
	const [viewMode, setViewMode] = useState<"tabs" | "kanban">("tabs");

	const getStageCount = (stage: ApplicationStatus | "all") => {
		if (stage === "all") return applications.length;
		return applications.filter((app) => (app.status || "applied") === stage).length;
	};

	const filteredApplications =
		activeStage === "all"
			? applications
			: applications.filter((app) => (app.status || "applied") === activeStage);

	if (isLoading) {
		return (
			<div className='p-12 text-center text-base-content/50'>
				<span className='loading loading-spinner loading-md text-primary mr-2' />
				Loading candidate pipeline...
			</div>
		);
	}

	if (applications.length === 0) {
		return (
			<div className='bg-base-100 border border-base-300 rounded-2xl p-10 text-center'>
				<div className='w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3'>
					<Users size={28} />
				</div>
				<h3 className='text-lg font-bold text-base-content'>No applications yet</h3>
				<p className='text-xs text-base-content/60 max-w-sm mx-auto mt-1'>
					When job seekers apply to this listing, their profiles, resumes, and cover letters will appear here.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Top Controls: Stages & View Switcher */}
			<div className='flex flex-wrap items-center justify-between gap-3 bg-base-100 p-3 rounded-xl border border-base-300 shadow-sm'>
				<div className='flex flex-wrap gap-1.5'>
					{pipelineStages.map((stage) => {
						const count = getStageCount(stage.id);
						const isActive = activeStage === stage.id;
						return (
							<button
								key={stage.id}
								onClick={() => setActiveStage(stage.id)}
								className={`btn btn-xs rounded-lg transition-all ${
									isActive
										? "btn-primary font-bold shadow-sm"
										: "btn-ghost text-base-content/70 hover:bg-base-200"
								}`}
							>
								{stage.label}
								<span
									className={`badge badge-xs ml-1 ${
										isActive ? "badge-neutral" : stage.badgeClass
									}`}
								>
									{count}
								</span>
							</button>
						);
					})}
				</div>

				<div className='flex items-center gap-1 border-l border-base-300 pl-3'>
					<button
						onClick={() => setViewMode("tabs")}
						className={`btn btn-xs btn-circle ${
							viewMode === "tabs" ? "btn-neutral" : "btn-ghost"
						}`}
						title='List View'
					>
						<List size={14} />
					</button>
					<button
						onClick={() => setViewMode("kanban")}
						className={`btn btn-xs btn-circle ${
							viewMode === "kanban" ? "btn-neutral" : "btn-ghost"
						}`}
						title='Kanban View'
					>
						<LayoutGrid size={14} />
					</button>
				</div>
			</div>

			{/* Views */}
			{viewMode === "tabs" ? (
				<div className='space-y-3'>
					{filteredApplications.length > 0 ? (
						filteredApplications.map((app) => (
							<ApplicantCard key={app._id} application={app} interviews={interviews} />
						))
					) : (
						<div className='p-8 text-center bg-base-100 rounded-xl border border-base-300 text-xs text-base-content/50'>
							No candidates in "{activeStage}" stage.
						</div>
					)}
				</div>
			) : (
				/* Kanban Pipeline View */
				<div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-4'>
					{pipelineStages
						.filter((s) => s.id !== "all")
						.map((stage) => {
							const stageApps = applications.filter(
								(app) => (app.status || "applied") === stage.id
							);
							return (
								<div
									key={stage.id}
									className='bg-base-200/50 rounded-xl p-3 border border-base-300/80 min-w-[260px] flex flex-col'
								>
									<div className='flex items-center justify-between mb-3 pb-2 border-b border-base-300'>
										<span className='font-bold text-xs capitalize text-base-content'>
											{stage.label}
										</span>
										<span className={`badge ${stage.badgeClass} badge-xs font-semibold`}>
											{stageApps.length}
										</span>
									</div>

									<div className='space-y-2.5 flex-1'>
										{stageApps.length > 0 ? (
											stageApps.map((app) => (
												<ApplicantCard key={app._id} application={app} interviews={interviews} />
											))
										) : (
											<div className='h-24 flex items-center justify-center text-[11px] text-base-content/40 border border-dashed border-base-300 rounded-lg'>
												No candidates
											</div>
										)}
									</div>
								</div>
							);
						})}
				</div>
			)}
		</div>
	);
};

export default ApplicationPipeline;
