import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Building2, MapPin, DollarSign, Users, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { IJob } from "../../types";

interface JobCardProps {
	job: IJob;
}

const getJobTypeBadgeColor = (type: string) => {
	switch (type) {
		case "full-time":
			return "badge-primary";
		case "part-time":
			return "badge-secondary";
		case "contract":
			return "badge-accent";
		case "internship":
			return "badge-info";
		case "remote":
			return "badge-success";
		default:
			return "badge-ghost";
	}
};

const formatSalary = (min?: number, max?: number) => {
	if (!min && !max) return null;
	const formatNum = (n: number) => {
		if (n >= 1000) return `$${Math.round(n / 1000)}k`;
		return `$${n.toLocaleString()}`;
	};
	if (min && max) return `${formatNum(min)} - ${formatNum(max)}/yr`;
	if (min) return `From ${formatNum(min)}/yr`;
	return `Up to ${formatNum(max!)}/yr`;
};

const JobCard: React.FC<JobCardProps> = ({ job }) => {
	const salaryText = formatSalary(job.salaryMin, job.salaryMax);
	const timeAgo = job.createdAt
		? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
		: "recently";

	const author = typeof job.authorId === "object" ? job.authorId : null;

	return (
		<div className='card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full'>
			<div className='card-body p-5'>
				{/* Header: Title + Status */}
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0 flex-1'>
						<Link
							to={`/jobs/${job._id}`}
							className='text-lg font-bold text-base-content hover:text-primary transition-colors line-clamp-1'
						>
							{job.title}
						</Link>
						<div className='flex items-center gap-1.5 text-sm text-base-content/70 mt-1'>
							<Building2 size={15} className='text-base-content/50 flex-shrink-0' />
							<span className='font-medium truncate'>{job.company}</span>
						</div>
					</div>

					<div className='flex flex-col items-end gap-1 flex-shrink-0'>
						<span className={`badge ${getJobTypeBadgeColor(job.type)} badge-sm font-semibold capitalize`}>
							{job.type}
						</span>
						{job.status !== "open" && (
							<span
								className={`badge badge-xs ${
									job.status === "paused" ? "badge-warning" : "badge-error"
								} capitalize`}
							>
								{job.status}
							</span>
						)}
					</div>
				</div>

				{/* Location & Salary */}
				<div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-base-content/60 mt-3 pt-3 border-t border-base-200'>
					<div className='flex items-center gap-1'>
						<MapPin size={13} className='text-base-content/40' />
						<span>{job.location}</span>
					</div>

					{salaryText && (
						<div className='flex items-center gap-1 font-semibold text-success'>
							<DollarSign size={13} />
							<span>{salaryText}</span>
						</div>
					)}
				</div>

				{/* Description snippet */}
				<p className='text-xs text-base-content/70 mt-2.5 line-clamp-2 leading-relaxed'>
					{job.description}
				</p>

				{/* Requirements Badges (first 3) */}
				{job.requirements && job.requirements.length > 0 && (
					<div className='flex flex-wrap gap-1 mt-3'>
						{job.requirements.slice(0, 3).map((req, idx) => (
							<span key={idx} className='badge badge-ghost badge-xs text-[11px] px-2 py-1'>
								{req}
							</span>
						))}
						{job.requirements.length > 3 && (
							<span className='badge badge-ghost badge-xs text-[10px] text-base-content/50'>
								+{job.requirements.length - 3} more
							</span>
						)}
					</div>
				)}
			</div>

			{/* Footer: Metadata & Link */}
			<div className='px-5 py-3 bg-base-200/50 border-t border-base-300/60 rounded-b-2xl flex items-center justify-between text-xs text-base-content/60'>
				<div className='flex items-center gap-3'>
					<span className='flex items-center gap-1' title='Applicants count'>
						<Users size={13} className='text-base-content/50' />
						<strong className='text-base-content/80'>{job.applicantsCount || 0}</strong> applicants
					</span>
					{job.viewsCount !== undefined && (
						<span className='flex items-center gap-1 text-base-content/50' title='Views count'>
							<Eye size={13} />
							{job.viewsCount}
						</span>
					)}
				</div>

				<div className='flex items-center gap-2'>
					<span className='flex items-center gap-1 text-[11px] text-base-content/50'>
						<Clock size={12} />
						{timeAgo}
					</span>
					<Link to={`/jobs/${job._id}`} className='btn btn-xs btn-primary font-medium ml-1'>
						View
					</Link>
				</div>
			</div>
		</div>
	);
};

export default JobCard;
