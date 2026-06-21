# PawSupport 🐾

PawSupport is a web-based platform that connects animal shelters and NGOs with donors and adopters. The system allows NGOs to manage animals, create donation requests, review adoption requests, and track donations, while donors can contribute resources, request adoptions, and monitor their activities.

## Features

### Donor
* Register and login
* Update profile information
* Browse available animals
* Submit adoption requests
* Make direct donations
* Donate to NGO requests
* Track donation history
* View adoption request status

### NGO
* Register and login
* Manage organization profile
* Add and remove animals
* Create and manage donation requests
* Review adoption requests
* Approve or reject donations
* Mark donations as received
* View organization statistics
---

## Tech Stack

### Frontend
* HTML5
* CSS3
* JavaScript (Vanilla JS)

### Backend
* Node.js
* Express.js

### Database
* MySQL
---

## Project Structure

```text
PawSupport/
│
├── public/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── pages/
│       ├── login.html
│       ├── login-script.js
│       ├── login-style.css
│       ├── register.html
│       ├── register-script.js
│       ├── register-style.css
│       ├── donor/
│       └── ngo/
├── images/
├── sql/
│   ├── schema.sql
│   ├── procedures.sql
│   ├── triggers.sql
│   └── sample_data.sql
├── server.js
├── db.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```
---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ManyaKalkur/pawsupport.git
cd pawsupport
```

### 2. Install Dependencies

Navigate to the backend folder:
```bash
cd backend
npm install
```
This installs:
* Express
* MySQL2
* CORS
* Dotenv
* Body Parser
---

### 3. Configure Environment Variables

Create a `.env` file inside the backend folder.
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pawsupport
```
---

### 4. Create Database

Open MySQL Workbench and create the database:
```sql
CREATE DATABASE pawsupport;
USE pawsupport;
```
Run all SQL scripts provided in the project to create:
* users
* donors
* ngos
* animals
* donations
* donation_requests
* adoption_requests
tables, triggers, procedures and functions.
---

### 5. Start Backend Server

```bash
node server.js
```
or
```bash
npm start
```
Server should start on:
```text
http://localhost:3000
```
---

### 6. Run Frontend

Open the frontend using:
```text
index.html
```
or use the VS Code Live Server extension.
---

## Default Workflow

### NGO
1. Register NGO account
2. Add animals
3. Create donation requests
4. Review adoption requests
5. Manage donations

### Donor
1. Register donor account
2. Browse animals
3. Request adoption
4. Donate directly or through requests
5. Track donation and adoption status
---

## Future Enhancements
* Email notifications
* Payment gateway integration
* Image uploads instead of URLs
* AI-based animal recommendation system
* Real time NGO and donor communication
* Mobile application support
