import pygame
import random
import math

# Initialize pygame
pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Fireworks Show")
clock = pygame.time.Clock()

# Colors
BLACK = (0, 0, 0)

# Color palettes for vibrant effects
PALETTES = [
    [(255, 80, 80), (255, 200, 80), (255, 255, 80), (80, 255, 80), (80, 255, 255), (80, 80, 255), (200, 80, 255)],
    [(255, 255, 255), (200, 200, 255), (180, 255, 255), (255, 180, 255)],
    [(255, 0, 0), (255, 128, 0), (255, 255, 0), (0, 255, 0), (0, 255, 255), (0, 0, 255), (128, 0, 255)],
]

class Particle:
    def __init__(self, x, y, color, speed, angle, gravity=0.05):
        self.x = x
        self.y = y
        self.color = color
        self.speed = speed
        self.angle = angle
        self.gravity = gravity
        self.life = random.randint(60, 130)
        self.radius = random.randint(2, 4)
        self.trail = []
        self.sparkle = random.choice([True, False])

    def update(self):
        # Gravity curve for realism
        self.y += math.sin(self.angle) * self.speed + self.gravity * (130 - self.life) / 40
        self.x += math.cos(self.angle) * self.speed
        self.speed *= 0.97  # Air resistance
        self.life -= 1
        self.radius = max(1, self.radius * 0.98)
        # Trail effect
        if len(self.trail) > 8:
            self.trail.pop(0)
        self.trail.append((self.x, self.y))
        # Sparkle effect
        if self.sparkle and random.random() < 0.2:
            self.color = tuple(min(255, c + random.randint(-30, 30)) for c in self.color)

    def draw(self, surface):
        if self.life > 0:
            # Draw trail
            for i, (tx, ty) in enumerate(self.trail):
                alpha = int(80 * (i / len(self.trail)))
                surf = pygame.Surface((self.radius*2, self.radius*2), pygame.SRCALPHA)
                safe_color = tuple(max(0, min(255, c)) for c in self.color)
                pygame.draw.circle(surf, (*safe_color, alpha), (self.radius, self.radius), int(self.radius))
                surface.blit(surf, (tx - self.radius, ty - self.radius))
            # Draw particle
            alpha = max(0, min(255, int(255 * (self.life / 130))))
            surf = pygame.Surface((self.radius*2, self.radius*2), pygame.SRCALPHA)
            safe_color = tuple(max(0, min(255, c)) for c in self.color)
            pygame.draw.circle(surf, (*safe_color, alpha), (self.radius, self.radius), int(self.radius))
            surface.blit(surf, (self.x - self.radius, self.y - self.radius))

class Shockwave:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.radius = 1
        self.max_radius = random.randint(40, 80)
        self.life = 20
        self.color = color

    def update(self):
        self.radius += self.max_radius / 20
        self.life -= 1

    def draw(self, surface):
        if self.life > 0:
            alpha = int(120 * (self.life / 20))
            surf = pygame.Surface((self.max_radius*2, self.max_radius*2), pygame.SRCALPHA)
            pygame.draw.circle(surf, (*self.color, alpha), (self.max_radius, self.max_radius), int(self.radius), 2)
            surface.blit(surf, (self.x - self.max_radius, self.y - self.max_radius))

class Firework:
    def __init__(self):
        self.x = random.randint(100, WIDTH-100)
        self.y = HEIGHT
        self.target_y = random.randint(150, 350)
        self.palette = random.choice(PALETTES)
        self.color = random.choice(self.palette)
        self.speed = random.uniform(6, 9)
        self.exploded = False
        self.particles = []
        self.trail = []
        self.shockwave = None

    def update(self):
        if not self.exploded:
            self.y -= self.speed
            self.trail.append((self.x, self.y))
            if self.y <= self.target_y:
                self.explode()
        else:
            for p in self.particles:
                p.update()
            self.particles = [p for p in self.particles if p.life > 0]
            if self.shockwave:
                self.shockwave.update()

    def draw(self, surface):
        if not self.exploded:
            # Draw rocket tail (glow effect)
            for i, (tx, ty) in enumerate(self.trail[-16:]):
                alpha = int(120 * (i / 16))
                surf = pygame.Surface((10, 10), pygame.SRCALPHA)
                pygame.draw.circle(surf, (255, 255, 180, alpha), (5, 5), 5)
                surface.blit(surf, (tx-5, ty-5))
            # Draw rocket body
            pygame.draw.rect(surface, (180, 180, 180), (int(self.x)-2, int(self.y)-12, 4, 12))
            pygame.draw.circle(surface, self.color, (int(self.x), int(self.y)-12), 4)
            # Draw rocket tip
            pygame.draw.polygon(surface, (255, 255, 255), [
                (int(self.x)-4, int(self.y)-16),
                (int(self.x)+4, int(self.y)-16),
                (int(self.x), int(self.y)-22)
            ])
        else:
            if self.shockwave and self.shockwave.life > 0:
                self.shockwave.draw(surface)
            for p in self.particles:
                p.draw(surface)

    def explode(self):
        self.exploded = True
        count = random.randint(60, 120)
        spread = random.uniform(2.5, 3.8)
        for i in range(count):
            angle = random.uniform(0, 2*math.pi)
            speed = random.uniform(spread, spread+2)
            color = random.choice(self.palette)
            self.particles.append(Particle(self.x, self.y, color, speed, angle))
        self.shockwave = Shockwave(self.x, self.y, self.color)

fireworks = []
running = True
timer = 0

while running:
    screen.fill(BLACK)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    timer += 1
    if timer % random.randint(30, 60) == 0:
        fireworks.append(Firework())

    for fw in fireworks:
        fw.update()
        fw.draw(screen)
    fireworks = [fw for fw in fireworks if not (fw.exploded and len(fw.particles) == 0 and (fw.shockwave is None or fw.shockwave.life <= 0))]

    pygame.display.flip()
    clock.tick(60)

pygame.quit()