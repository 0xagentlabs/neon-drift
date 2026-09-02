export const WIDTH = 720;
export const HEIGHT = 900;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class NeonDrift {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.player = { x: WIDTH / 2 - 28, y: HEIGHT - 120, w: 56, h: 58, speed: 430 };
    this.entities = [];
    this.score = 0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.dashCooldown = 0;
    this.invulnerable = 0;
    this.running = false;
    this.over = false;
  }

  start() {
    if (this.over) this.reset();
    this.running = true;
  }

  dash(direction = 0) {
    if (!this.running || this.dashCooldown > 0) return false;
    this.player.x = clamp(this.player.x + direction * 105, 22, WIDTH - this.player.w - 22);
    this.dashCooldown = 1.8;
    this.invulnerable = 0.24;
    return true;
  }

  spawn() {
    const core = this.random() < 0.19;
    const size = core ? 30 : 38 + this.random() * 36;
    this.entities.push({
      type: core ? "core" : "shard",
      x: 26 + this.random() * (WIDTH - size - 52),
      y: -size,
      w: size,
      h: size,
      speed: 210 + this.elapsed * 5 + this.random() * 120,
      spin: this.random() * Math.PI,
    });
  }

  update(dt, input = 0) {
    if (!this.running || this.over) return;
    const safeDt = Math.min(dt, 0.05);
    this.elapsed += safeDt;
    this.score += safeDt * 10;
    this.dashCooldown = Math.max(0, this.dashCooldown - safeDt);
    this.invulnerable = Math.max(0, this.invulnerable - safeDt);
    this.player.x = clamp(this.player.x + input * this.player.speed * safeDt, 22, WIDTH - this.player.w - 22);
    this.spawnTimer -= safeDt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = Math.max(0.24, 0.72 - this.elapsed * 0.009);
    }

    for (const entity of this.entities) {
      entity.y += entity.speed * safeDt;
      entity.spin += safeDt * 2.4;
      if (intersects(this.player, entity)) {
        if (entity.type === "core") {
          this.score += 75;
          entity.collected = true;
        } else if (this.invulnerable <= 0) {
          this.over = true;
          this.running = false;
        }
      }
    }
    this.entities = this.entities.filter((entity) => entity.y < HEIGHT + 100 && !entity.collected);
  }
}

