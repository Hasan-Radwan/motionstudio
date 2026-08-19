// Minimal 3D helpers for the Canvas2D fake-3D templates. Rotate a point by Euler
// angles (applied X → Y → Z, radians) and read it back for a pinhole projection.
// Cards are then drawn as perspective-scaled 2D sprites at the projected point,
// which is enough to make a whole group of cards read as if it rotates in 3D.
export function rotateXYZ(x, y, z, rx, ry, rz) {
  // X axis
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const y1 = y * cx - z * sx;
  const z1 = y * sx + z * cx;
  // Y axis
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const x2 = x * cy + z1 * sy;
  const z2 = -x * sy + z1 * cy;
  // Z axis
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);
  const x3 = x2 * cz - y1 * sz;
  const y3 = x2 * sz + y1 * cz;
  return { x: x3, y: y3, z: z2 };
}
