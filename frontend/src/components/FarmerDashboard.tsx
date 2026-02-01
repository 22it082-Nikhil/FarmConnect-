// Import required libraries and components
import { motion } from 'framer-motion' // For smooth animations and transitions
import { useState, useEffect } from 'react' // For managing component state
import { useClerk } from '@clerk/clerk-react'
import {
  // Navigation and UI icons for farmer dashboard
  Leaf, Truck, Users, ShoppingCart, MapPin, IndianRupee, MessageSquare,
  Settings, LogOut, Plus, FileText, Download,
  Bell, Menu, User, TrendingUp, TrendingDown,
  CheckCircle, AlertCircle, Trash,
  ArrowRight, Cloud, Sun, Warehouse, UserCheck, Home, Shield, Wrench, Star, Clock, Crop, BarChart3
} from 'lucide-react' // Icon library for consistent UI elements
import API_URL from '../config'
import ChatSystem from './ChatSystem'

// Main Farmer Dashboard Component - Provides comprehensive interface for crop farmers
const FarmerDashboard = () => {
  // State management for dashboard functionality
  const [activeTab, setActiveTab] = useState('overview') // Controls which section is currently displayed
  // State for reports
  const [reportData, setReportData] = useState({
    income: 0,
    expenses: 0,
    netProfit: 0,
    cropSales: [] as any[],
    serviceExpenses: [] as any[]
  })
  const [reportTab, setReportTab] = useState('income') // 'income' or 'expenses' // Controls which section is currently displayed
  const [sidebarOpen, setSidebarOpen] = useState(false) // Controls mobile sidebar visibility
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false) // Controls sign out confirmation modal
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  // Function to show sign out confirmation modal
  const handleSignOut = () => {
    setShowSignOutConfirm(true) // Opens the confirmation dialog
  }

  const { signOut } = useClerk()
  // Function to confirm sign out and redirect to home page
  const confirmSignOut = async () => {
    localStorage.removeItem('user')
    await signOut()
    window.location.href = '/' // Redirects user back to homepage
  }



  // Dynamic Overview State
  const [weather, setWeather] = useState<any>(null)
  const [revenueStats, setRevenueStats] = useState({ total: 0, trend: 0, increase: 0 })
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  // Helper: Fetch Weather (Open-Meteo API)
  const fetchWeather = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
          const data = await res.json()
          setWeather(data.current_weather)
        } catch (err) {
          console.error("Weather fetch failed", err)
        }
      })
    }
  }

  // Dynamic Crop State
  const [crops, setCrops] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCrop, setCurrentCrop] = useState<any>(null)
  const [cropForm, setCropForm] = useState({
    name: '',
    quantity: '',
    price: '',
    image: '🌾',
    status: 'active'
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null) // Selected image file
  const [imagePreview, setImagePreview] = useState<string | null>(null) // Image preview URL
  const [uploadingImage, setUploadingImage] = useState(false) // Image upload loading state


  // Dynamic Requests State
  const [requests, setRequests] = useState<any[]>([])
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<any>(null)

  // Service Available State (Read-only for Farmers)
  const [availableServices, setAvailableServices] = useState<any[]>([])
  // Market Prices State
  const [marketPrices, setMarketPrices] = useState<any[]>([])

  const fetchMarketPrices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/market-prices`)
      if (res.ok) {
        const data = await res.json()
        setMarketPrices(data)
      }
    } catch (err) {
      console.error("Failed to fetch market prices", err)
    }
  }
  const fetchAvailableServices = async () => {
    try {
      const [servicesRes, rentalsRes] = await Promise.all([
        fetch(`${API_URL}/api/provider-services`),
        fetch(`${API_URL}/api/rentals`)
      ])

      let mergedData: any[] = []

      if (servicesRes.ok) {
        const services = await servicesRes.json()
        mergedData = [...mergedData, ...services.map((s: any) => ({ ...s, category: 'Service' }))]
      }

      if (rentalsRes.ok) {
        const rentals = await rentalsRes.json()
        // Filter out my own rentals if needed, or show all. User asked for "farmers List New Equipment then it should also show"
        // We will show all available rentals.
        mergedData = [...mergedData, ...rentals.filter((r: any) => r.status === 'available').map((r: any) => ({
          _id: r._id,
          title: r.name,
          description: r.description,
          type: r.type,
          rate: r.pricePerHour,
          image: r.image,
          availability: r.status,
          contactPhone: r.farmer?.phone || 'Contact Farmer', // Assuming populating farmer
          provider: { name: r.farmer?.name || 'Fellow Farmer' }, // Mapping farmer to provider visual
          category: 'Rental Equipment'
        }))]
      }

      setAvailableServices(mergedData)
    } catch (err) {
      console.error("Failed to fetch available services", err)
    }
  }

  // New States for Offers Management
  const [viewOffersModal, setViewOffersModal] = useState(false)
  const [currentOffers, setCurrentOffers] = useState<any[]>([])
  const [selectedRequestForOffers, setSelectedRequestForOffers] = useState<any>(null)
  const [selectedCropForOffers, setSelectedCropForOffers] = useState<any>(null)

  const [locationType, setLocationType] = useState<'text' | 'coords'>('text')
  const [serviceForm, setServiceForm] = useState({
    type: 'Vehicle',
    description: '',
    location: '',
    duration: '',
    budget: '',
    status: 'pending',
    latitude: '',
    longitude: '',
    scheduledDate: '',
    endDate: ''
  })

  // Dynamic Rentals State
  const [rentals, setRentals] = useState<any[]>([])
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false)
  const [currentRental, setCurrentRental] = useState<any>(null)
  const [rentalForm, setRentalForm] = useState({
    name: '',
    type: 'Tractor',
    pricePerHour: '',
    description: '',
    image: '🚜',
    status: 'available'
  })

  const [selectedRentalImage, setSelectedRentalImage] = useState<File | null>(null)
  const [rentalImagePreview, setRentalImagePreview] = useState<string | null>(null)
  const [uploadingRentalImage, setUploadingRentalImage] = useState(false)

  // Fetch Crops
  const fetchCrops = async () => {
    if (!user?._id) return
    try {
      const res = await fetch(`${API_URL}/api/crops?farmerId=${user._id}`)
      const data = await res.json()
      setCrops(data)
    } catch (err) {
      console.error("Failed to fetch crops", err)
    }
  }

  // Fetch Service Requests
  const fetchRequests = async () => {
    if (!user?._id) return
    try {
      const res = await fetch(`${API_URL}/api/service-requests?farmerId=${user._id}`)
      const data = await res.json()
      setRequests(data)
    } catch (err) {
      console.error("Failed to fetch requests", err)
    }
  }

  // Fetch Rentals
  const fetchRentals = async () => {
    if (!user?._id) return
    try {
      const res = await fetch(`${API_URL}/api/rentals?farmerId=${user._id}`)
      const data = await res.json()
      setRentals(data)
    } catch (err) {
      console.error("Failed to fetch rentals", err)
    }
  }

  // Fetch Report Data (Accepted Offers)
  const fetchReportData = async () => {
    if (!user?._id) return
    try {
      const response = await fetch(`${API_URL}/api/offers?farmerId=${user._id}&status=accepted`)
      if (response.ok) {
        const data = await response.json()

        let totalIncome = 0
        let totalExpenses = 0
        const saleTransactions: any[] = []
        const expenseTransactions: any[] = []

        data.forEach((offer: any) => {
          // Remove currency symbol and parse
          const amountStr = offer.bidAmount ? offer.bidAmount.replace(/[^0-9.-]+/g, "") : "0"
          const amount = parseFloat(amountStr) || 0

          if (offer.offerType === 'crop') {
            // I sold a crop -> Income
            totalIncome += amount
            saleTransactions.push(offer)
          } else if (offer.offerType === 'service') {
            // I requested a service -> Expense
            totalExpenses += amount
            expenseTransactions.push(offer)
          }
        })

        setReportData({
          income: totalIncome,
          expenses: totalExpenses,
          netProfit: totalIncome - totalExpenses,
          cropSales: saleTransactions,
          serviceExpenses: expenseTransactions
        })

        // Update Revenue Stats for Overview Section
        setRevenueStats({
          total: totalIncome,
          trend: 12, // Placeholder trend
          increase: Math.floor(totalIncome * 0.12) // Estimated increase based on current revenue
        })
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    }
  }

  // Effect to load data when user is loaded
  useEffect(() => {
    if (user?._id) {
      fetchCrops()
      fetchRequests()
      fetchRentals()
      fetchOffers()
      fetchWeather()
      fetchAvailableServices()
      fetchReportData()
      fetchMarketPrices()
    }
  }, [user])

  // Dashboard statistics data - Key metrics displayed in the overview section
  const dashboardStats = [
    { title: "Total Crops", value: crops.length, change: "+2", icon: <Crop className="w-6 h-6" />, color: "text-green-600", bgColor: "bg-green-100" }, // Shows total number of crops planted
    { title: "Active Listings", value: crops.filter(c => c.status === 'active').length, change: "+1", icon: <ShoppingCart className="w-6 h-6" />, color: "text-blue-600", bgColor: "bg-blue-100" }, // Shows crops currently for sale
    { title: "Service Requests", value: requests.length, change: "+3", icon: <Truck className="w-6 h-6" />, color: "text-orange-600", bgColor: "bg-orange-100" }, // Shows pending service requests
    { title: "Total Revenue", value: `₹${revenueStats.total.toLocaleString()}`, change: `+${revenueStats.trend}%`, icon: <IndianRupee className="w-6 h-6" />, color: "text-purple-600", bgColor: "bg-purple-100" } // Shows total earnings from crop sales
  ]

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
      }
      setSelectedImage(file);
      // Create preview URL (Base64)
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle rental image file selection
  const handleRentalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
      }
      setSelectedRentalImage(file);
      // Create preview URL (Base64)
      const reader = new FileReader();
      reader.onloadend = () => {
        setRentalImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Removed uploadImage function as we are now using Base64 directly


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCropForm({ ...cropForm, [e.target.name]: e.target.value })
  }

  const handleSubmitCrop = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Use Base64 image if selected
      let finalImage = cropForm.image;
      if (selectedImage && imagePreview) {
        finalImage = imagePreview;
      }

      const url = currentCrop
        ? `${API_URL}/api/crops/${currentCrop._id}`
        : `${API_URL}/api/crops`

      const method = currentCrop ? 'PUT' : 'POST'

      const cropData = { ...cropForm, image: finalImage };
      const body = currentCrop
        ? JSON.stringify(cropData)
        : JSON.stringify({ ...cropData, farmer: user._id })

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchCrops()
        setCropForm({ name: '', quantity: '', price: '', image: '🌾', status: 'active' })
        setCurrentCrop(null)
        setSelectedImage(null)
        setImagePreview(null)
      }
    } catch (err) {
      console.error("Error saving crop", err)
    }
  }

  const openAddModal = () => {
    setCurrentCrop(null)
    setCropForm({ name: '', quantity: '', price: '', image: '🌾', status: 'active' })
    setSelectedImage(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  const openEditModal = (crop: any) => {
    setCurrentCrop(crop)
    setCropForm({
      name: crop.name,
      quantity: crop.quantity,
      price: crop.price,
      image: crop.image,
      status: crop.status
    })
    setSelectedImage(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  const handleDeleteCrop = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return

    try {
      const res = await fetch(`${API_URL}/api/crops/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchCrops()
      }
    } catch (err) {
      console.error("Error deleting crop", err)
    }
  }

  const handleViewOffers = async (request: any) => {
    setSelectedRequestForOffers(request)
    setSelectedCropForOffers(null)
    try {
      const res = await fetch(`${API_URL}/api/offers?farmerId=${user?._id}`)
      const offers = await res.json()

      // Filter for this specific request and status != rejected
      const relevantOffers = offers.filter((o: any) =>
        o.serviceRequest &&
        (o.serviceRequest._id === request._id || o.serviceRequest === request._id)
      )

      setCurrentOffers(relevantOffers)
      setViewOffersModal(true)
    } catch (err) {
      console.error("Failed to fetch offers", err)
      alert("Failed to load offers")
    }
  }

  const handleViewCropOffers = async (crop: any) => {
    setSelectedCropForOffers(crop)
    setSelectedRequestForOffers(null)
    try {
      const res = await fetch(`${API_URL}/api/offers?farmerId=${user?._id}`)
      const offers = await res.json()

      // Filter for this specific crop
      const relevantOffers = offers.filter((o: any) =>
        o.crop &&
        (o.crop._id === crop._id || o.crop === crop._id)
      )

      setCurrentOffers(relevantOffers)
      setViewOffersModal(true)
    } catch (err) {
      console.error("Failed to fetch offers", err)
      alert("Failed to load offers")
    }
  }

  const handleAcceptOffer = async (offer: any) => {
    try {
      // 1. Update Offer to 'accepted'
      const offerRes = await fetch(`${API_URL}/api/offers/${offer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      })

      if (offerRes.ok) {
        if (offer.offerType === 'crop') {
          // For crops, backend handles inventory deduction
          alert('Bid accepted! Inventory updated. ✅')
          setViewOffersModal(false)
          fetchCrops() // Refresh to see updated quantity/status
        } else {
          // For services, update service request status
          const requestRes = await fetch(`${API_URL}/api/service-requests/${offer.serviceRequest._id || offer.serviceRequest}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
          })

          if (requestRes.ok) {
            alert('Offer accepted! Service Request marked as Completed. ✅')
            setViewOffersModal(false)
            fetchRequests()
          } else {
            // Fallback if request update fails but offer was accepted
            alert('Offer accepted, but failed to update service request status.')
          }
        }
      } else {
        console.error("Failed to update offer status to accepted")
        alert("Failed to accept offer")
      }
    } catch (err) {
      console.error("Failed to accept offer", err)
      alert("Failed to accept offer")
    }
  }

  const handleRejectOffer = async (offerId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/offers/${offerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      })

      if (res.ok) {
        alert('Offer rejected.')
        // Assuming fetchOffersForRequest is a function that refreshes offers for the current request
        // If not, you might need to re-fetch all offers or update currentOffers state
        // fetchOffersForRequest(selectedRequestForOffers._id) // This function is not defined in the provided context
        // For now, let's just refresh the requests to potentially update UI if needed
        fetchRequests();
        // You might also want to update the currentOffers state locally or re-fetch them
        // For example, by calling handleViewOffers again with the selectedRequestForOffers
        if (selectedRequestForOffers) {
          handleViewOffers(selectedRequestForOffers);
        }
      } else {
        console.error("Failed to update offer status to rejected")
        alert("Failed to reject offer")
      }
    } catch (err) {
      console.error("Failed to reject offer", err)
      alert("Failed to reject offer")
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

  // Service Request Handlers
  const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setServiceForm({ ...serviceForm, [e.target.name]: e.target.value })
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = currentRequest
        ? `${API_URL}/api/service-requests/${currentRequest._id}`
        : `${API_URL}/api/service-requests`

      const method = currentRequest ? 'PUT' : 'POST'


      // Prepare body with coordinates if applicable
      const payload: any = { ...serviceForm }

      // Handle coordinates
      if (locationType === 'coords' && serviceForm.latitude && serviceForm.longitude) {
        payload.coordinates = {
          lat: parseFloat(serviceForm.latitude),
          lng: parseFloat(serviceForm.longitude)
        }
      }

      // Cleanup temporary fields before sending
      delete payload.latitude
      delete payload.longitude

      const body = currentRequest
        ? JSON.stringify(payload)
        : JSON.stringify({ ...payload, farmer: user._id })

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })

      if (res.ok) {
        setIsServiceModalOpen(false)
        fetchRequests()
        fetchRequests()
        setServiceForm({ type: 'Vehicle', description: '', location: '', duration: '', budget: '', status: 'pending', latitude: '', longitude: '', scheduledDate: '', endDate: '' })
        setCurrentRequest(null)
      }
    } catch (err) {
      console.error("Error saving request", err)
    }
  }

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return
    try {
      const res = await fetch(`${API_URL}/api/service-requests/${id}`, { method: 'DELETE' })
      if (res.ok) fetchRequests()
    } catch (err) {
      console.error("Error deleting request", err)
    }
  }

  const openAddServiceModal = () => {
    setCurrentRequest(null)
    setServiceForm({
      type: 'Vehicle',
      description: '',
      location: '',
      duration: '',
      budget: '',
      status: 'pending',
      latitude: '',
      longitude: '',
      scheduledDate: '',
      endDate: ''
    })
    setLocationType('text')
    setIsServiceModalOpen(true)
  }

  const openEditServiceModal = (request: any) => {
    setCurrentRequest(request)
    setServiceForm({
      type: request.type,
      description: request.description,
      location: request.location,
      duration: request.duration,
      budget: request.budget,
      status: request.status,
      latitude: request.coordinates?.lat?.toString() || '',
      longitude: request.coordinates?.lng?.toString() || '',
      scheduledDate: request.scheduledDate ? new Date(request.scheduledDate).toISOString().split('T')[0] : '',
      endDate: request.endDate ? new Date(request.endDate).toISOString().split('T')[0] : ''
    })

    // Set toggle based on whether coordinates exist
    if (request.coordinates && request.coordinates.lat) {
      setLocationType('coords')
    } else {
      setLocationType('text')
    }

    setIsServiceModalOpen(true)
  }

  // Rental Handlers
  const handleRentalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRentalForm({ ...rentalForm, [e.target.name]: e.target.value })
  }

  const handleSubmitRental = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = currentRental
        ? `${API_URL}/api/rentals/${currentRental._id}`
        : `${API_URL}/api/rentals`

      const method = currentRental ? 'PUT' : 'POST'

      let finalImage = rentalForm.image;
      if (selectedRentalImage && rentalImagePreview) {
        finalImage = rentalImagePreview;
      }

      const body = currentRental
        ? JSON.stringify({ ...rentalForm, image: finalImage })
        : JSON.stringify({ ...rentalForm, image: finalImage, farmer: user._id })

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })

      if (res.ok) {
        setIsRentalModalOpen(false)
        fetchRentals()
        setRentalForm({ name: '', type: 'Tractor', pricePerHour: '', description: '', image: '🚜', status: 'available' })
        setSelectedRentalImage(null)
        setRentalImagePreview(null)
        setCurrentRental(null)
      }
    } catch (err) {
      console.error("Error saving rental", err)
    }
  }

  const handleDeleteRental = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rental listing?')) return
    try {
      const res = await fetch(`${API_URL}/api/rentals/${id}`, { method: 'DELETE' })
      if (res.ok) fetchRentals()
    } catch (err) {
      console.error("Error deleting rental", err)
    }
  }

  const openAddRentalModal = () => {
    setCurrentRental(null)
    setRentalForm({ name: '', type: 'Tractor', pricePerHour: '', description: '', image: '🚜', status: 'available' })
    setSelectedRentalImage(null)
    setRentalImagePreview(null)
    setIsRentalModalOpen(true)
  }

  const openEditRentalModal = (rental: any) => {
    setCurrentRental(rental)
    setRentalForm({
      name: rental.name,
      type: rental.type,
      pricePerHour: rental.pricePerHour,
      description: rental.description,
      image: rental.image,
      status: rental.status
    })
    setSelectedRentalImage(null)
    setRentalImagePreview(null)
    setIsRentalModalOpen(true)
  }

  const renderAvailableServices = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">Service Market</h2>
            <p className="text-primary-100 text-lg">Explore services offered by providers in your area</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableServices.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-2">No service providers found.</p>
          </div>
        ) : (
          availableServices.map((service) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="text-center mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">
                    {service.provider?.name || 'Service Provider'}
                  </span>
                </div>

                {/* Image Display Logic */}
                <div className="h-40 w-full mb-4 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {service.image && service.image.startsWith('data:image') ? (
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">{service.image || '🛠️'}</span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                <div className="flex justify-center mt-1 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${service.category === 'Rental Equipment' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                    {service.category || 'Service'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{service.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-medium text-green-600">{service.rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium text-blue-600 select-all">{service.contactPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${(service.availability === 'Available' || service.status === 'active') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {service.availability || service.status || 'Active'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 btn-primary text-sm py-2" onClick={() => alert(`Call ${service.contactPhone}`)}>
                  Call Now
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )

  // Renders the main overview section with dashboard statistics and key information
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section - Hero banner with greeting and current date */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Farmer'}! 👋</h1>
            <p className="text-primary-100 text-lg">Here's what's happening with your farm today</p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-primary-100">Today's Date</p>
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
                <p className="text-sm text-green-600 font-medium">{stat.change}</p>
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
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Earnings</span>
              <span className="text-2xl font-bold text-green-600">₹{revenueStats.total.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style={{ width: `${Math.min(revenueStats.trend * 5, 100)}%` }}></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">+{revenueStats.trend}% estimated growth</span>
              <span className="text-green-600 font-medium">₹{revenueStats.increase.toLocaleString()} increase</span>
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
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`} />
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
            )) : (
              <p className="text-gray-500 text-sm text-center py-4">No recent activity found.</p>
            )}
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
            <button
              onClick={() => setActiveTab('crops')}
              className="w-full btn-primary text-left py-3 px-4 flex items-center justify-between group"
            >
              <span className="flex items-center">
                <Plus className="w-5 h-5 mr-3" /> Add New Crop
              </span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => { setActiveTab('services'); openAddServiceModal() }}
              className="w-full btn-outline text-left py-3 px-4 flex items-center justify-between group"
            >
              <span className="flex items-center">
                <Truck className="w-5 h-5 mr-3" /> Book Logistics
              </span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={generatePDFReport}
              className="w-full btn-outline text-left py-3 px-4 flex items-center justify-between group"
            >
              <span className="flex items-center">
                <FileText className="w-5 h-5 mr-3" /> Generate Report
              </span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </motion.div>

        {/* Weather Forecast (Dynamic) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Live Weather</h3>
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold mb-2">{weather ? `${weather.temperature}°C` : 'Wait...'}</div>
              <p className="text-blue-100">{weather ? `Wind: ${weather.windspeed} km/h` : 'Fetching...'}</p>
            </div>
            <Sun className="w-12 h-12 text-yellow-300 animate-pulse" />
          </div>
          <div className="mt-6 flex justify-between items-center text-sm text-blue-100">
            <span>{new Date().toLocaleDateString()}</span>
            <span>{weather ? 'Now' : '...'}</span>
          </div>
        </motion.div>

        {/* Market Prices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Prices</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Wheat</span>
              <span className="font-medium text-green-600">₹1.20/kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rice</span>
              <span className="font-medium text-green-600">₹1.80/kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Corn</span>
              <span className="font-medium text-green-600">₹0.90/kg</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Prices updated 2 hours ago</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )



  // Offers State and Handlers
  const [offers, setOffers] = useState<any[]>([])

  // Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    farmSize: '',
    bio: '',
    latitude: '',
    longitude: ''
  })

  // Initialize Profile Form when User loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        farmSize: user.farmSize || '',
        bio: user.bio || '',
        latitude: user.latitude || '',
        longitude: user.longitude || ''
      })
    }
  }, [user])

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
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
      }
    } catch (err) {
      console.error("Failed to update profile", err)
      alert("Failed to update profile. Please try again.")
    }
  }

  const renderProfile = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary-600 text-4xl font-bold border-4 border-primary-200">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-1">{user?.name}</h2>
            <p className="text-primary-100 mb-2">{user?.organization || 'Independent Farmer'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="bg-primary-500 bg-opacity-30 px-3 py-1 rounded-full text-sm flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> {user?.location || 'Location not set'}
              </span>
              <span className="bg-primary-500 bg-opacity-30 px-3 py-1 rounded-full text-sm flex items-center">
                <Warehouse className="w-4 h-4 mr-1" /> {user?.farmSize || 'Size not set'}
              </span>
            </div>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
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
            <h3 className="text-xl font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Personal Information</h3>
            <UserCheck className="w-6 h-6 text-primary-500" />
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location / Village</label>
                  <input
                    type="text"
                    name="location"
                    value={profileForm.location}
                    onChange={handleProfileInputChange}
                    placeholder="e.g. Anand, Gujarat"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm Size (Acres/Hectares)</label>
                  <input
                    type="text"
                    name="farmSize"
                    value={profileForm.farmSize}
                    onChange={handleProfileInputChange}
                    placeholder="e.g. 5 Acres"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={profileForm.latitude}
                    onChange={handleProfileInputChange}
                    placeholder="e.g. 21.1458"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={profileForm.longitude}
                    onChange={handleProfileInputChange}
                    placeholder="e.g. 79.0882"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Farm Description</label>
                <textarea
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileInputChange}
                  rows={4}
                  placeholder="Tell us about your farm and what you grow..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg"
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
                  <p className="font-semibold text-gray-900 border-b pb-2">{user?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-semibold text-gray-900 border-b pb-2">{user?.location || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Farm Size</p>
                  <p className="font-semibold text-gray-900 border-b pb-2">{user?.farmSize || 'Not provided'}</p>
                </div>
              </div>

              {/* Location Map Display */}
              {user?.latitude && user?.longitude && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">Field Location (Map)</p>
                  <div className="bg-gray-100 rounded-xl overflow-hidden h-64 border border-gray-200 relative group">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${user.latitude},${user.longitude}&z=15&output=embed`}
                      className="w-full h-full"
                    ></iframe>
                    <a
                      href={`https://www.google.com/maps?q=${user.latitude},${user.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md text-sm font-bold text-gray-700 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">About Farm</p>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 italic border border-gray-200">
                  "{user?.bio || 'No description added yet.'}"
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Account Details Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-l-4 border-yellow-500 pl-3">Account Status</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-600">Verified Farmer</p>
                <p className="text-xs text-gray-500">Account is active and verified</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Member Since:</span>
                <span className="font-medium">{new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Login:</span>
                <span className="font-medium">Just now</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl shadow-lg p-6 text-white text-center">
            <Star className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
            <h3 className="text-xl font-bold mb-2">Pro Features</h3>
            <p className="text-primary-200 text-sm mb-4">Upgrade to access advanced market analytics and priority support.</p>
            <button className="bg-white text-primary-900 px-6 py-2 rounded-full font-bold text-sm w-full hover:bg-yellow-400 hover:text-primary-900 transition-colors">
              Upgrade to Pro (Coming Soon)
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )

  // Helper: Calculate Revenue from Accepted Offers
  const calculateRevenue = () => {
    // Current Revenue
    const total = offers
      .filter(o => o.status === 'accepted')
      .reduce((sum, o) => sum + (parseFloat(o.pricePerUnit) * parseFloat(o.quantityRequested)), 0)

    // Mock Trend Logic (In a real app, we'd filter by month)
    // Randomize slightly to show dynamic movement if static
    const trend = 12 + Math.floor(Math.random() * 5)
    const increase = Math.floor(total * (trend / 100))

    setRevenueStats({ total, trend, increase })
  }

  // Helper: Aggregate Recent Activities
  const generateActivities = () => {
    const activities = [
      ...crops.map(c => ({
        type: 'crop',
        message: `Listed ${c.quantity} of ${c.name}`,
        time: new Date(c.createdAt).toLocaleDateString(),
        sortTime: new Date(c.createdAt).getTime(),
        status: 'success'
      })),
      ...requests.map(r => ({
        type: 'service',
        message: `Requested ${r.type}: ${r.description.substring(0, 20)}...`,
        time: new Date(r.createdAt).toLocaleDateString(),
        sortTime: new Date(r.createdAt).getTime(),
        status: r.status === 'completed' ? 'success' : 'pending'
      })),
      ...offers.map(o => ({
        type: 'offer',
        message: `New offer for ${o.crop?.name || 'Crop'}`,
        time: new Date(o.createdAt).toLocaleDateString(),
        sortTime: new Date(o.createdAt).getTime(),
        status: 'pending'
      }))
    ]

    // Sort by newest first and take top 5
    const sorted = activities.sort((a, b) => b.sortTime - a.sortTime).slice(0, 5)
    setRecentActivities(sorted)
  }

  // Recalculate Overview when data changes
  useEffect(() => {
    calculateRevenue()
    generateActivities()
  }, [crops, requests, offers])

  const fetchOffers = async () => {
    if (!user?._id) return
    try {
      const res = await fetch(`${API_URL}/api/offers?farmerId=${user._id}`)
      const data = await res.json()
      setOffers(data)
    } catch (err) {
      console.error("Failed to fetch offers", err)
    }
  }

  const handleOfferAction = async (offerId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/offers/${offerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchOffers() // Refresh offers
        fetchCrops() // Refresh crops (in case one was sold)
      }
    } catch (err) {
      console.error("Failed to update offer", err)
    }
  }

  const handleSimulateOffer = async () => {
    // Pick a random crop to make an offer on
    const activeCrops = crops.filter(c => c.status === 'active')
    if (activeCrops.length === 0) {
      alert("You need active crops to receive offers! Add a crop first.")
      return
    }
    const randomCrop = activeCrops[Math.floor(Math.random() * activeCrops.length)]

    // Create a dummy offer
    const dummyOffer = {
      farmer: user._id,
      crop: randomCrop._id,
      buyerName: "Organic Whole Foods Market",
      pricePerUnit: parseFloat(randomCrop.price.replace(/[^0-9.]/g, '')) * 1.1, // Offer 10% more
      quantityRequested: randomCrop.quantity,
      message: "We are interested in your high quality produce."
    }

    try {
      const res = await fetch('${API_URL}/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyOffer)
      })
      if (res.ok) fetchOffers()
    } catch (err) {
      console.error("Failed to simulate offer", err)
    }
  }

  const renderCrops = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Crops</h2>
            <p className="text-primary-100 text-lg">Manage your crop listings and sales</p>
          </div>
          <button onClick={openAddModal} className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-50 hover:shadow-xl transition-all duration-300 flex items-center transform hover:-translate-y-1">
            <Plus className="w-5 h-5 mr-2" />
            Add New Crop
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crops.map((crop) => (
          <motion.div
            key={crop._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="text-center mb-4">
              <div className="mb-2 flex justify-center">
                {crop.image && (crop.image.startsWith('/') || crop.image.startsWith('data:image')) ? (
                  <img
                    src={crop.image.startsWith('/') ? `${API_URL}${crop.image}` : crop.image}
                    alt={crop.name}
                    className="w-24 h-24 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling!.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <div className="text-4xl">{crop.image}</div>
                )}
                {/* Fallback for error loading image */}
                <div className="hidden text-4xl">{crop.image || '🌾'}</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{crop.name}</h3>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{crop.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-green-600">{crop.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${crop.status === 'active' ? 'bg-green-100 text-green-800' :
                  crop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {crop.status}
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleViewCropOffers(crop)}
                className="btn-primary text-sm py-2 px-4 w-full relative"
              >
                View Offers
                {/* Optional: Add badge if there are pending offers (requires offer count in crop object or derived) */}
              </button>
              <div className="flex space-x-2">
                <button onClick={() => openEditModal(crop)} className="flex-1 btn-outline text-sm py-2">Edit</button>
                <button onClick={() => handleDeleteCrop(crop._id)} className="p-2 btn-outline text-red-600 hover:bg-red-50 border-red-200">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {currentCrop ? 'Edit Crop' : 'Add New Crop'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCrop} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name</label>
                <input
                  type="text"
                  name="name"
                  value={cropForm.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="text"
                    name="quantity"
                    value={cropForm.quantity}
                    onChange={handleInputChange}
                    placeholder="e.g. 500 kg"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="text"
                    name="price"
                    value={cropForm.price}
                    onChange={handleInputChange}
                    placeholder="e.g. ₹1.20/kg"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={cropForm.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Image</label>
                  <div className="space-y-2">
                    {/* Image Preview */}
                    {(imagePreview || cropForm.image) && (
                      <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : cropForm.image && !cropForm.image.startsWith('http') ? (
                            <span className="text-4xl">{cropForm.image}</span>
                          ) : cropForm.image ? (
                            <img src={cropForm.image} alt="Crop" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                      </div>
                    )}
                    {/* File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">Upload an image or use emoji below (max 5MB)</p>
                    {/* Emoji Fallback */}
                    <input
                      type="text"
                      name="image"
                      value={cropForm.image}
                      onChange={handleInputChange}
                      placeholder="Or enter emoji (e.g., 🌾)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {uploadingImage && (
                      <p className="text-sm text-primary-600">Uploading image...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-outline py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2"
                >
                  {currentCrop ? 'Update Crop' : 'Add Crop'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )

  /* Removed static serviceRequests array - it is now dynamic state `requests` */

  const renderServices = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">Service Requests</h2>
            <p className="text-primary-100 text-lg">Manage your harvest service requirements</p>
          </div>
          <button onClick={openAddServiceModal} className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-50 hover:shadow-xl transition-all duration-300 flex items-center transform hover:-translate-y-1">
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </button>
        </div>
      </motion.div>

      <div className="space-y-4">
        {requests.map((service) => (
          <motion.div
            key={service._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    {service.type === 'Vehicle' ? <Truck className="w-5 h-5 text-primary-600" /> :
                      service.type === 'Manpower' ? <Users className="w-5 h-5 text-primary-600" /> :
                        <Crop className="w-5 h-5 text-primary-600" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.type} Request</h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mt-4 items-center whitespace-nowrap">
                  <div>
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wider block">Location</span>
                    <p className="font-semibold text-gray-900 truncate">{service.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wider block">Duration</span>
                    <p className="font-semibold text-gray-900 truncate">{service.duration}</p>
                  </div>
                  <div>
                    {service.status === 'completed' ? (
                      <>
                        <span className="text-green-600 text-xs uppercase font-bold tracking-wider block">Accepted Bid</span>
                        <p className="font-bold text-green-700">
                          {offers.find(o => o.serviceRequest && (o.serviceRequest._id === service._id || o.serviceRequest === service._id) && o.status === 'accepted')?.bidAmount || service.budget || 'N/A'}
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider block">Budget</span>
                        <p className="font-bold text-gray-900">{service.budget || 'N/A'}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wider block">Status</span>
                    <p className={`font-bold ${service.status === 'active' ? 'text-green-600' :
                      service.status === 'pending' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>{service.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wider block">Offers</span>
                    <p className="font-bold text-gray-900">{offers.filter(o => o.serviceRequest && (o.serviceRequest._id === service._id || o.serviceRequest === service._id)).length} received</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button onClick={() => handleViewOffers(service)} className="btn-outline text-sm py-2 px-4 relative">
                  View Offers
                  {/* Badge for offer count could go here */}
                </button>
                <div className="flex space-x-2">
                  <button onClick={() => openEditServiceModal(service)} className="flex-1 btn-primary text-sm py-2 px-4">Edit</button>
                  <button onClick={() => handleDeleteRequest(service._id)} className="p-2 btn-outline text-red-600 hover:bg-red-50 border-red-200">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {currentRequest ? 'Edit Request' : 'New Service Request'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                <select
                  name="type"
                  value={serviceForm.type}
                  onChange={handleServiceInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Vehicle">Vehicle Request</option>
                  <option value="Manpower">Manpower Request</option>
                  <option value="Equipment">Equipment Request</option>
                  <option value="Storage">Storage Request</option>
                  <option value="Processing">Processing Request</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={serviceForm.description}
                  onChange={handleServiceInputChange}
                  placeholder="Describe what you need..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-lg w-full">
                  <button
                    type="button"
                    onClick={() => setLocationType('text')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${locationType === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    City / Place Name
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType('coords')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${locationType === 'coords' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    GPS Coordinates
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locationType === 'coords' ? (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location Name <span className="text-gray-400 font-normal">(e.g. "North Field")</span>
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={serviceForm.location}
                          onChange={handleServiceInputChange}
                          placeholder="Short name for the location"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                        <input
                          type="text"
                          name="latitude"
                          value={serviceForm.latitude}
                          onChange={handleServiceInputChange}
                          placeholder="e.g. 21.1458"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required={locationType === 'coords'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                        <input
                          type="text"
                          name="longitude"
                          value={serviceForm.longitude}
                          onChange={handleServiceInputChange}
                          placeholder="e.g. 79.0882"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required={locationType === 'coords'}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={serviceForm.location}
                        onChange={handleServiceInputChange}
                        placeholder="e.g. Nagpur, Maharashtra"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      name="duration"
                      value={serviceForm.duration}
                      onChange={handleServiceInputChange}
                      placeholder="e.g. 2 days"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={serviceForm.scheduledDate}
                      onChange={handleServiceInputChange}
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={serviceForm.endDate}
                      onChange={handleServiceInputChange}
                      min={serviceForm.scheduledDate || new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <input
                      type="text"
                      name="budget"
                      value={serviceForm.budget}
                      onChange={handleServiceInputChange}
                      placeholder="e.g. ₹5000"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={serviceForm.status}
                  onChange={handleServiceInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
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
                  {currentRequest ? 'Update Request' : 'Post Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )

  const renderRentals = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Rentals</h2>
            <p className="text-primary-100 text-lg">Rent out your equipment to other farmers</p>
          </div>
          <button onClick={openAddRentalModal} className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-50 hover:shadow-xl transition-all duration-300 flex items-center transform hover:-translate-y-1">
            <Wrench className="w-5 h-5 mr-2" />
            List Equipment
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rentals.map((rental) => (
          <motion.div
            key={rental._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="text-center mb-4">
              <div className="h-40 w-full mb-4 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {rental.image && rental.image.startsWith('data:image') ? (
                  <img src={rental.image} alt={rental.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">{rental.image}</span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{rental.name}</h3>
              <p className="text-sm text-gray-500">{rental.type}</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Rate:</span>
                <span className="font-medium text-primary-600">{rental.pricePerHour}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${rental.status === 'available' ? 'bg-green-100 text-green-800' :
                  rental.status === 'rented' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600 italic">"{rental.description}"</p>
            </div>

            <div className="flex space-x-2">
              <button onClick={() => openEditRentalModal(rental)} className="flex-1 btn-outline text-sm py-2">Edit</button>
              <button onClick={() => handleDeleteRental(rental._id)} className="p-2 btn-outline text-red-600 hover:bg-red-50 border-red-200">
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {isRentalModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {currentRental ? 'Edit Listing' : 'List New Equipment'}
              </h3>
              <button onClick={() => setIsRentalModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRental} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
                <input
                  type="text"
                  name="name"
                  value={rentalForm.name}
                  onChange={handleRentalInputChange}
                  placeholder="e.g. John Deere Tractor"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    value={rentalForm.type}
                    onChange={handleRentalInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Tractor">Tractor</option>
                    <option value="Harvester">Harvester</option>
                    <option value="Seeder">Seeder</option>
                    <option value="Irrigation">Irrigation System</option>
                    <option value="Tools">Manual Tools</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price / Hour</label>
                  <input
                    type="text"
                    name="pricePerHour"
                    value={rentalForm.pricePerHour}
                    onChange={handleRentalInputChange}
                    placeholder="e.g. ₹25/hr"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={rentalForm.description}
                  onChange={handleRentalInputChange}
                  placeholder="Brief details about condition, power, etc."
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={rentalForm.status}
                    onChange={handleRentalInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented Out</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Image</label>
                  <div className="space-y-2">
                    {/* Image Preview */}
                    {(rentalImagePreview || rentalForm.image) && (
                      <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                          {rentalImagePreview ? (
                            <img src={rentalImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : rentalForm.image && rentalForm.image.startsWith('data:image') ? (
                            <img src={rentalForm.image} alt="Rental" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl">{rentalForm.image}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {/* File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleRentalImageSelect}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">Upload an image or use emoji below (max 5MB)</p>
                    {/* Emoji Fallback */}
                    <input
                      type="text"
                      name="image"
                      value={rentalForm.image}
                      onChange={handleRentalInputChange}
                      placeholder="Or enter emoji (e.g., 🚜)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {uploadingRentalImage && (
                      <p className="text-sm text-primary-600">Uploading image...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsRentalModalOpen(false)}
                  className="flex-1 btn-outline py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2"
                >
                  {currentRental ? 'Update Listing' : 'List Equipment'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )

  /* New: Generate PDF Report */
  const generatePDFReport = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return alert('Please allow popups to generate report')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprehensive Financial Farm Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 40px; }
          .header-section { border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 40px; }
          .company-name { font-size: 28px; font-weight: bold; color: #166534; }
          .report-title { font-size: 18px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
          .meta-info { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; background: #f9fafb; padding: 20px; border-radius: 8px; }
          .meta-block strong { display: block; margin-bottom: 5px; color: #111; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
          
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 50px; }
          .summary-box { background: white; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .summary-val { font-size: 32px; font-weight: bold; color: #111; margin-bottom: 5px; }
          .summary-lbl { font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 500; }
          .val-green { color: #16a34a; }
          .val-red { color: #dc2626; }
          .val-blue { color: #2563eb; }

          .section-title { font-size: 20px; font-weight: bold; color: #111; margin: 40px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; }
          .section-title::before { content: ''; display: block; width: 6px; height: 24px; background: #16a34a; margin-right: 12px; border-radius: 3px; }
          
          table { w-full; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; width: 100%; }
          th { background: #f3f4f6; padding: 12px 15px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; font-size: 12px; }
          td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) { background-color: #f9fafb; }
          
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
          
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-section">
          <div class="company-name">FarmConnect Financials</div>
          <div class="report-title">Farm Performance & Transaction Report</div>
        </div>

        <div class="meta-info">
          <div class="meta-block">
            <strong>FARMER PROFILE</strong>
            <div>Name: ${user?.name || 'N/A'}</div>
            <div>ID: ${user?._id || 'N/A'}</div>
            <div>Location: ${user?.location || 'Not set'}</div>
          </div>
          <div class="meta-block" style="text-align: right;">
            <strong>REPORT GENERATION</strong>
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Time: ${new Date().toLocaleTimeString()}</div>
            <div>Period: All Time Transaction History</div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="summary-grid">
          <div class="summary-box">
            <div class="summary-val val-green">₹${reportData.income.toLocaleString()}</div>
            <div class="summary-lbl">Total Sales (Income)</div>
          </div>
          <div class="summary-box">
            <div class="summary-val val-red">₹${reportData.expenses.toLocaleString()}</div>
            <div class="summary-lbl">Total Expenses</div>
          </div>
          <div class="summary-box">
            <div class="summary-val ${reportData.netProfit >= 0 ? 'val-blue' : 'val-red'}">₹${reportData.netProfit.toLocaleString()}</div>
            <div class="summary-lbl">Net Profit / Loss</div>
          </div>
        </div>

        <!-- Section 1: Income Analysis -->
        <div class="section-title">1. Crop Sales Revenue (Income)</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Crop Details</th>
              <th>Buyer</th>
              <th>Volume Sold</th>
              <th>Revenue (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.cropSales.length > 0 ? reportData.cropSales.map((sale) => `
              <tr>
                <td>${new Date(sale.createdAt).toLocaleDateString()}</td>
                <td><strong>${sale.crop?.name || 'Unknown'}</strong></td>
                <td>${sale.buyerName || 'Direct Buyer'}</td>
                <td>${sale.quantityRequested} ${sale.crop?.unit || 'units'}</td>
                <td style="font-weight: bold; color: #16a34a;">₹${sale.bidAmount?.toString().replace(/[₹$]/g, '')}</td>
              </tr>
            `).join('') : '<tr><td colspan="5" style="text-align:center; padding: 20px;">No crop sales recorded.</td></tr>'}
          </tbody>
        </table>

        <!-- Section 2: Expense Analysis -->
        <div class="section-title">2. Operational Service Expenses</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Service Category</th>
              <th>Service Provider</th>
              <th>Job Details</th>
              <th>Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.serviceExpenses.length > 0 ? reportData.serviceExpenses.map((expense) => `
              <tr>
                <td>${new Date(expense.createdAt).toLocaleDateString()}</td>
                <td><strong>${expense.serviceRequest?.type || 'Service'}</strong></td>
                <td>${expense.provider?.name || expense.providerName || 'Provider'}</td>
                <td>${expense.message || 'Standard Service'}</td>
                <td style="font-weight: bold; color: #dc2626;">₹${expense.bidAmount?.toString().replace(/[₹$]/g, '')}</td>
              </tr>
            `).join('') : '<tr><td colspan="5" style="text-align:center; padding: 20px;">No service expenses recorded.</td></tr>'}
          </tbody>
        </table>

        <!-- Summary Footer -->
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin-top: 30px;">
          <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 16px;">Financial Summary Note</h3>
          <p style="margin: 0; font-size: 14px; color: #374151;">
            This report summarizes all accepted transactions for <strong>${user?.name || 'the verified farmer'}</strong>. 
            The net profit of <strong>₹${reportData.netProfit.toLocaleString()}</strong> is calculated based on realized revenue from crop sales minus incurred expenses from service payments.
          </p>
        </div>

        <div class="footer">
          End of Official Financial Report • Generated by FarmConnect • ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} <br>
          This document is generated for personal record keeping and analysis.
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

  /* New: Render Reports Section */
  const renderReports = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Reports</h1>
          <p className="text-green-100 text-lg">Detailed analysis of your farm's performance</p>
        </div>
        <button
          onClick={generatePDFReport}
          className="bg-white text-green-700 px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-green-50 transition-colors flex items-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Report
        </button>
      </motion.div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Profit Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <h3 className={`text-3xl font-bold mt-2 ${reportData.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                ₹{reportData.netProfit.toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${reportData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <IndianRupee className={`w-6 h-6 ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 flex items-center">
            {reportData.netProfit >= 0 ? (
              <span className="text-green-600 flex items-center font-medium mr-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                Positive
              </span>
            ) : (
              <span className="text-red-600 flex items-center font-medium mr-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                Loss
              </span>
            )}
            cash flow
          </p>
        </motion.div>

        {/* Income Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{reportData.income.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Leaf className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            From crop sales
          </p>
        </motion.div>

        {/* Expenses Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{reportData.expenses.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Wrench className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-red-600 mt-4 flex items-center">
            <TrendingDown className="w-4 h-4 mr-1" />
            Service costs
          </p>
        </motion.div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Financial Analysis</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Distribution Chart (Visual) */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-4">Cash Flow Distribution</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Income (Crops)</span>
                    <span className="font-medium">
                      {reportData.income + reportData.expenses > 0
                        ? Math.round((reportData.income / (reportData.income + reportData.expenses)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${reportData.income + reportData.expenses > 0
                          ? (reportData.income / (reportData.income + reportData.expenses)) * 100
                          : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Expenses (Services)</span>
                    <span className="font-medium">
                      {reportData.income + reportData.expenses > 0
                        ? Math.round((reportData.expenses / (reportData.income + reportData.expenses)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${reportData.income + reportData.expenses > 0
                          ? (reportData.expenses / (reportData.income + reportData.expenses)) * 100
                          : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent History Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-500">Recent Transactions</h4>
                <div className="flex space-x-2 text-xs">
                  <button
                    onClick={() => setReportTab('income')}
                    className={`px-3 py-1 rounded-full ${reportTab === 'income' ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => setReportTab('expenses')}
                    className={`px-3 py-1 rounded-full ${reportTab === 'expenses' ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Expenses
                  </button>
                </div>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportTab === 'income' ? (
                      reportData.cropSales.length > 0 ? reportData.cropSales.slice(0, 5).map((sale: any, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-sm text-gray-900">{sale.crop?.name || 'Crop Sale'}</td>
                          <td className="px-3 py-2 text-sm text-green-600 font-medium">₹{sale.bidAmount?.toString().replace(/[₹$]/g, '')}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{new Date(sale.createdAt).toLocaleDateString()}</td>
                        </tr>
                      )) : <tr><td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">No sales yet.</td></tr>
                    ) : (
                      reportData.serviceExpenses.length > 0 ? reportData.serviceExpenses.slice(0, 5).map((expense: any, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-sm text-gray-900">{expense.serviceRequest?.type || 'Service'}</td>
                          <td className="px-3 py-2 text-sm text-red-600 font-medium">₹{expense.bidAmount?.toString().replace(/[₹$]/g, '')}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{new Date(expense.createdAt).toLocaleDateString()}</td>
                        </tr>
                      )) : <tr><td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">No expenses yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  /* New: Render Offers Section */
  const renderOffers = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">Received Offers</h2>
            <p className="text-primary-100 text-lg">Review and manage bids from buyers</p>
          </div>
          <button onClick={handleSimulateOffer} className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-50 hover:shadow-xl transition-all duration-300 flex items-center transform hover:-translate-y-1">
            <Plus className="w-5 h-5 mr-2" />
            Simulate New Offer
          </button>
        </div>
      </motion.div>

      <div className="space-y-4">
        {offers.map((offer) => (
          <motion.div
            key={offer._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                  {offer.crop?.image || '📦'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{offer.crop?.name || 'Unknown Crop'}</h3>
                  <div className="flex items-center text-sm text-gray-500 space-x-2">
                    <User className="w-4 h-4" />
                    <span>{offer.buyerName}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-8">
                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Offer Price</p>
                  <p className="text-2xl font-bold text-green-600">₹{offer.pricePerUnit}/unit</p>
                  <p className="text-xs text-gray-400">for {offer.quantityRequested}</p>
                </div>

                <div>
                  {offer.status === 'pending' ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOfferAction(offer._id, 'accepted')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center shadow-md"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Accept
                      </button>
                      <button
                        onClick={() => handleOfferAction(offer._id, 'rejected')}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center ${offer.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {offer.status === 'accepted' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                      {offer.status.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {offer.message && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-600 text-sm italic">"{offer.message}"</p>
              </div>
            )}
          </motion.div>
        ))}
        {offers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-2">No offers received yet.</p>
            <button onClick={handleSimulateOffer} className="text-primary-600 font-medium hover:underline">
              Simulate an offer to test
            </button>
          </div>
        )}
      </div>
    </div>
  )



  /* Derived Market Stats for Summary Cards */
  const getMarketStats = () => {
    if (marketPrices.length === 0) return { highest: { price: 0, crop: 'N/A' }, lowest: { price: 0, crop: 'N/A' }, avg: 0 }

    const sorted = [...marketPrices].sort((a, b) => b.price - a.price)
    const highest = sorted[0]
    const lowest = sorted[sorted.length - 1]
    const avg = Math.round(marketPrices.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0) / marketPrices.length)

    return { highest, lowest, avg }
  }

  const renderMarketPrices = () => {
    const stats = getMarketStats()

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 sm:p-8 text-white"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Live Market Prices</h2>
              <p className="text-green-100 text-sm sm:text-lg">Real-time Mandi rates for key crops</p>
            </div>
            <div className="bg-white text-green-700 px-4 py-2 rounded-xl font-bold shadow-lg flex items-center text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live Updates
            </div>
          </div>
        </motion.div>

        {/* Market Summary Cards (Matching Reports Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Highest Price Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Top Performer</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{stats.highest.price}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-4 flex items-center">
              <span className="font-bold mr-1">{stats.highest.crop}</span> is strictly high
            </p>
          </motion.div>

          {/* Lowest Price Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Lowest Rate</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{stats.lowest.price}</h3>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-red-600 mt-4 flex items-center">
              <span className="font-bold mr-1">{stats.lowest.crop}</span> is currently low
            </p>
          </motion.div>

          {/* Avg Price Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Market Average</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{stats.avg}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-4 flex items-center">
              Average across all Mandis
            </p>
          </motion.div>
        </div>

        {/* Detailed Market Rates Table (Matching Reports Style) */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Market Rates Analysis</h3>
          </div>
          <div className="p-0 sm:p-6"> {/* Removed padding on mobile for full width table feel */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Market</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price / Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marketPrices.map((item: any, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                            {/* Simple icon mapping based on crop name could go here, using default for now */}
                            🌱
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.crop}</div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {item.market.split(' ')[0]} {/* Show partial market name on mobile if needed, or just time */}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-900">{item.market}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">₹{item.price}</div>
                        <div className="text-xs text-gray-500">per {item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${parseFloat(item.change) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {parseFloat(item.change) >= 0 ? '+' : ''}{item.change}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'crops': return renderCrops()
      case 'services': return renderServices()
      case 'available_services': return renderAvailableServices()
      case 'rentals': return renderRentals()
      case 'market': return renderMarketPrices()
      case 'offers': return renderOffers()
      case 'reports': return renderReports()
      case 'chats': return (
        user ? <ChatSystem currentUser={{ id: user._id, name: user.name }} role="farmer" /> : <div>Loading...</div>
      )
      case 'profile': return renderProfile()
      default: return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
              <div className="relative group">
                <div className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-900">{user?.name || 'Farmer'}</span>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } `}>
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {[
                  { id: 'overview', name: 'Overview', icon: <Home className="w-5 h-5" /> },
                  { id: 'crops', name: 'My Crops', icon: <Leaf className="w-5 h-5" /> },
                  { id: 'services', name: 'Service Requests', icon: <Truck className="w-5 h-5" /> },
                  { id: 'available_services', name: 'Service Available', icon: <Wrench className="w-5 h-5" /> },
                  { id: 'rentals', name: 'My Rentals', icon: <ShoppingCart className="w-5 h-5" /> },
                  { id: 'market', name: 'Market Prices', icon: <BarChart3 className="w-5 h-5" /> },
                  { id: 'reports', name: 'Reports', icon: <FileText className="w-5 h-5" /> },
                  { id: 'chats', name: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
                  { id: 'profile', name: 'Profile', icon: <User className="w-5 h-5" /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === item.id
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } `}
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
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* View Offers Modal */}
      {viewOffersModal && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl overflow-y-auto max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Received Offers</h3>
                <p className="text-gray-600">
                  {selectedRequestForOffers ? `For: ${selectedRequestForOffers.type} (${selectedRequestForOffers.budget || 'No Budget'})` :
                    selectedCropForOffers ? `For: ${selectedCropForOffers.name} (${selectedCropForOffers.quantity})` :
                      'All Offers'}
                </p>
              </div>
              <button onClick={() => setViewOffersModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {currentOffers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No offers received yet.</p>
                </div>
              ) : (
                currentOffers.map((offer) => (
                  <div key={offer._id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-lg text-gray-900">
                          {offer.provider?.name || offer.buyer?.name || offer.providerName || offer.buyerName || 'User'}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {offer.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600">Bid Amount: <span className="font-bold text-green-600">{offer.bidAmount}</span></p>
                      {offer.quantityRequested && (
                        <p className="text-sm text-gray-600">Quantity: <span className="font-semibold">{offer.quantityRequested}</span></p>
                      )}
                      {offer.pricePerUnit && (
                        <p className="text-sm text-gray-600">Price/Unit: <span className="font-semibold">₹{offer.pricePerUnit}</span></p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">{new Date(offer.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleStartChat(offer._id)}
                        className="flex items-center justify-center w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {offer.offerType === 'service' ? 'Chat with Provider' : 'Chat with Buyer'}
                      </button>
                      {offer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptOffer(offer)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
                          >
                            Accept Bid
                          </button>
                          <button
                            onClick={() => handleRejectOffer(offer._id)}
                            className="border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            Reject Bid
                          </button>
                        </>
                      )}
                      {offer.status === 'accepted' && (
                        <span className="text-green-600 font-bold flex items-center">
                          Accepted ✅
                        </span>
                      )}
                      {offer.status === 'rejected' && (
                        <span className="text-red-600 font-bold flex items-center">
                          Rejected ❌
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
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

export default FarmerDashboard
