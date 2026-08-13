import { useEffect, useMemo, useState } from 'react'
import { addProjectResource, api, getEmployees, getStaff } from '../../../../api'
import { useNotification } from '../../../NotificationContext'
import EmployeeDirectoryPicker from '../../../layout/EmployeeDirectoryPicker'

function AddResourceModal({ projectId, projectCode, projectName, existingEmails = [], onClose, onAdded }) {

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        staffId: "",
        designation: "",
        password: "",
    })
    const [loading, setLoading] = useState(false)
    const [employees, setEmployees] = useState([])
    const [employeesLoading, setEmployeesLoading] = useState(true)
    const [registeredEmails, setRegisteredEmails] = useState([])
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const { showNotification } = useNotification()

    // Two sources load in parallel:
    // - XNETT employee directory: the authoritative "resources already in the
    //   system" list the PM picks from.
    // - Registered STAFF accounts: used to decide whether the picked employee
    //   already has a login (no password field / no account creation) or needs
    //   an account created on the fly (password field shows).
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const [employeesRes, staffRes] = await Promise.allSettled([
                    getEmployees(),
                    getStaff(),
                ]);

                if (mounted) {
                    if (employeesRes.status === "fulfilled") {
                        setEmployees(Array.isArray(employeesRes.value?.data) ? employeesRes.value.data : []);
                    } else {
                        console.error(employeesRes.reason);
                    }

                    if (staffRes.status === "fulfilled") {
                        const staff = Array.isArray(staffRes.value?.data) ? staffRes.value.data : [];
                        setRegisteredEmails(
                            staff
                                .map((member) => String(member.email || "").trim().toLowerCase())
                                .filter(Boolean)
                        );
                    } else {
                        console.error(staffRes.reason);
                    }
                }
            } finally {
                if (mounted) setEmployeesLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    const availableEmployees = useMemo(() => {
        const existing = new Set(
            existingEmails.map((email) => String(email || "").trim().toLowerCase())
        );

        return employees.filter(
            (emp) => !existing.has(String(emp.email || "").trim().toLowerCase())
        );
    }, [employees, existingEmails]);

    const registeredEmailSet = useMemo(
        () => new Set(registeredEmails),
        [registeredEmails]
    );

    // The picked employee's email decides whether an account already exists.
    const selectedHasAccount = useMemo(() => {
        const email = String(form.email || "").trim().toLowerCase();
        return Boolean(email && registeredEmailSet.has(email));
    }, [form.email, registeredEmailSet]);

    const showPasswordField = Boolean(selectedEmployee) && !selectedHasAccount;

    const handleSelectEmployee = (employee) => {
        if (!employee) {
            setSelectedEmployee(null);
            return;
        }

        setSelectedEmployee(employee);

        setForm((prev) => ({
            ...prev,
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            email: employee.email || "",
            phoneNumber: employee.phoneNumber || "",
            staffId: employee.staffId || "",
            designation: employee.designation || "",
            password: "",
        }));
    };

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.firstName || !form.lastName) {
            showNotification({
                type: "error",
                title: "Missing details",
                message: "First name and last name are required"
            });
            return;
        }

        if (showPasswordField && !form.password) {
            showNotification({
                type: "error",
                title: "Missing password",
                message: "A default password is required to create this staff member's account"
            });
            return;
        }

        try {
            setLoading(true);
            const response = await addProjectResource(projectId, form);

            let freshProject = response.data;

            try {
                const freshResponse = await api.get(`/projects/${projectCode}`);
                freshProject = freshResponse.data?.data ?? freshProject;
            } catch (refetchErr) {
                console.error(refetchErr);
            }

            onAdded(freshProject);

            const accountCreated = Boolean(showPasswordField && form.password);

            showNotification({
                type: "success",
                title: accountCreated ? "Resource Added & Account Created!" : "Resource Added!",
                message: accountCreated
                    ? `${form.firstName} ${form.lastName} has been added to ${projectName ?? "the project"} and their account created. They will receive their credentials by email.`
                    : `${form.firstName} ${form.lastName} has been added to ${projectName ?? "the project"}`
            });

            onClose();
        } catch (error) {
            console.error(error);
            showNotification({
                type: "error",
                title: "Failed To Add Resource!",
                message: error.response?.data?.error || "Unable to add resource"
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = 'w-full h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5 outline-none text-[#090909]'
    const labelClass = 'font-medium text-[14px]/[20px] text-[#090909]'

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
                        Add New Resource
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
                        Pick an employee from the staff directory — their details are filled in automatically. If this is their first time in the portal, a password field appears and an account is created for them. If they are not listed, capture the details below to add them to <span className='font-medium text-[#1B3C4A]'>{projectName ?? "this project"}</span>.
                    </p>
                </div>

                <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                    <div className='flex flex-col gap-1.5'>
                        <label className={labelClass}>Select employee from directory</label>
                        <EmployeeDirectoryPicker
                            employees={availableEmployees}
                            loading={employeesLoading}
                            value={selectedEmployee}
                            onSelect={handleSelectEmployee}
                            emptyMessage={
                                employeesLoading
                                    ? undefined
                                    : employees.length === 0
                                        ? "Directory unavailable — enter details manually"
                                        : "All staff are already on this project"
                            }
                        />
                    </div>

                    {selectedHasAccount && (
                        <div className='rounded-lg border border-[#D1FADF] bg-[#ECFDF3] p-3'>
                            <p className='font-normal text-[13px]/[20px] text-[#067647]'>
                                This employee already has a portal account — they will be added as a resource without creating a new one.
                            </p>
                        </div>
                    )}

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-1.5'>
                            <label className={labelClass}>First name <span className='text-[#B42318]'>*</span></label>
                            <input
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder='e.g. Nkechi'
                                className={inputClass}
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <label className={labelClass}>Last name <span className='text-[#B42318]'>*</span></label>
                            <input
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder='e.g. Ijoma'
                                className={inputClass}
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <label className={labelClass}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder='e.g. nkechi.ijoma@fasylng.com'
                                className={inputClass}
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <label className={labelClass}>Phone number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={form.phoneNumber}
                                onChange={handleChange}
                                placeholder='e.g. 08012345678'
                                className={inputClass}
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <label className={labelClass}>Staff ID</label>
                            <input
                                type="text"
                                name="staffId"
                                value={form.staffId}
                                onChange={handleChange}
                                placeholder='e.g. FNG23156'
                                className={inputClass}
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <label className={labelClass}>Designation / title</label>
                            <input
                                type="text"
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                                placeholder='e.g. Business Analyst'
                                className={inputClass}
                            />
                        </div>

                        {showPasswordField && (
                            <div className='flex flex-col gap-1.5 sm:col-span-2'>
                                <label className={labelClass}>
                                    Default password <span className='text-[#B42318]'>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder='e.g. Welcome123'
                                    className={inputClass}
                                />
                                <p className='font-normal text-[12px]/[18px] text-[#667085]'>
                                    No account exists for this email yet — submitting creates a STAFF account with this password. The staff member receives it by email and must change it on first login.
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className='w-full h-11 rounded-lg text-[#FFFFFF] font-medium bg-[#1B3C4A] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80'
                    >
                        <i className="fa-regular fa-circle-check text-[#FFFFFF]"></i>
                        {loading ? "Adding..." : showPasswordField ? "Add Resource & Create Account" : "Add Resource"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AddResourceModal
