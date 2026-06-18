# Gensyn Tracker

A simple web application built for the Gensyn Pioneer community to track, organize, and manage contributions in one place.

## Live Demo

https://gensyn-tracker.onrender.com

## Features

* User Registration and Login
* JWT Authentication
* Personal Contribution Dashboard
* Add, Edit, and Delete Contributions
* Upload Screenshots
* Export Contributions as CSV
* Secure User-Specific Data Access
* Responsive and Clean UI

## Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Deployment

* Render

## Project Structure

```text
gensyn-tracker/
├── backend-public/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── index.html
├── login.html
├── register.html
├── script.js
├── styles.css
└── README.md
```

## Installation

### Clone Repository

```bash
git clone https://github.com/SUMIT4859/gensyn-tracker.git
cd gensyn-tracker
```

### Install Dependencies

```bash
cd backend-public
npm install
```

### Environment Variables

Create a `.env` file inside `backend-public`:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Start Server

```bash
npm start
```

Server will run on:

```text
http://localhost:4000
```

## Usage

1. Create an account.
2. Login to your dashboard.
3. Add contributions with details and screenshots.
4. Edit or delete entries anytime.
5. Export contribution history as a CSV file.

## Security

* JWT-based authentication
* Protected API routes
* User-specific data isolation
* Secure file upload handling

## Future Improvements

* Contribution analytics
* Dark mode
* Search and filtering
* User profiles
* Admin dashboard

## Authors

* Sumit Kumar Pandit

Built for the Gensyn Pioneer Community.
