# Healthcare Web Application

## 📚 Overview
This healthcare web application facilitates real-time appointment booking, prescription management, and status updates for both patients and doctors.

### 🚀 Key Features
- **Patient Dashboard:** Book, view, and manage appointments.
- **Doctor Dashboard:** View appointments, prescribe medicine, and update statuses.
- **Authentication:** Secure login and registration system.
- **Prescription Management:** Doctors can prescribe and view prescriptions.
- **Real-Time Updates:** Automatic refresh of appointments and prescriptions.
- **Server-Side Rendering (SSR):** Optimized page loading and SEO with Next.js.
- **API Routes:** Backend API functionality integrated directly into Next.js.

## 🛠️ Technologies Used
- **Frontend:** Next.js, React, Apollo Client
- **Backend:** Node.js, Express.js (via Next.js API Routes)
- **Database:** MongoDB
- **GraphQL:** For efficient data fetching and updates
- **Styling:** Tailwind CSS

## 🔑 Authentication
- **JWT Authentication:** Secure token-based authentication for users.
- **NextAuth.js:** Authentication management for Next.js.

## 📄 API Endpoints (Next.js API Routes)

### Authentication
- `/api/auth/login` - **Login Endpoint**
- `/api/auth/register` - **Registration Endpoint**

### Dashboards
- `/dashboard/patient` - **Patient Dashboard**
- `/dashboard/doctor` - **Doctor Dashboard**

## 📆 Patient Dashboard
- **View Appointments:** Filter by date.
- **Book Appointments:** Select doctor, date, and time.
- **Update Appointments:** Modify doctor, date, and time.
- **View Prescription:** View prescription details from doctors.

## 🩺 Doctor Dashboard
- **View Appointments:** Filter by date.
- **Update Status:** Change appointment status.
- **Prescribe Medicine:** Add medicines and diagnosis.
- **View Prescription:** View existing prescriptions.

## 📦 Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the application:
   ```sh
   npm run dev
   ```

## 🧪 Testing
Run tests:
```sh
npm test
```

## 🏗️ Build for Production
Build and start the production server:
```sh
npm run build
npm start
```

## 🤝 Contribution
Feel free to contribute by opening issues or submitting pull requests.

## 📞 Support
For any inquiries, please reach out to [support@example.com](mailto:support@example.com).

## 📝 License
This project is licensed under the MIT License.
