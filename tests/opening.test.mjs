import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {OPENING_SCENES} from '../game/opening.mjs';
test('序章文案与全部背景资源齐备',()=>{
 assert.equal(OPENING_SCENES.length,12);
 assert.equal(new Set(OPENING_SCENES.map(s=>s.image)).size,6);
 for(const scene of OPENING_SCENES){assert.ok(scene.text);assert.ok(existsSync(new URL(`../game/assets/${scene.image}`,import.meta.url)),scene.image)}
});
