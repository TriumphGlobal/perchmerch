"use client"

import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs"

export default function Sample2Page() {
  const { isLoaded, isSignedIn, user } = useUser()

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Auth Debug Page</h1>
        {isSignedIn ? (
          <SignOutButton>
            <button style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '0.25rem', cursor: 'pointer' }}>
              Sign Out
            </button>
          </SignOutButton>
        ) : (
          <SignInButton mode="modal">
            <button style={{ padding: '0.5rem 1rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
              Sign In
            </button>
          </SignInButton>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Auth Status */}
        <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Authentication Status</h2>
          <p><strong>Loading:</strong> {!isLoaded ? "Yes" : "No"}</p>
          <p><strong>Signed In:</strong> {isSignedIn ? "Yes" : "No"}</p>
        </div>

        {isLoaded && isSignedIn && (
          <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>User Data</h2>
            <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress || 'Not available'}</p>
            <p><strong>Role:</strong> {user?.publicMetadata?.role || 'Not set'}</p>
          </div>
        )}
      </div>
    </div>
  )
}