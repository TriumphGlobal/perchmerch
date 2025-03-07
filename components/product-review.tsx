"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Review {
  id: string
  productId: string
  userId: string
  username: string
  rating: number
  comment: string
  createdAt: string
}

interface ProductReviewProps {
  productId: string
  initialReviews?: Review[]
}

export function ProductReview({ productId, initialReviews = [] }: ProductReviewProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
  }

  const handleSubmitReview = () => {
    if (!user) return
    if (!comment.trim()) return

    setIsSubmitting(true)

    // In a real app, this would be an API call
    const newReview: Review = {
      id: crypto.randomUUID(),
      productId,
      userId: user.id,
      username: user.username,
      rating,
      comment,
      createdAt: new Date().toISOString()
    }

    // Add the new review to the list
    setReviews([newReview, ...reviews])
    
    // Reset form
    setComment("")
    setRating(5)
    setShowForm(false)
    setIsSubmitting(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
        {user && !showForm && (
          <Button 
            variant="outline" 
            onClick={() => setShowForm(true)}
          >
            Write a Review
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className="mr-2">Rating:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="p-1"
                  >
                    <StarIcon
                      className={cn(
                        "h-5 w-5",
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Share your thoughts about this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={isSubmitting || !comment.trim()}
            >
              Submit Review
            </Button>
          </div>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="flex mr-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{review.username}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <p className="text-sm">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review this product!</p>
      )}
    </div>
  )
} 