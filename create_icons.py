from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create image with gradient background
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (approximation with rectangles)
    for y in range(size):
        # Interpolate between two colors
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Draw rounded rectangle (simplified as rectangle with rounded corners)
    # For a proper rounded rectangle, we'll overlay with transparency
    
    # Draw dumbbell shape (simplified)
    white = (255, 255, 255)
    green = (76, 175, 80)
    
    center_x = size // 2
    center_y = size // 2
    scale = size / 192  # Scale based on 192 as base
    
    # Left weight
    left_weight_x = center_x - int(55 * scale)
    left_weight_y = center_y
    draw.rectangle([
        left_weight_x - int(10 * scale),
        left_weight_y - int(25 * scale),
        left_weight_x + int(10 * scale),
        left_weight_y + int(25 * scale)
    ], fill=white)
    
    # Right weight
    right_weight_x = center_x + int(55 * scale)
    draw.rectangle([
        right_weight_x - int(10 * scale),
        center_y - int(25 * scale),
        right_weight_x + int(10 * scale),
        center_y + int(25 * scale)
    ], fill=white)
    
    # Bar
    draw.rectangle([
        center_x - int(45 * scale),
        center_y - int(8 * scale),
        center_x + int(45 * scale),
        center_y + int(8 * scale)
    ], fill=white)
    
    # Grips (simplified)
    for offset in [-29, -19, 19, 29]:
        grip_x = center_x + int(offset * scale)
        draw.rectangle([
            grip_x - int(4 * scale),
            center_y - int(15 * scale),
            grip_x + int(4 * scale),
            center_y + int(15 * scale)
        ], fill=green)
    
    # Draw counter badge
    badge_x = center_x + int(49 * scale)
    badge_y = center_y - int(49 * scale)
    badge_radius = int(30 * scale)
    
    draw.ellipse([
        badge_x - badge_radius,
        badge_y - badge_radius,
        badge_x + badge_radius,
        badge_y + badge_radius
    ], fill=green)
    
    # Draw + symbol
    plus_size = int(20 * scale)
    plus_width = int(4 * scale)
    # Vertical line
    draw.rectangle([
        badge_x - plus_width // 2,
        badge_y - plus_size // 2,
        badge_x + plus_width // 2,
        badge_y + plus_size // 2
    ], fill=white)
    # Horizontal line
    draw.rectangle([
        badge_x - plus_size // 2,
        badge_y - plus_width // 2,
        badge_x + plus_size // 2,
        badge_y + plus_width // 2
    ], fill=white)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename}")

# Create both icon sizes
if __name__ == "__main__":
    try:
        create_icon(192, 'icon-192.png')
        create_icon(512, 'icon-512.png')
        print("\n✅ Icons created successfully!")
        print("You can now use your PWA with these icons.")
    except Exception as e:
        print(f"❌ Error creating icons: {e}")
        print("\nAlternative: Open icon-generator.html in your browser to create icons manually.")
