'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { ArrowLeft, Save, User, Building2, MapPin, Globe, LogOut } from 'lucide-react'
import type { UserProfileUpdate } from '@/types/database'

// ============================================================================
// Constants
// ============================================================================

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
]

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Liability Partnership (LLP)',
  'Private Limited Company',
  'Public Limited Company',
  'One Person Company (OPC)',
  'Section 8 Company',
  'Cooperative Society'
]

const BUSINESS_CATEGORIES = [
  'Manufacturing',
  'Trading',
  'Services',
  'Agriculture',
  'Technology',
  'Healthcare',
  'Education',
  'Construction',
  'Retail',
  'Hospitality',
  'Transportation',
  'Other'
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'ur', name: 'اردو (Urdu)' }
]

// ============================================================================
// Component
// ============================================================================

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, loading: profileLoading, updateProfile } = useProfile()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<UserProfileUpdate>({})

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        business_name: profile.business_name || '',
        business_type: profile.business_type || '',
        business_category: profile.business_category || '',
        annual_turnover: profile.annual_turnover || null,
        employee_count: profile.employee_count || null,
        state: profile.state || '',
        district: profile.district || '',
        pincode: profile.pincode || '',
        language: profile.language || 'en',
      })
    }
  }, [profile])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Handle form field changes
  const handleChange = (field: keyof UserProfileUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSaving(true)
    try {
      await updateProfile(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        business_name: profile.business_name || '',
        business_type: profile.business_type || '',
        business_category: profile.business_category || '',
        annual_turnover: profile.annual_turnover || null,
        employee_count: profile.employee_count || null,
        state: profile.state || '',
        district: profile.district || '',
        pincode: profile.pincode || '',
        language: profile.language || 'en',
      })
    }
    setIsEditing(false)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to log out')
    }
  }

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  // Not authenticated
  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
              <p className="text-muted-foreground">
                Manage your account information and preferences
              </p>
            </div>
            
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>
                Your basic account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+91 1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select
                    value={formData.language || 'en'}
                    onValueChange={(value) => handleChange('language', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="size-5" />
                <CardTitle>Business Information</CardTitle>
              </div>
              <CardDescription>
                Details about your business for personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name || ''}
                    onChange={(e) => handleChange('business_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your business name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Select
                    value={formData.business_type || ''}
                    onValueChange={(value) => handleChange('business_type', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="business_type" className="w-full">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_category">Business Category</Label>
                  <Select
                    value={formData.business_category || ''}
                    onValueChange={(value) => handleChange('business_category', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="business_category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_count">Number of Employees</Label>
                  <Input
                    id="employee_count"
                    type="number"
                    min="0"
                    value={formData.employee_count || ''}
                    onChange={(e) => handleChange('employee_count', e.target.value ? parseInt(e.target.value) : null)}
                    disabled={!isEditing}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="annual_turnover">Annual Turnover (₹)</Label>
                  <Input
                    id="annual_turnover"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.annual_turnover || ''}
                    onChange={(e) => handleChange('annual_turnover', e.target.value ? parseFloat(e.target.value) : null)}
                    disabled={!isEditing}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="size-5" />
                <CardTitle>Location</CardTitle>
              </div>
              <CardDescription>
                Your business location for region-specific schemes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={formData.state || ''}
                    onValueChange={(value) => handleChange('state', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="state" className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={formData.district || ''}
                    onChange={(e) => handleChange('district', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your district"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode || ''}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    disabled={!isEditing}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </form>

        {/* Account Information */}
        {!isEditing && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="size-5" />
                <CardTitle>Account Information</CardTitle>
              </div>
              <CardDescription>
                Your account details and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Role:</span>
                  <span className="font-medium capitalize">{profile.role}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login:</span>
                  <span className="font-medium">
                    {profile.last_login_at
                      ? new Date(profile.last_login_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Never'}
                  </span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Logout Button */}
              <Button
                variant="destructive"
                className="w-full justify-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
