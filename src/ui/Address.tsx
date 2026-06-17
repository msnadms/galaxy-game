import { useUIStore } from "../store/uiStore"
import './Address.css'

export function Address() {
    const address = useUIStore((s) => s.address)
    return (
        <div className="address">
            {address?.map((segment, i) => (
                <span key={i}>
                    {i > 0 && <span className="address-separator">›</span>}
                    <span className={`address-segment${i === address.length - 1 ? ' address-segment--current' : ''}`}>
                        {segment.name}
                    </span>
                </span>
            ))}
        </div>
    )
}
