import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Loader, Eye, EyeOff } from "lucide-react";
import { useResetPassword } from "../../hooks/useAuth";

const ResetPasswordPage: React.FC = () => {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [clientError, setClientError] = useState("");
	const { mutate: resetPassword, isPending } = useResetPassword();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setClientError("");

		if (password.length < 6) {
			setClientError("Password must be at least 6 characters.");
			return;
		}
		if (password !== confirmPassword) {
			setClientError("Passwords do not match.");
			return;
		}
		if (!token) {
			setClientError("Invalid reset link.");
			return;
		}

		resetPassword(
			{ token, password },
			{
				onSuccess: () => {
					setTimeout(() => navigate("/login"), 2000);
				},
			}
		);
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-base-200 px-4'>
			<div className='max-w-md w-full'>
				<div className='bg-base-100 rounded-2xl shadow-xl p-8'>
					<div className='text-center mb-8'>
						<div className='inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4'>
							<Lock className='w-8 h-8 text-primary' />
						</div>
						<h1 className='text-2xl font-bold text-base-content'>Set a new password</h1>
						<p className='text-base-content/60 mt-2 text-sm'>
							Choose a strong password for your account.
						</p>
					</div>

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='form-control'>
							<label className='label' htmlFor='reset-password'>
								<span className='label-text font-medium'>New Password</span>
							</label>
							<div className='relative'>
								<input
									id='reset-password'
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder='At least 6 characters'
									className='input input-bordered w-full pr-10'
									required
									autoFocus
								/>
								<button
									type='button'
									onClick={() => setShowPassword((v) => !v)}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content'
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						<div className='form-control'>
							<label className='label' htmlFor='reset-confirm'>
								<span className='label-text font-medium'>Confirm Password</span>
							</label>
							<input
								id='reset-confirm'
								type={showPassword ? "text" : "password"}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder='Repeat your password'
								className='input input-bordered w-full'
								required
							/>
						</div>

						{clientError && (
							<div className='alert alert-error text-sm py-2'>
								<span>{clientError}</span>
							</div>
						)}

						<button
							type='submit'
							className='btn btn-primary w-full mt-2'
							disabled={isPending || !password || !confirmPassword}
						>
							{isPending ? <Loader size={18} className='animate-spin mr-2' /> : null}
							{isPending ? "Resetting..." : "Reset Password"}
						</button>
					</form>

					<div className='mt-6 text-center'>
						<Link
							to='/login'
							className='inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors'
						>
							<ArrowLeft size={14} />
							Back to login
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ResetPasswordPage;
