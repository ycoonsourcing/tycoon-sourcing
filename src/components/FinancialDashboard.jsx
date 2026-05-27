import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { loadSupabase } from '@/lib/supabase';

export default function FinancialDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, month, quarter, year
  const [selectedPeriod, setSelectedPeriod] = useState(new Date());

  useEffect(() => {
    loadFinancialData();
  }, [filter, selectedPeriod]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const sb = await loadSupabase();

      // Get all deals with batches and invoices
      const { data: deals } = await sb
        .from('deals')
        .select('id, deal_code, order_value_lkr, total_units, created_at');

      const { data: batches } = await sb
        .from('batches')
        .select('id, deal_id, batch_num, units, amount_lkr, handling_fee, storage_fee, service_fee, status, created_at');

      const { data: invoices } = await sb
        .from('invoices')
        .select('id, batch_id, amount, status, created_at');

      // Calculate financials
      const financialData = calculateFinancials(deals, batches, invoices);
      setData(financialData);
    } catch (e) {
      console.error('Failed to load financial data:', e);
    }
    setLoading(false);
  };

  const calculateFinancials = (deals, batches, invoices) => {
    if (!deals || !batches || !invoices) return null;

    // Total sales (sum of all invoice amounts)
    const totalSales = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Total costs (sum of all fees)
    const totalCosts = batches.reduce((sum, b) => {
      const handling = b.handling_fee || 0;
      const storage = b.storage_fee || 0;
      const service = b.service_fee || 0;
      return sum + handling + storage + service;
    }, 0);

    // Total profit
    const totalProfit = totalSales - totalCosts;
    const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : 0;

    // By deal breakdown
    const byDeal = deals.map(deal => {
      const dealBatches = batches.filter(b => b.deal_id === deal.id);
      const dealInvoices = invoices.filter(inv => dealBatches.some(b => b.id === inv.batch_id));
      
      const sales = dealInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const costs = dealBatches.reduce((sum, b) => sum + ((b.handling_fee || 0) + (b.storage_fee || 0) + (b.service_fee || 0)), 0);
      const profit = sales - costs;

      return {
        dealCode: deal.deal_code,
        dealId: deal.id,
        sales,
        costs,
        profit,
        batchCount: dealBatches.length,
        units: deal.total_units,
      };
    }).sort((a, b) => b.profit - a.profit);

    // By batch breakdown
    const byBatch = batches.map(batch => {
      const batchInvoices = invoices.filter(inv => inv.batch_id === batch.id);
      const sales = batchInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const costs = (batch.handling_fee || 0) + (batch.storage_fee || 0) + (batch.service_fee || 0);
      const profit = sales - costs;

      return {
        batchNum: batch.batch_num,
        batchId: batch.id,
        dealId: batch.deal_id,
        sales,
        handling: batch.handling_fee || 0,
        storage: batch.storage_fee || 0,
        service: batch.service_fee || 0,
        costs,
        profit,
        status: batch.status,
      };
    }).sort((a, b) => b.profit - a.profit);

    // Cost breakdown
    const costBreakdown = {
      handling: batches.reduce((sum, b) => sum + (b.handling_fee || 0), 0),
      storage: batches.reduce((sum, b) => sum + (b.storage_fee || 0), 0),
      service: batches.reduce((sum, b) => sum + (b.service_fee || 0), 0),
    };

    // Status breakdown
    const statusBreakdown = {
      pending: batches.filter(b => b.status === 'pending').length,
      paid: batches.filter(b => b.status === 'paid').length,
      released: batches.filter(b => b.status === 'released').length,
      cancelled: batches.filter(b => b.status === 'cancelled').length,
    };

    return {
      summary: {
        totalSales,
        totalCosts,
        totalProfit,
        profitMargin,
        totalBatches: batches.length,
        totalDeals: deals.length,
      },
      byDeal,
      byBatch,
      costBreakdown,
      statusBreakdown,
    };
  };

  const fmt = (num) => {
    if (!num) return 'LKR 0';
    return 'LKR ' + (+num).toLocaleString('en-AU', { maximumFractionDigits: 2 });
  };

  const Card = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-slate-200 p-4 space-y-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-600 uppercase">{title}</h3>
        <Icon size={16} className={`text-${color}-600`} />
      </div>
      <div className="text-xl font-black text-slate-900">{value}</div>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </motion.div>
  );

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Financial Dashboard</h1>
        <p className="text-sm text-slate-600">Complete overview of profits, sales, and costs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Total Sales"
          value={fmt(data.summary.totalSales)}
          icon={DollarSign}
          color="green"
          subtitle={`${data.summary.totalBatches} batches`}
        />
        <Card
          title="Total Costs"
          value={fmt(data.summary.totalCosts)}
          icon={AlertCircle}
          color="red"
          subtitle={`Fees & charges`}
        />
        <Card
          title="Total Profit"
          value={fmt(data.summary.totalProfit)}
          icon={TrendingUp}
          color="blue"
          subtitle={`${data.summary.profitMargin}% margin`}
        />
        <Card
          title="Active Deals"
          value={data.summary.totalDeals}
          icon={Calendar}
          color="purple"
          subtitle={`${data.summary.totalBatches} total batches`}
        />
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="font-bold text-slate-900">Cost Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Handling Fees (3%)</span>
              <span className="font-bold">{fmt(data.costBreakdown.handling)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-slate-600">Storage Fees</span>
              <span className="font-bold">{fmt(data.costBreakdown.storage)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-slate-600">Service Fees (4%/mo)</span>
              <span className="font-bold">{fmt(data.costBreakdown.service)}</span>
            </div>
            <div className="flex justify-between bg-slate-100 -mx-4 -mb-4 px-4 py-2 rounded-b font-bold">
              <span>Total Costs</span>
              <span>{fmt(data.summary.totalCosts)}</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="font-bold text-slate-900">Batch Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-amber-600 font-semibold">Pending</span>
              <span className="font-bold">{data.statusBreakdown.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600 font-semibold">Paid</span>
              <span className="font-bold">{data.statusBreakdown.paid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600 font-semibold">Released</span>
              <span className="font-bold">{data.statusBreakdown.released}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 font-semibold">Cancelled</span>
              <span className="font-bold">{data.statusBreakdown.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="font-bold text-slate-900">Key Metrics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Profit Margin</span>
              <span className="font-bold text-green-600">{data.summary.profitMargin}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Avg Profit/Batch</span>
              <span className="font-bold">{fmt(data.summary.totalProfit / data.summary.totalBatches)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Avg Sale/Batch</span>
              <span className="font-bold">{fmt(data.summary.totalSales / data.summary.totalBatches)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* By Deal Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Profitability by Deal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-bold text-slate-700">Deal Code</th>
                <th className="px-4 py-2 text-right font-bold text-slate-700">Sales</th>
                <th className="px-4 py-2 text-right font-bold text-slate-700">Costs</th>
                <th className="px-4 py-2 text-right font-bold text-slate-700">Profit</th>
                <th className="px-4 py-2 text-center font-bold text-slate-700">Batches</th>
              </tr>
            </thead>
            <tbody>
              {data.byDeal.map((deal, idx) => (
                <tr key={deal.dealId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-2 font-bold text-slate-900">{deal.dealCode}</td>
                  <td className="px-4 py-2 text-right text-green-600">{fmt(deal.sales)}</td>
                  <td className="px-4 py-2 text-right text-red-600">{fmt(deal.costs)}</td>
                  <td className="px-4 py-2 text-right font-bold text-blue-600">{fmt(deal.profit)}</td>
                  <td className="px-4 py-2 text-center text-slate-600">{deal.batchCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Batch Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Detailed Batch Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-slate-700">Batch #</th>
                <th className="px-3 py-2 text-right font-bold text-slate-700">Sales</th>
                <th className="px-3 py-2 text-right font-bold text-slate-700">Handling</th>
                <th className="px-3 py-2 text-right font-bold text-slate-700">Storage</th>
                <th className="px-3 py-2 text-right font-bold text-slate-700">Service</th>
                <th className="px-3 py-2 text-right font-bold text-slate-700">Profit</th>
                <th className="px-3 py-2 text-center font-bold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.byBatch.slice(0, 20).map((batch, idx) => (
                <tr key={batch.batchId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 font-bold text-slate-900">#{batch.batchNum}</td>
                  <td className="px-3 py-2 text-right text-green-600 text-xs">{fmt(batch.sales)}</td>
                  <td className="px-3 py-2 text-right text-red-600 text-xs">{fmt(batch.handling)}</td>
                  <td className="px-3 py-2 text-right text-red-600 text-xs">{fmt(batch.storage)}</td>
                  <td className="px-3 py-2 text-right text-red-600 text-xs">{fmt(batch.service)}</td>
                  <td className="px-3 py-2 text-right font-bold text-blue-600">{fmt(batch.profit)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      batch.status === 'released' ? 'bg-green-100 text-green-700' :
                      batch.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                      batch.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.byBatch.length > 20 && (
          <div className="p-3 bg-slate-50 text-center text-xs text-slate-600">
            Showing 20 of {data.byBatch.length} batches
          </div>
        )}
      </div>
    </div>
  );
}
