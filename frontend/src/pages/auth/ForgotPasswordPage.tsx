import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader } from "lucide-react";
import { useForgotPassword } from "../../hooks/useAuth";

const ForgotPasswordPage: React.FC = () => {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const { mutate: forgotPassword, isPending } = useForgotPassword();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		forgotPassword(email, {
			onSuccess: () => setSubmitted(true),
		});
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-base-200 px-4'>
			<div className='max-w-md w-full'>
				<div className='bg-base-100 rounded-2xl shadow-xl p-8'>
					{/* Logo */}
					<div className='text-center mb-8'>
						<div className='inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4'>
							<Mail className='w-8 h-8 text-primary' />
						</div>
						<h1 className='text-2xl font-bold text-base-content'>Forgot your password?</h1>
						<p className='text-base-content/60 mt-2 text-sm'>
							Enter your email address and we'll send you a link to reset your password.
						</p>
					</div>

					{submitted ? (
						<div className='text-center'>
							<div className='bg-success/10 border border-success/20 rounded-xl p-6 mb-6'>
								<div className='text-success text-4xl mb-3'>✉️</div>
								<p className='text-base-content font-medium'>
									If an account exists with that email, you'll receive reset instructions shortly.
								</p>
								<p className='text-base-content/60 text-sm mt-2'>Check your spam folder if you don't see it within a few minutes.</p>
							</div>
							<Link to='/login' className='btn btn-primary w-full'>
								Return to Login
							</Link>
						</div>
					) : (
						<form onSubmit={handleSubmit} className='space-y-4'>
							<div className='form-control'>
								<label className='label' htmlFor='forgot-email'>
									<span className='label-text font-medium'>Email Address</span>
								</label>
								<input
									id='forgot-email'
									type='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder='you@example.com'
									className='input input-bordered w-full'
									required
									autoFocus
								/>
							</div>

							<button type='submit' className='btn btn-primary w-full mt-2' disabled={isPending || !email.trim()}>
								{isPending ? <Loader size={18} className='animate-spin mr-2' /> : null}
								{isPending ? "Sending..." : "Send Reset Link"}
							</button>
						</form>
					)}

					<div className='mt-6 text-center'>
						<Link to='/login' className='inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors'>
							<ArrowLeft size={14} />
							Back to login
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ForgotPasswordPage;
