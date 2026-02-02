// Import required libraries and components
import { motion } from 'framer-motion' // For smooth animations and transitions
import { useState, useEffect } from 'react' // For managing component state
import { useClerk } from '@clerk/clerk-react'
import {
  // Navigation and UI icons for service provider dashboard
  Truck, Users, BarChart3,
  TrendingUp, CheckCircle, Clock, Star, Settings, LogOut,
  FileText, Download, Plus, Search, MapPin,
  Bell, Home, Menu, User, MessageSquare,
  Briefcase, Wrench, IndianRupee, Trash2, Award, Calendar as CalendarIcon, X, Eye
} from 'lucide-react' // Icon library for consistent UI elements
import API_URL from '../config'
import ChatSystem from './ChatSystem'
import ToastNotification from './ToastNotification'

import JobMap from './JobMap' // Import Map Component
import Calendar from './Calendar' // Import Calendar Component

const ServiceProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [jobViewMode, setJobViewMode] = useState<'list' | 'map'>('list') // Toggle state for Jobs
  const [user, setUser] = useState<any>(null)

  // My Bids State
  const [bidViewMode, setBidViewMode] = useState<'list' | 'map' | 'calendar'>('list')
  const [bidFilter, setBidFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending')
  const [toasts, setToasts] = useState<any[]>([])
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [selectedBidForDetail, setSelectedBidForDetail] = useState<any>(null)

  // Printing State
  const [printMode, setPrintMode] = useState<'report' | 'invoice'>('report')
  const [invoiceData, setInvoiceData] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // 🔔 Notification Polling
  useEffect(() => {
    if (!user?._id) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications?userId=${user._id}`)
        if (res.ok) {
          const notifications = await res.json()
          notifications.forEach(async (notif: any) => {
            // Add toast
            setToasts(prev => [...prev, {
              id: Date.now() + Math.random(),
              message: notif.message,
              type: 'success'
            }])

            // Mark as read immediately to avoid accumulation
            await fetch(`${API_URL}/api/notifications/${notif._id}/read`, { method: 'PUT' })
          })
        }
      } catch (err) {
        console.error("Error fetching notifications", err)
      }
    }

    // Checking every 30 seconds
    fetchNotifications() // Initial check
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user?._id])

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  /* ... (omitting unchanged parts for brevity if possible, but replace_file_content needs context) ... */
  /* actually I will use multi_replace for this to be clean */

  const handleSignOut = () => {
    setShowSignOutConfirm(true)
    localStorage.removeItem('user')
  }

  const { signOut } = useClerk()
  const confirmSignOut = async () => {
    localStorage.removeItem('user')
    await signOut()
    window.location.href = '/'
  }





  const [jobs, setJobs] = useState<any[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [marketHistory, setMarketHistory] = useState<any[]>([]) // Global accepted bids
  const [myServices, setMyServices] = useState<any[]>([])
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [serviceForm, setServiceForm] = useState({
    title: '',
    type: 'Vehicle',
    description: '',
    rate: '',
    contactPhone: user?.phone || '',
    availability: 'Available',
    image: '🛠️'
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)



  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'Vehicle': return '🚛';
      case 'Manpower': return '👷';
      case 'Equipment': return '🚜';
      case 'Storage': return '🏠';
      case 'Processing': return '⚙️';
      default: return '🛠️';
    }
  }




  // Calendar / Scheduling State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [schedulingService, setSchedulingService] = useState<any>(null)

  // Helper to open schedule for a service
  const openScheduleModal = (service: any) => {
    setSchedulingService(service)
    setIsScheduleModalOpen(true)
  }

  // Handle toggling a date as blocked/unblocked
  const handleDateClick = async (date: Date) => {
    if (!schedulingService) return

    const existingBlockIndex = schedulingService.blockedDates?.findIndex((d: any) =>
      new Date(d.date).toDateString() === date.toDateString()
    )

    let updatedBlockedDates = [...(schedulingService.blockedDates || [])]

    if (existingBlockIndex >= 0) {
      // Unblock: Remove date
      updatedBlockedDates.splice(existingBlockIndex, 1)
    } else {
      // Block: Add date
      updatedBlockedDates.push({ date: date, reason: 'maintenance' })
    }

    // Optimistic Update
    const updatedService = { ...schedulingService, blockedDates: updatedBlockedDates }
    setSchedulingService(updatedService)

    // Backend Update
    try {
      await fetch(`${API_URL}/api/provider-services/${schedulingService._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedDates: updatedBlockedDates })
      })
      // Also update local list of services
      setMyServices(prev => prev.map(s => s._id === schedulingService._id ? updatedService : s))
    } catch (err) {
      console.error("Failed to update schedule", err)
      alert("Failed to update schedule")
    }
  }

  // Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    location: '',
    latitude: '',
    longitude: '',
    bio: ''
  })

  // Initialize profile form when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        organization: user.organization || '',
        location: user.location || '',
        latitude: user.latitude || '',
        longitude: user.longitude || '',
        bio: user.bio || ''
      })
    }
  }, [user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/api/auth/update/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data) // Update local state with returned user object
        localStorage.setItem('user', JSON.stringify(data)) // Persist to storage
        setIsEditingProfile(false)
        alert('Profile Updated Successfully! ✨')
      } else {
        alert(data.msg || 'Update failed')
      }
    } catch (err) {
      console.error("Profile update failed", err)
      alert("Failed to update profile")
    }
  }
  // Fetch Jobs (Service Requests from Farmers)
  const fetchJobs = async () => {
    try {
      // Fetch all service requests
      const res = await fetch(`${API_URL}/api/service-requests`)
      const data = await res.json()
      // Filter out completed ones
      setJobs(data.filter((j: any) => j.status !== 'completed'))
    } catch (err) {
      console.error("Failed to fetch jobs", err)
    }
  }

  // Fetch My Bids (Offers made by this provider)
  // We need to know WHO the provider is. We don't have login for provider yet.
  // We will assume a static provider ID or just fetch all offers of type 'service'.
  // Fetch My Bids (Offers made by this provider)
  const fetchBids = async () => {
    // console.log("Fetching bids. User:", user)
    if (!user?._id) {
      console.warn("No user ID found, skipping fetchBids")
      return
    }
    try {
      console.log(`Fetching bids for providerId: ${user._id}`)
      const res = await fetch(`${API_URL}/api/offers?providerId=${user._id}`)
      if (res.ok) {
        const data = await res.json()
        console.log("Fetched bids:", data)
        setBids(data)
      } else {
        console.error("Failed to fetch bids, status:", res.status)
      }
    } catch (err) {
      console.error("Failed to fetch bids", err)
    }
  }

  // Fetch My Services (Services listed by this provider)
  const fetchServices = async () => {
    if (!user?._id) return
    try {
      const res = await fetch(`${API_URL}/api/provider-services?providerId=${user._id}`)
      if (res.ok) {
        const data = await res.json()
        setMyServices(data)
      }
    } catch (err) {
      console.error("Failed to fetch services", err)
    }
  }

  // Fetch Market History (All Accepted Bids)
  const fetchMarketHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/offers?status=accepted`)
      if (res.ok) {
        const data = await res.json()
        const serviceBids = data.filter((offer: any) => offer.offerType === 'service' || offer.serviceRequest)
        setMarketHistory(serviceBids)
      }
    } catch (err) {
      console.error("Failed to fetch market history", err)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchMarketHistory()
  }, [])

  useEffect(() => {
    if (user?._id) {
      fetchBids()
      fetchServices()
    }
  }, [user])

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?._id) {
      alert("Please log in to add a service")
      return
    }

    const icon = getServiceIcon(serviceForm.type)

    // Use Base64 image if selected, otherwise keep existing or default
    let finalImage = serviceForm.image;
    if (selectedImage && imagePreview) {
      finalImage = imagePreview;
    } else if (!editingService && serviceForm.image === '🛠️') {
      finalImage = icon; // Default icon if no image uploaded for new
    }

    const payload = {
      provider: user._id,
      ...serviceForm,
      image: finalImage
    }

    try {
      let url = `${API_URL}/api/provider-services`
      let method = 'POST'

      if (editingService) {
        url = `${API_URL}/api/provider-services/${editingService._id}`
        method = 'PUT'
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        alert(editingService ? 'Service Updated Successfully! ✅' : 'Service Listed Successfully! 🛠️')
        setIsServiceModalOpen(false)
        setEditingService(null) // Reset editing state
        fetchServices()
        // Reset form
        setServiceForm({
          title: '',
          type: 'Vehicle',
          description: '',
          rate: '',
          contactPhone: '',
          availability: 'Available',
          image: '🛠️'
        })
        setSelectedImage(null)
        setImagePreview(null)
      } else {
        alert('Failed to save service')
      }
    } catch (err) {
      console.error("Error saving service", err)
      alert("Error saving service")
    }
  }

  const handleEditService = (service: any) => {
    setEditingService(service)
    setServiceForm({
      title: service.title,
      type: service.type,
      description: service.description,
      rate: service.rate,
      contactPhone: service.contactPhone,
      availability: service.availability || 'Available',
      image: service.image
    })
    // Set preview if image is a URL/Base64
    if (service.image && (service.image.startsWith('data:') || service.image.startsWith('/'))) {
      setImagePreview(service.image)
    } else {
      setImagePreview(null)
    }
    setSelectedImage(null)
    setIsServiceModalOpen(true)
  }

  const openNewServiceModal = () => {
    setEditingService(null)
    setServiceForm({
      title: '',
      type: 'Vehicle',
      description: '',
      rate: '',
      contactPhone: user?.phone || '',
      availability: 'Available',
      image: '🛠️'
    })
    setSelectedImage(null)
    setImagePreview(null)
    setIsServiceModalOpen(true)
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const res = await fetch(`${API_URL}/api/provider-services/${serviceId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        alert('Service Deleted Successfully 🗑️')
        fetchServices()
      } else {
        alert('Failed to delete service')
      }
    } catch (err) {
      console.error("Error deleting service", err)
      alert("Error deleting service")
    }
  }

  const handleSubmitBid = async (job: any) => {
    const rawBudget = job.budget ? job.budget.replace(/[^0-9]/g, '') : ''
    // Pre-fill with budget number
    const bidAmountInput = prompt(`Enter your bid amount for this job (Budget: ${job.budget || 'N/A'}):`, rawBudget)

    if (!bidAmountInput) return

    // Ensure currency symbol
    const bidAmount = bidAmountInput.trim().startsWith('₹') ? bidAmountInput.trim() : `₹${bidAmountInput.trim()}`

    // Logic: If Bid == Budget (exact match string comparison including symbol, or number comparison)
    // Let's compare normalized numbers to be safe
    const normalizedBid = bidAmount.replace(/[^0-9]/g, '')
    const normalizedBudget = rawBudget

    const isMatch = normalizedBid === normalizedBudget && normalizedBid !== ''
    // Status is accepted if match, pending otherwise
    const offerStatus = isMatch ? 'accepted' : 'pending'



    if (!user?._id) {
      alert("Error: user ID not found. Please sign out and sign in again.")
      return
    }

    try {
      console.log(`Submitting bid. Provider: ${user._id} (${user.name})`)
      const offerRes = await fetch(`${API_URL}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer: job.farmer?._id || job.farmer,
          serviceRequest: job._id,
          offerType: 'service',
          providerName: user.fullName || user.firstName || 'Service Provider',
          provider: user._id,
          bidAmount: bidAmount,
          status: offerStatus
        })
      })

      if (offerRes.ok) {
        let alertMsg = 'Bid submitted successfully!'

        // If matched, complete the job immediately
        if (isMatch) {
          await fetch(`${API_URL}/api/service-requests/${job._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
          })
          alertMsg += ' Great news! Your bid matched the budget. Job is yours (Completed). 🤝'
        } else {
          alertMsg += ' Sent to farmer for review. (Pending) ⏳'
        }

        alert(alertMsg)
        fetchJobs()
        fetchBids()
      }
    } catch (err) {
      console.error("Failed to submit bid", err)
      alert("Failed to submit bid")
    }
  }

  const handleStartChat = async (offerId: string) => {
    try {
      if (!user?._id) return;
      const res = await fetch(`${API_URL}/api/chats/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId,
          currentUserId: user._id
        }),
      });

      if (res.ok) {
        setActiveTab('chats');
      } else {
        const errorData = await res.json();
        alert(`Failed to start chat: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Error starting chat. Please try again.');
    }
  };

  const renderOverview = () => {
    // Dynamic Stats Calculation
    const acceptedBids = bids.filter(b => b.status === 'accepted')
    const pendingBids = bids.filter(b => b.status === 'pending')
    const totalEarnings = acceptedBids.reduce((sum, bid) => {
      const amount = parseFloat(bid.bidAmount.replace(/[^0-9.]/g, '')) || 0
      return sum + amount
    }, 0)

    // Derived Activities (Sorted by newest)
    const activities = [...bids].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(bid => ({
      type: 'bid',
      message: `Bid ${bid.status} for ${bid.serviceRequest?.type || 'Service'}`,
      time: new Date(bid.createdAt).toLocaleDateString(),
      status: bid.status === 'accepted' ? 'success' : 'pending'
    }))

    const dashboardStats = [
      { title: "Active Listings", value: myServices.length.toString(), change: "+0", icon: <Briefcase className="w-6 h-6" />, color: "text-blue-600", bgColor: "bg-blue-100" },
      { title: "Completed Jobs", value: acceptedBids.length.toString(), change: `+${acceptedBids.length}`, icon: <CheckCircle className="w-6 h-6" />, color: "text-green-600", bgColor: "bg-green-100" },
      { title: "Pending Bids", value: pendingBids.length.toString(), change: (pendingBids.length > 0 ? "+" : "") + pendingBids.length, icon: <Clock className="w-6 h-6" />, color: "text-orange-600", bgColor: "bg-orange-100" },
      { title: "Total Earnings", value: `₹${totalEarnings.toLocaleString()}`, change: "+100%", icon: <IndianRupee className="w-6 h-6" />, color: "text-purple-600", bgColor: "bg-purple-100" }
    ]

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Service Pro'}! 🚛</h1>
              <p className="text-blue-100 text-lg">Here's what's happening with your services today</p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-blue-100">Today's Date</p>
                <p className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => (
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
                  <p className="text-sm text-green-600 font-medium">{stat.change} since joining</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Earnings Trend</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="text-2xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Growth</span>
                <span className="text-green-600 font-medium">Consistent</span>
              </div>
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activities</h3>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-gray-500 italic">No recent activities found.</p>
              ) : activities.map((activity, index) => (
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

        {/* Quick Actions and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={openNewServiceModal} className="w-full btn-primary text-left py-3 px-4">
                <Plus className="w-4 h-4 mr-2 inline" />
                Add New Service
              </button>
              <button onClick={() => setActiveTab('jobs')} className="w-full btn-outline text-left py-3 px-4">
                <Search className="w-4 h-4 mr-2 inline" />
                Browse Jobs
              </button>
              <button onClick={generateProviderReport} className="w-full btn-outline text-left py-3 px-4">
                <FileText className="w-4 h-4 mr-2 inline" />
                Generate Report
              </button>
            </div>
          </motion.div>

          {/* Job Opportunities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
          >
            <h3 className="text-lg font-semibold mb-4">Job Opportunities</h3>
            <div className="text-center">
              <div className="text-4xl mb-2">💼</div>
              <div className="text-2xl font-bold mb-1">{jobs.length} Active Jobs</div>
              <div className="text-green-100">Available in the market</div>
              <button onClick={() => setActiveTab('jobs')} className="mt-4 bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50">View All</button>
            </div>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium text-green-600">{bids.length > 0 ? Math.round((acceptedBids.length / bids.length) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rating</span>
                <span className="font-medium text-yellow-600">4.8/5.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Time</span>
                <span className="font-medium text-blue-600">Fast</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">Based on recent activity</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const renderServices = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">My Services</h1>
          <p className="text-blue-100 text-lg">Manage your service offerings and availability</p>
        </div>
        <button onClick={openNewServiceModal} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-50 transition-colors flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add New Service
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myServices.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-2">You haven't listed any services yet.</p>
            <button onClick={openNewServiceModal} className="text-blue-600 hover:underline">Add your first service</button>
          </div>
        ) : (
          myServices.map((service) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="text-center mb-4">
                {/* Image Banner Style from FarmerDashboard */}
                <div className="h-40 w-full mb-4 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {service.image && (service.image.startsWith('/') || service.image.startsWith('data:image')) ? (
                    <img
                      src={service.image.startsWith('/') ? `${API_URL}${service.image}` : service.image}
                      alt={service.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <span className="text-6xl">{service.image}</span>
                  )}
                  {/* Fallback */}
                  <div className="hidden text-6xl">{service.type === 'Vehicle' ? '🚛' : '🛠️'}</div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                <div className="flex justify-center mt-1 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${service.type === 'Vehicle' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                    {service.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-medium text-green-600">{service.rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium text-blue-600">{service.contactPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${(service.availability === 'Available' || service.status === 'active') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {service.availability || service.status}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button onClick={() => handleEditService(service)} className="flex-1 btn-outline text-sm py-2">Edit</button>
                <button
                  onClick={() => openScheduleModal(service)}
                  className="p-2 btn-outline text-blue-600 hover:bg-blue-50 border-blue-200"
                  title="Manage Schedule"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteService(service._id)} className="p-2 btn-outline text-red-600 hover:bg-red-50 border-red-200">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Schedule Modal */}
      {
        isScheduleModalOpen && schedulingService && (
          <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                    Availability: {schedulingService.title}
                  </h2>
                  <p className="text-sm text-gray-500">Click dates to block/unblock (Red = Blocked)</p>
                </div>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 bg-gray-50">
                <Calendar
                  events={[
                    ...(schedulingService.blockedDates || []).map((d: any) => ({
                      date: new Date(d.date),
                      type: 'blocked' as const,
                      title: d.reason || 'Unavailable'
                    })),
                    // Add accepted jobs that might overlap (Global provider view)
                    ...bids.filter(b => b.status === 'accepted' && b.serviceRequest?.scheduledDate).map(b => ({
                      date: new Date(b.serviceRequest.scheduledDate),
                      type: 'job' as const,
                      title: `Job: ${b.serviceRequest.type}`,
                      details: b
                    }))
                  ]}
                  onDateClick={handleDateClick}
                />
              </div>
            </motion.div>
          </div>
        )
      }
    </div >
  )

  /* ACCEPTED BIDS SECTION */
  const renderAcceptedBids = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Market History 📜</h1>
        <p className="text-blue-100 text-lg">Transparency Report: See all accepted bids and winners.</p>
      </motion.div>

      {/* Desktop View - Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer (Requester)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Needed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winning Bid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner (Provider)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marketHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No accepted bids found in the history yet.
                  </td>
                </tr>
              ) : (
                marketHistory.map((bid) => (
                  <tr key={bid._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bid.farmer?.name || 'Unknown Farmer'}</div>
                      <div className="text-sm text-gray-500">{bid.farmer?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {bid.serviceRequest?.type || bid.offerType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bid.serviceRequest?.budget || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">{bid.bidAmount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-0">
                          <div className="text-sm font-medium text-purple-700">
                            {bid.provider?.name || bid.providerName || 'Service Provider'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Verified Winner
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4">
        {marketHistory.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-100 shadow-sm">
            No accepted bids found in the history yet.
          </div>
        ) : (
          marketHistory.map((bid) => (
            <div key={bid._id} className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
              {/* Header: Service Type & Date */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mb-1">
                    {bid.serviceRequest?.type || bid.offerType}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{new Date(bid.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Winning Bid</p>
                  <p className="text-lg font-bold text-green-600">{bid.bidAmount}</p>
                </div>
              </div>

              <div className="border-t border-b border-gray-50 py-3 my-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Farmer:</span>
                  <span className="font-medium text-gray-900">{bid.farmer?.name || 'Unknown Farmer'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget:</span>
                  <span className="font-medium text-gray-600">{bid.serviceRequest?.budget || 'N/A'}</span>
                </div>
              </div>

              {/* Footer: Winner */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-gray-500">Winner:</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-700">{bid.provider?.name || bid.providerName || 'Service Provider'}</p>
                  <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderJobs = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Market</h1>
          <p className="text-blue-100 text-lg">Browse and bid on farmer service requests</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setJobViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${jobViewMode === 'list'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            List View
          </button>
          <button
            onClick={() => setJobViewMode('map')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${jobViewMode === 'map'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            Map View
          </button>
        </div>
      </motion.div>

      {jobViewMode === 'map' ? (
        <JobMap jobs={jobs} />
      ) : (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No active job requests found.</p>
          ) : jobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {job.type === 'Vehicle' ? <Truck className="w-5 h-5 text-blue-600" /> :
                        job.type === 'Manpower' ? <Users className="w-5 h-5 text-blue-600" /> :
                          <Wrench className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.type} Request</h3>
                      <p className="text-sm text-gray-600">{job.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Farmer:</span>
                      <p className="font-medium text-blue-600">
                        {job.farmer && typeof job.farmer === 'object' ? (job.farmer.name || 'Unknown') : (job.farmer ? `Farmer #${job.farmer.substring(0, 6)}` : 'Unknown')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium">{job.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <p className="font-medium text-green-600">{job.budget || 'Negotiable'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className={`font-medium ${job.status === 'active' ? 'text-green-600' :
                        job.status === 'pending' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>{job.status}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  {/* Only show chat button if provider has already submitted a bid for this job */}
                  {bids.some(bid => bid.serviceRequest?._id === job._id || bid.serviceRequest === job._id) && (
                    <button
                      onClick={() => {
                        // Find the bid/offer for this job
                        const myBid = bids.find(bid => bid.serviceRequest?._id === job._id || bid.serviceRequest === job._id);
                        if (myBid) {
                          handleStartChat(myBid._id);
                        }
                      }}
                      className="flex items-center justify-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat with Farmer
                    </button>
                  )}
                  <button className="btn-outline text-sm py-2 px-4">View Details</button>
                  <button onClick={() => handleSubmitBid(job)} className="btn-primary text-sm py-2 px-4">Submit Bid</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div >
  )


  /* MY BIDS SECTION */
  const renderBids = () => {
    // Filter logic
    const displayedBids = bids.filter(b => bidFilter === 'pending' ? b.status === 'pending' : b.status === bidFilter)

    // For map view, we need to extract the service request location data
    // Only map bids that have a valid service request with location/coordinates
    const mapJobs = displayedBids
      .filter(b => b.serviceRequest)
      .map(b => ({
        ...b.serviceRequest,
        _id: b.serviceRequest._id // JobMap needs _id
      }))

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">My Bids & Offers</h1>
            <p className="text-blue-100 text-lg">Track your submitted quotes and job status</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-blue-700/30 rounded-lg p-1">
              <button
                onClick={() => setBidFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${bidFilter === 'pending'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:bg-blue-600/50'
                  }`}
              >
                Pending
              </button>
              <button
                onClick={() => setBidFilter('accepted')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${bidFilter === 'accepted'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:bg-blue-600/50'
                  }`}
              >
                Approved
              </button>
              <button
                onClick={() => setBidFilter('rejected')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${bidFilter === 'rejected'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:bg-blue-600/50'
                  }`}
              >
                Rejected
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-transparent">
              <button
                onClick={() => setBidViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${bidViewMode === 'list'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                List
              </button>
              <button
                onClick={() => setBidViewMode('map')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${bidViewMode === 'map'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                Map
              </button>
              <button
                onClick={() => setBidViewMode('calendar')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${bidViewMode === 'calendar'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                Calendar
              </button>
            </div>
          </div>
        </motion.div>

        {bidViewMode === 'map' ? (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg">
            {mapJobs.length > 0 ? (
              <JobMap jobs={mapJobs} />
            ) : (
              <div className="h-[400px] w-full bg-gray-50 flex flex-col items-center justify-center text-gray-500">
                <MapPin className="w-12 h-12 mb-2 opacity-20" />
                <p>No location data available for these bids.</p>
              </div>
            )}
          </div>
        ) : bidViewMode === 'calendar' ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
              Job Calendar
            </h2>
            <Calendar
              events={displayedBids
                .filter(b => b.serviceRequest && b.serviceRequest.scheduledDate)
                .map(b => ({
                  start: new Date(b.serviceRequest.scheduledDate),
                  end: b.serviceRequest.endDate ? new Date(b.serviceRequest.endDate) : new Date(b.serviceRequest.scheduledDate),
                  type: b.status === 'accepted' ? 'job' as const : b.status === 'pending' ? 'pending' as const : 'blocked' as const,
                  title: `${b.serviceRequest.type} (${b.status})`,
                  details: b
                }))
              }
              onEventClick={(evt) => {
                if (evt.details) {
                  // alert(`Bid Status: ${evt.details.status}\nAmount: ${evt.details.bidAmount}\nRequest: ${evt.title}`)
                  // Could implement a detail modal here
                }
              }}
            />
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {bidFilter} bids with scheduled dates.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className={`p-1 rounded-lg mr-2 ${bidFilter === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                bidFilter === 'accepted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {bidFilter === 'pending' ? <Clock className="w-5 h-5" /> :
                  bidFilter === 'accepted' ? <CheckCircle className="w-5 h-5" /> :
                    <Trash2 className="w-5 h-5" />
                }
              </span>
              {bidFilter === 'pending' ? 'Active Bids' : bidFilter === 'accepted' ? 'Approved Bids' : 'Rejected Bids'} ({displayedBids.length})
            </h2>

            {displayedBids.length === 0 ? (
              <p className="text-gray-500 italic bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {bidFilter === 'pending' ? 'No active bids pending.' :
                  bidFilter === 'accepted' ? 'No approved bids yet.' :
                    'No rejected bids found.'}
              </p>
            ) : (
              displayedBids.map((bid) => (
                <motion.div
                  key={bid._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    {/* Left Side: Content */}
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bid.serviceRequest?.type === 'Vehicle' ? 'bg-blue-50 text-blue-600' :
                          bid.serviceRequest?.type === 'Manpower' ? 'bg-orange-50 text-orange-600' :
                            'bg-green-50 text-green-600'
                          }`}>
                          {bid.serviceRequest?.type === 'Vehicle' ? <Truck className="w-6 h-6" /> :
                            bid.serviceRequest?.type === 'Manpower' ? <Users className="w-6 h-6" /> :
                              <Briefcase className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{bid.serviceRequest?.type || 'Service'} Request</h3>
                          <p className="text-gray-500 text-sm font-medium">{bid.farmer?.name || 'Unknown Farmer'}</p>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                          <p className="text-sm text-gray-500 mb-1 font-medium">Your Bid:</p>
                          <p className="font-bold text-blue-600">{bid.bidAmount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1 font-medium">Location:</p>
                          <p className="font-bold text-gray-900 truncate max-w-[180px]">{bid.serviceRequest?.location || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1 font-medium">Budget:</p>
                          <p className="font-bold text-green-600">{bid.serviceRequest?.budget || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1 font-medium">Status:</p>
                          <span className={`font-bold capitalize ${bid.status === 'accepted' ? 'text-green-600' :
                            bid.status === 'rejected' ? 'text-red-500' :
                              'text-yellow-600'
                            }`}>
                            {bid.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Actions */}
                    <div className="ml-6 flex flex-col gap-3">
                      <button
                        onClick={() => setSelectedBidForDetail(bid)}
                        className="px-6 py-2 bg-white border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-bold shadow-sm whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div >
    )
  }

  // Handle Report Printing
  const generateProviderReport = () => {
    setPrintMode('report')
    setTimeout(() => {
      window.print()
    }, 100)
  }

  // Handle Invoice Generation
  const generateInvoice = async (bid: any) => {
    try {
      // 1. Fetch Farmer Details from Backend to get Phone, Email, Full Address
      let farmerDetails = null;
      if (bid.farmer?._id) {
        const res = await fetch(`${API_URL}/users/${bid.farmer._id}`);
        if (res.ok) {
          farmerDetails = await res.json();
        }
      }

      // 2. Prepare Enriched Invoice Data
      const enrichedData = {
        ...bid,
        farmer: {
          ...bid.farmer,
          ...farmerDetails // Merge fetched details (phone, distinct location if any)
        }
      };

      setInvoiceData(enrichedData);
      setPrintMode('invoice');

      // Wait for state update and images to load before printing
      setTimeout(() => {
        window.print()
      }, 500)

    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Could not fetch full invoice details. Printing available data.");
      // Fallback
      setInvoiceData(bid);
      setPrintMode('invoice');
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }

  // Define Printable Invoice Content - Yellow Traditional Format
  const renderInvoice = () => {
    if (!invoiceData) return null;

    const invoiceDate = new Date().toLocaleDateString();

    // Simple Number to Words Converter
    const amount = parseFloat(invoiceData.bidAmount?.replace(/[^0-9.]/g, '') || '0');
    // Basic approximation for "In Words" - ideal would be a full function
    // For a real app, use a library like 'number-to-words'
    const amountInWords = `Rupees ${amount} Only`;

    return (
      <div className="hidden print:block bg-[#fefce8] text-black font-sans max-w-[210mm] mx-auto p-4 h-screen" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>

        {/* Main Border Box */}
        <div className="border-[3px] border-black h-full flex flex-col">

          {/* Header / Company Info */}
          <div className="border-b-[3px] border-black p-4 text-center relative">
            <div className="absolute top-4 left-4 font-bold">GST No: ....................</div>
            <div className="absolute top-4 right-4 font-bold">Date: {invoiceDate}</div>

            <h2 className="text-xl font-bold uppercase mb-1">Tax Invoice Bill</h2>
            <h1 className="text-4xl font-extrabold uppercase mb-2">{user?.name || 'Company Name Pvt.Ltd'}</h1>
            <p className="font-bold text-lg">Address – {user?.location || 'Street Name, City Name'}</p>
            <p className="font-bold text-lg">Ph No: {user?.phone || '99999 99999'}</p>
          </div>

          {/* Customer Details Section */}
          <div className="border-b-[3px] border-black p-4 space-y-3">
            <div className="flex">
              <span className="font-bold w-24">Name:</span>
              <span className="border-b-2 border-dotted border-black flex-grow font-bold pl-2">{invoiceData.farmer?.name}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24">Address:</span>
              <span className="border-b-2 border-dotted border-black flex-grow font-bold pl-2">{invoiceData.serviceRequest?.location || invoiceData.farmer?.location}</span>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-1">
                <span className="font-bold w-24">Invoice No:</span>
                <span className="border-b-2 border-dotted border-black flex-grow font-bold pl-2">INV-{invoiceData._id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex flex-1">
                <span className="font-bold w-12 text-right pr-2">Date:</span>
                <span className="border-b-2 border-dotted border-black flex-grow font-bold pl-2">{invoiceDate}</span>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-1">
                <span className="font-bold w-24">Mobile:</span>
                <span className="border-b-2 border-dotted border-black flex-grow font-bold pl-2">{invoiceData.farmer?.phone}</span>
              </div>
              <div className="flex flex-1">
                <span className="font-bold w-12 text-right pr-2">Email:</span>
                <span className="border-b-2 border-dotted border-black flex-grow font-bold pl-2">{invoiceData.farmer?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Table Section - Grid Layout to match perfectly */}
          <div className="flex-grow flex flex-col">
            <div className="flex border-b-[3px] border-black bg-[#fefce8]">
              <div className="w-16 border-r-[3px] border-black p-2 text-center font-bold">Sl. No.</div>
              <div className="flex-grow border-r-[3px] border-black p-2 text-center font-bold">Particulars</div>
              <div className="w-20 border-r-[3px] border-black p-2 text-center font-bold">Qty</div>
              <div className="w-24 border-r-[3px] border-black p-2 text-center font-bold">Rate</div>
              <div className="w-32 p-2 text-center font-bold">Amount</div>
            </div>

            {/* Table Rows Container */}
            <div className="flex-grow flex relative">
              {/* Vertical Guidelines for Columns (Absolute overlay to ensure full height lines) */}
              <div className="absolute inset-0 flex pointer-events-none">
                <div className="w-16 border-r-[3px] border-black h-full"></div>
                <div className="flex-grow border-r-[3px] border-black h-full"></div>
                <div className="w-20 border-r-[3px] border-black h-full"></div>
                <div className="w-24 border-r-[3px] border-black h-full"></div>
                <div className="w-32 h-full"></div>
              </div>

              {/* Actual Data Content */}
              <div className="w-full z-10">
                {/* Row 1: The Service */}
                <div className="flex font-bold text-lg">
                  <div className="w-16 p-2 text-center">1.</div>
                  <div className="flex-grow p-2">
                    {invoiceData.serviceRequest?.type} Service
                    <div className="text-sm font-normal mt-1">{invoiceData.serviceRequest?.description}</div>
                  </div>
                  <div className="w-20 p-2 text-center">{invoiceData.serviceRequest?.duration || '1'}</div>
                  <div className="w-24 p-2 text-right">{invoiceData.serviceRequest?.budget || '-'}</div>
                  <div className="w-32 p-2 text-right">{amount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t-[3px] border-black flex">
            {/* Left Side: Empty/Notes */}
            <div className="flex-grow border-r-[3px] border-black"></div>

            {/* Right Side: Totals Box */}
            <div className="w-[340px] flex flex-col"> {/* Width covers Qty + Rate + Amount roughly */}
              <div className="flex border-b-[3px] border-black">
                <div className="flex-grow p-2 font-bold border-r-[3px] border-black text-right pr-4">Sub Total</div>
                <div className="w-32 p-2 font-bold text-right">{amount}</div>
              </div>
              <div className="flex border-b-[3px] border-black">
                <div className="flex-grow p-2 font-bold border-r-[3px] border-black text-right pr-4">Tax</div>
                <div className="w-32 p-2 font-bold text-right">-</div>
              </div>
              <div className="flex bg-[#fefce8]">
                <div className="flex-grow p-2 font-bold border-r-[3px] border-black text-right pr-4">Total</div>
                <div className="w-32 p-2 font-bold text-right">{amount}</div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="border-t-[3px] border-black p-4">
            <div className="font-bold mb-8">
              In Words: <span className="font-normal underline decoration-dotted underline-offset-4">{amountInWords}</span>
            </div>

            <div className="flex justify-between items-end mt-12">
              <div className="font-bold text-lg">Thank You and Visit Again.</div>
              <div className="font-bold text-lg">
                Signature: <span className="inline-block w-48 border-b-2 border-black"></span>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }



  // Define Printable Report Content (Global Scope)
  const renderPrintableReport = () => {
    if (printMode === 'invoice') return null; // Don't render report if in invoice mode

    // Recalculate stats for the report
    const acceptedBids = bids.filter(b => b.status === 'accepted')
    const totalEarnings = acceptedBids.reduce((sum, bid) => {
      const amount = parseFloat(bid.bidAmount.replace(/[^0-9.]/g, '')) || 0
      return sum + amount
    }, 0)
    const successRate = bids.length > 0 ? Math.round((acceptedBids.length / bids.length) * 100) : 0

    // Top Service Calculation
    const serviceCounts: Record<string, number> = {}
    bids.forEach(bid => {
      const type = bid.serviceRequest?.type || 'Other'
      serviceCounts[type] = (serviceCounts[type] || 0) + 1
    })
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'


    return (
      <div className="hidden print:block p-8 bg-white text-black font-serif max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-wider text-gray-900">Service Report</h1>
            <p className="text-gray-600 mt-1">Generated for {user?.name || 'Service Provider'}</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-500">Date Generated</p>
            <p className="text-xl font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Section 1: Financial Executive Summary */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 uppercase text-gray-800 border-l-4 border-blue-600 pl-3">Financial Executive Summary</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border border-gray-300 p-3 text-sm font-bold text-gray-700 uppercase">Metric</th>
                <th className="border border-gray-300 p-3 text-sm font-bold text-gray-700 uppercase">Value</th>
                <th className="border border-gray-300 p-3 text-sm font-bold text-gray-700 uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Total Earnings</td>
                <td className="border border-gray-300 p-3 font-bold text-green-700 text-lg">₹{totalEarnings.toLocaleString()}</td>
                <td className="border border-gray-300 p-3 text-gray-600">Total revenue from accepted service bids</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Jobs Completed</td>
                <td className="border border-gray-300 p-3 text-lg">{acceptedBids.length}</td>
                <td className="border border-gray-300 p-3 text-gray-600">Total number of successfully finished jobs</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Bid Success Rate</td>
                <td className="border border-gray-300 p-3 text-lg">{successRate}%</td>
                <td className="border border-gray-300 p-3 text-gray-600">Percentage of submitted bids that were accepted</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Top Performing Service</td>
                <td className="border border-gray-300 p-3 text-lg">{topService}</td>
                <td className="border border-gray-300 p-3 text-gray-600">Primary revenue generating service category</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 2: Active Service Portfolio */}
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-2xl font-bold mb-4 uppercase text-gray-800 border-l-4 border-blue-600 pl-3">Active Service Portfolio</h2>
          {myServices.length === 0 ? (
            <p className="text-gray-500 italic border p-4">No active services listed.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border border-gray-300 p-3 text-sm font-bold text-gray-700 uppercase">Service Title</th>
                  <th className="border border-gray-300 p-3 text-sm font-bold text-gray-700 uppercase">Category</th>
                  <th className="border border-gray-300 p-3 text-sm font-bold text-gray-700 uppercase">Rate</th>
                  <th className="border border-gray-300 p-3 text-sm font-bold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {myServices.map((service, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-3 font-medium">{service.title}</td>
                    <td className="border border-gray-300 p-3">{service.type}</td>
                    <td className="border border-gray-300 p-3">{service.rate}</td>
                    <td className="border border-gray-300 p-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase rounded-full">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    )
  }

  const renderReports = () => {
    // 1. Calculate Earnings
    const acceptedBids = bids.filter(b => b.status === 'accepted')
    const pendingBids = bids.filter(b => b.status === 'pending').length
    const rejectedBids = bids.filter(b => b.status === 'rejected').length

    /* Calculations for on-screen charts */
    const totalEarnings = acceptedBids.reduce((sum, bid) => {
      const amount = parseFloat(bid.bidAmount.replace(/[^0-9.]/g, '')) || 0
      return sum + amount
    }, 0)

    const successRate = bids.length > 0 ? Math.round((acceptedBids.length / bids.length) * 100) : 0

    const serviceCounts: Record<string, number> = {}
    bids.forEach(bid => {
      const type = bid.serviceRequest?.type || 'Other'
      serviceCounts[type] = (serviceCounts[type] || 0) + 1
    })
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    return (
      <div className="space-y-6">
        {/* Reports are now rendered globally via renderPrintableReport outside main layout */}

        {/* Dashboard View (On Screen) */}
        <div className="print:hidden space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics Center</h1>
              <p className="text-blue-100 text-lg">Financial insights and performance metrics</p>
            </div>
            <button onClick={generateProviderReport} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-50 transition-colors flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Download Report
            </button>
          </motion.div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{totalEarnings.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <IndianRupee className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-green-600 mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                From {acceptedBids.length} completed jobs
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Bid Success Rate</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{successRate}%</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${successRate}%` }}></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Top Service</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{topService}</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">Most requested service type</p>
            </motion.div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Bid Statistics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bid Distribution Chart (Visual) */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Distribution</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accepted ({acceptedBids.length})</span>
                        <span className="font-medium">{Math.round((acceptedBids.length / bids.length) * 100 || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(acceptedBids.length / bids.length) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Pending ({pendingBids})</span>
                        <span className="font-medium">{Math.round((pendingBids / bids.length) * 100 || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(pendingBids / bids.length) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Rejected ({rejectedBids})</span>
                        <span className="font-medium">{Math.round((rejectedBids / bids.length) * 100 || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(rejectedBids / bids.length) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent History Table */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Recent Transactions</h4>
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {acceptedBids.slice(0, 5).map((bid, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-sm text-gray-900">{bid.serviceRequest?.type || 'Service'}</td>
                            <td className="px-3 py-2 text-sm text-green-600 font-medium">{bid.bidAmount}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{new Date(bid.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {acceptedBids.length === 0 && (
                          <tr><td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">No accepted bids yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }



  const renderProfile = () => {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-blue-100 text-lg">Manage your account settings and preferences</p>
          </div>
          <button
            onClick={() => {
              if (isEditingProfile) {
                // If cancelling edit, reset form to current user data
                setProfileForm({
                  name: user?.name || '',
                  organization: user?.organization || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  location: user?.location || '',
                  latitude: user?.latitude || '',
                  longitude: user?.longitude || '',
                  bio: user?.bio || '',
                });
              }
              setIsEditingProfile(!isEditingProfile);
            }}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-50 transition-colors flex items-center"
          >
            <Settings className="w-5 h-5 mr-2" />
            {isEditingProfile ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Identity Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 flex flex-col items-center text-center h-fit"
          >
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-6 relative group cursor-pointer">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-blue-600" />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">Change</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.name || 'Service Provider'}</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-6">
              Service Partner
            </span>

            <div className="w-full space-y-4 border-t pt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium text-gray-900">Jan 2024</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Service Area</span>
                <span className="font-medium text-gray-900">{user?.location || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-green-600 flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>Verified</span>
              </div>
            </div>
          </motion.div>

          {/* Details Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
              {isEditingProfile && (
                <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                  Editing Mode Active
                </span>
              )}
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization / Company</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.organization}
                    onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    disabled={!isEditingProfile}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    disabled={!isEditingProfile}
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.latitude}
                    onChange={(e) => setProfileForm({ ...profileForm, latitude: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    placeholder="e.g. 21.1458"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.longitude}
                    onChange={(e) => setProfileForm({ ...profileForm, longitude: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    placeholder="e.g. 79.0882"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location / Base of Operations</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    placeholder="e.g. Nagpur, Maharashtra"
                  />
                </div>
              </div>

              {/* Location Map Display */}
              {profileForm.latitude && profileForm.longitude && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">Base Location (Map)</p>
                  <div className="bg-gray-100 rounded-xl overflow-hidden h-64 border border-gray-200 relative group">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${profileForm.latitude},${profileForm.longitude}&z=15&output=embed`}
                      className="w-full h-full"
                    ></iframe>
                    <a
                      href={`https://www.google.com/maps?q=${profileForm.latitude},${profileForm.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md text-sm font-bold text-gray-700 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Service Description</label>
                <textarea
                  rows={4}
                  disabled={!isEditingProfile}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  placeholder="Describe your services and expertise..."
                />
              </div>

              {isEditingProfile && (
                <div className="flex justify-end pt-4 border-t border-gray-100 animate-fade-in-up">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      // Reset form to current user data if cancelled
                      setProfileForm({
                        name: user?.name || '',
                        organization: user?.organization || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        location: user?.location || '',
                        latitude: user?.latitude || '',
                        longitude: user?.longitude || '',
                        bio: user?.bio || '',
                      });
                    }}
                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium mr-4 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'services': return renderServices()
      case 'jobs': return renderJobs()
      case 'bids': return renderBids()
      case 'history': return renderAcceptedBids()
      case 'reports': return renderReports()
      case 'chats': return (
        user ? <ChatSystem currentUser={{ id: user._id, name: user.name }} role="provider" /> : <div>Loading...</div>
      )
      case 'profile': return renderProfile()
      default: return renderOverview()
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastNotification
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
      {/* Global Printable Report (Visible ONLY when printing) */}
      {renderPrintableReport()}

      {/* Main Dashboard UI (Hidden when printing) */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-0 md:space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center -ml-3 md:ml-0">
                <img src="/logo.png" alt="FarmConnect Logo" className="w-12 h-12 -mr-1 md:w-14 md:h-14 md:-mr-2 -mt-1 md:-mt-1.5 rounded-lg object-contain" />
                <span className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">FarmConnect</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative ml-2">
                <div
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                    <span className="text-blue-700 font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'S'}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-gray-700">{user?.name || 'Service Provider'}</span>
                </div>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors font-medium"
                    >
                      <User className="w-4 h-4 mr-3 text-gray-500" />
                      Profile
                    </button>
                    <button
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors font-medium"
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-500" />
                      Settings
                    </button>
                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)] print:hidden">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {[
                  { id: 'overview', name: 'Overview', icon: <Home className="w-5 h-5" /> },
                  { id: 'services', name: 'My Services', icon: <Wrench className="w-5 h-5" /> },
                  { id: 'jobs', name: 'Job Requests', icon: <Briefcase className="w-5 h-5" /> },
                  { id: 'bids', name: 'My Bids', icon: <FileText className="w-5 h-5" /> },
                  { id: 'history', name: 'Market History', icon: <CheckCircle className="w-5 h-5" /> },
                  { id: 'reports', name: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
                  { id: 'chats', name: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
                  { id: 'profile', name: 'Profile', icon: <User className="w-5 h-5" /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === item.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-gray-200 p-4 mt-auto">
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
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}



      {/* Add New Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleServiceSubmit} className="space-y-4">
              {/* Image Upload Section */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl text-gray-400">
                        {serviceForm.type === 'Vehicle' ? '🚛' : '🛠️'}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer hover:bg-blue-700 shadow-md transform translate-x-1/4 translate-y-1/4">
                    <Plus className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Title</label>
                <input
                  type="text"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  placeholder="e.g. Premium Tractor Rental"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={serviceForm.type}
                    onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Vehicle">Vehicle</option>
                    <option value="Manpower">Manpower</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Storage">Storage</option>
                    <option value="Processing">Processing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                  <input
                    type="text"
                    value={serviceForm.rate}
                    onChange={(e) => setServiceForm({ ...serviceForm, rate: e.target.value })}
                    placeholder="e.g. ₹500/hr"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Describe your service..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={serviceForm.contactPhone}
                    onChange={(e) => setServiceForm({ ...serviceForm, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select
                    value={serviceForm.availability}
                    onChange={(e) => setServiceForm({ ...serviceForm, availability: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Weekend Only">Weekend Only</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 btn-outline py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2"
                >
                  {editingService ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Bid Details Modal */}
      {selectedBidForDetail && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-blue-600 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {selectedBidForDetail.serviceRequest?.type || 'Service'} Job
                </h2>
                <div className="flex items-center text-blue-100 mt-2 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  Posted {new Date(selectedBidForDetail.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedBidForDetail(null)}
                className="text-white hover:bg-blue-700/50 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8">

              {/* Description Section */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedBidForDetail.serviceRequest?.description || 'No description provided.'}
                </p>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location & Farmer */}
                <div className="space-y-4">
                  <div>
                    <h4 className="flex items-center text-gray-500 text-sm font-semibold mb-1">
                      <MapPin className="w-4 h-4 mr-2" /> Location
                    </h4>
                    <p className="font-medium text-gray-900 border-l-2 border-blue-500 pl-3">
                      {selectedBidForDetail.serviceRequest?.location || 'Unknown Location'}
                    </p>
                  </div>
                  <div>
                    <h4 className="flex items-center text-gray-500 text-sm font-semibold mb-1">
                      <User className="w-4 h-4 mr-2" /> Posted By
                    </h4>
                    <p className="font-medium text-gray-900 border-l-2 border-blue-500 pl-3">
                      {selectedBidForDetail.farmer?.name || 'Farmer'} <span className="text-gray-400 text-sm ml-1">(#{selectedBidForDetail.farmer?._id?.slice(-4) || 'ID'})</span>
                    </p>
                  </div>
                </div>

                {/* Dates & Duration */}
                <div className="space-y-4">
                  <div>
                    <h4 className="flex items-center text-gray-500 text-sm font-semibold mb-1">
                      <CalendarIcon className="w-4 h-4 mr-2" /> Schedule
                    </h4>
                    <div className="font-medium text-gray-900 border-l-2 border-green-500 pl-3">
                      <p>Start: {selectedBidForDetail.serviceRequest?.scheduledDate ? new Date(selectedBidForDetail.serviceRequest.scheduledDate).toLocaleDateString() : 'TBD'}</p>
                      <p className="text-sm text-gray-500">End: {selectedBidForDetail.serviceRequest?.endDate ? new Date(selectedBidForDetail.serviceRequest.endDate).toLocaleDateString() : 'TBD'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="flex items-center text-gray-500 text-sm font-semibold mb-1">
                      <Clock className="w-4 h-4 mr-2" /> Duration
                    </h4>
                    <p className="font-medium text-gray-900 border-l-2 border-green-500 pl-3">
                      {selectedBidForDetail.serviceRequest?.duration || 'Flexible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financials Strip */}
              <div className="pt-6 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-blue-50">
                    <span className="block text-xs text-blue-600 font-bold uppercase">Your Bid</span>
                    <span className="block text-xl font-bold text-gray-900">{selectedBidForDetail.bidAmount}</span>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <span className="block text-xs text-gray-500 font-bold uppercase">Budget</span>
                    <span className="block text-xl font-bold text-gray-700">{selectedBidForDetail.serviceRequest?.budget || 'N/A'}</span>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <span className="block text-xs text-gray-500 font-bold uppercase">Status</span>
                    <span className={`block text-lg font-bold uppercase ${selectedBidForDetail.status === 'accepted' ? 'text-green-600' :
                      selectedBidForDetail.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      {selectedBidForDetail.status}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 flex justify-end">
              <button
                onClick={() => setSelectedBidForDetail(null)}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {selectedBidForDetail.status === 'accepted' && (
                <button
                  onClick={() => generateInvoice(selectedBidForDetail)}
                  className="ml-3 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Bill Now
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showSignOutConfirm && (
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
      )}
    </div>
  )
}

export default ServiceProviderDashboard
