// src/components/WarehouseLocations.jsx
import React, { useState } from 'react';
import { WAREHOUSES, PICKUP_SCHEDULE_OPTIONS } from "../lib/warehouseData";
import './WarehouseLocations.css';

export default function WarehouseLocations({ variant = 'grid' }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  if (variant === 'modal') {
    return (
      <div className="warehouse-modal">
        <div className="warehouse-modal-content">
          <h2>Our Warehouse Locations</h2>
          <div className="warehouse-list">
            {WAREHOUSES.map(warehouse => (
              <div key={warehouse.id} className="warehouse-item-list">
                <h3>{warehouse.name}</h3>
                <p><strong>Address:</strong> {warehouse.address}, {warehouse.suburb}</p>
                <p><strong>Phone:</strong> <a href={`tel:${warehouse.phone}`}>{warehouse.phone}</a></p>
                <p><strong>Email:</strong> <a href={`mailto:${warehouse.email}`}>{warehouse.email}</a></p>
                <p><strong>Hours:</strong> {warehouse.hours}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className="warehouse-footer">
        <h3>Warehouse Locations</h3>
        <ul className="warehouse-footer-list">
          {WAREHOUSES.map(warehouse => (
            <li key={warehouse.id}>
              <strong>{warehouse.name}</strong><br />
              {warehouse.suburb}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Default: grid layout for About page
  return (
    <div className="warehouse-grid">
      <h2>Our Distribution Network</h2>
      <p className="warehouse-intro">Tycoon Sourcing operates 7 strategic warehouse locations across Australia for fast, reliable delivery.</p>
      
      <div className="warehouse-cards">
        {WAREHOUSES.map(warehouse => (
          <div 
            key={warehouse.id} 
            className={`warehouse-card ${selectedWarehouse?.id === warehouse.id ? 'active' : ''}`}
            onClick={() => setSelectedWarehouse(selectedWarehouse?.id === warehouse.id ? null : warehouse)}
          >
            <div className="warehouse-card-header">
              <h3>{warehouse.name}</h3>
              <span className="warehouse-region">{warehouse.region}</span>
            </div>
            
            <div className="warehouse-card-body">
              <div className="info-row">
                <span className="label">Address</span>
                <span className="value">{warehouse.address}</span>
              </div>
              <div className="info-row">
                <span className="label">Suburb</span>
                <span className="value">{warehouse.suburb}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone</span>
                <a href={`tel:${warehouse.phone}`} className="value">{warehouse.phone}</a>
              </div>
              <div className="info-row">
                <span className="label">Email</span>
                <a href={`mailto:${warehouse.email}`} className="value">{warehouse.email}</a>
              </div>
              <div className="info-row">
                <span className="label">Hours</span>
                <span className="value">{warehouse.hours}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
