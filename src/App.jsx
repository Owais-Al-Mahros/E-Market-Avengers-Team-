import { Routes, Route } from 'react-router-dom'

import heroImg from './assets/hero.png'

import AdminDashboard from './pages/AdminDashboard'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom';




function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <>

      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/dashboard' element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} />
        <Route path='/login' element={<LoginPage setIsAdmin={setIsAdmin} />} />
      </Routes>

    </>
  )
}

export default App
