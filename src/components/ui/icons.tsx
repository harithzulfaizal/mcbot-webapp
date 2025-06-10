// src/components/ui/icons.tsx

/**
 * Renders a stop icon component.
 *
 * @param {object} props - The component props.
 * @param {number} [props.size=16] - The size of the icon.
 * @returns {JSX.Element} The stop icon component.
 */
export const StopIcon = ({ size = 16 }: { size?: number }) => {
    return (
        <svg
            height={size}
            viewBox="0 0 16 16"
            width={size}
            style={{ color: 'currentcolor' }}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3 3H13V13H3V3Z"
                fill="currentColor"
            />
        </svg>
    );
};
