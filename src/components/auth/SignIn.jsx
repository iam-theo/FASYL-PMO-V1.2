import { useNavigate } from 'react-router-dom'
import bgSignIn from "../../assets/bgSignIn.jpg"
import bgSignInTwo from "../../assets/bgSignInTwo.jpg"
import { useState } from 'react'
import { api, forgotPassword } from '../../api'
import { useNotification } from '../NotificationContext'
import SignUp from './SignUp'

function SignIn({ setUser }) {

    const [email, setEmail] = useState(null)
    const [password, setPassword] = useState(null)
    const [showSignUp, setShowSignUp] = useState(false)
    const [showForgot, setShowForgot] = useState(false)
    const [forgotEmail, setForgotEmail] = useState("")
    const [forgotLoading, setForgotLoading] = useState(false)
    const { showNotification } = useNotification()
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate()

    const fillTestCredentials = () => {
        setEmail("coo@fasylng.com");
        setPassword("password123");
        showNotification({
            type: "success",
            title: "Head of Operations",
            message: "Test credentials filled in. Click Sign in to continue."
        });
    }

    const handleSignUpComplete = (user) => {
        setShowSignUp(false);
        setUser(user);
        navigate("/app");
    }

    const handleLogin = async (e) => {
        e.preventDefault();

        try {

            setLoading(true);

            const { data } = await api.post("/auth/login", {
                email,
                password
            })

            // console.log(data)

            // store token and user
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.accessToken);

            showNotification(
                {
                    type: "success",
                    title: `${data.message}`,
                    message: `Welcome,  ${data.user.fullName}`
                }
            )

            setUser(data.user)

            navigate("/app")

        } catch(error) {
            console.error(error)

            const message = error.response?.data?.error || "Something went wrong";

            showNotification(
                {
                    type: "error",
                    title: `${message}`,
                    message: "Please try again"
                }
            )
        } finally {
            
            setEmail("");
            setPassword("");
            setLoading(false);
        }
    };


    return (
        <div 
            className='flex max-w-360 max-h-screen relative'>

            <div 
                className='w-238 h-screen relative'>

                <img 
                    src={bgSignIn} 
                    alt="" 
                    className='w-full h-full object-cover absolute'
                />

                <div 
                    className='bg-linear-to-bl from-[#1B3C4A] to-[#1A5C78] w-full h-full top-0 opacity-80 text-[#FFFFFF] flex flex-col items-start justify-center px-20'>

                    <h1 
                        className='text-[48px]/[100%] font-semibold tracking-[-2%] mb-3.5'>
                            Welcome to FASYL PM Portal
                    </h1>

                    <p 
                        className='font-normal text-[20px]/[30px] tracking[0%]'>
                            Login to the portal to manage your projects
                    </p>
                    
                </div>

            </div>

            {/* Sign In Form */}
            <div 
                className='w-122 h-screen relative flex flex-col items-start justify-center'>

                <img 
                    src={bgSignInTwo} 
                    alt="" 
                    className='w-full h-full object-cover opacity-30 absolute z-[-1000]'
                />

                <div 
                    className='px-16 flex flex-col items-start justify-center gap-4'>

                    <h3 
                        className='text-[#101828] text-[24px]/[100%] tracking-[0%] font-semibold'>
                            Log in
                    </h3>
                    
                    <p 
                        className='text-[#141414] text-[16px]/[24px] tracking-[0%] font-normal'>
                            Welcome back! Please enter your details
                    </p>

                    <form 
                        action="" 
                        onSubmit={handleLogin}>

                        <div 
                            className='flex flex-col mb-4'>

                            <label 
                                htmlFor="" 
                                className='font-medium text-[14px]/[20px] tracking[0%] text-[#090909] mb-1.5'>
                                    Email
                            </label>

                            <input 
                                onChange={(e) => setEmail(e.target.value)}
                                value={email ?? ""}
                                type="email" 
                                name='email' 
                                placeholder='Enter your email' 
                                className='w-90 h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5'
                            />

                        </div>

                        <div 
                            className='flex flex-col mb-4'>

                            <label 
                                htmlFor="" 
                                className='font-medium text-[14px]/[20px] tracking[0%] text-[#090909] mb-1.5'>
                                    Password
                            </label>

                            <input 
                                onChange={(e) => setPassword(e.target.value)}
                                value={password ?? ""}
                                type="password" 
                                name='password' 
                                placeholder='........' 
                                className='w-90 h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5'
                            />

                        </div>

                        <button
                            type="button"
                            onClick={() => setShowForgot((prev) => !prev)}
                            className='text-[14px]/[20px] tracking-[0%] text-[#1B3C4A] font-medium cursor-pointer hover:underline'>
                                Forgot password?
                        </button>

                        {showForgot && (
                            <div className='mt-3 w-90 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] p-4'>
                                <p className='mb-3 font-normal text-[13px]/[20px] text-[#475467]'>
                                    Enter your email and we will send you a link to reset your password.
                                </p>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder='Enter your email'
                                    className='w-full h-10 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] py-2.5 px-3.5 outline-none text-[#090909] text-[14px]'
                                />
                                <button
                                    type="button"
                                    disabled={forgotLoading}
                                    onClick={async () => {
                                        if (!forgotEmail) {
                                            showNotification({ type: "error", title: "Email required", message: "Please enter your email address." });
                                            return;
                                        }
                                        try {
                                            setForgotLoading(true);
                                            await forgotPassword(forgotEmail);
                                            showNotification({
                                                type: "success",
                                                title: "Reset link sent",
                                                message: "If an account exists for that email, a password reset link has been sent."
                                            });
                                            setForgotEmail("");
                                            setShowForgot(false);
                                        } catch (error) {
                                            console.error(error);
                                            showNotification({ type: "error", title: "Request failed", message: "Something went wrong. Please try again." });
                                        } finally {
                                            setForgotLoading(false);
                                        }
                                    }}
                                    className='mt-3 w-full h-10 rounded-lg text-[#FFFFFF] font-medium bg-[#1B3C4A] cursor-pointer disabled:opacity-80 text-[14px]'>
                                    {forgotLoading ? "Sending..." : "Send reset link"}
                                </button>
                            </div>
                        )}

                        <button 
                            type='submit' 
                            disabled={loading}
                            className='text-[16px]/[24px] tracking-[0%] text-[#FFFFFF] font-medium bg-[#1B3C4A] shadow-[#1018280D] shadow-[2px] w-90 h-11 rounded-lg py-2.5 px-4.5 mt-2 cursor-pointer disabled:opacity-80' >
                                {!loading ? "Sign in" : "Signing in..."}
                        </button>

                        </form>

                        <div className='w-90 flex flex-col gap-2 pt-4'>
                            <button
                                type="button"
                                onClick={fillTestCredentials}
                                className='w-full h-11 rounded-lg border border-dashed border-[#1B3C4A] bg-[#F3F7F9] flex items-center justify-center gap-2 cursor-pointer'
                            >
                                <i className="fa-solid fa-user-pen text-[#1B3C4A]"></i>
                                <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Head of Operations (one-click login)</span>
                            </button>

                            <div className='flex items-center gap-3'>
                                <div className='flex-1 h-px bg-[#D0D5DD]'></div>
                                <span className='font-normal text-[12px]/[20px] text-[#667085]'>or</span>
                                <div className='flex-1 h-px bg-[#D0D5DD]'></div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowSignUp(true)}
                                className='w-full h-11 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] flex items-center justify-center gap-2 cursor-pointer'
                            >
                                <i className="fa-solid fa-user-plus text-[#1B3C4A]"></i>
                                <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Create a Project Manager / Staff test account</span>
                            </button>
                        </div>

                    </div>

                </div>

            {showSignUp && (
                <SignUp
                    onClose={() => setShowSignUp(false)}
                    onSignUpComplete={handleSignUpComplete}
                />
            )}

            </div>
    )
}

export default SignIn
