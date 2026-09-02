import test from "node:test";
import assert from "node:assert/strict";
import { HEIGHT, WIDTH, NeonDrift, clamp, intersects } from "../src/game.js";

test("clamp keeps the player inside the arena", () => {
  assert.equal(clamp(-2, 0, 10), 0);
  assert.equal(clamp(14, 0, 10), 10);
  assert.equal(clamp(4, 0, 10), 4);
});

test("collision helper detects overlap and separation", () => {
  assert.equal(intersects({ x: 0, y: 0, w: 20, h: 20 }, { x: 10, y: 10, w: 5, h: 5 }), true);
  assert.equal(intersects({ x: 0, y: 0, w: 5, h: 5 }, { x: 10, y: 10, w: 5, h: 5 }), false);
});

test("movement remains inside game bounds", () => {
  const game = new NeonDrift(() => 1);
  game.start();
  for (let i = 0; i < 1000; i += 1) game.update(0.016, 1);
  assert.ok(game.player.x <= WIDTH - game.player.w - 22);
  game.entities = [];
  for (let i = 0; i < 1000; i += 1) game.update(0.016, -1);
  assert.ok(game.player.x >= 22);
});

test("collecting a core adds score without ending the run", () => {
  const game = new NeonDrift(() => 1);
  game.start();
  game.spawnTimer = 99;
  game.entities = [{ type: "core", ...game.player, speed: 0, spin: 0 }];
  game.update(0.016, 0);
  assert.ok(game.score >= 75);
  assert.equal(game.over, false);
  assert.equal(game.entities.length, 0);
});

test("shards consume shields and the third hit ends the run", () => {
  const game = new NeonDrift(() => 1);
  game.start();
  game.spawnTimer = 99;
  game.entities = [{ type: "shard", ...game.player, speed: 0, spin: 0 }];
  game.update(0.016, 0);
  assert.equal(game.lives, 2);
  assert.equal(game.over, false);
  assert.equal(game.entities.length, 0);

  for (let lives = 1; lives >= 0; lives -= 1) {
    game.invulnerable = 0;
    game.entities = [{ type: "shard", ...game.player, speed: 0, spin: 0 }];
    game.update(0.016, 0);
    assert.equal(game.lives, lives);
  }
  assert.equal(game.over, true);
});
