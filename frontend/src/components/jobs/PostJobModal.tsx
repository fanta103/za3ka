import React, { useState, useEffect } from "react";
import { X, Briefcase, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { useCreateJob, useUpdateJob } from "../../hooks/useJobs";
import { IJob, JobType } from "../../types";

interface PostJobModalProps {
	isOpen: boolean;
	onClose: () => void;
	existingJob?: IJob | null;
}

const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose, existingJob }) => {
	const isEdit = Boolean(existingJob);

	const [title, setTitle] = useState("");
	const [company, setCompany] = useState("");
	const [location, setLocation] = useState("");
	const [type, setType] = useState<JobType>("full-time");
	const [salaryMin, setSalaryMin] = useState<string>("");
	const [salaryMax, setSalaryMax] = useState<string>("");
	const [description, setDescription] = useState("");
	const [requirementInput, setRequirementInput] = useState("");
	const [requirements, setRequirements] = useState<string[]>([]);

	const { mutate: createJob, isPending: isCreating } = useCreateJob();
	const { mutate: updateJob, isPending: isUpdating } = useUpdateJob();

	const isPending = isCreating || isUpdating;

	useEffect(() => {
		if (existingJob) {
			setTitle(existingJob.title || "");
			setCompany(existingJob.company || "");
			setLocation(existingJob.location || "");
			setType(existingJob.type || "full-time");
			setSalaryMin(existingJob.salaryMin !== undefined ? String(existingJob.salaryMin) : "");
			setSalaryMax(existingJob.salaryMax !== undefined ? String(existingJob.salaryMax) : "");
			setDescription(existingJob.description || "");
			setRequirements(existingJob.requirements || []);
		} else {
			setTitle("");
			setCompany("");
			setLocation("");
			setType("full-time");
			setSalaryMin("");
			setSalaryMax("");
			setDescription("");
			setRequirements([]);
		}
	}, [existingJob, isOpen]);

	if (!isOpen) return null;

	const handleAddRequirement = (e: React.KeyboardEvent | React.MouseEvent) => {
		if ("key" in e && e.key !== "Enter") return;
		e.preventDefault();
		const trimmed = requirementInput.trim();
		if (trimmed && !requirements.includes(trimmed)) {
			setRequirements([...requirements, trimmed]);
			setRequirementInput("");
		}
	};

	const handleRemoveRequirement = (idx: number) => {
		setRequirements(requirements.filter((_, i) => i !== idx));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const jobData: Partial<IJob> = {
			title: title.trim(),
			company: company.trim(),
			location: location.trim(),
			type,
			salaryMin: salaryMin ? Number(salaryMin) : undefined,
			salaryMax: salaryMax ? Number(salaryMax) : undefined,
			description: description.trim(),
			requirements,
		};

		if (isEdit && existingJob) {
			updateJob(
				{ id: existingJob._id, data: jobData },
				{
					onSuccess: () => {
						onClose();
					},
				}
			);
		} else {
			createJob(jobData, {
				onSuccess: () => {
					onClose();
				},
			});
		}
	};

	return (
		<div className='modal modal-open z-50 bg-black/50 backdrop-blur-sm transition-all'>
			<div className='modal-box max-w-2xl bg-base-100 p-6 rounded-2xl shadow-2xl border border-base-300 relative max-h-[90vh] overflow-y-auto'>
				{/* Close button */}
				<button
					onClick={onClose}
					disabled={isPending}
					className='btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/60 hover:text-base-content'
				>
					<X size={18} />
				</button>

				{/* Header */}
				<div className='flex items-center gap-2 mb-5'>
					<div className='p-2 bg-primary/10 text-primary rounded-lg'>
						<Briefcase size={20} />
					</div>
					<div>
						<h3 className='font-bold text-xl text-base-content'>
							{isEdit ? "Edit Job Listing" : "Post a New Job"}
						</h3>
						<p className='text-xs text-base-content/60'>
							Reach top candidates in the network
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* Title & Company */}
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='text-xs font-semibold text-base-content/80 block mb-1'>
								Job Title *
							</label>
							<input
								type='text'
								required
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder='e.g., Senior Full Stack Engineer'
								className='input input-sm input-bordered w-full text-sm'
								disabled={isPending}
							/>
						</div>

						<div>
							<label className='text-xs font-semibold text-base-content/80 block mb-1'>
								Company Name *
							</label>
							<input
								type='text'
								required
								value={company}
								onChange={(e) => setCompany(e.target.value)}
								placeholder='e.g., Acme Corp'
								className='input input-sm input-bordered w-full text-sm'
								disabled={isPending}
							/>
						</div>
					</div>

					{/* Location & Type */}
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='text-xs font-semibold text-base-content/80 block mb-1'>
								Location *
							</label>
							<input
								type='text'
								required
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder='e.g., San Francisco, CA / Remote'
								className='input input-sm input-bordered w-full text-sm'
								disabled={isPending}
							/>
						</div>

						<div>
							<label className='text-xs font-semibold text-base-content/80 block mb-1'>
								Employment Type *
							</label>
							<select
								value={type}
								onChange={(e) => setType(e.target.value as JobType)}
								className='select select-sm select-bordered w-full text-sm capitalize'
								disabled={isPending}
							>
								<option value='full-time'>Full-time</option>
								<option value='part-time'>Part-time</option>
								<option value='contract'>Contract</option>
								<option value='internship'>Internship</option>
								<option value='remote'>Remote</option>
							</select>
						</div>
					</div>

					{/* Salary Range */}
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='text-xs font-semibold text-base-content/80 block mb-1'>
								Min Annual Salary (USD)
							</label>
							<input
								type='number'
								min='0'
								step='1000'
								value={salaryMin}
								onChange={(e) => setSalaryMin(e.target.value)}
								placeholder='e.g., 90000'
								className='input input-sm input-bordered w-full text-sm'
								disabled={isPending}
							/>
						</div>

						<div>
							<label className='text-xs font-semibold text-base-content/80 block mb-1'>
								Max Annual Salary (USD)
							</label>
							<input
								type='number'
								min='0'
								step='1000'
								value={salaryMax}
								onChange={(e) => setSalaryMax(e.target.value)}
								placeholder='e.g., 140000'
								className='input input-sm input-bordered w-full text-sm'
								disabled={isPending}
							/>
						</div>
					</div>

					{/* Requirements Tags */}
					<div>
						<label className='text-xs font-semibold text-base-content/80 block mb-1'>
							Key Requirements & Skills
						</label>
						<div className='flex gap-2 mb-2'>
							<input
								type='text'
								value={requirementInput}
								onChange={(e) => setRequirementInput(e.target.value)}
								onKeyDown={handleAddRequirement}
								placeholder='Add skill (e.g. React, TypeScript) and press Enter'
								className='input input-sm input-bordered flex-1 text-sm'
								disabled={isPending}
							/>
							<button
								type='button'
								onClick={handleAddRequirement}
								disabled={isPending || !requirementInput.trim()}
								className='btn btn-sm btn-outline'
							>
								<Plus size={15} /> Add
							</button>
						</div>

						{requirements.length > 0 && (
							<div className='flex flex-wrap gap-1.5 p-2 bg-base-200/50 rounded-xl border border-base-300'>
								{requirements.map((req, idx) => (
									<span
										key={idx}
										className='badge badge-primary badge-outline gap-1 text-xs py-2 px-3'
									>
										{req}
										<button
											type='button'
											onClick={() => handleRemoveRequirement(idx)}
											className='hover:text-error'
										>
											<X size={12} />
										</button>
									</span>
								))}
							</div>
						)}
					</div>

					{/* Description */}
					<div>
						<div className='flex justify-between items-center mb-1'>
							<label className='text-xs font-semibold text-base-content/80'>
								Job Description *
							</label>
							<span className='text-[11px] text-base-content/40'>
								{description.length}/5000
							</span>
						</div>
						<textarea
							required
							rows={6}
							value={description}
							onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
							placeholder='Describe the role, responsibilities, culture, and requirements in detail...'
							className='textarea textarea-bordered w-full text-sm focus:textarea-primary leading-relaxed'
							disabled={isPending}
						/>
					</div>

					{/* Action Buttons */}
					<div className='modal-action pt-2 flex items-center justify-end gap-2'>
						<button
							type='button'
							onClick={onClose}
							disabled={isPending}
							className='btn btn-sm btn-ghost'
						>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isPending || !title.trim() || !company.trim() || !description.trim()}
							className='btn btn-sm btn-primary min-w-28'
						>
							{isPending ? (
								<>
									<Loader2 size={15} className='animate-spin' />
									Saving...
								</>
							) : (
								<>
									<CheckCircle2 size={15} />
									{isEdit ? "Update Job" : "Publish Job"}
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default PostJobModal;
