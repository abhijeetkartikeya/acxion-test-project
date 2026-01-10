# Library Management System  
**Assessment Project – Acxiom**

## Overview
This project is a **Library Management System** developed as part of an **assessment test for Acxiom**.  
The application demonstrates a structured, web-based approach to managing core library operations such as authentication, book issue/return, and fine calculation.

The goal of this project is to showcase **clean structure, functional correctness, and practical implementation** suitable for an assessment environment.

---

## Problem Statement
Traditional library management processes are manual and inefficient.  
This system provides a simple solution to manage:

- Role-based authentication (Admin / User)
- Book issuing and returning
- Fine calculation for late returns
- Centralized control of basic library operations

---

## Features

### Authentication & Roles
- **Admin**
  - Access administrative controls
  - Monitor library activity
- **User**
  - View issued books
  - Track return status and fines

### Library Operations
- Issue books to users
- Return books
- Automatic fine calculation  
  - Fine rate: **₹10 per day**

### General
- Simple and clean user interface
- Browser-based application
- Lightweight and fast execution

---

## Technology Stack

| Component | Technology |
|----------|------------|
| Frontend | HTML, CSS |
| Logic | JavaScript |
| Runtime | Node.js |
| Package Manager | npm |

---

## Project Structure

```
acxiom-test-project/
│
├── acxiom_project/        # Core application files
├── README.md              # Project documentation
├── .gitattributes
└── package.json
```

---

## Installation & Setup

### Prerequisites
- Node.js (v16 or later recommended)
- npm

### Steps to Run

1. Download or clone the repository
2. Open the project directory
3. Open terminal / command prompt in the project folder
4. Run the following commands:

```bash
npm install
npm start
```

---

## Accessing the Application

After starting the server, open the browser and navigate to:

```
http://localhost:3000/login.html
```

---

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | adm | adm |
| User | user | user |

**Fine Policy:** ₹10 per day for late book returns

---

## Assumptions
- Single-library environment
- Local execution for assessment purposes
- Static or in-memory data handling

---

## Limitations
- No persistent database
- No encrypted authentication
- Designed strictly within assessment scope

---

## Future Enhancements
- Database integration (MySQL / MongoDB)
- Secure authentication using JWT
- Book search and filtering
- Admin dashboard and analytics
- Cloud deployment

---

## Assessment Context
This project was developed specifically for an **assessment test conducted by Acxiom** to demonstrate:

- Logical problem-solving skills
- Clean project organization
- Practical JavaScript implementation
- Basic system design understanding

---

## Author
**Abhijeet Kartikeya**  
B.Tech Student  
Library Management System – Assessment Submission

---

## Notes for Reviewers
The project is intentionally kept simple and readable, focusing on functionality, clarity, and extensibility within a limited assessment timeline.