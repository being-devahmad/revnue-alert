import { Ionicons } from "@expo/vector-icons"
import type React from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  size?: number
  color?: string
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, size = 24, color = "#9A1B2B" }) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRatingChange(star)} style={styles.starButton}>
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? color : "#D1D5DB"}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
})
