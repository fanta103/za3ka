import React, { useState } from "react";
<br>import { Star, X, MessageSquare } from "lucide-react";
import { useSubmitFeedback } from "../../hooks/useInterviews";

interface FeedbackModalProps {
	interviewId: string;
	candidateName: string;
	onClose: () => void;
	onSuccess?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
	interviewId,
	candidateName,
	onClose,
	onSuccess,
}) => {
	const [rating, setRating] = useState(0);
	const [hoverRating, setHoverRating] = useState(0);
	const [notes, setNotes] = useState("");

	const { mutate: submitFeedback, isPending } = useSubmitFeedback();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (rating === 0) return;
		submitFeedback(
			{ id: interviewId, rating, notes: notes || undefined },
			{
				onSuccess: () => {
					onSuccess?.();
					onClose();
				},
			}
		);
	};

	const ratingLabels = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];

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
					<Star size={20} className='text-warning' />
					Submit Interview Feedback
				</h3>
				<p className='text-sm text-base-content/60 mb-5'>
					Your private assessment of{" "}
					<span className='font-semibold text-base-content'>{candidateName}</span>
				</p>

				<form onSubmit={handleSubmit} className='space-y-5'>
					{/* Star Rating */}
					<div className='form-control'>
						<label className='label'>
							<span className='label-text font-semibold'>Overall Rating *</span>
						</label>
						<div className='flex gap-1 items-center'>
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									type='button'
									onClick={() => setRating(star)}
									onMouseEnter={() => setHoverRating(star)}
									onMouseLeave={() => setHoverRating(0)}
									className='text-3xl focus:outline-none transition-transform hover:scale-110'
								>
									<Star
										size={32}
										className={
											star <= (hoverRating || rating)
												? "fill-warning text-warning"
												: "text-base-content/20"
										}
									/>
								</button>
							))}
							{(hoverRating || rating) > 0 && (
								<span className='ml-3 text-sm font-semibold text-base-content/70'>
									{ratingLabels[hoverRating || rating]}
								</span>
							)}
						</div>
						{rating === 0 && (
							<p className='text-xs text-error mt-1'>Please select a rating</p>
						)}
					</div>

					{/* Notes */}
					<div className='form-control'>
						<label className='label'>
							<span className='label-text font-semibold flex items-center gap-1'>
								<MessageSquare size={14} /> Notes (optional)
							</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder='Technical skills, communication, cultural fit, etc.'
							rows={4}
							maxLength={2000}
							className='textarea textarea-bordered textarea-sm focus:textarea-primary resize-none text-sm'
						/>
						<label className='label'>
							<span className='label-text-alt text-base-content/40'>{notes.length}/2000</span>
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
						<button
							type='submit'
							disabled={isPending || rating === 0}
							className='btn btn-warning btn-sm gap-2'
						>
							{isPending ? (
								<span className='loading loading-spinner loading-xs' />
							) : (
								<Star size={15} />
							)}
							Submit Feedback
						</button>
					</div>
				</form>
			</div>
			<div className='modal-backdrop' onClick={onClose} />
		</dialog>
	);
};

export default FeedbackModal;
