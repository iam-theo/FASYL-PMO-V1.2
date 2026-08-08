import { useState } from 'react'
import { api } from '../../api'
import { useNotification } from '../NotificationContext'

function SignUp({ onClose, onSignUpComplete }) {

    const [step, setStep] = useState(1)
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "PROJECTMANAGER"
    })
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const { showNotification } = useNotification()

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleRequestOtp = async (e) => {
        e.preventDefault();

        if (!form.fullName || !form.email || !form.password) {
            showNotification({
                type: "error",
                title: "Missing details",
                message: "Please fill in your full name, email and password"
            });
            return;
        }

        try {
            setLoading(true);
            await api.post("/auth/signup/request-otp", form);
            setStep(2);
            showNotification({
                type: "success",
                title: "Code sent!",
                message: `A verification code was sent to ${form.email}`
            });
        } catch (error) {
            console.error(error);
            showNotification({
                type: "error",
                title: "Signup failed",
                message: error.response?.data?.error || "Something went wrong"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (!otp) {
            showNotification({
                type: "error",
                title: "Missing code",
                message: "Please enter the verification code sent to your email"
            });
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.post("/auth/signup/verify-otp", {
                email: form.email,
                otp
            });

            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.accessToken);

            showNotification({
                type: "success",
                title: "Account created!",
                message: `Welcome, ${data.user.fullName}`
            });

            onSignUpComplete(data.user);
        } catch (error) {
            console.error(error);
            showNotification({
                type: "error",
                title: "Verification failed",
                message: error.response?.data?.error || "Something went wrong"
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = 'w-full h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5 outline-none text-[#090909]'

    return (
        <div
            className='fixed inset-0 z-2000 bg-[#00000080] flex items-center justify-center p-4'
            onClick={onClose}
        >
            <div
                className='w-full max-w-120 max-h-full overflow-y-auto no-scrollbar bg-[#F7F7F7] rounded-xl flex flex-col gap-4 p-6'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='flex items-center justify-between gap-3'>
                    <h3 className='text-[#101828] text-[20px]/[100%] tracking-[0%] font-semibold'>
                        Create a test account
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className='px-4 py-2 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-pointer shrink-0'
                    >
                        <p className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Close</p>
                        <i className="fa-regular fa-circle-xmark fa-sm"></i>
                    </button>
                </div>

                <div className='rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-4'>
                    <p className='font-normal text-[13px]/[20px] text-[#636363]'>
                        Create a <span className='font-medium text-[#1B3C4A]'>Project Manager</span> or <span className='font-medium text-[#1B3C4A]'>Staff</span> account for testing. Enter an email you can access — a one-time code will be sent to it, and it will also be used to receive notification test emails.
                    </p>
                </div>

                {step === 1 ? (
                    <form className='flex flex-col gap-4' onSubmit={handleRequestOtp}>
                        <div className='flex flex-col gap-1.5'>
                            <label className='font-medium text-[14px]/[20px] text-[#090909]'>Full name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                placeholder='e.g. Test Project Manager'
                                className={inputClass}
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <label className='font-medium text-[14px]/[20px] text-[#090909]'>Email (for notifications)</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder='e.g. pm-test@example.com'
                                className={inputClass}
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <label className='font-medium text-[14px]/[20px] text-[#090909]'>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder='Enter a password'
                                className={inputClass}
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <label className='font-medium text-[14px]/[20px] text-[#090909]'>Role</label>
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value="PROJECTMANAGER">Project Manager</option>
                                <option value="STAFF">Staff</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className='w-full h-11 rounded-lg text-[#FFFFFF] font-medium bg-[#1B3C4A] cursor-pointer disabled:opacity-80'
                        >
                            {loading ? "Sending code..." : "Send verification code"}
                        </button>
                    </form>
                ) : (
                    <form className='flex flex-col gap-4' onSubmit={handleVerifyOtp}>
                        <div className='flex flex-col gap-1.5'>
                            <label className='font-medium text-[14px]/[20px] text-[#090909]'>Verification code</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder='Enter the 6-digit code'
                                className={`${inputClass} text-center tracking-[8px] font-semibold`}
                            />
                            <p className='font-normal text-[13px]/[20px] text-[#667085]'>
                                Sent to {form.email}. Check your inbox (and spam folder).
                            </p>
                        </div>

                        <div className='flex flex-col gap-2'>
                            <button
                                type="submit"
                                disabled={loading}
                                className='w-full h-11 rounded-lg text-[#FFFFFF] font-medium bg-[#1B3C4A] cursor-pointer disabled:opacity-80'
                            >
                                {loading ? "Verifying..." : "Verify & create account"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className='w-full h-11 rounded-lg text-[#1B3C4A] font-medium bg-[#E8E8E8] cursor-pointer'
                            >
                                Back to details
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default SignUp
