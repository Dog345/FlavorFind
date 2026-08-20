const STATUS_LABELS = {
  received: 'Order Received',
  sent_to_kitchen: 'Sent to Kitchen',
  preparing: 'Being Prepared',
  ready: 'Ready to Serve',
  served: 'Served',
};

const STATUS_TONE = {
  received: 'bg-line text-ink-soft',
  sent_to_kitchen: 'bg-line text-ink-soft',
  preparing: 'bg-primary-light text-primary-dark',
  ready: 'bg-[#EAF3E6] text-[#4C7A3D]',
  served: 'bg-[#EAF3E6] text-[#4C7A3D]',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        STATUS_TONE[status] || STATUS_TONE.received
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
