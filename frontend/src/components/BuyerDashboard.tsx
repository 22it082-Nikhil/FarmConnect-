// Import required libraries and components
import { motion } from 'framer-motion' // For smooth animations and transitions
import { useState, useEffect, useMemo } from 'react' // For managing component state
import { useClerk } from '@clerk/clerk-react'
import {
  // Navigation and UI icons
  ShoppingCart, Users, BarChart3, Calendar, MapPin, IndianRupee,
  TrendingUp, AlertCircle, CheckCircle, Clock, Star, Settings, LogOut, Plus,
  Search, Filter, Eye, MessageSquare, FileText, Download, Upload, Crop,
  Warehouse, Car, UserCheck, Bell, Home, Menu, User, Shield, Heart,
  Package, Truck, CreditCard, Award, TrendingDown, Trash, FileSpreadsheet
} from 'lucide-react' // Icon library for consistent UI elements
import API_URL from '../config'

// Main Buyer Dashboard Component - Provides comprehensive interface for crop buyers
const BuyerDashboard = () => {
  const { signOut } = useClerk()
  // State management for dashboard functionality
  const [activeTab, setActiveTab] = useState('overview') // Controls which section is currently displayed
  const [sidebarOpen, setSidebarOpen] = useState(false) // Controls mobile sidebar visibility
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false) // Controls sign out confirmation modal
  const [user, setUser] = useState<any>(null)

  // Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    organization: '',
    bio: ''
  })

  // Update profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        organization: user.organization || '',
        bio: user.bio || ''
      })
    }
  }, [user])

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?._id) return

    try {
      const res = await fetch(`${API_URL}/api/auth/update/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      })

      if (res.ok) {
        const updatedUser = await res.json()
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setIsEditingProfile(false)
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('An error occurred while updating profile')
    }
  }

  // Crop Data State
  const [crops, setCrops] = useState<any[]>([])
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState<any>(null)
  const [bidForm, setBidForm] = useState({
    pricePerUnit: '',
    quantityRequested: ''
  })

  // Mock Data (Static) for other sections (keeping as requested to maintain UI)
  // Live Order Data State
  const [myOrders, setMyOrders] = useState<any[]>([])

  // Fetch Buyer's Orders
  const fetchMyOrders = async () => {
    if (!user?._id) return
    try {
      const response = await fetch(`${API_URL}/api/offers?buyerId=${user._id}`)
      if (response.ok) {
        const data = await response.json()
        setMyOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  // Effect to load user data and fetch crops/orders on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      // Fetch data only after user is loaded
      if (parsedUser._id) {
        fetch(`${API_URL}/api/offers?buyerId=${parsedUser._id}`)
          .then(res => res.json())
          .then(data => setMyOrders(data))
          .catch(err => console.error(err))
      }
    }
    fetchCrops()
  }, [])

  useEffect(() => {
    if (user?._id) fetchSavedCrops()
  }, [user?._id]) // Separate effect for fetching saved crops when user changes

  // Saved crops data - Buyer's wishlist and favorite crops for future purchase
  const [savedCrops, setSavedCrops] = useState<any[]>([])

  const fetchSavedCrops = async () => {
    if (!user?._id) return
    try {
      const res = await fetch(`${API_URL}/api/users/${user._id}`)
      if (res.ok) {
        const data = await res.json()
        setSavedCrops(data.savedCrops || [])
      }
    } catch (err) {
      console.error("Error fetching saved crops", err)
    }
  }

  const handleToggleSave = async (cropId: string) => {
    if (!user?._id) return
    try {
      const res = await fetch(`${API_URL}/api/users/${user._id}/toggle-save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropId })
      })
      if (res.ok) {
        const data = await res.json()
        // Optimistically update savedCrops based on response
        // But for full detail, we might want to re-fetch if we just have the ID
        // The backend returns the list of IDs, not populated objects usually if simply toggling
        // So safest is to re-fetch populated list
        fetchSavedCrops()
      }
    } catch (err) {
      console.error("Error toggling save", err)
    }
  }

  // Dynamic Dashboard Statistics
  const dashboardStats = useMemo(() => {
    const totalPurchases = myOrders.length;
    const activeOrders = myOrders.filter(o => ['pending', 'accepted', 'shipped'].includes(o.status)).length;
    const totalSpent = myOrders
      .filter(o => ['accepted', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, order) => {
        const amount = parseFloat(order.bidAmount?.replace(/[^0-9.-]+/g, "") || "0");
        return sum + amount;
      }, 0);

    // Calculate spending increase (mock logic for now as we don't have historical month data stored separately)
    // In a real app, we'd compare this month vs last month.
    const spendingChange = "+12%";

    return [
      {
        title: "Total Purchases",
        value: totalPurchases.toString(),
        change: "+2", // constant for now or calculate if date available
        icon: <ShoppingCart className="w-6 h-6" />,
        color: "text-orange-600",
        bgColor: "bg-orange-100"
      },
      {
        title: "Active Orders",
        value: activeOrders.toString(),
        change: "Live",
        icon: <Package className="w-6 h-6" />,
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      },
      {
        title: "Saved Crops",
        value: savedCrops.length.toString(),
        change: "Wishlist",
        icon: <Heart className="w-6 h-6" />,
        color: "text-red-600",
        bgColor: "bg-red-100"
      },
      {
        title: "Total Spent",
        value: `₹${totalSpent.toLocaleString()}`,
        change: spendingChange,
        icon: <IndianRupee className="w-6 h-6" />,
        color: "text-purple-600",
        bgColor: "bg-purple-100"
      }
    ];
  }, [myOrders, savedCrops]);

  // Dynamic Recent Activities
  const recentActivities = useMemo(() => {
    return myOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(order => ({
        type: 'order',
        message: `${order.crop?.name || 'Crop'} order ${order.status}`,
        time: new Date(order.createdAt).toLocaleDateString(),
        status: order.status === 'accepted' || order.status === 'delivered' ? 'success' : 'pending'
      }));
  }, [myOrders]);

  // Function to show sign out confirmation modal
  const handleSignOut = () => {
    setShowSignOutConfirm(true) // Opens the confirmation dialog
  }

  // Effect to load user data and fetch crops on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    fetchCrops()
  }, [])

  const fetchCrops = async () => {
    try {
      const response = await fetch(`${API_URL}/api/crops`)
      if (response.ok) {
        const data = await response.json()
        setCrops(data)
      }
    } catch (error) {
      console.error('Error fetching crops:', error)
    }
  }

  // Function to confirm sign out and redirect to home page
  const confirmSignOut = async () => {
    await signOut()
    localStorage.removeItem('user') // Clear local storage
    window.location.href = '/' // Redirects user back to homepage
  }

  const handlePlaceBid = (crop: any) => {
    setSelectedCrop(crop)
    setBidForm({ pricePerUnit: '', quantityRequested: '' })
    setIsBidModalOpen(true)
  }

  const handleSubmitBid = async (e: any) => {
    e.preventDefault()
    if (!user || !selectedCrop) return

    try {
      const response = await fetch(`${API_URL}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerType: 'crop',
          farmer: selectedCrop.farmer,
          buyer: user._id,
          buyerName: user.name,
          crop: selectedCrop._id,
          quantityRequested: parseFloat(bidForm.quantityRequested),
          pricePerUnit: parseFloat(bidForm.pricePerUnit),
          bidAmount: `₹${parseFloat(bidForm.pricePerUnit) * parseFloat(bidForm.quantityRequested)}`, // Calculate total
          status: 'pending'
        })
      })

      if (response.ok) {
        alert('Bid submitted successfully!')
        setIsBidModalOpen(false)
        fetchMyOrders() // Refresh orders
      } else {
        alert('Failed to submit bid')
      }
    } catch (error) {
      console.error('Error submitting bid:', error)
    }
  }

  // Renders the main overview section with dashboard statistics and key information
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section - Hero banner with greeting and current date */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Buyer'}! 🛒</h1>
            <p className="text-orange-100 text-lg">Here's what's happening with your purchases today</p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-orange-100">Today's Date</p>
              <p className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Displays key metrics in responsive card layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => ( // Maps through dashboard statistics to create stat cards
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600 font-medium">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Activity Section - Two-column layout for spending trends and recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Chart - Visual representation of monthly spending with progress bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Spending Trend</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">This Month</span>
              <span className="text-2xl font-bold text-green-600">{dashboardStats[3]?.value || '₹0'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full" style={{ width: '72%' }}></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">+18% from last month</span>
              <span className="text-green-600 font-medium">$1,290 increase</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Activities - List of user's latest actions with status indicators */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => ( // Maps through recent activities to display each one
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                {activity.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions and Notifications - Three-column layout for actions, insights, and status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - Buttons for common buyer actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('crops')}
              className="w-full btn-primary text-left py-3 px-4"
            >
              <Search className="w-4 h-4 mr-2 inline" />
              Browse Crops
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className="w-full btn-outline text-left py-3 px-4"
            >
              <Heart className="w-4 h-4 mr-2 inline" />
              View Saved Items
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className="w-full btn-outline text-left py-3 px-4"
            >
              <FileText className="w-4 h-4 mr-2 inline" />
              Order History
            </button>
          </div>
        </motion.div>

        {/* Market Insights - Purple gradient card showing price trends and market status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-4">Market Insights</h3>
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div> {/* Market data emoji icon */}
            <div className="text-2xl font-bold mb-1">Price Trends</div> {/* Price trends heading */}
            <div className="text-purple-100">Wheat: +5% | Rice: +3%</div> {/* Current price changes */}
            <div className="mt-4 text-sm text-purple-100">
              <p>Best Time to Buy: Now</p> {/* Buying recommendation */}
              <p>Market Status: Stable</p> {/* Market condition */}
            </div>
          </div>
        </motion.div>

        {/* Delivery Status - Shows count of orders in different delivery stages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Transit</span>
              <span className="font-medium text-blue-600">
                {myOrders.filter(o => o.status === 'shipped').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Scheduled</span>
              <span className="font-medium text-yellow-600">
                {myOrders.filter(o => o.status === 'accepted').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivered</span>
              <span className="font-medium text-green-600">
                {myOrders.filter(o => o.status === 'delivered').length}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Live Updates from your Orders</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )

  // Renders the Browse Crops section - Shows available crops for purchase
  const renderCrops = () => (
    <div className="space-y-6">
      {/* Header section with title and search button */}
      {/* Header section with gradient style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">Available Crops 🌾</h2>
            <p className="text-orange-100 text-lg">Browse and purchase fresh harvest directly from farmers</p>
          </div>
          <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors inline-flex items-center">
            <Search className="w-4 h-4 mr-2" />
            Search Crops
          </button>
        </div>
      </motion.div>

      {/* Grid layout for displaying crop cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crops.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">
            No crops available at the moment.
          </div>
        ) : (
          crops.map((crop) => ( // Maps through available crops to create individual crop cards
            <motion.div
              key={crop._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              {/* Crop header with emoji icon, name, and farmer */}
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{crop.image || '🌾'}</div> {/* Crop emoji icon */}
                <h3 className="text-lg font-semibold text-gray-900">{crop.name}</h3> {/* Crop name */}
                <p className="text-sm text-gray-600">by {crop.farmer?.name || 'Unknown Farmer'}</p>
              </div>
              {/* Crop details section with quantity, price, rating, and status */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span> {/* Quantity label */}
                  <span className="font-medium">{crop.quantity}</span> {/* Available quantity */}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span> {/* Price label */}
                  <span className="font-medium text-green-600">{crop.price}</span> {/* Price per kg */}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span> {/* Status label */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${crop.status === 'active' ? 'bg-green-100 text-green-800' : // Green for available
                    crop.status === 'sold' ? 'bg-red-100 text-red-800' : // Red for sold
                      'bg-gray-100 text-gray-800' // Gray for unavailable
                    }`}>
                    {crop.status?.toUpperCase() || 'ACTIVE'} {/* Status text */}
                  </span>
                </div>
              </div>
              {/* Action buttons for crop interaction */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleSave(crop._id)}
                  className={`flex-1 btn-outline text-sm py-2 ${savedCrops.some(sc => sc._id === crop._id) ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
                >
                  <Heart className={`w-4 h-4 mr-1 inline ${savedCrops.some(sc => sc._id === crop._id) ? 'fill-current' : ''}`} /> {/* Heart icon for wishlist */}
                  {savedCrops.some(sc => sc._id === crop._id) ? 'Saved' : 'Save'} {/* Save to wishlist button */}
                </button>
                <button
                  onClick={() => handlePlaceBid(crop)}
                  disabled={crop.status === 'sold'}
                  className={`flex-1 text-sm py-2 rounded-lg font-semibold shadow-sm transition-colors ${crop.status === 'sold'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:opacity-90'
                    }`}
                >
                  {crop.status === 'sold' ? 'Sold Out' : 'Place Bid'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )

  // Renders the My Orders section - Shows buyer's current and past crop orders
  const renderOrders = () => (
    <div className="space-y-6">
      {/* Header section with title and order history button */}
      {/* Header section with gradient style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Orders 📦</h2>
            <p className="text-orange-100 text-lg">Track your current and past orders</p>
          </div>
          <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors inline-flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Order History
          </button>
        </div>
      </motion.div>

      {/* List of active orders with detailed information */}
      <div className="space-y-4">
        {myOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow text-center text-gray-500">
            No orders placed yet.
          </div>
        ) : (
          myOrders.map((order) => ( // Maps through active orders to create order cards
            <motion.div
              key={order._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Order header with package icon, crop name, and farmer */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-600" /> {/* Package icon for order */}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.crop?.name || 'Unknown Crop'} Order</h3> {/* Order title with crop name */}
                      <p className="text-sm text-gray-600">Farmer: {order.farmer?.name || 'Unknown Farmer'}</p> {/* Farmer name */}
                    </div>
                  </div>
                  {/* Order details grid with quantity, price, status, and delivery date */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Quantity:</span> {/* Quantity label */}
                      <p className="font-medium">{order.quantityRequested} {order.crop?.unit || 'units'}</p> {/* Ordered quantity */}
                    </div>
                    <div>
                      <span className="text-gray-600">Bid Amount:</span> {/* Total price label */}
                      <p className="font-medium text-green-600">{order.bidAmount}</p> {/* Order total cost */}
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span> {/* Status label */}
                      <p className={`font-medium ${order.status === 'accepted' ? 'text-green-600' : // Green for confirmed
                        order.status === 'shipped' ? 'text-blue-600' : // Blue for shipped
                          order.status === 'rejected' ? 'text-red-600' :
                            'text-yellow-600' // Yellow for processing
                        }`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p> {/* Order status text */}
                    </div>
                    <div>
                      <span className="text-gray-600">Placed On:</span> {/* Delivery label */}
                      <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p> {/* Expected delivery date */}
                    </div>
                  </div>
                </div>
                {/* Action buttons for order management */}
                <div className="flex flex-col space-y-2">
                  <button className="btn-outline text-sm py-2 px-4">Track Order</button> {/* Track order button */}
                  <button className="btn-primary text-sm py-2 px-4">View Details</button> {/* View order details button */}
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        try {
                          const res = await fetch(`${API_URL}/api/offers/${order._id}`, { method: 'DELETE' })
                          if (res.ok) {
                            alert('Order cancelled successfully')
                            fetchMyOrders()
                          } else {
                            alert('Failed to delete order')
                          }
                        } catch (err) {
                          console.error('Error deleting order:', err)
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Trash className="w-4 h-4 mr-2" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )

  // Renders the Saved Items section - Shows buyer's wishlist and favorite crops
  const renderSaved = () => (
    <div className="space-y-6">
      {/* Header section with title and description */}
      {/* Header section with gradient style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white"
      >
        <div>
          <h2 className="text-3xl font-bold mb-2">Saved Crops ❤️</h2>
          <p className="text-orange-100 text-lg">Your favorite crops and wishlist items</p>
        </div>
      </motion.div>

      {/* Grid layout for displaying saved crop cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedCrops.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">
            No saved items yet. Go to "Browse Crops" to add some!
          </div>
        ) : (
          savedCrops.map((crop) => ( // Maps through saved crops to create wishlist cards
            <motion.div
              key={crop._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              {/* Saved crop header with emoji icon, name, and farmer */}
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{crop.image || '🌾'}</div> {/* Crop emoji icon */}
                <h3 className="text-lg font-semibold text-gray-900">{crop.name}</h3> {/* Crop name */}
                <p className="text-sm text-gray-600">by {crop.farmer?.name || 'Unknown Farmer'}</p> {/* Farmer name */}
              </div>
              {/* Saved crop details with price and saved date */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span> {/* Price label */}
                  <span className="font-medium text-green-600">{crop.price}</span> {/* Current price */}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span> {/* Saved date label */}
                  <span className="font-medium">{crop.status}</span> {/* When crop was saved */}
                </div>
              </div>
              {/* Action buttons for saved crop management */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleSave(crop._id)}
                  className="flex-1 btn-outline text-sm py-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                >
                  Remove
                </button> {/* Remove from wishlist */}
                <button
                  onClick={() => { setActiveTab('crops'); handlePlaceBid(crop) }}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  Buy Now
                </button> {/* Purchase saved crop */}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )

  // Generate PDF Report for Buyer
  const generatePDFReport = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return alert('Please allow popups to generate report')

    const totalSpent = myOrders
      .filter(o => o.status === 'accepted' || o.status === 'shipped' || o.status === 'delivered')
      .reduce((sum, order) => {
        const amount = parseFloat(order.bidAmount?.replace(/[^0-9.-]+/g, "") || "0")
        return sum + amount
      }, 0)

    const totalOrders = myOrders.length
    const activeOrders = myOrders.filter(o => o.status !== 'completed' && o.status !== 'rejected').length

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Buyer Purchase Report - FarmConnect</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 40px; }
          .header-section { border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 40px; }
          .company-name { font-size: 28px; font-weight: bold; color: #c2410c; }
          .report-title { font-size: 18px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
          .meta-info { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; background: #fff7ed; padding: 20px; border-radius: 8px; }
          .meta-block strong { display: block; margin-bottom: 5px; color: #111; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
          
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 50px; }
          .summary-box { background: white; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .summary-val { font-size: 32px; font-weight: bold; color: #111; margin-bottom: 5px; }
          .summary-lbl { font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 500; }
          .val-orange { color: #f97316; }
          .val-green { color: #16a34a; }
          
          .section-title { font-size: 20px; font-weight: bold; color: #111; margin: 40px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; }
          .section-title::before { content: ''; display: block; width: 6px; height: 24px; background: #f97316; margin-right: 12px; border-radius: 3px; }
          
          table { w-full; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; width: 100%; }
          th { background: #fff7ed; padding: 12px 15px; text-align: left; font-weight: 600; color: #9a3412; border-bottom: 2px solid #fed7aa; text-transform: uppercase; font-size: 12px; }
          td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) { background-color: #fffaf5; }
          
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
          
          .status-pil { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .status-accepted { background: #dcfce7; color: #166534; }
          .status-rejected { background: #fee2e2; color: #991b1b; }
          .status-pending { background: #fef9c3; color: #854d0e; }
        </style>
      </head>
      <body>
        <div class="header-section">
          <div class="company-name">FarmConnect Buyer Report</div>
          <div class="report-title">Purchase History & Expense Analysis</div>
        </div>

        <div class="meta-info">
          <div class="meta-block">
            <strong>BUYER PROFILE</strong>
            <div>Name: ${user?.name || 'Valued Buyer'}</div>
            <div>ID: ${user?._id || 'N/A'}</div>
          </div>
          <div class="meta-block" style="text-align: right;">
            <strong>REPORT GENERATION</strong>
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Time: ${new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-box">
            <div class="summary-val val-orange">₹${totalSpent.toLocaleString()}</div>
            <div class="summary-lbl">Total Expenditure</div>
          </div>
          <div class="summary-box">
            <div class="summary-val">${totalOrders}</div>
            <div class="summary-lbl">Total Orders Placed</div>
          </div>
          <div class="summary-box">
            <div class="summary-val val-green">${activeOrders}</div>
            <div class="summary-lbl">Active Orders</div>
          </div>
        </div>

        <div class="section-title">Order History</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Crop Name</th>
              <th>Farmer</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${myOrders.length > 0 ? myOrders.map((order) => `
              <tr>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td><strong>${order.crop?.name || 'Unknown'}</strong></td>
                <td>${order.farmer?.name || 'Unknown Farmer'}</td>
                <td>${order.quantityRequested} ${order.crop?.unit || 'units'}</td>
                <td style="font-weight: bold;">${order.bidAmount}</td>
                <td><span class="status-pil status-${order.status}">${order.status}</span></td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; padding: 20px;">No orders found.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generated by FarmConnect Platform • ${new Date().getFullYear()}
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Renders the Reports section
  const renderReports = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">Financial Reports 📊</h2>
            <p className="text-orange-100 text-lg">Analyze your spending and order history</p>
          </div>
          <button
            onClick={generatePDFReport}
            className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors inline-flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download PDF Report
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase">Total Spent</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            ₹{myOrders
              .filter(o => o.status === 'accepted' || o.status === 'shipped' || o.status === 'delivered')
              .reduce((sum, order) => sum + parseFloat(order.bidAmount?.replace(/[^0-9.-]+/g, "") || "0"), 0)
              .toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">On accepted orders</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{myOrders.length}</p>
          <p className="text-xs text-gray-400 mt-1">Lifetime order volume</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase">Pending Approval</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {myOrders.filter(o => o.status === 'pending').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Waiting for farmer acceptance</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{myOrders.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Crop</th>
                <th className="py-3 px-6">Farmer</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myOrders.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No transactions found.</td></tr>
              ) : (
                myOrders.slice(0, 10).map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-6 font-medium text-gray-900">{order.crop?.name || 'Unknown'}</td>
                    <td className="py-3 px-6">{order.farmer?.name || 'Unknown'}</td>
                    <td className="py-3 px-6 font-bold text-green-600">{order.bidAmount}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // Main content router - Determines which section to display based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview() // Shows dashboard overview with stats and activities
      case 'crops': return renderCrops() // Shows available crops for purchase
      case 'orders': return renderOrders() // Shows buyer's current and past orders
      case 'saved': return renderSaved() // Shows saved crops in wishlist
      case 'reports': return renderReports() // Shows financial reports
      case 'profile': return renderProfile() // Shows user profile
      default: return renderOverview() // Default to overview if no tab is selected
    }
  }

  const renderProfile = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-orange-600 text-4xl font-bold border-4 border-orange-200">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-1">{user?.name}</h2>
            <p className="text-orange-100 mb-2">{user?.organization || 'Registered Buyer'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="bg-orange-700 bg-opacity-30 px-3 py-1 rounded-full text-sm flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> {user?.location || 'Location not set'}
              </span>
              <span className="bg-orange-700 bg-opacity-30 px-3 py-1 rounded-full text-sm flex items-center">
                <Shield className="w-4 h-4 mr-1" /> {user?.role || 'Buyer'}
              </span>
            </div>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 border-l-4 border-orange-500 pl-3">Personal Information</h3>
            <UserCheck className="w-6 h-6 text-orange-500" />
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location / City</label>
                  <input
                    type="text"
                    name="location"
                    value={profileForm.location}
                    onChange={handleProfileInputChange}
                    placeholder="e.g. Mumbai, India"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization / Company</label>
                  <input
                    type="text"
                    name="organization"
                    value={profileForm.organization}
                    onChange={handleProfileInputChange}
                    placeholder="e.g. Fresh Foods Ltd."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Purchasing Requirements</label>
                <textarea
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileInputChange}
                  rows={4}
                  placeholder="Tell us about your purchasing needs..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-900 border-b pb-2">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email Address</p>
                  <p className="font-semibold text-gray-900 border-b pb-2">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="font-semibold text-gray-900 border-b pb-2">{user?.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-semibold text-gray-900 border-b pb-2">{user?.location || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Organization</p>
                  <p className="font-semibold text-gray-900 border-b pb-2">{user?.organization || 'Not set'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Purchasing Requirements</p>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {user?.bio || 'No details provided yet.'}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Status Card */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-600 mr-3" />
                  <span className="font-medium text-green-900">Verified Buyer</span>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium text-blue-900">Member Since</span>
                </div>
                <span className="text-sm text-blue-800 font-semibold">{new Date().getFullYear()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )

  // Main component return - Renders the complete buyer dashboard interface
  return (
    <div className="min-h-screen bg-gray-50"> {/* Main container with gray background */}
      {/* Top navigation bar with logo and user controls */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Mobile menu button and logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)} /* Toggles mobile sidebar */
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" /> {/* Hamburger menu icon for mobile */}
              </button>
              {/* Logo and brand name */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" /> {/* Shopping cart icon in logo */}
                </div>
                <span className="text-xl font-bold text-gray-900">FarmConnect</span> {/* Brand name */}
              </div>
            </div>

            {/* Right side - Notifications and user profile */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5" /> {/* Notification bell icon */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span> {/* Notification indicator */}
              </button>
              {/* User profile section */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" /> {/* User avatar icon */}
                </div>
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Buyer'}</span> {/* User role/title */}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main layout container with sidebar and content */}
      <div className="flex">
        {/* Sidebar navigation - Fixed on mobile, sticky on desktop */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full' // Controls mobile sidebar visibility
          }`}>
          <div className="h-full flex flex-col">
            {/* Navigation menu items */}
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {/* Navigation menu items array with icons and labels */}
                {[
                  { id: 'overview', name: 'Overview', icon: <Home className="w-5 h-5" /> }, // Dashboard overview
                  { id: 'crops', name: 'Browse Crops', icon: <Crop className="w-5 h-5" /> }, // Available crops
                  { id: 'orders', name: 'My Orders', icon: <Package className="w-5 h-5" /> }, // Order management
                  { id: 'saved', name: 'Saved Items', icon: <Heart className="w-5 h-5" /> }, // Wishlist
                  { id: 'reports', name: 'Reports', icon: <BarChart3 className="w-5 h-5" /> }, // Analytics
                  { id: 'profile', name: 'Profile', icon: <User className="w-5 h-5" /> } // User profile
                ].map((item) => ( // Maps through navigation items to create menu buttons
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === item.id
                      ? 'bg-orange-100 text-orange-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 lg:ml-0">
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </main>
        </div>
      </div >

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sign Out Confirmation Modal */}
      {
        showSignOutConfirm && (
          <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to sign out? You'll be redirected to the home page.</p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 btn-outline py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSignOut}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )
      }
      {/* Bid Modal */}
      {
        isBidModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center">
                  <IndianRupee className="w-6 h-6 mr-2" />
                  Place Bid for {selectedCrop?.name}
                </h2>
                <p className="text-orange-100 text-sm mt-1">Available: {selectedCrop?.quantity}</p>
              </div>

              <form onSubmit={handleSubmitBid} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Required (Numbers only)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={bidForm.quantityRequested}
                      onChange={(e) => setBidForm({ ...bidForm, quantityRequested: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pl-10"
                      placeholder="e.g. 50"
                    />
                    <Crop className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <span className="absolute right-3 top-2.5 text-gray-500 text-sm">kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Offer Price (per Unit)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={bidForm.pricePerUnit}
                      onChange={(e) => setBidForm({ ...bidForm, pricePerUnit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pl-10"
                      placeholder="e.g. 20"
                    />
                    <IndianRupee className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {(bidForm.quantityRequested && bidForm.pricePerUnit) && (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex justify-between items-center">
                    <span className="text-orange-800 font-medium">Total Bid Amount:</span>
                    <span className="text-xl font-bold text-orange-600">
                      ₹{(parseFloat(bidForm.quantityRequested) * parseFloat(bidForm.pricePerUnit)).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBidModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:opacity-90 font-medium shadow-md"
                  >
                    Submit Bid
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )
      }
    </div >
  )
}

export default BuyerDashboard
