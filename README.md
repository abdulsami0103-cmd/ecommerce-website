# Multivendor E-commerce Platform

A full-featured multivendor e-commerce platform built with React, Node.js, and MongoDB.

## Features

- Multi-vendor marketplace
- Physical & digital products
- Real-time chat between buyers and vendors
- Instant payouts via Stripe Connect
- Multi-language and multi-currency support
- Admin dashboard

## Tech Stack

- **Frontend**: React 18, Redux Toolkit, Tailwind CSS
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Payments**: Stripe Connect, PayPal, Razorpay

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Stripe account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp server/.env.example server/.env
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

The client runs on http://localhost:5173 and the server on http://localhost:5000.

## Project Structure

```
ecommerce-website/
├── client/          # React frontend
├── server/          # Node.js backend
└── package.json     # Root workspace config
```
