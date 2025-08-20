import pygame
import math

# Initialize Pygame
pygame.init()

# Set up the display
WIDTH = 800
HEIGHT = 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Bouncing Ball Inside Rotating Circle")

# Colors
WHITE = (255, 255, 255)
RED = (255, 0, 0)
BLACK = (0, 0, 0)

# Physics parameters
GRAVITY = 0.5
FRICTION = 0.99
BOUNCE_LOSS = 0.8
CIRCLE_RADIUS = 200
CENTER = (WIDTH // 2, HEIGHT // 2)

# Add these constants for the hexagon
HEXAGON_RADIUS = 200
NUM_SIDES = 6
ROTATION_SPEED = 0.02

class Ball:
    def __init__(self):
        self.radius = 15
        # Start at the bottom of the circle
        self.x = 0
        self.y = 0
        self.vx = 4
        self.vy = -10
    
    def update(self):
        # Gravity and movement
        self.vy += GRAVITY
        self.x += self.vx
        self.y += self.vy
        
        # Friction
        self.vx *= FRICTION
        self.vy *= FRICTION
        
        # Check collision with hexagon sides
        self.check_hexagon_collision()
    
    def check_hexagon_collision(self):
        # Check collision with each side of the hexagon
        for i in range(NUM_SIDES):
            angle = 2 * math.pi * i / NUM_SIDES
            next_angle = 2 * math.pi * (i + 1) / NUM_SIDES
            
            # Calculate current side points
            x1 = HEXAGON_RADIUS * math.cos(angle)
            y1 = HEXAGON_RADIUS * math.sin(angle)
            x2 = HEXAGON_RADIUS * math.cos(next_angle)
            y2 = HEXAGON_RADIUS * math.sin(next_angle)
            
            # Check collision with this side
            self.handle_line_collision(x1, y1, x2, y2)
    
    def handle_line_collision(self, x1, y1, x2, y2):
        # Vector from line start to ball
        dx = self.x - x1
        dy = self.y - y1
        
        # Line vector
        line_dx = x2 - x1
        line_dy = y2 - y1
        
        # Line length squared
        line_len_sq = line_dx * line_dx + line_dy * line_dy
        
        # Calculate projection of ball onto line
        t = max(0, min(1, (dx * line_dx + dy * line_dy) / line_len_sq))
        
        # Closest point on line
        closest_x = x1 + t * line_dx
        closest_y = y1 + t * line_dy
        
        # Vector from closest point to ball
        nx = self.x - closest_x
        ny = self.y - closest_y
        
        # Distance squared from line
        dist_sq = nx * nx + ny * ny
        
        # Check if we're close enough for collision
        if dist_sq < self.radius * self.radius:
            # Normalize normal vector
            dist = math.sqrt(dist_sq)
            if dist > 0:
                nx /= dist
                ny /= dist
            
            # Move ball out of collision
            overlap = self.radius - dist
            self.x += nx * overlap
            self.y += ny * overlap
            
            # Reflect velocity
            dot = self.vx * nx + self.vy * ny
            self.vx = (self.vx - 2 * dot * nx) * BOUNCE_LOSS
            self.vy = (self.vy - 2 * dot * ny) * BOUNCE_LOSS

    def draw(self, surface, center, rotation_angle):
        # Rotate ball position
        cos_a = math.cos(rotation_angle)
        sin_a = math.sin(rotation_angle)
        rx = self.x * cos_a - self.y * sin_a
        ry = self.x * sin_a + self.y * cos_a
        px = int(center[0] + rx)
        py = int(center[1] + ry)
        pygame.draw.circle(surface, RED, (px, py), self.radius)

def draw_hexagon(surface, center, radius, rotation_angle):
    points = []
    for i in range(NUM_SIDES):
        angle = rotation_angle + (2 * math.pi * i / NUM_SIDES)
        x = center[0] + radius * math.cos(angle)
        y = center[1] + radius * math.sin(angle)
        points.append((int(x), int(y)))
    pygame.draw.polygon(surface, WHITE, points, 2)

def main():
    clock = pygame.time.Clock()
    ball = Ball()
    rotation_angle = 0

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                # Give the ball a random kick
                ball.vx = (math.cos(rotation_angle) * 8)
                ball.vy = (math.sin(rotation_angle) * 8) - 10

        # Update
        ball.update()
        rotation_angle += ROTATION_SPEED

        # Draw
        screen.fill(BLACK)
        draw_hexagon(screen, CENTER, HEXAGON_RADIUS, rotation_angle)
        ball.draw(screen, CENTER, rotation_angle)

        pygame.display.flip()
        clock.tick(60)






    main()
    if __name__ == "__main__":
        pygame.quit() 

if __name__ == "__main__":
    main()