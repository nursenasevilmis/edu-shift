import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import RoleRedirect from './components/RoleRedirect'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import BranchManager from './pages/BranchManager'
import CourseManager from './pages/CourseManager'
import TeacherManager from './pages/TeacherManager'
import ConstraintCalendar from './pages/ConstraintCalendar'
import AssignmentManager from './pages/AssignmentManager'
import ScheduleGrid from './pages/ScheduleGrid'
import UserManager from './pages/UserManager'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<PrivateRoute><RoleRedirect /></PrivateRoute>} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="branches" element={<BranchManager />} />
        <Route path="courses" element={<CourseManager />} />
        <Route path="teachers" element={<TeacherManager />} />
        <Route path="constraints" element={<ConstraintCalendar />} />
        <Route path="assignments" element={<AssignmentManager />} />
        <Route path="schedule" element={<ScheduleGrid />} />
        <Route path="users" element={<UserManager />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App