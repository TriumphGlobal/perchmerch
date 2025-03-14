"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { processImageForBrand } from "../lib/utils"
import { db } from "../lib/db"
import { User as PrismaUser } from "@prisma/client"

interface Brand {
  id: string
  name: string
  ownerId: string
  description?: string
  mainImage?: string
  products?: any[]
  totalSales?: number
  totalRevenue?: number
  totalVisitors?: number
  conversionRate?: number
  createdAt?: string
  updatedAt?: string
  isApproved?: boolean
  featured: boolean
  logo: string
  banner: string
  genres?: string[]
}

interface Genre {
  id: string
  name: string
  createdBy: string
}

interface User extends PrismaUser {
  ownedBrands: Brand[]
}

interface FeaturedBrand {
  id: string
  brandId: string
  name: string
  position: number
}

interface PlatformReferral {
  id: string
  referrerId: string
  referredUserId: string
  status: "PENDING" | "COMPLETED"
  earnings: number
  createdAt: Date
  completedAt?: Date | null
}

interface ReferralLink {
  id: string
  code: string
  userId: string
  isActive: boolean
  totalReferrals: number
  totalEarnings: number
  createdAt: Date
  updatedAt: Date
}

interface AuthContextType {
  user: User | null
  featuredBrands: FeaturedBrand[]
  signin: (username: string, password: string) => void
  signup: (username: string, password: string, email: string, referralCode?: string, captchaToken?: string) => Promise<void>
  logout: () => void
  isOwnerOfBrand: (brandId: string) => boolean
  canManageBrand: (brandId: string) => boolean
  isPlatformAdmin: () => boolean
  isSuperAdmin: () => boolean
  canAccessAdminDashboard: () => boolean
  canManagePlatform: () => boolean
  canManageFeaturedBrands: () => boolean
  canApproveBrands: () => boolean
  addBrand: (brand: Brand) => Promise<void>
  deleteBrand: (brandId: string) => Promise<void>
  updateBrandProducts: (brandId: string, products: any[]) => Promise<void>
  updateBrandDetails: (brandId: string, details: Partial<Brand>) => Promise<void>
  getCurrentUser: () => User | null
  getVisibleBrands: () => Brand[]
  getAllBrands: () => Brand[]
  generatePlatformReferralCode: (userId: string) => Promise<string>
  getPlatformReferralStats: (userId: string) => Promise<{
    totalReferrals: number
    totalEarnings: number
    pendingReferrals: number
    completedReferrals: number
  }>
  suspendUser: (userId: string) => Promise<void>
  activateUser: (userId: string) => Promise<void>
  updateUserDetails: (userId: string, details: Partial<User>) => Promise<void>
  validatePasswordStrength: (password: string) => { valid: boolean, message: string }
  verifyCaptcha: (token: string) => Promise<boolean>
  updatePassword: (hashedPassword: string) => Promise<boolean>
  promoteUserToPlatformAdmin: (userId: string) => Promise<void>
  promoteUserToSuperAdmin: (userId: string) => Promise<void>
  renameGenre: (genreId: string, newName: string) => Promise<void>
  removeGenre: (genreId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export { AuthContext }

// Remove the in-memory storage
// const users = new Map<string, User>()
// const allBrands = new Map<string, Brand>()
// const existingbrandIds = new Set<string>()
// const userReferrals = new Map<string, string[]>()

// Update the getCurrentUser function to use the database
const getCurrentUser = async (): Promise<User | null> => {
  if (!currentUser?.email) return null;
  
  try {
    const dbUser = await db.user.findUnique({
      where: { email: currentUser.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true,
        isPlatformAdmin: true,
        // Add other fields you need
      }
    });
    
    if (dbUser) {
      setCurrentUser(dbUser as User);
      return dbUser as User;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }
  
  return null;
}

// Update the isPlatformAdmin function
const isPlatformAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.isPlatformAdmin || false;
}

// Update the isSuperAdmin function
const isSuperAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.isSuperAdmin || false;
}

// Update the canAccessAdminDashboard function
const canAccessAdminDashboard = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.isPlatformAdmin || user?.isSuperAdmin || false;
}

// Load data from localStorage or use defaults
const loadStoredData = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const storedUsers = localStorage.getItem('perchmerch_users');
    const storedBrands = localStorage.getItem('perchmerch_brands');
    const storedIds = localStorage.getItem('perchmerch_ids');
    
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      Object.entries(parsedUsers).forEach(([key, value]) => {
        users.set(key, value as User);
      });
    }
    
    if (storedBrands) {
      const parsedBrands = JSON.parse(storedBrands);
      Object.entries(parsedBrands).forEach(([key, value]) => {
        allBrands.set(key, value as Brand);
      });
    }
    
    if (storedIds) {
      const parsedIds = JSON.parse(storedIds);
      parsedIds.forEach((id: string) => {
        existingbrandIds.add(id);
      });
    }
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

// Save data to localStorage
const saveData = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const usersObj = Object.fromEntries(users);
    const brandsObj = Object.fromEntries(allBrands);
    const idsArray = Array.from(existingbrandIds);
    
    localStorage.setItem('perchmerch_users', JSON.stringify(usersObj));
    localStorage.setItem('perchmerch_brands', JSON.stringify(brandsObj));
    localStorage.setItem('perchmerch_ids', JSON.stringify(idsArray));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Generate a unique referral code
function generateUniqueReferralCode(username: string): string {
  const baseCode = username.slice(0, 5).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${baseCode}-${randomPart}`;
}

// Log user activity
const logUserActivity = (userId: string, type: string, details: any = {}) => {
  // In a real app, this would be saved to the database
  console.log(`User activity: ${userId} - ${type}`, details);
  
  // For now, we'll just log to console, but in a real app
  // this would create a UserActivity record in the database
  // with proper fields matching the schema
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [featuredBrands, setFeaturedBrands] = useState<FeaturedBrand[]>([])
  const router = useRouter()
  
  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser?.email) return;
      
      try {
        const dbUser = await db.user.findUnique({
          where: { email: currentUser.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isSuperAdmin: true,
            isPlatformAdmin: true,
            // Add other fields you need
          }
        });
        
        if (dbUser) {
          setCurrentUser(dbUser as User);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    loadUser();
  }, [currentUser?.email]);

  const validateUsername = (username: string): boolean => {
    // Username must be 3-20 characters long and contain only letters, numbers, and underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  const getCurrentUser = (): User | null => {
    return currentUser
  }

  // Function to get brands visible to the current user
  const getVisibleBrands = (): Brand[] => {
    if (!currentUser) return []
    return currentUser.ownedBrands
  }

  // Function to get all brands (for public viewing)
  const getAllBrands = (): Brand[] => {
    // TODO: Replace with actual logic to fetch brands from the database
    return []
  }

  // Function to check if user is a super admin
  const isSuperAdmin = () => {
    return currentUser?.role === "superAdmin" && currentUser?.isSuperAdmin === true;
  }

  // Function to check if user is a platform admin
  const isPlatformAdmin = () => {
    return currentUser?.isPlatformAdmin === true;
  }

  // Function to check if user has any admin privileges
  const isAdmin = () => {
    return isSuperAdmin() || isPlatformAdmin();
  }

  // Function to check if user can access admin dashboard
  const canAccessAdminDashboard = (): boolean => {
    return !!currentUser && (currentUser.isPlatformAdmin || currentUser.isSuperAdmin);
  }

  // Function to check if user can manage platform
  const canManagePlatform = (): boolean => {
    return !!currentUser && (currentUser.isPlatformAdmin || currentUser.isSuperAdmin);
  }

  // Function to check if user can manage featured brands
  const canManageFeaturedBrands = (): boolean => {
    return !!currentUser && (currentUser.isPlatformAdmin || currentUser.isSuperAdmin);
  }

  // Function to check if user can approve brands
  const canApproveBrands = (): boolean => {
    return !!currentUser && (currentUser.isPlatformAdmin || currentUser.isSuperAdmin);
  }

  // Password strength validation
  const validatePasswordStrength = (password: string): { valid: boolean, message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character" };
    }
    
    return { valid: true, message: "Password is strong" };
  };

  // Mock captcha verification (replace with actual reCAPTCHA implementation)
  const verifyCaptcha = async (token: string): Promise<boolean> => {
    // In a real implementation, you would validate with the reCAPTCHA API
    if (!token) return false;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return token.length > 0;
    } catch (error) {
      console.error("Captcha verification failed:", error);
      return false;
    }
  };

  // Generate a unique referral code for a user
  const generateReferralCode = (userId: string): string => {
    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    
    if (user.referralCode) return user.referralCode;
    
    const code = generateUniqueReferralCode(user.username);
    
    // Update the user with the new referral code
    const updatedUser = {
      ...user,
      referralCode: code
    };
    
    users.set(user.username, updatedUser);
    saveData();
    
    if (user.id === user.id) {
      setCurrentUser(updatedUser);
    }
    
    return code;
  };

  // Get referral statistics for a user
  const getReferralStats = (userId: string) => {
    const referredUsers = userReferrals.get(userId) || [];
    const totalReferrals = referredUsers.length;
    
    // Calculate earnings (5% of all purchases made by referred users)
    // This is a simplified calculation, in a real app you would track actual purchases
    let totalEarnings = 0;
    referredUsers.forEach(referredId => {
      const referred = Array.from(users.values()).find(u => u.id === referredId);
      if (!referred) return;
      
      // Calculate based on their owned brands
      referred.ownedBrands.forEach(brand => {
        // Assuming there's some sales data on the brand
        const brandSales = brand.totalSales || 0;
        totalEarnings += brandSales * 0.05; // 5% of sales
      });
    });
    
    return { referrals: totalReferrals, earnings: totalEarnings };
  };

  // Suspend a user
  const suspendUser = async (userId: string): Promise<void> => {
    if (!currentUser?.isSuperAdmin) throw new Error("Unauthorized action");
    
    const userToSuspend = Array.from(users.values()).find(u => u.id === userId);
    if (!userToSuspend) throw new Error("User not found");
    
    // Cannot suspend an admin
    if (userToSuspend.isPlatformAdmin) throw new Error("Cannot suspend a platform admin user");
    
    const updatedUser = {
      ...userToSuspend,
      isActive: false
    };
    
    users.set(userToSuspend.username, updatedUser);
    saveData();
  };

  // Activate a suspended user
  const activateUser = async (userId: string): Promise<void> => {
    if (!currentUser?.isSuperAdmin) throw new Error("Unauthorized action");
    
    const userToActivate = Array.from(users.values()).find(u => u.id === userId);
    if (!userToActivate) throw new Error("User not found");
    
    const updatedUser = {
      ...userToActivate,
      isActive: true
    };
    
    users.set(userToActivate.username, updatedUser);
    saveData();
  };

  // Update user details
  const updateUserDetails = async (userId: string, details: Partial<User>): Promise<void> => {
    // Only the user themselves or an admin can update user details
    if (currentUser?.id !== userId && !currentUser?.isSuperAdmin) {
      throw new Error("Unauthorized action");
    }
    
    const userToUpdate = Array.from(users.values()).find(u => u.id === userId);
    if (!userToUpdate) throw new Error("User not found");
    
    // Prevent updating certain fields directly
    const safeDetails = { ...details };
    delete safeDetails.id;
    delete safeDetails.username;
    delete safeDetails.isSuperAdmin;
    
    const updatedUser = {
      ...userToUpdate,
      ...safeDetails
    };
    
    users.set(userToUpdate.username, updatedUser);
    
    // If updating the current user, update state
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }
    
    saveData();
  };

  // Enhanced sign-up with email, referral code, and captcha
  const signup = async (username: string, password: string, email: string, referralCode?: string, captchaToken?: string): Promise<void> => {
    try {
      // Validate username
      if (!validateUsername(username)) {
        throw new Error("Invalid username. Username must be 3-20 characters long and contain only letters, numbers, and underscores.")
      }
      
      // Check if username already exists
      if (users.has(username)) {
        throw new Error("Username already exists")
      }
      
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message)
      }
      
      // Validate captcha if provided
      if (captchaToken) {
        const isValid = await verifyCaptcha(captchaToken)
        if (!isValid) {
          throw new Error("Captcha validation failed")
        }
      }
      
      // Process referral code if provided
      let referrerId: string | undefined
      if (referralCode) {
        // Find user with this referral code
        for (const [id, userData] of users.entries()) {
          if (userData.referralCode === referralCode) {
            referrerId = id
            break
          }
        }
        
        if (!referrerId) {
          throw new Error("Invalid referral code")
        }
        
        // Add this user to the referrer's list
        if (!userReferrals.has(referrerId)) {
          userReferrals.set(referrerId, [])
        }
        userReferrals.get(referrerId)?.push(username)
      }
      
      // Generate a unique referral code for this user
      const userReferralCode = generateUniqueReferralCode(username)
      
      // Create new user - always as regular user (role: "user")
      const newUser: User = {
        id: `user-${Date.now()}`,
        username,
        password, // In a real app, this would be hashed
        email,
        isSuperAdmin: false,
        isPlatformAdmin: false, // New users can never be platform admins
        ownedBrands: [],
        referralCode: userReferralCode,
        referredBy: referrerId,
        referralCommission: 5, // Default 5% commission for referrals
        isVerified: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastSignIn: new Date().toISOString(),
        marketingConsent: false,
        hashedPassword: password, // In a real app, this would be hashed
        role: "user", // Always set to "user", never "platform"
        featured: false,
        name: username.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }
      
      users.set(username, newUser)
      
      // Save updated data
      saveData()
      
      // Log the activity
      logUserActivity(newUser.id, "sign-up", { referredBy: referrerId })
      
      // Auto-sign-in the user
      setCurrentUser(newUser)
    } catch (error) {
      console.error("sign-up error:", error)
      throw error
    }
  }

  const signin = async (username: string, password: string): Promise<void> => {
    try {
      const existingUser = users.get(username)

      if (!existingUser) {
        throw new Error("Account not found. Please sign up first.")
      }

      if (existingUser.password !== password) {
        throw new Error("Incorrect password")
      }

      // Check if user is active
      if (existingUser.isActive === false) {
        throw new Error("This account has been suspended. Please contact support.");
      }

      // Get the latest brands owned by this user
      const updatedOwnedBrands = existingUser.ownedBrands.map(brand => {
        // Get the latest version of the brand from allBrands
        const latestBrand = allBrands.get(brand.id)
        return latestBrand || brand
      }).filter(brand => {
        // Filter out any brands that no longer exist in allBrands
        return allBrands.has(brand.id)
      })

      // Update the user with the latest brands
      let updatedUser = {
        ...existingUser,
        ownedBrands: updatedOwnedBrands,
        lastSignIn: new Date().toISOString()
      } as User;

      users.set(username, updatedUser)
      setCurrentUser(updatedUser)
      saveData() // Save after updating user

      // Always redirect to landing page after sign-in
      router.replace("/landing")
    } catch (error) {
      console.error("sign-in error:", error)
      throw error
    }
  }

  const logout = () => {
    setCurrentUser(null)
    router.push("/")
  }

  const isOwnerOfBrand = (brandId: string): boolean => {
    if (!currentUser) return false
    return currentUser.ownedBrands.some(brand => brand.id === brandId)
  }

  const canManageBrand = (brandId: string): boolean => {
    if (!currentUser) return false

    if (brandId === "demo") return currentUser.isSuperAdmin

    return currentUser.ownedBrands.some(brand => brand.id === brandId)
  }

  const addBrand = async (brand: Brand): Promise<void> => {
    if (!currentUser) throw new Error("Must be logged in to create a brand")

    // Validate brand URL (brandId)
    if (!brand.id || typeof brand.id !== 'string') {
      throw new Error("Brand URL is required")
    }

    // Ensure brand URL is URL-safe
    const urlSafeRegex = /^[a-z0-9-]+$/
    if (!urlSafeRegex.test(brand.id)) {
      throw new Error("Brand URL can only contain lowercase letters, numbers, and hyphens")
    }

    // Check minimum and maximum length
    if (brand.id.length < 3 || brand.id.length > 50) {
      throw new Error("Brand URL must be between 3 and 50 characters")
    }

    // Prevent using demo id for regular brands
    if (brand.id === "demo") {
      throw new Error("The URL 'demo' is reserved")
    }

    // Check if the id is already taken
    if (existingbrandIds.has(brand.id)) {
      throw new Error("A brand with this URL already exists")
    }

    // Process the brand image if it exists
    const processedImage = brand.mainImage ? processImageForBrand(brand.mainImage) : ""

    // Handle genres
    let brandGenres: string[] = []
    if (brand.genres) {
      // Limit to 3 genres
      brandGenres = brand.genres.slice(0, 3)
      
      // Create new genres if they don't exist
      brandGenres.forEach(genre => {
        if (!allGenres.has(genre)) {
          const newGenre: Genre = {
            id: crypto.randomUUID(),
            name: genre,
            createdBy: currentUser.id
          }
          allGenres.set(genre, newGenre)
        }
      })
    }

    // Create the new brand - always set isApproved to false
    const newBrand = {
      ...brand,
      ownerId: currentUser.id,
      id: brand.id,
      name: brand.name,
      brandId: brand.id,
      description: brand.description || "",
      mainImage: processedImage,
      products: brand.products || [],
      totalSales: 0,
      totalRevenue: 0,
      totalVisitors: 0,
      conversionRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isApproved: false, // Always false initially, regardless of user role
      featured: false,
      genres: brandGenres
    }

    // Add to global brands collection
    allBrands.set(newBrand.id, newBrand)

    // Update user's owned brands
    const updatedUser = {
      ...currentUser,
      ownedBrands: [...currentUser.ownedBrands, newBrand]
    }
    users.set(currentUser.username, updatedUser)
    setCurrentUser(updatedUser)

    // Add the id to our tracking set
    existingbrandIds.add(brand.id)
    
    saveData() // Save after adding brand

    // Log brand creation
    logUserActivity(currentUser.id, "BRAND_CREATE", {
      brandId: brand.id,
      brandName: brand.name,
      requiresApproval: true
    })
  }

  const deleteBrand = async (brandId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error("You must be logged in to delete a brand")
    }
    
    // Find the brand
    const brand = allBrands.get(brandId)
    
    if (!brand) {
      throw new Error("Brand not found")
    }
    
    // Check if user owns the brand or is a platform admin
    if (brand.ownerId !== currentUser.id && !currentUser.isPlatformAdmin) {
      throw new Error("You don't have permission to delete this brand")
    }
    
    // Remove the brand from allBrands
    allBrands.delete(brandId)
    
    // Remove the brand from the user's ownedBrands
    if (brand.ownerId === currentUser.id) {
      const brandOwner = users.get(currentUser.username)
      if (brandOwner) {
        brandOwner.ownedBrands = brandOwner.ownedBrands.filter(b => b.id !== brandId)
        users.set(currentUser.username, brandOwner)
      }
    }
    
    // Remove the id from existingbrandIds
    existingbrandIds.delete(brandId)
    
    // Save updated data
    saveData()
    
    // Log the activity
    logUserActivity(currentUser.id, "BRAND_DELETE", { brandId, brandName: brand.name })
  }

  // Add a function to update brand products
  const updateBrandProducts = async (brandId: string, products: any[]): Promise<void> => {
    if (!currentUser) throw new Error("Must be logged in to update brand products")
    
    // Find the brand in the global collection
    const brandToUpdate = allBrands.get(brandId)
    if (!brandToUpdate) {
      throw new Error("Brand not found")
    }
    
    // Update the brand's products
    const updatedBrand = {
      ...brandToUpdate,
      products: products
    }
    
    // Update in global brands collection
    allBrands.set(brandId, updatedBrand)
    
    // Update in user's owned brands if they own this brand
    if (currentUser.ownedBrands.some(b => b.id === brandId)) {
      const updatedOwnedBrands = currentUser.ownedBrands.map(b => 
        b.id === brandId ? updatedBrand : b
      )
      
      const updatedUser = {
        ...currentUser,
        ownedBrands: updatedOwnedBrands
      }
      
      users.set(currentUser.username, updatedUser)
      setCurrentUser(updatedUser)
    }
    
    saveData() // Save after updating products
  }

  // Add a function to update brand details
  const updateBrandDetails = async (brandId: string, details: Partial<Brand>): Promise<void> => {
    if (!currentUser) throw new Error("Must be logged in to update brand details")
    
    // Find the brand in the global collection
    const brandToUpdate = allBrands.get(brandId)
    if (!brandToUpdate) {
      throw new Error("Brand not found")
    }
    
    // Handle genres update
    let updatedGenres = brandToUpdate.genres || []
    if (details.genres) {
      // Remove genres
      updatedGenres = updatedGenres.filter(genre => details.genres?.includes(genre))
      
      // Add new genres
      details.genres.forEach(genre => {
        if (!updatedGenres.includes(genre)) {
          updatedGenres.push(genre)
          
          // Create the genre if it doesn't exist
          if (!allGenres.has(genre)) {
            const newGenre: Genre = {
              id: crypto.randomUUID(),
              name: genre,
              createdBy: currentUser.id
            }
            allGenres.set(genre, newGenre)
          }
        }
      })
      
      // Limit to 3 genres
      updatedGenres = updatedGenres.slice(0, 3)
    }
    
    // Update the brand details
    const updatedBrand = {
      ...brandToUpdate,
      ...details,
      genres: updatedGenres // Update the genres
    }
    
    // Update in global brands collection
    allBrands.set(brandId, updatedBrand)
    
    // Update in user's owned brands if they own this brand
    if (currentUser.ownedBrands.some(b => b.id === brandId)) {
      const updatedOwnedBrands = currentUser.ownedBrands.map(b => 
        b.id === brandId ? updatedBrand : b
      )
      
      const updatedUser = {
        ...currentUser,
        ownedBrands: updatedOwnedBrands
      }
      
      users.set(currentUser.username, updatedUser)
      setCurrentUser(updatedUser)
    }
    
    saveData() // Save after updating brand details
  }

  // Update password function
  const updatePassword = async (hashedPassword: string): Promise<boolean> => {
    if (!currentUser) throw new Error("Must be logged in to update password");
    
    const currentUser = users.get(currentUser.username);
    if (!currentUser) throw new Error("User not found");
    
    currentUser.hashedPassword = hashedPassword;
    users.set(currentUser.username, currentUser);
    setCurrentUser(currentUser);
    
    saveData();
    
    // Log the activity without using 'action' property
    logUserActivity(currentUser.id, "PASSWORD_CHANGE", {
      timestamp: new Date()
    });
    
    return true;
  }

  // Function for super admins to promote a user to platform admin
  const promoteUserToPlatformAdmin = async (userId: string): Promise<void> => {
    // Check if current user is a super admin
    if (!currentUser || !isSuperAdmin()) {
      throw new Error("Only super admins can promote users to platform admin status")
    }
    
    // Find the user to promote
    let userToPromote: User | undefined
    
    for (const [_, userData] of users.entries()) {
      if (userData.id === userId) {
        userToPromote = userData
        break
      }
    }
    
    if (!userToPromote) {
      throw new Error("User not found")
    }
    
    // Update the user's role and admin status
    userToPromote.role = "platform"
    userToPromote.isPlatformAdmin = true
    
    // Update in the users map
    users.set(userToPromote.username, userToPromote)
    
    // Save changes
    saveData()
    
    // Log the activity
    logUserActivity(currentUser.id, "PROMOTE_TO_PLATFORM_ADMIN", { 
      targetUserId: userId, 
      targetUsername: userToPromote.username 
    })
  }

  // Function for super admins to promote a user to super admin
  const promoteUserToSuperAdmin = async (userId: string): Promise<void> => {
    // Check if current user is a super admin
    if (!currentUser || !isSuperAdmin()) {
      throw new Error("Only super admins can promote users to super admin status")
    }
    
    // Find the user to promote
    let userToPromote: User | undefined
    
    for (const [_, userData] of users.entries()) {
      if (userData.id === userId) {
        userToPromote = userData
        break
      }
    }
    
    if (!userToPromote) {
      throw new Error("User not found")
    }
    
    // Update the user's role and admin status
    userToPromote.role = "superAdmin"
    userToPromote.isSuperAdmin = true
    userToPromote.isPlatformAdmin = true // Super admins automatically get platform admin privileges
    
    // Update in the users map
    users.set(userToPromote.username, userToPromote)
    
    // Save changes
    saveData()
    
    // Log the activity
    logUserActivity(currentUser.id, "PROMOTE_TO_SUPER_ADMIN", { 
      targetUserId: userId, 
      targetUsername: userToPromote.username 
    })
  }

  // Function for super admins to demote a user
  const demoteUser = async (userId: string, newRole: "user" | "platform"): Promise<void> => {
    // Check if current user is a super admin
    if (!currentUser || !isSuperAdmin()) {
      throw new Error("Only super admins can demote users")
    }
    
    // Find the user to demote
    let userToDemote: User | undefined
    
    for (const [_, userData] of users.entries()) {
      if (userData.id === userId) {
        userToDemote = userData
        break
      }
    }
    
    if (!userToDemote) {
      throw new Error("User not found")
    }

    // Special protection for sales@triumphglobal.net
    if (userToDemote.email === "sales@triumphglobal.net") {
      throw new Error("Cannot demote the primary superAdmin account")
    }
    
    // Cannot demote the last super admin
    if (userToDemote.role === "superAdmin") {
      const superAdminCount = Array.from(users.values()).filter(u => u.role === "superAdmin").length
      if (superAdminCount <= 1) {
        throw new Error("Cannot demote the last super admin")
      }
    }
    
    // Update the user's role and admin status
    userToDemote.role = newRole
    userToDemote.isSuperAdmin = false
    userToDemote.isPlatformAdmin = newRole === "platform"
    
    // Update in the users map
    users.set(userToDemote.username, userToDemote)
    
    // Save changes
    saveData()
    
    // Log the activity
    logUserActivity(currentUser.id, "DEMOTE_USER", { 
      targetUserId: userId, 
      targetUsername: userToDemote.username,
      newRole 
    })
  }

  // Function for platform admins and super admins to rename a genre
  const renameGenre = async (genreId: string, newName: string): Promise<void> => {
    // Check if current user is a platform admin or super admin
    if (!currentUser || (!isPlatformAdmin() && !isSuperAdmin())) {
      throw new Error("Only platform admins and super admins can rename genres")
    }
    
    // Find the genre to rename
    let genreToRename: Genre | undefined
    
    for (const [_, genreData] of allGenres.entries()) {
      if (genreData.id === genreId) {
        genreToRename = genreData
        break
      }
    }
    
    if (!genreToRename) {
      throw new Error("Genre not found")
    }
    
    // Update the genre name
    genreToRename.name = newName
    
    // Update in the allGenres map
    allGenres.set(genreToRename.id, genreToRename)
    
    // Update the associated brands
    for (const [_, brandData] of allBrands.entries()) {
      if (brandData.genres?.includes(genreToRename.name)) {
        const updatedGenres = brandData.genres.map(g => 
          g === genreToRename.name ? newName : g
        )
        
        const updatedBrand = {
          ...brandData,
          genres: updatedGenres
        }
        
        allBrands.set(brandData.id, updatedBrand)
      }
    }
    
    // Save changes
    saveData()
    
    // Log the activity
    logUserActivity(currentUser.id, "RENAME_GENRE", { 
      genreId: genreId, 
      oldName: genreToRename.name,
      newName: newName
    })
    
    return
  }

  // Function for platform admins and super admins to remove a genre
  const removeGenre = async (genreId: string): Promise<void> => {
    // Check if current user is a platform admin or super admin  
    if (!currentUser || (!isPlatformAdmin() && !isSuperAdmin())) {
      throw new Error("Only platform admins and super admins can remove genres")
    }
    
    // Find the genre to remove
    let genreToRemove: Genre | undefined
    
    for (const [_, genreData] of allGenres.entries()) {
      if (genreData.id === genreId) {
        genreToRemove = genreData
        break
      }
    }
    
    if (!genreToRemove) {
      throw new Error("Genre not found")
    }
    
    // Remove from the allGenres map
    allGenres.delete(genreToRemove.id)
    
    // Remove the genre from associated brands
    for (const [_, brandData] of allBrands.entries()) {
      if (brandData.genres?.includes(genreToRemove.name)) {
        const updatedGenres = brandData.genres.filter(g => g !== genreToRemove.name)
        
        const updatedBrand = {
          ...brandData,
          genres: updatedGenres
        }
        
        allBrands.set(brandData.id, updatedBrand)
      }
    }
    
    // Save changes
    saveData()
    
    // Log the activity
    logUserActivity(currentUser.id, "REMOVE_GENRE", { 
      genreId: genreId, 
      genreName: genreToRemove.name
    })
    
    return
  }

  // Fetch featured brands
  const fetchFeaturedBrands = async () => {
    try {
      const res = await fetch('/api/brands/featured')
      const data = await res.json()
      if (data.success) {
        setFeaturedBrands(data.brands)
      }
    } catch (error) {
      console.error('Error fetching featured brands:', error)
    }
  }

  useEffect(() => {
    fetchFeaturedBrands()
  }, [])

  // Add a function to handle auth state changes
  useEffect(() => {
    const handleAuthStateChange = async () => {
      if (currentUser) {
        // Only redirect from homepage to landing, but not during sign-up
        const path = window.location.pathname
        if (path === "/" && !path.includes('sign-up')) {
          router.replace("/landing")
        }
      }
    }

    handleAuthStateChange()
  }, [currentUser, router])

  // Function to initialize super admin privileges
  const initializeSuperAdmin = async () => {
    const superAdmin: User = {
      id: "admin",
      username: "admin",
      password: "admin",
      isSuperAdmin: true,
      isPlatformAdmin: true,
      platformCommission: 50,
      ownedBrands: [],
      hashedPassword: "admin",
      role: "superAdmin",
      email: "sales@triumphglobal.net",
      name: "Admin",
      featured: false
    }
    
    setCurrentUser(superAdmin)
  }

  const generatePlatformReferralCode = async (userId: string): Promise<string> => {
    try {
      // Generate a unique code
      const code = generateUniqueReferralCode(userId)
      
      // Create a new referral link in the database
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`
          INSERT INTO "ReferralLink" (id, code, "userId", "isActive", "totalReferrals", "totalEarnings", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${code}, ${userId}, true, 0, 0, NOW(), NOW())
        `
      })
      
      return code
    } catch (error) {
      console.error("Error generating platform referral code:", error)
      throw new Error("Failed to generate platform referral code")
    }
  }

  const getPlatformReferralStats = async (userId: string) => {
    try {
      // Get all platform referrals for the user
      const referrals = await db.$transaction(async (tx) => {
        const result = await tx.$queryRaw<PlatformReferral[]>`
          SELECT * FROM "PlatformReferral"
          WHERE "referrerId" = ${userId}
        `
        return result
      })

      // Calculate stats
      const totalReferrals = referrals.length
      const totalEarnings = referrals.reduce((sum: number, ref: PlatformReferral) => sum + ref.earnings, 0)
      const pendingReferrals = referrals.filter((ref: PlatformReferral) => ref.status === "PENDING").length
      const completedReferrals = referrals.filter((ref: PlatformReferral) => ref.status === "COMPLETED").length

      return {
        totalReferrals,
        totalEarnings,
        pendingReferrals,
        completedReferrals
      }
    } catch (error) {
      console.error("Error getting platform referral stats:", error)
      throw new Error("Failed to get platform referral stats")
    }
  }

  const value = {
    user: currentUser,
    featuredBrands,
    signin,
    signup,
    logout,
    isOwnerOfBrand,
    canManageBrand,
    isPlatformAdmin,
    isSuperAdmin,
    canAccessAdminDashboard,
    canManagePlatform,
    canManageFeaturedBrands,
    canApproveBrands,
    addBrand,
    deleteBrand,
    updateBrandProducts,
    updateBrandDetails,
    getCurrentUser,
    getVisibleBrands,
    getAllBrands,
    generatePlatformReferralCode,
    getPlatformReferralStats,
    suspendUser,
    activateUser,
    updateUserDetails,
    validatePasswordStrength,
    verifyCaptcha,
    updatePassword,
    promoteUserToPlatformAdmin,
    promoteUserToSuperAdmin,
    renameGenre,
    removeGenre,
    demoteUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 