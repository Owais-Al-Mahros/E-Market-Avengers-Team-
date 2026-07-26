import { Routes, Route } from 'react-router-dom'


import AdminDashboard from './pages/AdminDashboard'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom';




function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const StorgedAdmin = localStorage.getItem('isAdmin');
    if (StorgedAdmin === 'true') {
      setIsAdmin(true)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <><h1>... waite a minute</h1></>

  }

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
