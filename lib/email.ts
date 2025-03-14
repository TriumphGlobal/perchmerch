import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const data = await resend.emails.send({
      from: "PerchMerch <noreply@perchmerch.com>",
      to,
      subject,
      html
    })
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error }
  }
}

// Email templates
export const emailTemplates = {
  brandCreated: (brandName: string) => ({
    subject: `Your Brand "${brandName}" Has Been Created`,
    html: `
      <h1>Your Brand Has Been Created!</h1>
      <p>Your brand "${brandName}" has been successfully created and is now pending approval.</p>
      <p>Our team will review your brand shortly. You'll receive another email once it's approved.</p>
      <p>In the meantime, you can start adding products to your brand.</p>
    `
  }),

  brandStatusChanged: (brandName: string, status: string, reason?: string) => ({
    subject: `Brand Status Update: ${brandName}`,
    html: `
      <h1>Brand Status Update</h1>
      <p>Your brand "${brandName}" has been ${status.toLowerCase()}.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
      <p>If you have any questions, please contact our support team.</p>
    `
  }),

  productAdded: (brandName: string, productName: string) => ({
    subject: `New Product Added to ${brandName}`,
    html: `
      <h1>New Product Added</h1>
      <p>The product "${productName}" has been successfully added to your brand "${brandName}".</p>
      <p>It will be reviewed by our team before becoming visible on the platform.</p>
    `
  }),

  productModified: (brandName: string, productName: string) => ({
    subject: `Product Updated: ${productName}`,
    html: `
      <h1>Product Update</h1>
      <p>The product "${productName}" in your brand "${brandName}" has been updated.</p>
      <p>The changes will be reviewed by our team before becoming visible.</p>
    `
  }),

  productRemoved: (brandName: string, productName: string, reason?: string) => ({
    subject: `Product Removed: ${productName}`,
    html: `
      <h1>Product Removed</h1>
      <p>The product "${productName}" has been removed from your brand "${brandName}".</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
    `
  }),

  userStatusChanged: (status: string, reason?: string) => ({
    subject: `Account Status Update`,
    html: `
      <h1>Account Status Update</h1>
      <p>Your account has been ${status.toLowerCase()}.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
      <p>If you believe this is a mistake, please contact our support team.</p>
    `
  }),

  newReferralLink: (code: string, appUrl: string) => ({
    subject: "Your New PerchMerch Referral Link",
    html: `
      <h1>Your New Referral Link is Ready!</h1>
      <p>Here's your new referral link:</p>
      <p><a href="${appUrl}/signup?ref=${code}">${appUrl}/signup?ref=${code}</a></p>
      <p>Share this link with potential users and earn 5% of PerchMerch's commission from their sales!</p>
      <p>Happy sharing!</p>
    `
  })
} 