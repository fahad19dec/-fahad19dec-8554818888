import { Image as RNImage } from "expo-image";
import { styled } from "nativewind";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

const Image = styled(RNImage, { className: "style" });

const sizes = {
  xl: { container: "size-27", text: "headline" }, // Profile
  lg: { container: "size-22", text: "heading" },
  md: { container: "size-16", text: "title" },
} as const;

// A guest's photo on a soft yellow circle, or their initial when there's no photo.
export function Avatar({
  imageUrl,
  name,
  size = "lg",
  className,
  style,
}: {
  imageUrl?: string | null;
  name?: string | null;
  size?: keyof typeof sizes;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const s = sizes[size];
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s photo` : "Profile photo"}
      className={cn("items-center justify-center overflow-hidden rounded-full bg-primary-soft", s.container, className)}
      style={style}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} contentFit="cover" transition={150} className="size-full" />
      ) : (
        <Text variant={s.text}>{name?.trim().charAt(0).toUpperCase() || "?"}</Text>
      )}
    </View>
  );
}
