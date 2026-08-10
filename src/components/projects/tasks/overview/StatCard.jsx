import { ChevronRightIcon } from './icons'

const CARD_BACKGROUND_STYLE = {
    backgroundImage:
        "url('https://api.builder.io/api/v1/image/assets/TEMP/aee0652477cf0ab7f5489b896df8a55a5445eb96?width=742')",
    backgroundColor: "#EBEBEB",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
}

function StatCard({ value, label, icon, onSeeDetails }) {
    const isClickable = typeof onSeeDetails === "function";

    return (
        <div
            onClick={isClickable ? onSeeDetails : undefined}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={
                isClickable
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSeeDetails();
                          }
                      }
                    : undefined
            }
            className={`flex-1 min-w-52 h-35.75 p-3 rounded-lg border border-white flex flex-col justify-between ${
                isClickable ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
            }`}
            style={CARD_BACKGROUND_STYLE}
        >
            <div className='flex items-start justify-between gap-2'>
                <div className='flex flex-col items-start gap-2'>
                    <span className='font-semibold text-[16px]/[20px] text-[#090909]'>{value}</span>
                    <span className='font-normal text-[14px]/[20px] text-[#636363]'>{label}</span>
                </div>
                {icon}
            </div>
            <span className='flex items-center justify-between gap-2'>
                <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>See Details</span>
                <ChevronRightIcon />
            </span>
        </div>
    )
}

export default StatCard
