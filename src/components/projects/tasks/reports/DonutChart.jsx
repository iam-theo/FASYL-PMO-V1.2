const DONUT_CENTER = 96;
const DONUT_RADIUS = 78;
const DONUT_STROKE = 30;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function DonutChart({ title, items }) {
    const segments = Array.isArray(items) ? items : [];
    const total = segments.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

    // Each segment is a circle stroke with a dash of its own length, offset by
    // the cumulative length of the segments before it so they tile seamlessly.
    const arcs = segments.map((item, index) => {
        const length = total > 0 ? ((Number(item.count) || 0) / total) * DONUT_CIRCUMFERENCE : 0;
        const previous = segments
            .slice(0, index)
            .reduce(
                (sum, prev) => sum + (total > 0 ? (Number(prev.count) || 0) / total : 0),
                0,
            ) * DONUT_CIRCUMFERENCE;

        return {
            key: item.label,
            color: item.color,
            dash: length,
            gap: Math.max(0, DONUT_CIRCUMFERENCE - length),
            offset: -previous,
        };
    });

    return (
        <div className='flex flex-col gap-4'>
            <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>{title}</h3>

            <div className='flex min-h-56 items-center justify-center rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-6'>
                <div className='flex flex-wrap items-center justify-center gap-9'>
                    <svg width="160" height="160" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className='shrink-0'>
                        {/* -90° so the first segment starts at 12 o'clock, like a clock face. */}
                        <g transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}>
                            <circle
                                cx={DONUT_CENTER}
                                cy={DONUT_CENTER}
                                r={DONUT_RADIUS}
                                stroke="#E4E7EC"
                                strokeWidth={DONUT_STROKE}
                            />
                            {arcs.map((arc) => (
                                <circle
                                    key={arc.key}
                                    cx={DONUT_CENTER}
                                    cy={DONUT_CENTER}
                                    r={DONUT_RADIUS}
                                    fill="none"
                                    stroke={arc.color}
                                    strokeWidth={DONUT_STROKE}
                                    // A zero-length dash draws nothing (butt caps), so a
                                    // single segment filling the whole ring must omit the
                                    // dash pattern entirely.
                                    {...(arc.gap > 0
                                        ? {
                                            strokeDasharray: `${arc.dash} ${arc.gap}`,
                                            strokeDashoffset: arc.offset,
                                        }
                                        : {})}
                                />
                            ))}
                        </g>
                        {segments.length === 0 && (
                            <text
                                x={DONUT_CENTER}
                                y={DONUT_CENTER}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#667085"
                                fontSize="11"
                                fontFamily="Inter, sans-serif"
                            >
                                No data
                            </text>
                        )}
                    </svg>

                    {segments.length === 0 ? (
                        <p className='font-normal text-[14px]/[20px] text-[#636363]'>
                            No data to chart yet.
                        </p>
                    ) : (
                        <div className='flex items-center gap-12'>
                            <div className='flex flex-col items-start gap-8'>
                                {segments.map((item) => (
                                    <div key={item.label} className='flex items-center gap-1.5'>
                                        <span className='h-2 w-2 shrink-0 rounded-sm' style={{ backgroundColor: item.color }} />
                                        <span className='font-normal text-[14px]/[16px] text-[#1C2024] whitespace-nowrap'>{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className='flex flex-col items-start gap-8'>
                                {segments.map((item) => (
                                    <span key={item.label} className='font-normal text-[14px]/[16px] text-[#1C2024] whitespace-nowrap'>
                                        {item.count}({item.percent}%)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DonutChart
