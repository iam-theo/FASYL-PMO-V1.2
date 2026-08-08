export function OverallProgressIcon({ className = '' }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3" stroke="#08BD66" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 3C16.9706 3 21 7.02944 21 12" stroke="#08BD66" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
            <path d="M12 8V12L15 14" stroke="#08BD66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function TasksCompletedIcon({ className = '' }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 12C2.5 7.52166 2.5 5.28248 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28248 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1087C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1087C2.5 18.7175 2.5 16.4783 2.5 12Z" fill="#228CEE" fillOpacity="0.3" stroke="#228CEE" strokeWidth="1.5" />
            <path d="M8 12.5L10.5 15L16 9" stroke="#228CEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function ResourcesAllocatedIcon({ className = '' }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 22V19C20 17.1144 20 16.1716 19.4142 15.5858C18.8284 15 17.8856 15 16 15H14L12 17L10 15H8C6.11438 15 5.17157 15 4.58579 15.5858C4 16.1716 4 17.1144 4 19V22" stroke="#00A0B6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 15V22" stroke="#00A0B6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 15V22" stroke="#00A0B6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 9V7C15.5 5.067 13.933 3.5 12 3.5C10.067 3.5 8.5 5.067 8.5 7V9C8.5 10.933 10.067 12.5 12 12.5C13.933 12.5 15.5 10.933 15.5 9Z" fill="#00A0B6" fillOpacity="0.3" stroke="#00A0B6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function DaysRemainingIcon({ className = '' }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C6.75329 21.5 2.5 17.2467 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12Z" fill="#FF8D28" fillOpacity="0.3" stroke="#FF8D28" strokeWidth="1.5" />
            <path d="M12 8V12L14.5 13.5" stroke="#FF8D28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function LifecycleCheckIcon({ className = '' }) {
    return (
        <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="16" fill="#1B3C4A" />
            <path d="M22.7953 9.85322L13.2487 19.0666L10.7153 16.3599C10.2487 15.9199 9.51534 15.8932 8.982 16.2666C8.462 16.6532 8.31534 17.3332 8.63534 17.8799L11.6353 22.7599C11.9287 23.2132 12.4353 23.4932 13.0087 23.4932C13.5553 23.4932 14.0753 23.2132 14.3687 22.7599C14.8487 22.1332 24.0087 11.2132 24.0087 11.2132C25.2087 9.98655 23.7553 8.90655 22.7953 9.83989V9.85322Z" fill="white" />
        </svg>
    )
}
