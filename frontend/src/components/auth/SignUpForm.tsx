import React, { useState } from "react";
import { Loader } from "lucide-react";
import { useSignUp } from "../../hooks/useAuth";

const SignUpForm: React.FC = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<string>("jobseeker");

    const { mutate: signUpMutation, isPending } = useSignUp();

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        signUpMutation({ name, username, email, password, role });
    };

    return (
        <form onSubmit={handleSignUp} className='flex flex-col gap-4'>
            <input
                type='text'
                placeholder='Full name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='input input-bordered w-full'
                required
            />
            <input
                type='text'
                placeholder='Username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className='input input-bordered w-full'
                required
            />
            <input
                type='email'
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='input input-bordered w-full'
                required
            />
            <input
                type='password'
                placeholder='Password (6+ characters)'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='input input-bordered w-full'
                required
            />

            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className='select select-bordered w-full'
            >
                <option value="jobseeker">I'm a Job Seeker</option>
                <option value="recruiter">I'm a Recruiter</option>
            </select>

            <button type='submit' disabled={isPending} className='btn btn-primary w-full text-white'>
                {isPending ? <Loader className='size-5 animate-spin' /> : "Agree & Join"}
            </button>
        </form>
    );
};

export default SignUpForm;
