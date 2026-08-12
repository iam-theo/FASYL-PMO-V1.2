import { useEffect, useMemo, useState } from 'react'
import { addProjectResource, api, getStaff } from '../../../../api'
import { useNotification } from '../../../NotificationContext'

function AddResourceModal({ projectId, projectCode, projectName, existingEmails = [], onClose, onAdded }) {

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        staffId: "",
        designation: "",
    })
    const [loading, setLoading] = useState(false)
    const [staff, setStaff] = useState([])
    const [staffLoading, setStaffLoading] = useState(true)
    const { showNotification } = useNotification()

    // Staff accounts already exist in the system — surface them so the PM can
    // pick instead of typing out contact details by hand.
    useEffect(() => {
        let mounted = true;

        const loadStaff = async () => {
            try {
                const response = await getStaff();
                if (mounted) setStaff(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error(error);
            } finally {
                if (mounted) setStaffLoading(false);
            }
        };

        loadStaff();
        return () => { mounted = false; };
    }, []);

    const availableStaff = useMemo(() => {
        const existing = new Set(
            existingEmails.map((email) => String(email || "").trim().toLowerCase())
        );

        return staff.filter(
            (member) => !existing.has(String(member.email || "").trim().toLowerCase())
        );
    }, [staff, existingEmails]);

    const handleSelectStaff = (id) => {
        const member = staff.find((s) => String(s.id) === String(id));
        if (!member) return;

        const parts = String(member.fullName || "").trim().split(/\s+/);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ");

        setForm((prev) => ({
            ...prev,
            firstName,
            lastName,
            email: member.email || "",
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

            showNotification({
                type: "success",
                title: "Resource Added!",
                message: `${form.firstName} ${form.lastName} has been added to ${projectName ?? "the project"}`
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
                        Pick an existing staff member from the system — their details are filled in automatically. If they are not listed, capture the details below to add them to <span className='font-medium text-[#1B3C4A]'>{projectName ?? "this project"}</span>.
                    </p>
                </div>

                <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                    <div className='flex flex-col gap-1.5'>
                        <label className={labelClass}>Select existing staff</label>
                        <select
                            value=""
                            onChange={(e) => handleSelectStaff(e.target.value)}
                            className={inputClass}
                            disabled={staffLoading}
                        >
                            <option value="">
                                {staffLoading
                                    ? "Loading staff..."
                                    : availableStaff.length === 0
                                        ? staff.length === 0
                                            ? "No staff accounts found in the system"
                                            : "All staff are already on this project"
                                        : "Select a staff member"}
                            </option>
                            {availableStaff.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.fullName} — {member.email}
                                </option>
                            ))}
                        </select>
                    </div>
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
                            <label className={labelClass}>Designation</label>
                            <input
                                type="text"
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                                placeholder='e.g. Business Analyst'
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className='w-full h-11 rounded-lg text-[#FFFFFF] font-medium bg-[#1B3C4A] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80'
                    >
                        <i className="fa-regular fa-circle-check text-[#FFFFFF]"></i>
                        {loading ? "Adding..." : "Add Resource"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AddResourceModal
