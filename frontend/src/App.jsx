import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
// import CategoryPage from "./pages/CategoryPage";

import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "./hooks/useUserStore";
import { useEffect } from "react";
// import { Home } from "lucide-react";
// import { L } from "framer-motion/dist/types.d-6pKw1mTI";
import LoadingSpinner from "./components/LoadingSpinner";
// import CartPage from "./pages/CartPage";
// import { useCartStore } from "./stores/useCartStore";
// import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
// import PurchaseCancelPage from "./pages/PurchaseCancelPage";

function App() {

  const { user, checkAuth, checkingAuth } = useUserStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (checkingAuth) {
    return <LoadingSpinner />;
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white relative overflow-hidden'>
      {/* Background gradient */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute inset-0'>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3)_0%,rgba(10,80,60,0.2)_45%,rgba(0,0,0,0.1)_100%)]' />
				</div>
			</div>
      <div className='relative z-50 pt-20'>
        <Navbar />
        <Routes>
          <Route path='/' element={ user ? <HomePage /> : <Navigate to="/login" /> }></Route>
          <Route path='/signup' element={ !user ? <SignupPage /> : <Navigate to="/" /> }></Route>
          <Route path='/login' element={ !user ? <LoginPage/> : <Navigate to="/" /> }></Route>
          <Route path='/secret-dashboard' element={ user?.role==="admin" ? <AdminPage/> : <Navigate to="/login" /> }></Route>
        </Routes>
      </div>
      <Toaster />
      
    </div>
  )
}

export default App
