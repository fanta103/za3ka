import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useApplyToJob } from "../../hooks/useApplications";
import { IJob } from "../../types";

interface ApplyModalProps {
	job: IJob;
	isOpen: boolean;
	onClose: () => void;
}

const ApplyModal: React.FC<ApplyModalProps> = ({ job, isOpen, onClose }) => {
	const [coverLetter, setCoverLetter] = useState("");
	const [resumeFile, setResumeFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { mutate: apply, isPending } = useApplyToJob();

	if (!isOpen) return null;

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setFileError(null);
		const validTypes = [
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		];

		if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
			setFileError("Only PDF and DOC/DOCX files are supported");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			setFileError("File size must be under 5MB");
			return;
		}

		setResumeFile(file);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const formData = new FormData();
		formData.append("jobId", job._id);
		if (coverLetter.trim()) {
			formData.append("coverLetter", coverLetter.trim());
		}
		if (resumeFile) {
			formData.append("resume", resumeFile);
		}

		apply(formData, {
			onSuccess: () => {
				onClose();
			},
		});
	};

	return (
		<div className='modal modal-open z-50 bg-black/50 backdrop-blur-sm transition-all'>
			<div className='modal-box max-w-lg bg-base-100 p-6 rounded-2xl shadow-2xl border border-base-300 relative'>
				{/* Close button */}
				<button
					onClick={onClose}
					disabled={isPending}
					className='btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/60 hover:text-base-content'
				>
					<X size={18} />
				</button>

				{/* Header */}
				<div className='pr-8 mb-5'>
					<span className='badge badge-primary badge-outline badge-sm mb-1'>Apply for Role</span>
					<h3 className='font-bold text-xl text-base-content'>{job.title}</h3>
					<p className='text-sm text-base-content/60'>
						{job.company} · {job.location}
					</p>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* Cover Letter */}
					<div>
						<div className='flex justify-between items-center mb-1.5'>
							<label className='text-xs font-semibold text-base-content/80'>
								Cover Letter / Note to Recruiter
							</label>
							<span
								className={`text-xs ${
									coverLetter.length > 2800 ? "text-warning" : "text-base-content/40"
								}`}
							>
								{coverLetter.length}/3000
							</span>
						</div>
						<textarea
							value={coverLetter}
							onChange={(e) => setCoverLetter(e.target.value.slice(0, 3000))}
							placeholder='Share why you are a great fit for this position...'
							className='textarea textarea-bordered w-full h-32 text-sm focus:textarea-primary leading-relaxed resize-none'
							disabled={isPending}
						/>
					</div>

					{/* Resume Upload */}
					<div>
						<label className='text-xs font-semibold text-base-content/80 block mb-1.5'>
							Resume / CV (PDF or DOCX, max 5MB)
						</label>

						<input
							type='file'
							ref={fileInputRef}
							onChange={handleFileChange}
							accept='.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
							className='hidden'
							disabled={isPending}
						/>

						{resumeFile ? (
							<div className='flex items-center justify-between p-3 bg-base-200/80 rounded-xl border border-primary/30'>
								<div className='flex items-center gap-2 min-w-0'>
									<div className='p-2 bg-primary/10 rounded-lg text-primary'>
										<FileText size={20} />
									</div>
									<div className='min-w-0'>
										<p className='text-xs font-medium truncate'>{resumeFile.name}</p>
										<p className='text-[10px] text-base-content/50'>
											{(resumeFile.size / 1024 / 1024).toFixed(2)} MB · Uploaded
										</p>
									</div>
								</div>
								<button
									type='button'
									onClick={() => setResumeFile(null)}
									disabled={isPending}
									className='btn btn-ghost btn-xs btn-circle text-error'
								>
									<X size={14} />
								</button>
							</div>
						) : (
							<div
								onClick={() => fileInputRef.current?.click()}
								className='border-2 border-dashed border-base-300 hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-base-200/30 hover:bg-base-200/60'
							>
								<Upload size={24} className='mx-auto text-base-content/40 mb-1.5' />
								<p className='text-xs font-medium text-base-content/80'>
									Click to upload your resume
								</p>
								<p className='text-[11px] text-base-content/50 mt-0.5'>
									Supported formats: PDF, DOCX (Up to 5MB)
								</p>
							</div>
						)}

						{fileError && (
							<div className='flex items-center gap-1 text-xs text-error mt-1.5'>
								<AlertCircle size={13} />
								<span>{fileError}</span>
							</div>
						)}
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
							disabled={isPending}
							className='btn btn-sm btn-primary min-w-28'
						>
							{isPending ? (
								<>
									<Loader2 size={15} className='animate-spin' />
									Submitting...
								</>
							) : (
								<>
									<CheckCircle2 size={15} />
									Submit Application
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ApplyModal;
