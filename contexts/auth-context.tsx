"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { processImageForBrand } from "@/lib/utils"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface Brand {
  id: string
  name: string
  ownerId: string
  slug: string
  description?: string
  mainImage?: string
  products?: any[]
  totalSales?: number
  totalRevenue?: number
  totalVisitors?: number
  conversionRate?: number
  createdAt?: string
  updatedAt?: string
}

interface User {
  id: string
  username: string
  isAdmin: boolean
  ownedBrands: Brand[]
  isSuperAdmin?: boolean
  platformCommission?: number
  password: string
  email?: string
  referralCode?: string
  referredBy?: string
  referralCommission?: number
  isVerified?: boolean
  isActive?: boolean
  createdAt?: string
  lastLogin?: string
  paymentInfo?: {
    stripeCustomerId?: string
    paymentMethod?: string
  }
  marketingConsent?: boolean
  hashedPassword: string
  role: "user" | "admin"
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => void
  signup: (username: string, password: string, email: string, referralCode?: string, captchaToken?: string) => Promise<void>
  logout: () => void
  isOwnerOfBrand: (brandId: string) => boolean
  canManageBrand: (brandSlug: string) => boolean
  isSuperAdmin: () => boolean
  canAccessAdminDashboard: () => boolean
  addBrand: (brand: Brand) => Promise<void>
  deleteBrand: (brandId: string) => Promise<void>
  updateBrandProducts: (brandId: string, products: any[]) => Promise<void>
  updateBrandDetails: (brandId: string, details: Partial<Brand>) => Promise<void>
  getCurrentUser: () => User | null
  getVisibleBrands: () => Brand[]
  getAllBrands: () => Brand[]
  generateReferralCode: (userId: string) => string
  getReferralStats: (userId: string) => { referrals: number, earnings: number }
  suspendUser: (userId: string) => Promise<void>
  activateUser: (userId: string) => Promise<void>
  updateUserDetails: (userId: string, details: Partial<User>) => Promise<void>
  validatePasswordStrength: (password: string) => { valid: boolean, message: string }
  verifyCaptcha: (token: string) => Promise<boolean>
  updatePassword: (hashedPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export { AuthContext }

// The demo brand - owned by admin account
const DEMO_BRAND: Brand = {
  id: "demo-brand",
  name: "Demo Brand",
  ownerId: "admin",
  slug: "demo",
  description: "This is a demo brand to showcase the platform",
  mainImage: "https://placehold.co/200x200.jpg",
  products: [],
  totalSales: 0,
  totalRevenue: 0,
  totalVisitors: 0,
  conversionRate: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// Store all brands in a separate collection for persistence
const allBrands = new Map<string, Brand>()
allBrands.set(DEMO_BRAND.id, DEMO_BRAND)

// Store users and their brands in memory
// In a real app, this would be in a database
const users = new Map<string, User>()

// Initialize admin account with demo brand
users.set("admin", {
  id: "admin",
  username: "admin",
  password: "admin",
  isAdmin: true,
  isSuperAdmin: true,
  platformCommission: 50,
  ownedBrands: [{ ...DEMO_BRAND }], // Create a fresh copy
  hashedPassword: "admin",
  role: "admin"
})

// Keep track of all brand slugs to prevent duplicates
const existingBrandSlugs = new Set<string>(["demo"])

// Keep track of referral relationships
const userReferrals = new Map<string, string[]>(); // userId -> array of referred userIds

// Load data from localStorage or use defaults
const loadStoredData = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const storedUsers = localStorage.getItem('perchmerch_users');
    const storedBrands = localStorage.getItem('perchmerch_brands');
    const storedSlugs = localStorage.getItem('perchmerch_slugs');
    
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
    
    if (storedSlugs) {
      const parsedSlugs = JSON.parse(storedSlugs);
      parsedSlugs.forEach((slug: string) => {
        existingBrandSlugs.add(slug);
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
    const slugsArray = Array.from(existingBrandSlugs);
    
    localStorage.setItem('perchmerch_users', JSON.stringify(usersObj));
    localStorage.setItem('perchmerch_brands', JSON.stringify(brandsObj));
    localStorage.setItem('perchmerch_slugs', JSON.stringify(slugsArray));
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  
  // Load stored data on initial mount
  useEffect(() => {
    loadStoredData();
  }, []);

  const validateUsername = (username: string): boolean => {
    // Username must be 3-20 characters long and contain only letters, numbers, and underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  const getCurrentUser = (): User | null => {
    return user
  }

  // Function to get brands visible to the current user
  const getVisibleBrands = (): Brand[] => {
    if (!user) return []
    return user.ownedBrands
  }

  // Function to get all brands (for public viewing)
  const getAllBrands = (): Brand[] => {
    // If user is not logged in, only return brands that should be publicly visible
    if (!user) {
      // Filter out the demo brand for non-logged in users
      return Array.from(allBrands.values()).filter(brand => brand.id !== DEMO_BRAND.id);
    }
    
    // For admin users, return all brands
    if (user.isAdmin) {
      return Array.from(allBrands.values());
    }
    
    // For regular users, return their brands plus any public brands (excluding demo)
    const publicBrands = Array.from(allBrands.values()).filter(
      brand => brand.id !== DEMO_BRAND.id && brand.ownerId !== user.id
    );
    
    return [...user.ownedBrands, ...publicBrands];
  }

  // Ensure the admin always has the demo brand
  const ensureAdminHasDemoBrand = (adminUser: User): User => {
    const hasDemoBrand = adminUser.ownedBrands.some(brand => brand.id === DEMO_BRAND.id)
    
    if (!hasDemoBrand) {
      console.log("Adding demo brand to admin account")
      return {
        ...adminUser,
        ownedBrands: [...adminUser.ownedBrands, { ...DEMO_BRAND }]
      }
    }
    
    return adminUser
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
      setUser(updatedUser);
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
    if (!user?.isSuperAdmin) throw new Error("Unauthorized action");
    
    const userToSuspend = Array.from(users.values()).find(u => u.id === userId);
    if (!userToSuspend) throw new Error("User not found");
    
    // Cannot suspend an admin
    if (userToSuspend.isAdmin) throw new Error("Cannot suspend an admin user");
    
    const updatedUser = {
      ...userToSuspend,
      isActive: false
    };
    
    users.set(userToSuspend.username, updatedUser);
    saveData();
  };

  // Activate a suspended user
  const activateUser = async (userId: string): Promise<void> => {
    if (!user?.isSuperAdmin) throw new Error("Unauthorized action");
    
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
    if (user?.id !== userId && !user?.isAdmin) {
      throw new Error("Unauthorized action");
    }
    
    const userToUpdate = Array.from(users.values()).find(u => u.id === userId);
    if (!userToUpdate) throw new Error("User not found");
    
    // Prevent updating certain fields directly
    const safeDetails = { ...details };
    delete safeDetails.id;
    delete safeDetails.username;
    delete safeDetails.isAdmin;
    delete safeDetails.isSuperAdmin;
    
    const updatedUser = {
      ...userToUpdate,
      ...safeDetails
    };
    
    users.set(userToUpdate.username, updatedUser);
    
    // If updating the current user, update state
    if (user?.id === userId) {
      setUser(updatedUser);
    }
    
    saveData();
  };

  // Enhanced signup with email, referral code, and captcha
  const signup = async (username: string, password: string, email: string, referralCode?: string, captchaToken?: string): Promise<void> => {
    // Validate username format
    if (!validateUsername(username)) {
      throw new Error("Username must be 4-20 characters long and contain only letters, numbers, and underscores");
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Validate captcha
    if (!captchaToken || !(await verifyCaptcha(captchaToken))) {
      throw new Error("Captcha verification failed");
    }

    // Check for reserved usernames
    if (username.toLowerCase() === "admin") {
      throw new Error("Username 'admin' is reserved");
    }

    // Check for existing accounts
    if (users.has(username)) {
      throw new Error("Username already taken");
    }

    // Check if email is already in use
    const emailExists = Array.from(users.values()).some(u => u.email === email);
    if (emailExists) {
      throw new Error("Email already in use");
    }

    // Process referral code if provided
    let referredBy = undefined;
    if (referralCode) {
      const referrer = Array.from(users.values()).find(u => u.referralCode === referralCode);
      if (referrer) {
        referredBy = referrer.id;
        
        // Initialize referral tracking if needed
        if (!userReferrals.has(referrer.id)) {
          userReferrals.set(referrer.id, []);
        }
      }
    }

    // Create a new user with no brands
    const newUser: User = {
      id: username,
      username,
      password,
      email,
      isAdmin: false,
      isSuperAdmin: false,
      ownedBrands: [], // New users start with no brands
      referralCode: generateUniqueReferralCode(username),
      referredBy,
      referralCommission: 5, // Default 5% commission
      isVerified: false, // Require email verification
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      marketingConsent: false,
      hashedPassword: password,
      role: "user"
    }
    
    users.set(username, newUser);
    setUser(newUser);
    
    // Track the referral relationship
    if (referredBy) {
      const referrerReferrals = userReferrals.get(referredBy) || [];
      referrerReferrals.push(newUser.id);
      userReferrals.set(referredBy, referrerReferrals);
    }
    
    saveData(); // Save after creating new user
  }

  const login = (username: string, password: string) => {
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
      lastLogin: new Date().toISOString()
    } as User;

    // Special handling for admin account
    if (username === "admin") {
      updatedUser = ensureAdminHasDemoBrand(updatedUser)
    }

    users.set(username, updatedUser)
    setUser(updatedUser)
    saveData() // Save after updating user
    
    if (username === "admin") {
      router.push("/admin/dashboard")
    } else {
      router.push("/")
    }
  }

  const logout = () => {
    setUser(null)
    router.push("/")
  }

  const isOwnerOfBrand = (brandId: string): boolean => {
    if (!user) return false
    return user.ownedBrands.some(brand => brand.id === brandId)
  }

  const canManageBrand = (brandSlug: string): boolean => {
    if (!user) return false
    // Only admin can manage demo brand
    if (brandSlug === "demo") return user.isAdmin
    // Users can manage their own brands
    return user.ownedBrands.some(brand => brand.slug === brandSlug)
  }

  const isSuperAdmin = (): boolean => {
    return user?.isSuperAdmin ?? false
  }

  const canAccessAdminDashboard = (): boolean => {
    return user?.isSuperAdmin ?? false
  }

  const addBrand = async (brand: Brand): Promise<void> => {
    if (!user) throw new Error("Must be logged in to create a brand")

    // Prevent using demo slug for regular brands
    if (brand.slug === "demo") {
      throw new Error("The URL 'demo' is reserved")
    }

    // Check if the slug is already taken
    if (existingBrandSlugs.has(brand.slug)) {
      throw new Error("A brand with this URL already exists")
    }

    // Process the brand image if it exists
    const processedImage = brand.mainImage ? processImageForBrand(brand.mainImage) : ""

    // Create the new brand
    const newBrand = {
      ...brand,
      ownerId: user.id,
      id: brand.id || crypto.randomUUID(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      mainImage: processedImage,
      products: brand.products || [],
      totalSales: 0,
      totalRevenue: 0,
      totalVisitors: 0,
      conversionRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add to global brands collection
    allBrands.set(newBrand.id, newBrand)

    // Update user's owned brands
    const updatedUser = {
      ...user,
      ownedBrands: [...user.ownedBrands, newBrand]
    }
    users.set(user.username, updatedUser)
    setUser(updatedUser)

    // Add the slug to our tracking set
    existingBrandSlugs.add(brand.slug)
    
    saveData() // Save after adding brand
  }

  const deleteBrand = async (brandId: string): Promise<void> => {
    if (!user) throw new Error("Must be logged in to delete a brand")
    
    // Don't allow deleting the demo brand
    if (brandId === DEMO_BRAND.id) {
      throw new Error("Cannot delete the demo brand")
    }

    const brandToDelete = user.ownedBrands.find(b => b.id === brandId)
    if (!brandToDelete) {
      throw new Error("Brand not found")
    }

    // Remove from global brands collection
    allBrands.delete(brandId)

    // Update user's owned brands
    const updatedUser = {
      ...user,
      ownedBrands: user.ownedBrands.filter(b => b.id !== brandId)
    }
    users.set(user.username, updatedUser)
    setUser(updatedUser)

    // Remove the slug from our tracking set
    existingBrandSlugs.delete(brandToDelete.slug)
    
    saveData() // Save after deleting brand
  }

  // Add a function to update brand products
  const updateBrandProducts = async (brandId: string, products: any[]): Promise<void> => {
    if (!user) throw new Error("Must be logged in to update brand products")
    
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
    if (user.ownedBrands.some(b => b.id === brandId)) {
      const updatedOwnedBrands = user.ownedBrands.map(b => 
        b.id === brandId ? updatedBrand : b
      )
      
      const updatedUser = {
        ...user,
        ownedBrands: updatedOwnedBrands
      }
      
      users.set(user.username, updatedUser)
      setUser(updatedUser)
    }
    
    saveData() // Save after updating products
  }

  // Add a function to update brand details
  const updateBrandDetails = async (brandId: string, details: Partial<Brand>): Promise<void> => {
    if (!user) throw new Error("Must be logged in to update brand details")
    
    // Find the brand in the global collection
    const brandToUpdate = allBrands.get(brandId)
    if (!brandToUpdate) {
      throw new Error("Brand not found")
    }
    
    // Update the brand details
    const updatedBrand = {
      ...brandToUpdate,
      ...details
    }
    
    // Update in global brands collection
    allBrands.set(brandId, updatedBrand)
    
    // Update in user's owned brands if they own this brand
    if (user.ownedBrands.some(b => b.id === brandId)) {
      const updatedOwnedBrands = user.ownedBrands.map(b => 
        b.id === brandId ? updatedBrand : b
      )
      
      const updatedUser = {
        ...user,
        ownedBrands: updatedOwnedBrands
      }
      
      users.set(user.username, updatedUser)
      setUser(updatedUser)
    }
    
    saveData() // Save after updating brand details
  }

  const updatePassword = async (hashedPassword: string) => {
    if (!user) {
      throw new Error("No user logged in");
    }

    try {
      // Update password in the database
      await prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword }
      });

      // Update local user state
      setUser(prev => prev ? { ...prev, hashedPassword } : null);

      // Log the event
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          action: "PASSWORD_CHANGE",
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error("Failed to update password:", error);
      throw new Error("Failed to update password");
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        signup,
        logout, 
        isOwnerOfBrand, 
        canManageBrand,
        isSuperAdmin,
        canAccessAdminDashboard,
        addBrand,
        deleteBrand,
        updateBrandProducts,
        updateBrandDetails,
        getCurrentUser,
        getVisibleBrands,
        getAllBrands,
        generateReferralCode,
        getReferralStats,
        suspendUser,
        activateUser,
        updateUserDetails,
        validatePasswordStrength,
        verifyCaptcha,
        updatePassword
      }}
    >
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