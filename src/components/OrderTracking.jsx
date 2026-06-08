// src/components/OrderTracking.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './OrderTracking.css';

const ORDER_STATUSES = [
  { key: 'pending', label: 'Pending', color: '#ffc107', icon: '⏳' },
  { key: 'confirmed', label: 'Confirmed', color: '#17a2b8', icon: '✓' },
  { key: 'processing', label: 'Processing', color: '#007bff', icon: '⚙️' },
  { key: 'shipped', label: 'Shipped', color: '#28a745', icon: '📦' },
  { key: 'delivered', label: 'Delivered', color: '#20c997', icon: '✅' }
];

export default function OrderTracking({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderStatus();
    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`order:${orderId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(prev => ({
            ...prev,
            ...payload.new,
            updated_at: new Date().toISOString()
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  const fetchOrderStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, updated_at, total_amount, items(*)')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Unable to fetch order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="order-tracking loading">Loading order status...</div>;
  }

  if (error) {
    return <div className="order-tracking error">{error}</div>;
  }

  if (!order) {
    return <div className="order-tracking error">Order not found.</div>;
  }

  const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.key === order.status);
  const currentStatus = ORDER_STATUSES[currentStatusIndex] || ORDER_STATUSES[0];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="order-tracking">
      <div className="tracking-header">
        <div className="order-info">
          <h3>Order #{order.order_number}</h3>
          <p className="order-amount">AUD ${parseFloat(order.total_amount || 0).toFixed(2)}</p>
        </div>
        <div className="order-date">
          <span className="label">Placed on</span>
          <span className="date">{formatDate(order.created_at)}</span>
        </div>
      </div>

      <div className="tracking-timeline">
        <div className="timeline-container">
          {ORDER_STATUSES.map((status, index) => (
            <div key={status.key} className="timeline-item">
              <div className={`timeline-dot ${index <= currentStatusIndex ? 'active' : ''}`}
                   style={{ backgroundColor: index <= currentStatusIndex ? status.color : '#ddd' }}>
                <span className="status-icon">{status.icon}</span>
              </div>
              <div className="timeline-content">
                <h4 className={index <= currentStatusIndex ? 'active' : ''}>
                  {status.label}
                </h4>
                {index === currentStatusIndex && (
                  <p className="current-status">Current Status</p>
                )}
              </div>
              {index < ORDER_STATUSES.length - 1 && (
                <div className={`timeline-line ${index < currentStatusIndex ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="tracking-details">
        <div className="status-badge" style={{ backgroundColor: currentStatus.color }}>
          <span className="icon">{currentStatus.icon}</span>
          <span className="label">{currentStatus.label}</span>
        </div>

        <div className="details-grid">
          <div className="detail-item">
            <span className="label">Order Status</span>
            <span className="value capitalize">{order.status}</span>
          </div>
          <div className="detail-item">
            <span className="label">Last Updated</span>
            <span className="value">{formatDate(order.updated_at)}</span>
          </div>
          {order.items && order.items.length > 0 && (
            <div className="detail-item full-width">
              <span className="label">Items ({order.items.length})</span>
              <div className="items-list">
                {order.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <span className="item-name">{item.product_name || 'Product'}</span>
                    <span className="item-qty">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tracking-actions">
        <button onClick={fetchOrderStatus} className="btn-refresh">
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );
}
