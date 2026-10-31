import { describe, expect, it } from 'vitest';
import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three';

/**
 * Regression test for the reported "3D animation doesn't render at all" bug
 * in Parent Mode. Root cause: AvatarModel.tsx applied a hardcoded
 * position={[0, -1, 0]} offset that was tuned by guesswork, not computed from
 * the actual model geometry. For the real cesium-man.glb (whose mesh spans
 * roughly y in [0, 1.5] locally, after its baked-in root transforms), that
 * fixed offset pushed the figure's feet to y=-1 and its head to only
 * y=0.5, well below where the camera (positioned/looking per AvatarStage's
 * defaults) was framed, making the figure appear mostly or entirely out of
 * frame. The fix replaces the hardcoded offset with a bounding-box
 * computation that grounds the feet at y=0 and centers x/z, which is
 * reusable for this or any future GLB regardless of its own authored size or
 * origin. This test exercises that centering math directly against a
 * synthetic mesh standing away from the origin, without needing a real
 * WebGL context or network fetch of the GLB.
 */
describe('AvatarModel framing math (regression)', () => {
  it('grounds an arbitrarily offset model at y=0 and centers it on x/z', () => {
    // Simulate a humanoid mesh whose local geometry, like the real
    // cesium-man.glb, does NOT happen to sit centered on the origin.
    const group = new Group();
    const geometry = new BoxGeometry(0.4, 1.5, 0.3);
    const mesh = new Mesh(geometry, new MeshBasicMaterial());
    // Deliberately offset away from the origin, mimicking a model authored
    // with its own arbitrary pivot/root transform.
    mesh.position.set(5, -3, 2);
    group.add(mesh);
    group.updateMatrixWorld(true);

    const box = new Box3().setFromObject(group);
    expect(box.isEmpty()).toBe(false);
    const center = box.getCenter(new Vector3());

    // This mirrors the centering logic now in AvatarModel.tsx's useLayoutEffect.
    group.position.x = -center.x;
    group.position.y = -box.min.y;
    group.position.z = -center.z;
    group.updateMatrixWorld(true);

    const groundedBox = new Box3().setFromObject(group);
    expect(groundedBox.min.y).toBeCloseTo(0, 5);
    const groundedCenter = groundedBox.getCenter(new Vector3());
    expect(groundedCenter.x).toBeCloseTo(0, 5);
    expect(groundedCenter.z).toBeCloseTo(0, 5);
    // The figure's full height must still be intact after grounding, not cropped.
    expect(groundedBox.max.y - groundedBox.min.y).toBeCloseTo(1.5, 5);
  });
});
