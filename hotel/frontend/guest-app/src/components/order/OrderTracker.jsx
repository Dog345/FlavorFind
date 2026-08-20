const STEPS = [
  { key: 'received', label: 'Order Received' },
  { key: 'sent_to_kitchen', label: 'Sent to Kitchen' },
  { key: 'preparing', label: 'Being Prepared' },
  { key: 'ready', label: 'Ready to Serve' },
  { key: 'served', label: 'Served' },
];

/** Vertical progress timeline. Steps before the current status are filled;
 * the current step pulses; steps after are empty circles. */
export default function OrderTracker({ status, items }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="pt-3">
      <ol>
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`h-3.5 w-3.5 rounded-full shrink-0 ${current ? 'animate-pulseDot' : ''}`}
                  style={{
                    background: done || current ? 'var(--color-primary)' : 'transparent',
                    border: done || current ? 'none' : '2px solid #EAE2D8',
                  }}
                  aria-hidden="true"
                />
                {!isLast && (
                  <span
                    className="w-[2px] flex-1 min-h-[22px]"
                    style={{ background: done ? 'var(--color-primary)' : '#EAE2D8' }}
                  />
                )}
              </div>
              <span
                className={`text-[13px] pb-5 ${
                  done || current ? 'font-semibold text-ink' : 'text-ink-soft'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {items?.length > 0 && (
        <div className="mt-1 pt-3 border-t border-line space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-[13px]">
              <span className="text-ink">
                {item.quantity}× {item.name}
              </span>
              <span className="text-ink-soft capitalize">{item.status?.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
