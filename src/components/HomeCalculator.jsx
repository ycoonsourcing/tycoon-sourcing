// src/components/HomeCalculator.jsx
import React, { useState, useEffect } from 'react';
import { PICKUP_SCHEDULE_OPTIONS } from '../config/warehouseData';
import './HomeCalculator.css';

export default function HomeCalculator() {
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [pickupDays, setPickupDays] = useState(5);
  const [margin, setMargin] = useState(20);
  const [results, setResults] = useState(null);

  useEffect(() => {
    calculateEstimate();
  }, [quantity, unitPrice, pickupDays, margin]);

  const calculateEstimate = () => {
    if (!quantity || !unitPrice) {
      setResults(null);
      return;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const totalCost = qty * price;
    const markupAmount = (totalCost * margin) / 100;
    const estimatedSRP = totalCost + markupAmount;
    const profitPerUnit = markupAmount / qty;

    setResults({
      totalCost: totalCost.toFixed(2),
      markup: markupAmount.toFixed(2),
      estimatedSRP: estimatedSRP.toFixed(2),
      profitPerUnit: profitPerUnit.toFixed(2),
      profitMargin: margin
    });
  };

  return (
    <div className="home-calculator">
      <div className="calculator-header">
        <h2>Wholesale Calculator</h2>
        <p>Estimate your margin and selling price</p>
      </div>

      <div className="calculator-form">
        <div className="form-group">
          <label htmlFor="quantity">Quantity (units)</label>
          <input
            id="quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="unitPrice">Cost per Unit (AUD)</label>
          <input
            id="unitPrice"
            type="number"
            placeholder="Enter unit price"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="pickupDays">Estimated Pickup Schedule</label>
          <select
            id="pickupDays"
            value={pickupDays}
            onChange={(e) => setPickupDays(parseInt(e.target.value))}
            className="pickup-schedule-dropdown"
          >
            {PICKUP_SCHEDULE_OPTIONS.map(option => (
              <option key={option.days} value={option.days}>
                {option.label}
              </option>
            ))}
          </select>
          <small className="schedule-hint">
            Estimated delivery timeframe from warehouse
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="margin">Target Markup (%)</label>
          <div className="margin-slider-wrapper">
            <input
              id="margin"
              type="range"
              min="5"
              max="100"
              step="5"
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="margin-slider"
            />
            <span className="margin-value">{margin}%</span>
          </div>
        </div>
      </div>

      {results && (
        <div className="calculator-results">
          <div className="results-grid">
            <div className="result-card">
              <span className="result-label">Total Cost</span>
              <span className="result-value primary">
                ${results.totalCost}
              </span>
            </div>

            <div className="result-card">
              <span className="result-label">Markup Amount</span>
              <span className="result-value success">
                +${results.markup}
              </span>
            </div>

            <div className="result-card">
              <span className="result-label">Profit per Unit</span>
              <span className="result-value info">
                ${results.profitPerUnit}
              </span>
            </div>

            <div className="result-card highlight">
              <span className="result-label">Estimated SRP</span>
              <span className="result-value large">
                ${results.estimatedSRP}
              </span>
            </div>
          </div>

          <div className="results-summary">
            <p>
              At <strong>{results.profitMargin}%</strong> markup, you'd sell {quantity} units 
              at <strong>${(results.estimatedSRP / quantity).toFixed(2)}</strong> each,
              earning <strong>${results.markup}</strong> profit.
            </p>
            <p className="schedule-note">
              With {pickupDays}-day pickup schedule, plan inventory accordingly.
            </p>
          </div>
        </div>
      )}

      <div className="calculator-note">
        <p><strong>Note:</strong> This calculator is for estimation purposes. Actual costs may vary based on order size, shipping, and payment terms.</p>
      </div>
    </div>
  );
}
