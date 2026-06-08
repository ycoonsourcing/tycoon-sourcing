// src/lib/warehouseData.js
export const WAREHOUSES = [
  {
    id: 1,
    name: 'Brisbane Main Warehouse',
    address: '123 Logistics Avenue',
    suburb: 'Docklands, QLD 4215',
    phone: '+61 7 3000 1000',
    email: 'brisbane@tycoonsourcing.com',
    hours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-1PM',
    region: 'Queensland'
  },
  {
    id: 2,
    name: 'Sydney Distribution Centre',
    address: '456 Trade Street',
    suburb: 'Parramatta, NSW 2150',
    phone: '+61 2 9000 2000',
    email: 'sydney@tycoonsourcing.com',
    hours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-1PM',
    region: 'New South Wales'
  },
  {
    id: 3,
    name: 'Melbourne Fulfilment Hub',
    address: '789 Commerce Lane',
    suburb: 'Dandenong, VIC 3175',
    phone: '+61 3 9000 3000',
    email: 'melbourne@tycoonsourcing.com',
    hours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-1PM',
    region: 'Victoria'
  },
  {
    id: 4,
    name: 'Perth Western Hub',
    address: '321 Export Road',
    suburb: 'Kewdale, WA 6105',
    phone: '+61 8 9000 4000',
    email: 'perth@tycoonsourcing.com',
    hours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-1PM',
    region: 'Western Australia'
  },
  {
    id: 5,
    name: 'Adelaide South Warehouse',
    address: '654 Import Drive',
    suburb: 'Gillman, SA 5013',
    phone: '+61 8 8000 5000',
    email: 'adelaide@tycoonsourcing.com',
    hours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-1PM',
    region: 'South Australia'
  },
  {
    id: 6,
    name: 'Gold Coast Coastal Hub',
    address: '987 Shipping Boulevard',
    suburb: 'Southport, QLD 4215',
    phone: '+61 7 5000 6000',
    email: 'goldcoast@tycoonsourcing.com',
    hours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-1PM',
    region: 'Queensland'
  },
  {
    id: 7,
    name: 'Canberra Capital Centre',
    address: '159 Government Lane',
    suburb: 'Mitchell, ACT 2911',
    phone: '+61 2 6000 7000',
    email: 'canberra@tycoonsourcing.com',
    hours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-1PM',
    region: 'Australian Capital Territory'
  }
];

export const PICKUP_SCHEDULE_OPTIONS = [
  { days: 3, label: '3 Days' },
  { days: 5, label: '5 Days' },
  { days: 7, label: '7 Days' },
  { days: 10, label: '10 Days' }
];
