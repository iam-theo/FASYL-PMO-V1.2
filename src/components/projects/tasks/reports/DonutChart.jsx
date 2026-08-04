function DonutChart({ title, items }) {
    return (
        <div className='flex flex-col gap-4'>
            <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>{title}</h3>

            <div className='flex min-h-56 items-center justify-center rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-6'>
                <div className='flex flex-wrap items-center justify-center gap-9'>
                    <svg width="160" height="160" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className='shrink-0'>
                        <path d="M191 96C191 80.9879 187.48 66.1851 180.721 52.7804C173.963 39.3758 164.155 27.743 152.085 18.8163C140.015 9.88962 126.02 3.91793 111.224 1.38088C96.4281 -1.15617 81.2432 -0.187872 66.8892 4.208L77.4308 38.63C86.4021 35.8826 95.8926 35.2774 105.14 36.8631C114.388 38.4487 123.135 42.181 130.678 47.7602C138.222 53.3393 144.352 60.6099 148.576 68.9878C152.8 77.3657 155 86.6175 155 96H191Z" fill="#0088FF" />
                        <path d="M66.8891 4.20801C45.9034 10.6348 27.7534 24.0585 15.4632 42.2424C3.17298 60.4264 -2.51534 82.2727 -0.654036 104.141L35.2163 101.088C34.053 87.4204 37.6082 73.7665 45.2895 62.4015C52.9709 51.0365 64.3147 42.6468 77.4308 38.63L66.8891 4.20801Z" fill="#34C759" />
                        <path d="M-0.654297 104.141C1.08389 124.563 9.31262 143.893 22.8277 159.302C36.3428 174.711 54.4348 185.389 74.456 189.776L82.16 154.61C69.6467 151.868 58.3392 145.194 49.8923 135.563C41.4453 125.933 36.3024 113.852 35.216 101.088L-0.654297 104.141Z" fill="#FF383C" />
                        <path d="M74.4561 189.776C92.9557 193.829 112.241 192.319 129.885 185.437C147.528 178.555 162.743 166.608 173.612 151.1L144.133 130.438C137.339 140.13 127.83 147.597 116.803 151.898C105.775 156.199 93.7223 157.143 82.16 154.61L74.4561 189.776Z" fill="#FF8D28" />
                        <path d="M173.613 151.1C184.929 134.955 191 115.717 191 96H155C155 108.323 151.206 120.347 144.133 130.438L173.613 151.1Z" fill="#FF8D28" />
                    </svg>

                    <div className='flex items-center gap-12'>
                        <div className='flex flex-col items-start gap-8'>
                            {items.map((item) => (
                                <div key={item.label} className='flex items-center gap-1.5'>
                                    <span className='h-2 w-2 shrink-0 rounded-sm' style={{ backgroundColor: item.color }} />
                                    <span className='font-normal text-[14px]/[16px] text-[#1C2024] whitespace-nowrap'>{item.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className='flex flex-col items-start gap-8'>
                            {items.map((item) => (
                                <span key={item.label} className='font-normal text-[14px]/[16px] text-[#1C2024] whitespace-nowrap'>
                                    {item.count}({item.percent}%)
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DonutChart
