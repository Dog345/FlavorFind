import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, ChefHat, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { trackOrder } from '../api/guest';
import { useSessionStore } from '../stores/sessionStore';

/**
 * Status pipeline shown as steps:
 *   pending → confirmed → preparing → ready → served
 */
const STEPS = [
  { key: 'pending',    label: 'Order received',   icon: CheckCircle2    },
  { key: 'confirmed',  label: 'Confirmed',         icon: CheckCircle2    },
  { key: 'preparing',  label: 'Kitchen is cooking', icon: ChefHat        },
  { key: 'ready',      label: 'Ready to serve',    icon: UtensilsCrossed },
  { key: 'served',     label: 'Enjoy your meal!',  icon: UtensilsCrossed },
];

const STATUS_INDEX = {
  pending:   0,
  confirmed: 1,
  preparing: 2,
  ready:     3,
  served:    4,
};

// How often to poll the server for status updates (ms)
const POLL_INTERVAL = 15_000;

export default function OrderPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const token      = useSessionStore((s) => s.token);
  const hotel      = useSessionStore((s) => s.hotel);
  const table      = useSessionStore((s) => s.table);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:        ['order', id],
    queryFn:         () => trackOrder(token, id).then((r) => r.data.data),
    enabled:         !!token && !!id,
    refetchInterval: (query) => {
      // Stop polling once the order is served
      const status = query.state.data?.status;
      return status === 'served' || status === 'cancelled' ? false : POLL_INTERVAL;
    },
  });

  const order      = data;
  const statusKey  = order?.status || 'pending';
  const stepIndex  = STATUS_INDEX[statusKey] ?? 0;
  const isServed   = statusKey === 'served';
  const isCancelled = statusKey === 'cancelled';

  // Emoji feedback for current status
  const STATUS_EMOJI = {
    pending:   '🧾',
    confirmed: '✅',
    preparing: '👨‍🍳',
    ready:     '🍽️',
    served:    '🎉',
    cancelled: '❌',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
        <div className="w-10 h-10 border-2 border-[#2a2a2a] border-t-[#f5c842] rounded-full animate-spin" />
        <p className="text-[#888] text-sm">Loading your order…</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="text-4xl">😕</div>
        <p className="text-[#f5f5f0] font-semibold">Couldn't load your order</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 bg-[#f5c842] text-[#0a0a0a] rounded-xl font-semibold text-sm tap"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── Header ── */}
      <div className="bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-semibold text-[#f5f5f0] leading-none">
              Order #{String(order.order_number || order.id).slice(-6).toUpperCase()}
            </h1>
            {table && (
              <p className="text-[#888] text-xs mt-0.5">{table.label}</p>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center tap"
          >
            <RefreshCw size={14} className="text-[#888]" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">

        {/* ── Big status emoji ── */}
        <div className="flex flex-col items-center gap-3 fade-in">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background: isServed ? 'rgba(245,200,66,0.15)' : isCancelled ? 'rgba(239,68,68,0.1)' : '#1e1e1e',
              border: `1.5px solid ${isServed ? '#f5c842' : isCancelled ? '#ef4444' : '#2a2a2a'}`,
            }}
          >
            {STATUS_EMOJI[statusKey] || '🧾'}
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold text-[#f5f5f0]">
              {isCancelled ? 'Order Cancelled' : isServed ? 'Enjoy your meal!' : 'Order in progress'}
            </h2>
            {!isCancelled && !isServed && (
              <p className="text-[#888] text-sm mt-1">
                We'll update this page automatically
              </p>
            )}
          </div>
        </div>

        {/* ── Status stepper ── */}
        {!isCancelled && (
          <div className="bg-[#1e1e1e] rounded-2xl p-4 border border-[#2a2a2a]">
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const Icon     = step.icon;
                const done     = i < stepIndex;
                const current  = i === stepIndex;
                const upcoming = i > stepIndex;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {/* Icon/circle */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: done ? '#f5c842' : current ? 'rgba(245,200,66,0.15)' : '#2a2a2a',
                        border: current ? '1.5px solid #f5c842' : 'none',
                      }}
                    >
                      <Icon
                        size={14}
                        strokeWidth={2}
                        style={{ color: done ? '#0a0a0a' : current ? '#f5c842' : '#555' }}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className="text-sm"
                      style={{
                        color:      done ? '#f5f5f0' : current ? '#f5c842' : '#555',
                        fontWeight: current ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </span>

                    {/* Pulse for current step */}
                    {current && !isServed && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-[#f5c842] animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Items in this order ── */}
        {order.items?.length > 0 && (
          <div>
            <p className="text-[#888] text-xs uppercase tracking-widest mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((line) => (
                <div
                  key={line.id}
                  className="bg-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between border border-[#2a2a2a]"
                >
                  <div className="flex items-center gap-3">
                    {line.menu_item?.image_url && (
                      <img
                        src={line.menu_item.image_url}
                        alt={line.menu_item?.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="text-[#f5f5f0] text-sm font-medium">
                        {line.menu_item?.name || 'Item'}
                      </p>
                      <p className="text-[#888] text-xs">×{line.quantity}</p>
                    </div>
                  </div>
                  <p className="text-[#f5c842] text-sm font-semibold">
                    KES {Number(line.unit_price * line.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Order total ── */}
        <div className="bg-[#1e1e1e] rounded-2xl px-4 py-4 border border-[#2a2a2a]">
          <div className="flex justify-between items-center">
            <span className="text-[#888] text-sm">Order total</span>
            <span className="text-[#f5c842] font-bold text-xl">
              KES {Number(order.total_amount || 0).toLocaleString()}
            </span>
          </div>
          {order.notes && (
            <p className="text-[#888] text-xs mt-2 italic">"{order.notes}"</p>
          )}
        </div>

        {/* ── Order more ── */}
        <button
          onClick={() => navigate('/menu')}
          className="w-full py-4 rounded-2xl border border-[#2a2a2a] text-[#f5f5f0]
                     font-semibold text-sm tap bg-[#1e1e1e]"
        >
          Order more items
        </button>

      </div>
    </div>
  );
}
