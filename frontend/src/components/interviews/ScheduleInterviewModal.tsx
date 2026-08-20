import React, { useState } from "react";
import { Calendar, Clock, FileText, X } from "lucide-react";
import { useScheduleInterview } from "../../hooks/useInterviews";

interface ScheduleInterviewModalProps {
	jobId: string;
	candidateId: string;
	candidateName: string;
	onClose: () => void;
}

const DURATION_OPTIONS = [
	{ value: 15, label: "15 minutes" },
	{ value: 30, label: "30 minutes" },
	{ value: 45, label: "45 minutes" },
	{ value: 60, label: "1 hour" },
];

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
	jobId,
	candidateId,
	candidateName,
	onClose,
}) => {
	// Default scheduledAt to 1 day from now at the next round hour
	const defaultDate = () => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		d.setMinutes(0, 0, 0);
		return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
	};

	const [scheduledAt, setScheduledAt] = useState(defaultDate());
	const [duration, setDuration] = useState(30);
	const [note, setNote] = useState("");

	const { mutate: schedule, isPending } = useScheduleInterview();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		schedule(
			{ jobId, candidateId, scheduledAt, duration, note: note || undefined },
			{ onSuccess: onClose }
		);
	};

	return (
		<dialog className='modal modal-open'>
			<div className='modal-box max-w-md'>
				<button
					onClick={onClose}
					className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
					disabled={isPending}
				>
					<X size={16} />
				</button>

				<h3 className='font-black text-lg mb-1 flex items-center gap-2'>
					<Calendar size={20} className='text-primary' />
					Schedule Interview
				</h3>
				<p className='text-sm text-base-content/60 mb-5'>
					Scheduling with <span className='font-semibold text-base-content'>{candidateName}</span>
				</p>

				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* Date & Time */}
					<div className='form-control'>
						<label className='label'>
							<span className='label-text font-semibold flex items-center gap-1'>
								<Calendar size={14} /> Date & Time
							</span>
						</label>
						<input
							type='datetime-local'
							value={scheduledAt}
							onChange={(e) => setScheduledAt(e.target.value)}
							required
							min={new Date().toISOString().slice(0, 16)}
							className='input input-bordered input-sm focus:input-primary'
						/>
					</div>

					{/* Duration */}
					<div className='form-control'>
						<label className='label'>
							<span className='label-text font-semibold flex items-center gap-1'>
								<Clock size={14} /> Duration
							</span>
						</label>
						<select
							value={duration}
							onChange={(e) => setDuration(Number(e.target.value))}
							className='select select-bordered select-sm focus:select-primary'
						>
							{DURATION_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>

					{/* Optional Note */}
					<div className='form-control'>
						<label className='label'>
							<span className='label-text font-semibold flex items-center gap-1'>
								<FileText size={14} /> Note (optional)
							</span>
						</label>
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder='Add any preparation instructions or agenda...'
							rows={3}
							maxLength={500}
							className='textarea textarea-bordered textarea-sm focus:textarea-primary resize-none text-sm'
						/>
						<label className='label'>
							<span className='label-text-alt text-base-content/40'>{note.length}/500</span>
						</label>
					</div>

					<div className='modal-action mt-2'>
						<button
							type='button'
							onClick={onClose}
							disabled={isPending}
							className='btn btn-ghost btn-sm'
						>
							Cancel
						</button>
						<button type='submit' disabled={isPending} className='btn btn-primary btn-sm gap-2'>
							{isPending ? (
								<span className='loading loading-spinner loading-xs' />
							) : (
								<Calendar size={15} />
							)}
							Schedule Interview
						</button>
					</div>
				</form>
			</div>
			<div className='modal-backdrop' onClick={onClose} />
		</dialog>
	);
};

export default ScheduleInterviewModal;
